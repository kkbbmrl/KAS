import assert from 'node:assert/strict'
import test from 'node:test'
import sharp from 'sharp'
import { generateImageVariants } from '../lib/imageProcessing.js'

test('generateImageVariants emits responsive WebP images without exceeding the master cap', async () => {
  const source = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: '#c00' } }).jpeg().toBuffer()

  const result = await generateImageVariants(source)

  assert.deepEqual(result.variants.map((variant) => variant.width), [320, 640, 960, 1200])
  assert.equal(result.variants.at(-1)?.role, 'detail-xl')
  for (const variant of result.variants) {
    const metadata = await sharp(variant.buffer).metadata()
    assert.equal(metadata.format, 'webp')
    assert.equal(metadata.width, variant.width)
    assert.ok(variant.buffer.length > 0)
  }
})

test('generateImageVariants avoids upscaling a smaller source image', async () => {
  const source = await sharp({ create: { width: 500, height: 400, channels: 3, background: '#0c0' } }).png().toBuffer()

  const result = await generateImageVariants(source)

  assert.deepEqual(result.variants.map((variant) => variant.width), [320, 500])
  assert.equal(result.variants.at(-1)?.role, 'detail-xl')
})
