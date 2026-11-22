import { closeDatabase, query } from '../server/db/db.js'
import { groupReferences, parseAuditArgs, topLargest, type AuditAsset, type ImageReference } from '../server/lib/backfillAudit.js'
import sharp from 'sharp'

const identifier = (value: string) => '"' + value.replaceAll('"', '""') + '"'

try {
  const options = parseAuditArgs(process.argv.slice(2))
  if (!options.dryRun) throw new Error('Only dry-run is supported.')
  console.log('Discovering image references in public database tables...')
  const { rows: columns } = await query<{ table_name: string; column_name: string }>(`
    SELECT c.table_name, c.column_name FROM information_schema.columns c
    JOIN information_schema.tables t USING (table_schema, table_name)
    WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('text', 'character varying', 'character', 'json', 'jsonb')
  `)
  const rows: ImageReference[] = []
  for (const { table_name, column_name } of columns) {
    const column = identifier(column_name)
    const source = `${table_name}.${column_name}`
    const { rows: found } = await query<ImageReference>(`
      SELECT matches.url, $1::text AS source,
        COALESCE(to_jsonb(t)->>'id', to_jsonb(t)->>'setting_key', t.ctid::text) AS "rowId"
      FROM public.${identifier(table_name)} t
      CROSS JOIN LATERAL regexp_matches(t.${column}::text, $2, 'gi') AS m(parts)
      CROSS JOIN LATERAL (SELECT m.parts[1] AS url) AS matches
    `, [source, String.raw`(https?://[^[:space:]"<>\\]*?/storage/v1/(?:object|render/image)/[^[:space:]"<>\\]+)`])
    for (const reference of found) rows.push(reference)
  }
  const groups = groupReferences(rows).slice(0, options.limit)
  const assets: AuditAsset[] = []
  const failed: { url: string; error: string }[] = []
  let next = 0
  let completed = 0
  console.log(`Inspecting ${groups.length} unique URLs from ${rows.length} references...`)
  async function worker() {
    while (next < groups.length) {
      const [url, references] = groups[next++]
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10_000), redirect: 'error' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = Buffer.from(await response.arrayBuffer())
        const { width, height } = await sharp(data).metadata()
        assets.push({ url, source: [...new Set(references.map((ref) => ref.source))].join(', '), bytes: data.length, width, height })
      } catch (error) {
        failed.push({ url, error: error instanceof Error ? error.message : String(error) })
      }
      console.log(`[${++completed}/${groups.length}] scanned...`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, groups.length) }, worker))
  const top10 = topLargest(assets)
  console.table(top10)
  console.log(JSON.stringify({ mode: 'dry-run', scanned: completed, top10, failed, references: Object.fromEntries(groups) }, null, 2))
} finally {
  await closeDatabase()
}
