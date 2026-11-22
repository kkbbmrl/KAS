import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export type Values = Record<string, unknown>
export type Change = { table: string; identity: Values; before: Values; after: Values }

export function options(args: string[], cleanup = false) {
  const allowed = cleanup ? /^--(?:dry-run|confirm-delete|manifest=.+)$/ : /^--(?:dry-run|execute|(?:limit|batch-size|rollback)=.+)$/
  if (args.some(arg => !allowed.test(arg)) || new Set(args.map(arg => arg.split('=')[0])).size !== args.length) {
    throw new Error('Unknown or duplicate argument')
  }
  const execute = args.includes(cleanup ? '--confirm-delete' : '--execute')
  if (execute && args.includes('--dry-run')) throw new Error('Conflicting execution flags')
  const value = (name: string) => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
  const count = (name: string) => {
    const input = value(name)
    if (input === undefined) return undefined
    const n = Number(input)
    if (!/^\d+$/.test(input) || !Number.isSafeInteger(n) || n < 1) throw new Error(`Invalid --${name}`)
    return n
  }
  return { execute, limit: count('limit'), batchSize: count('batch-size') ?? 10, manifest: value(cleanup ? 'manifest' : 'rollback') }
}

export async function saveManifest(dir: string, changes: Change[]) {
  await mkdir(dir, { recursive: true })
  const file = join(dir, `r2-cutover-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.json`)
  await writeFile(file, JSON.stringify({ version: 1, changes }, null, 2), { flag: 'wx', flush: true })
  return file
}

export function reverseChanges(changes: Change[]): Change[] {
  return [...changes].reverse().map(({ before, after, ...rest }) => ({ ...rest, before: after, after: before }))
}

export async function runChanges(changes: Change[], execute: boolean, apply: (changes: Change[]) => Promise<void>) {
  if (execute && changes.length) await apply(changes)
}

export function stillReferenced(values: unknown, key: string, url: string): boolean {
  if (typeof values === 'string') {
    let decoded = values
    try { decoded = decodeURIComponent(values) } catch { /* retain original */ }
    return values.includes(url) || decoded.includes(key)
  }
  return !!values && typeof values === 'object' && Object.values(values).some(value => stillReferenced(value, key, url))
}

export function cleanupCandidates(changes: Change[], prefix: string) {
  const candidates = new Map<string, string>()
  function collect(value: unknown) {
    if (typeof value === 'string') {
      for (const url of value.match(/https?:[^\s"<>]+/g) ?? []) {
        if (!url.startsWith(prefix)) continue
        const key = decodeURIComponent(new URL(url).pathname.slice(new URL(prefix).pathname.length))
        if (key && !key.split('/').some(part => !part || part === '.' || part === '..')) candidates.set(key, url)
      }
    } else if (value && typeof value === 'object') {
      for (const child of Object.values(value)) collect(child)
    }
  }
  for (const change of changes) collect(change.before)
  return [...candidates].map(([key, url]) => ({ key, url }))
}
