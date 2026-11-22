export interface AuditAsset { url: string; source: string; bytes: number; width?: number; height?: number }
export function parseAuditArgs(args: string[]) {
  const limitArg = args.find((arg) => arg.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.slice(8)) : undefined
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) throw new Error('--limit must be a positive integer')
  return { dryRun: !args.includes('--write'), limit }
}
export function topLargest(assets: AuditAsset[], count = 10) { return [...assets].sort((a, b) => b.bytes - a.bytes).slice(0, count) }

export interface ImageReference { url: string; source: string; rowId: string | null }

export function groupReferences(rows: ImageReference[]) {
  const groups = new Map<string, ImageReference[]>()
  for (const row of rows) {
    const url = row.url.trim()
    if (!/^https?:\/\//i.test(url)) continue
    const references = groups.get(url)
    if (references) references.push(row)
    else groups.set(url, [row])
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b))
}
