import pg from 'pg'
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'

dotenv.config()

const targetUrl = process.argv[2] || process.env.REMOTE_DATABASE_URL || process.env.DATABASE_URL

if (!targetUrl) {
  console.error('❌ Please provide the remote PostgreSQL connection URL:')
  console.error('   npx tsx server/scripts/sync_to_remote_postgres.ts "postgresql://postgres:password@host:5432/dbname"')
  process.exit(1)
}

const sqlitePath = path.resolve(process.cwd(), 'server', 'data', 'kas_autoparts.sqlite')
if (!fs.existsSync(sqlitePath)) {
  console.error(`❌ SQLite database not found at: ${sqlitePath}`)
  process.exit(1)
}

const sqlite = new Database(sqlitePath, { readonly: true })
const isLocal = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')
const pool = new pg.Pool({
  connectionString: targetUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

const TABLE_ORDER = [
  'algeria_wilayas',
  'algeria_communes',
  'categories',
  'brands',
  'vehicle_makes',
  'vehicle_models',
  'vehicle_generations',
  'vehicle_engines',
  'products',
  'product_variants',
  'product_specs',
  'product_images',
  'part_compatibility',
  'product_aliases',
  'landing_offers',
  'offer_features',
  'customers',
  'orders',
  'order_items',
  'order_timeline',
  'inventory_transactions',
  'contact_messages',
  'admin_users',
  'admin_sessions',
  'audit_logs',
  'marketing_campaigns',
  'campaign_visits',
  'notifications',
  'system_settings',
  'import_batches',
  'import_batch_rows',
  'part_requests',
]

async function runSync() {
  console.log(`🔌 Connecting to Remote PostgreSQL Database...`)
  const client = await pool.connect()
  console.log(`✅ Connected successfully!`)

  try {
    // 1. Ensure Schema Exists on Remote Database
    console.log('🔄 Initializing remote PostgreSQL schema...')
    const { initDatabase } = await import('../db/init.js')
    await initDatabase()

    await client.query('BEGIN')
    console.log('🚀 Starting Data Migration...')

    for (const tbl of TABLE_ORDER) {
      // Check if table exists in SQLite
      const tableExists = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tbl)
      if (!tableExists) continue

      const cols = sqlite.prepare(`PRAGMA table_info(${tbl})`).all().map((c: any) => c.name)
      const rows = sqlite.prepare(`SELECT * FROM ${tbl}`).all()

      if (rows.length === 0) {
        console.log(`  ⚪ ${tbl}: 0 rows (skipped)`)
        continue
      }

      console.log(`  📦 Migrating ${tbl}: ${rows.length} rows...`)
      
      // Delete existing data in remote table
      await client.query(`DELETE FROM "${tbl}"`)

      const colNames = cols.map((c) => `"${c}"`).join(', ')
      
      // Insert in chunks of 200
      const chunkSize = 200
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize)
        const placeholders: string[] = []
        const params: any[] = []
        let paramIdx = 1

        for (const row of chunk) {
          const rowPlaceholders: string[] = []
          for (const col of cols) {
            rowPlaceholders.push(`$${paramIdx++}`)
            params.push((row as any)[col])
          }
          placeholders.push(`(${rowPlaceholders.join(', ')})`)
        }

        const insertSql = `INSERT INTO "${tbl}" (${colNames}) VALUES ${placeholders.join(', ')}`
        await client.query(insertSql, params)
      }
    }

    await client.query('COMMIT')
    console.log('\n============================================================')
    console.log('🎉 COMPLETE DATABASE MIGRATION TO WEB FINISHED SUCCESSFULLY!')
    console.log('============================================================')
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('❌ Migration failed:', err.message)
  } finally {
    client.release()
    await pool.end()
    sqlite.close()
  }
}

runSync()
