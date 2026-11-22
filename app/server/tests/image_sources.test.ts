import assert from 'node:assert/strict'
import test from 'node:test'
import { listingSources, detailSources } from '../../src/lib/imageSources.js'
test('listing resolver preserves a legacy URL', () => assert.deepEqual(listingSources('https://legacy/img.webp'), { src: 'https://legacy/img.webp' }))
test('detail resolver preserves a legacy URL', () => assert.deepEqual(detailSources('https://legacy/img.webp'), { src: 'https://legacy/img.webp' }))
