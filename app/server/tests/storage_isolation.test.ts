import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('production storage initializes with R2 and no Supabase variables', () => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.includes('SUPABASE')))
  Object.assign(env, {
    NODE_ENV: 'production',
    STORAGE_PROVIDER: 'r2',
    R2_ACCOUNT_ID: 'test',
    R2_ACCESS_KEY_ID: 'test',
    R2_SECRET_ACCESS_KEY: 'test',
    R2_BUCKET_NAME: 'test',
    R2_PUBLIC_URL: 'https://images.example.test',
  })
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--eval', "const m = await import('./server/lib/storage.ts'); console.log(typeof m.uploadImage)"],
    { cwd: process.cwd(), env, encoding: 'utf8' },
  )
  assert.equal(result.status, 0)
  assert.match(result.stdout, /function\s*$/)
})
