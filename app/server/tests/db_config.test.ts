import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('production startup rejects a missing DATABASE_URL instead of using embedded credentials', () => {
  const env = { ...process.env, NODE_ENV: 'production', DATABASE_URL: '' }
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--eval', "await import('./server/db/db.ts')"],
    { cwd: process.cwd(), env, encoding: 'utf8' }
  )

  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /DATABASE_URL is required in production/)
})
