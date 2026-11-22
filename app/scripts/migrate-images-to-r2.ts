import 'dotenv/config'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { closeDatabase } from '../server/db/db.js'
import { groupReferences, type ImageReference } from '../server/lib/backfillAudit.js'
import { buildImmutableImageKey } from '../server/lib/imageAssets.js'
import { generateImageVariants } from '../server/lib/imageProcessing.js'
import { createR2Adapter, r2Config } from '../server/lib/r2.js'
import { options, reverseChanges, runChanges, saveManifest, type Change, type Values } from '../server/lib/r2Cutover.js'
import { applyChanges, matchingRows, readManifest, tables } from './r2-cutover-db.js'

type Reference = ImageReference & { table: string; identity: Values; row: Values; column: string }
type Variant = { key: string; width: number }
const digest = (data: Buffer) => createHash('sha256').update(data).digest('hex')
const manifests = fileURLToPath(new URL('./manifests/', import.meta.url))

function replace(value: unknown, from: string, to: string): unknown {
  if (typeof value === 'string') return value.replace(/https?:[^\s"<>\\]+/g, url => url === from ? to : url)
  if (Array.isArray(value)) return value.map(item => replace(item, from, to))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replace(item, from, to)]))
  return value
}

async function download(url: string) {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10_000) })
  if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
  const data = Buffer.from(await response.arrayBuffer())
  if (!data.length) throw new Error('Empty image')
  return { response, data }
}

async function main() {
  const cli = options(process.argv.slice(2))
  if (cli.manifest) {
    const changes = reverseChanges(await readManifest(cli.manifest))
    await runChanges(changes, cli.execute, applyChanges)
    console.log(`${cli.execute ? 'Restored' : 'Would restore'} ${changes.length} row changes`)
    return
  }
  const config = r2Config(process.env)
  const adapter = createR2Adapter(config)
  const source = new URL(process.env.SUPABASE_URL || (() => { throw new Error('SUPABASE_URL is required') })())
  const prefix = `${source.origin}/storage/v1/object/public/${encodeURIComponent(process.env.SUPABASE_STORAGE_BUCKET || 'product-images')}/`
  const references: Reference[] = []
  const unsupported: string[] = []
  for (const { name, keys } of await tables()) {
    for (const row of await matchingRows(name, prefix)) {
      const identity = Object.fromEntries(keys.map(key => [key, row[key]]))
      for (const [column, value] of Object.entries(row)) {
        const matches = JSON.stringify(value)?.match(/https?:[^\s"<>\\]+/g) ?? []
        for (const url of new Set(matches.filter(url => url.startsWith(prefix)))) {
          if (!keys.length || keys.includes(column)) {
            unsupported.push(`${name}.${column} has no usable stable row identity`)
            continue
          }
          references.push({ url, source: `${name}.${column}`, rowId: JSON.stringify(identity), table: name, identity, row, column })
        }
      }
    }
  }
  const groups = groupReferences(references).slice(0, cli.limit)
  console.log(JSON.stringify({ mode: cli.execute ? 'execute' : 'dry-run', uniqueUrls: groups.length,
    references: groups.reduce((count, [, refs]) => count + refs.length, 0), unsupported,
    ...(!cli.execute && {
      plan: groups.map(([url, refs]) => ({ url, references: refs.map(({ source, rowId }) => ({ source, rowId })) })),
    }),
  }, null, 2))
  if (unsupported.length) process.exitCode = 1
  if (!cli.execute) return
  if (unsupported.length) throw new Error('Resolve unsupported references before executing')
  for (const [, refs] of groups) {
    for (const ref of refs as Reference[]) {
      const provider = ref.table === 'product_images' && ref.column === 'image_url' ? 'storage_provider'
        : ref.table === 'landing_offers' && ref.column === 'hero_image_url' ? 'image_storage_provider' : undefined
      if (provider && ![provider, 'image_key', 'image_variants'].every(column => Object.hasOwn(ref.row, column))) {
        throw new Error('Apply 20261121_image_variants.sql before executing')
      }
    }
  }
  const client = new S3Client(config.client)
  const failed: { url: string; error: string }[] = []
  // Share downloads and object verification within a batch, including derivatives.
  let completed = 0
  try {
    for (let offset = 0; offset < groups.length; offset += cli.batchSize) {
      const batch = groups.slice(offset, offset + cli.batchSize)
      const downloads = new Map<string, ReturnType<typeof download>>()
      const read = (url: string) => {
        if (!downloads.has(url)) downloads.set(url, download(url))
        return downloads.get(url)!
      }
      const verified = new Map<string, Promise<void>>()
      function verify(key: string, data: Buffer, type: string) {
        if (!verified.has(key)) verified.set(key, (async () => {
          try {
            await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }), { abortSignal: AbortSignal.timeout(10_000) })
          } catch (error) {
            if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode !== 404) throw error
            await adapter.upload(key, data, type)
          }
          const actual = await download(adapter.publicUrl(key))
          const cache = actual.response.headers.get('cache-control')?.split(',').map(value => value.trim().toLowerCase()) ?? []
          if (actual.data.length !== data.length || digest(actual.data) !== digest(data) ||
              !['public', 'max-age=31536000', 'immutable'].every(value => cache.includes(value))) {
            throw new Error(`R2 verification failed for ${key}`)
          }
        })())
        return verified.get(key)!
      }

      const changes: Change[] = []
      const successful: { url: string; refs: Reference[]; key: string; variants: Variant[] }[] = []
      let next = 0
      async function worker() {
        while (next < batch.length) {
          const [url, group] = batch[next++]
          const refs = group as Reference[]
          try {
            const { data, response } = await read(url)
            const productRows = refs.filter(ref => ref.table === 'product_images' && ref.column === 'image_url')
            const existing = productRows.find(ref => Array.isArray(ref.row.image_variants) && ref.row.image_variants.length)
            let variants: Variant[] = []
            let key: string
            if (existing) {
              const oldKey = existing.row.image_key
              if (typeof oldKey !== 'string' || !oldKey || !url.endsWith('/' + oldKey)) throw new Error('Master metadata does not match URL')
              const oldVariants = existing.row.image_variants as Variant[]
              if (productRows.some(ref => Array.isArray(ref.row.image_variants) && ref.row.image_variants.length &&
                (ref.row.image_key !== oldKey || JSON.stringify(ref.row.image_variants) !== JSON.stringify(oldVariants)))) {
                throw new Error('Conflicting variant metadata for shared source')
              }
              for (const variant of oldVariants) {
                if (!/^[\w/-]+\.webp$/.test(variant.key) || !Number.isInteger(variant.width) || variant.width < 1) throw new Error('Invalid variant metadata')
                const asset = variant.key === oldKey ? data : (await read(prefix + variant.key)).data
                if ((await sharp(asset).metadata()).format !== 'webp') throw new Error('Expected WebP variant')
                await verify(variant.key, asset, 'image/webp')
              }
              if ((await sharp(data).metadata()).format !== 'webp') throw new Error('Expected WebP master')
              await verify(oldKey, data, 'image/webp')
              key = oldKey
              variants = oldVariants
            } else if (productRows.length) {
              for (const variant of (await generateImageVariants(data)).variants) {
                const variantKey = buildImmutableImageKey('products', digest(variant.buffer), variant.width)
                await verify(variantKey, variant.buffer, 'image/webp')
                variants.push({ key: variantKey, width: variant.width })
              }
              key = variants.at(-1)!.key
            } else {
              const type = response.headers.get('content-type')?.split(';')[0] ?? ''
              if (!/^image\/[a-z0-9.+-]+$/i.test(type)) throw new Error('Expected an image content type')
              key = `migrated/v1/${digest(data)}.${type.slice(6).replace(/[^a-z0-9]/gi, '')}`
              await verify(key, data, type)
            }
            successful.push({ url, refs, key, variants })
          } catch (error) {
            failed.push({ url, error: error instanceof Error ? error.message : String(error) })
          }
          console.log(`[${++completed}/${groups.length}] inspected`)
        }
      }
      await Promise.all(Array.from({ length: Math.min(5, batch.length) }, worker))
      const grouped = new Map<string, Change>()
      for (const { url, refs, key, variants } of successful) {
        for (const ref of refs) {
          const id = JSON.stringify([ref.table, ref.identity])
          let change = grouped.get(id)
          if (!change) {
            change = { table: ref.table, identity: ref.identity, before: {}, after: {} }
            grouped.set(id, change)
          }
          const set = (column: string, value: unknown) => {
            if (!Object.hasOwn(change!.before, column)) change!.before[column] = ref.row[column]
            change!.after[column] = value
          }
          set(ref.column, replace(change.after[ref.column] ?? ref.row[ref.column], url, adapter.publicUrl(key)))
          const product = ref.table === 'product_images' && ref.column === 'image_url'
          const offer = ref.table === 'landing_offers' && ref.column === 'hero_image_url'
          if (product || offer) {
            const provider = product ? 'storage_provider' : 'image_storage_provider'
            if (![provider, 'image_key', 'image_variants'].every(column => Object.hasOwn(ref.row, column))) {
              throw new Error('Apply 20261121_image_variants.sql before executing')
            }
            set(provider, 'r2')
            set('image_key', key)
            set('image_variants', variants.length ? variants : null)
          }
        }
      }
      changes.push(...grouped.values())
      if (changes.length) {
        console.log(`Rollback manifest: ${await saveManifest(manifests, changes)}`)
        await applyChanges(changes)
        // Update the shared snapshots for subsequent batches touching the same row.
        for (const ref of references) {
          const change = grouped.get(JSON.stringify([ref.table, ref.identity]))
          if (change) Object.assign(ref.row, change.after)
        }
      }
    }
  } finally {
    client.destroy()
  }
  console.log(JSON.stringify({ completed, failed }, null, 2))
  if (failed.length) process.exitCode = 1
}

try { await main() } finally { await closeDatabase() }
