import assert from 'node:assert/strict'
import test from 'node:test'
import { createR2Adapter, isAllowedImageUrl, r2Config, removeStoredImage, storageProvider } from '../lib/r2.js'
import { listingSources, detailSources } from '../../src/lib/imageSources.js'

const env = {
  R2_ACCOUNT_ID: 'abc123', R2_ACCESS_KEY_ID: 'fake', R2_SECRET_ACCESS_KEY: 'fake-secret',
  R2_BUCKET_NAME: 'images', R2_PUBLIC_URL: 'https://images.example.com///',
}

test('defaults to local development or R2 production and reports every missing R2 key', () => {
  assert.equal(storageProvider({}), 'local')
  assert.equal(storageProvider({ NODE_ENV: 'production' }), 'r2')
  assert.throws(() => storageProvider({ NODE_ENV: 'production', STORAGE_PROVIDER: 'local' }))
  assert.throws(() => storageProvider({ STORAGE_PROVIDER: 'supabase' }))
  assert.equal(storageProvider({ STORAGE_PROVIDER: 'r2' }), 'r2')
  assert.throws(() => r2Config({}), /R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL/)
})

test('creates a lazy client and sends immutable WebP upload parameters', async () => {
  const config = r2Config(env)
  const commands: unknown[] = []
  let initialized = false
  const adapter = createR2Adapter(config, (options) => {
    initialized = true
    assert.deepEqual(options, {
      region: 'auto', endpoint: 'https://abc123.r2.cloudflarestorage.com',
      credentials: { accessKeyId: 'fake', secretAccessKey: 'fake-secret' },
      requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
    })
    return { async send(command) { commands.push(command.input) } }
  })
  assert.equal(adapter.publicUrl('//products/a.webp'), 'https://images.example.com/products/a.webp')
  assert.equal(initialized, false)
  const body = Buffer.from('fixture')
  await adapter.upload('/products/a.webp', body)
  assert.deepEqual(commands, [{
    Bucket: 'images', Key: 'products/a.webp', Body: body, ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable', IfNoneMatch: '*',
  }])
  assert.ok(isAllowedImageUrl(adapter.publicUrl('a.webp'), env))
  assert.ok(!isAllowedImageUrl('https://images.example.com.attacker.test/a.webp', env))
})

test('uses the stored asset host and explicitly routes cleanup by provider', async () => {
  const variants = [320, 640, 960, 1200].map(width => ({ key: `products/${width}.webp`, width }))
  const supabase = 'https://project.supabase.co/storage/v1/object/public/product-images'
  const r2 = 'https://images.example.com'
  assert.equal(listingSources(`${supabase}/products/1200.webp`, variants).src, `${supabase}/products/640.webp`)
  assert.equal(listingSources(`${r2}/products/1200.webp`, variants).srcSet,
    `${r2}/products/320.webp 320w, ${r2}/products/640.webp 640w`)
  assert.match(detailSources(`${r2}/products/1200.webp`, variants).srcSet!, /1200\.webp 1200w$/)
  const calls: string[] = []
  const adapters = {
    r2: { async remove(key: string) { calls.push(`r2:${key}`) } },
  }
  assert.equal(await removeStoredImage('supabase', 'a.webp', adapters), false)
  await removeStoredImage('r2', 'b.webp', adapters)
  assert.equal(await removeStoredImage(null, 'a.webp', adapters), false)
  assert.equal(await removeStoredImage('r2', 'b.webp', {}), false)
  assert.deepEqual(calls, ['r2:b.webp'])
})
