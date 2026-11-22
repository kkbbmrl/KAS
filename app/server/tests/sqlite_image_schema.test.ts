import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('a fresh SQLite database includes responsive image metadata columns', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'kas-sqlite-schema-'))
  const sqlitePath = path.join(cwd, 'kas-test.sqlite')
  const dbModule = pathToFileURL(path.resolve('server/db/db.ts')).href
  const initModule = pathToFileURL(path.resolve('server/db/init.ts')).href
  const script = `
    const db = await import(${JSON.stringify(dbModule)});
    const { initDatabase } = await import(${JSON.stringify(initModule)});
    await initDatabase();
    const product = db.sqliteDb.prepare('PRAGMA table_info(product_images)').all().map(r => r.name);
    const offers = db.sqliteDb.prepare('PRAGMA table_info(landing_offers)').all().map(r => r.name);
    console.log(JSON.stringify({ product, offers }));
    await db.closeDatabase();
  `

  try {
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--eval', script], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: '', KAS_SQLITE_DB_PATH: sqlitePath },
      encoding: 'utf8',
    })
    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(sqlitePath), true)
    const payload = JSON.parse(result.stdout.split('\n').find(line => line.startsWith('{')) || '{}')
    assert.deepEqual(
      payload.product.filter((name: string) => ['storage_provider', 'image_key', 'image_variants'].includes(name)),
      ['storage_provider', 'image_key', 'image_variants']
    )
    assert.deepEqual(
      payload.offers.filter((name: string) => ['image_storage_provider', 'image_key', 'image_variants'].includes(name)),
      ['image_storage_provider', 'image_key', 'image_variants']
    )
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
