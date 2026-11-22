import assert from 'node:assert/strict'
import test from 'node:test'
import { buildImmutableImageKey, buildResponsiveWidths, resolveImageSources } from '../lib/imageAssets.js'

test('buildResponsiveWidths creates card, grid, detail, and capped master widths', () => {
  assert.deepEqual(buildResponsiveWidths(2000), [320, 640, 960, 1200])
})

test('buildResponsiveWidths never requests an upscale', () => {
  assert.deepEqual(buildResponsiveWidths(500), [320, 500])
})

test('buildImmutableImageKey is content addressed and versioned', () => {
  const key = buildImmutableImageKey('products', 'a'.repeat(64), 640)
  assert.equal(key, `products/v1/${'a'.repeat(64)}-640w.webp`)
})

test('resolveImageSources keeps a legacy public URL usable without variants', () => {
  const result = resolveImageSources({
    legacyUrl: 'https://project.supabase.co/storage/v1/object/public/product-images/products/legacy.webp',
    variants: null,
  })

  assert.equal(result.src, 'https://project.supabase.co/storage/v1/object/public/product-images/products/legacy.webp')
  assert.equal(result.srcSet, undefined)
})

test('resolveImageSources uses the configured CDN base for provider-neutral keys', () => {
  const result = resolveImageSources({
    legacyUrl: 'https://project.supabase.co/storage/v1/object/public/product-images/products/legacy.webp',
    variants: [
      { key: 'products/v1/hash-320w.webp', width: 320 },
      { key: 'products/v1/hash-640w.webp', width: 640 },
    ],
    baseUrl: 'https://images.khaledauto.live/',
  })

  assert.equal(result.src, 'https://images.khaledauto.live/products/v1/hash-640w.webp')
  assert.equal(
    result.srcSet,
    'https://images.khaledauto.live/products/v1/hash-320w.webp 320w, https://images.khaledauto.live/products/v1/hash-640w.webp 640w'
  )
})
