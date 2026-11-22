import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { groupReferences } from '../lib/backfillAudit.js'
import { cleanupCandidates, options, reverseChanges, runChanges, saveManifest, stillReferenced } from '../lib/r2Cutover.js'

const prefix = 'https://example.supabase.co/storage/v1/object/public/product-images/'
const url = prefix + 'catalog/a.webp'
const changes = [{
  table: 'product_images', identity: { id: 'one' },
  before: { image_url: url, storage_provider: null, image_key: null, image_variants: null },
  after: { image_url: 'https://images.example.com/a.webp', storage_provider: 'r2', image_key: 'a.webp', image_variants: [] },
}]

test('groups one source URL across all referencing rows', () => {
  const refs = [{ url, source: 'product_images.image_url', rowId: 'one' },
    { url, source: 'landing_offers.hero_image_url', rowId: 'two' }]
  assert.deepEqual(groupReferences(refs), [[url, refs]])
})

test('default and rollback planning never call the write adapter', async () => {
  const rejectWrite = async () => assert.fail('unexpected write')
  await runChanges(changes, options([]).execute, rejectWrite)
  await runChanges(reverseChanges(changes), options(['--rollback=fixture.json']).execute, rejectWrite)
  assert.throws(() => options(['--execute', '--dry-run']), /Conflicting/)
})

test('writes a fresh manifest and restores exact prior values via the write adapter', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'kas-cutover-'))
  try {
    const file = await saveManifest(dir, changes)
    const manifest = JSON.parse(await readFile(file, 'utf8'))
    assert.deepEqual(manifest, { version: 1, changes })
    let restored = false
    await runChanges(reverseChanges(manifest.changes), options([`--rollback=${file}`, '--execute']).execute, async ([entry]) => {
      assert.deepEqual(entry.after, changes[0].before)
      assert.deepEqual(entry.before, changes[0].after)
      restored = true
    })
    assert.ok(restored)
  } finally { await rm(dir, { recursive: true }) }
})

test('cleanup identifies manifest sources and detects nested and encoded references', () => {
  const [candidate] = cleanupCandidates(changes, prefix)
  assert.deepEqual(candidate, { key: 'catalog/a.webp', url })
  assert.ok(stillReferenced({ gallery: [url] }, candidate.key, candidate.url))
  assert.ok(stillReferenced({ settings: 'catalog%2Fa.webp' }, candidate.key, candidate.url))
  assert.ok(!stillReferenced({ image: changes[0].after.image_url }, candidate.key, candidate.url))
  assert.equal(options(['--manifest=fixture.json'], true).execute, false)
})
