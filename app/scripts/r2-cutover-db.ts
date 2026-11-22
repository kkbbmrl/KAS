import { readFile } from 'node:fs/promises'
import { query, withTransaction } from '../server/db/db.js'
import type { Change, Values } from '../server/lib/r2Cutover.js'

const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"'
const object = (value: unknown): value is Values => !!value && typeof value === 'object' && !Array.isArray(value)

export async function tables() {
  return (await query<{ name: string; keys: string[] }>(`
    SELECT c.relname AS name, ARRAY(
      SELECT a.attname::text FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = c.oid AND i.indisprimary ORDER BY a.attnum
    ) AS keys
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND NOT c.relispartition
    ORDER BY c.relname
  `)).rows
}

export async function matchingRows(table: string, needle: string) {
  return (await query<{ data: Values }>(`
    SELECT to_jsonb(t) AS data FROM public.${quote(table)} t
    WHERE strpos(to_jsonb(t)::text, $1) > 0
  `, [needle])).rows.map(row => row.data)
}

export async function readManifest(file: string): Promise<Change[]> {
  const data = JSON.parse(await readFile(file, 'utf8'))
  if (data?.version !== 1 || !Array.isArray(data.changes) || data.changes.some((c: Change) =>
    !c || typeof c.table !== 'string' || !object(c.identity) || !Object.keys(c.identity).length ||
    !object(c.before) || !object(c.after) || !Object.keys(c.before).length ||
    Object.keys(c.before).length !== Object.keys(c.after).length ||
    Object.keys(c.before).some(key => !Object.hasOwn(c.after, key)))) throw new Error('Invalid rollback manifest')
  return data.changes
}

export async function applyChanges(changes: Change[]) {
  const catalog = new Map((await tables()).map(t => [t.name, t.keys]))
  await withTransaction(async () => {
    for (const { table, identity, before, after } of changes) {
      const keys = catalog.get(table)
      if (!keys?.length || keys.length !== Object.keys(identity).length || keys.some(key => !Object.hasOwn(identity, key))) {
        throw new Error(`Invalid primary key for ${table}`)
      }
      const columns = Object.keys(after)
      if (columns.some(column => keys.includes(column))) throw new Error('Cannot change a primary key')
      const qualified = 'public.' + quote(table)
      const result = await query(`
        UPDATE ${qualified} AS t SET ${columns.map(c => `${quote(c)} = new_value.${quote(c)}`).join(', ')}
        FROM jsonb_populate_record(NULL::${qualified}, $3::jsonb) AS new_value
        WHERE to_jsonb(t) @> $1::jsonb
          AND (SELECT jsonb_object_agg(k, to_jsonb(t)->k) FROM jsonb_object_keys($2::jsonb) AS k) = $2::jsonb
        RETURNING 1
      `, [JSON.stringify(identity), JSON.stringify(before), JSON.stringify(after)])
      if (result.rows.length !== 1) {
        const current = await query(`
          SELECT 1 FROM ${qualified} t WHERE to_jsonb(t) @> $1::jsonb
            AND (SELECT jsonb_object_agg(k, to_jsonb(t)->k) FROM jsonb_object_keys($2::jsonb) AS k) = $2::jsonb
        `, [JSON.stringify(identity), JSON.stringify(after)])
        if (current.rows.length !== 1) throw new Error(`Row changed since planning in ${table}`)
      }
    }
  })
}
