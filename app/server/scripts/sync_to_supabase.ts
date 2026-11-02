import pg from 'pg'
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'

dotenv.config()

const targetUrl = process.env.DATABASE_URL

if (!targetUrl) {
  console.error('❌ DATABASE_URL is not defined in app/.env')
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
  'products',
  'product_variants',
  'product_aliases',
  'product_specs',
  'product_images',
  'part_compatibility',
  'landing_offers',
  'offer_features',
  'customers',
  'orders',
  'order_items',
  'inventory_transactions',
  'contact_messages',
  'audit_logs',
  'admin_users',
  'admin_sessions',
  'order_timeline',
  'marketing_campaigns',
  'campaign_visits',
  'notifications',
  'system_settings',
  'import_batches',
  'import_batch_rows',
  'purchase_history',
]

function mapSqliteTypeToPg(type: string): string {
  const t = (type || 'TEXT').toUpperCase()
  if (t.includes('INT')) return 'BIGINT'
  if (t.includes('REAL') || t.includes('FLOA') || t.includes('DOUB')) return 'NUMERIC'
  if (t.includes('BOOL')) return 'BOOLEAN'
  if (t.includes('BLOB')) return 'BYTEA'
  return 'TEXT'
}

async function run() {
  console.log('🔌 Connecting to Supabase PostgreSQL database...')
  const client = await pool.connect()
  console.log('✅ Connected successfully!')

  try {
    console.log('\n🔨 Step 1: Ensuring all catalog & store tables exist in Supabase...')

    for (const tbl of TABLE_ORDER) {
      const tableCheck = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tbl)
      if (!tableCheck) continue

      const cols = sqlite.prepare(`PRAGMA table_info("${tbl}")`).all() as Array<{
        cid: number
        name: string
        type: string
        notnull: number
        dflt_value: any
        pk: number
      }>

      // Check if table exists in PostgreSQL
      const pgTableCheck = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
        [tbl]
      )

      if (pgTableCheck.rows.length === 0) {
        // Build CREATE TABLE statement
        const colDefs = cols.map((c) => {
          const pgType = mapSqliteTypeToPg(c.type)
          let def = `"${c.name}" ${pgType}`
          if (c.pk === 1) def += ' PRIMARY KEY'
          return def
        })

        const createSql = `CREATE TABLE IF NOT EXISTS "${tbl}" (\n  ${colDefs.join(',\n  ')}\n);`
        await client.query(createSql)
        console.log(`  ➕ Created table "${tbl}"`)
      } else {
        // Table exists, check for any missing columns
        const pgCols = await client.query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
          [tbl]
        )
        const existingPgColNames = new Set(pgCols.rows.map((r) => r.column_name))

        for (const c of cols) {
          if (!existingPgColNames.has(c.name)) {
            const pgType = mapSqliteTypeToPg(c.type)
            await client.query(`ALTER TABLE "${tbl}" ADD COLUMN IF NOT EXISTS "${c.name}" ${pgType}`)
            console.log(`  ➕ Added column "${tbl}.${c.name}" (${pgType})`)
          }
        }
      }
    }

    console.log('\n🚀 Step 2: Migrating clean catalog data into Supabase...')

    // Temporarily bypass foreign key constraints during bulk load
    await client.query("SET session_replication_role = 'replica';")

    let totalMigratedRows = 0

    for (const tbl of TABLE_ORDER) {
      const tableCheck = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tbl)
      if (!tableCheck) continue

      const rows = sqlite.prepare(`SELECT * FROM "${tbl}"`).all() as any[]
      if (rows.length === 0) {
        console.log(`  ⚪ ${tbl}: 0 rows (skipped)`)
        continue
      }

      // Truncate existing table in Supabase
      await client.query(`TRUNCATE TABLE "${tbl}" CASCADE;`)

      const cols = sqlite.prepare(`PRAGMA table_info("${tbl}")`).all() as any[]
      const colNames = cols.map((c) => `"${c.name}"`).join(', ')
      const colKeys = cols.map((c) => c.name)

      // Batch insert in chunks of 150
      const chunkSize = 150
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize)
        const placeholders: string[] = []
        const params: any[] = []
        let paramIdx = 1

        for (const row of chunk) {
          const rowPlaceholders: string[] = []
          for (const key of colKeys) {
            rowPlaceholders.push(`$${paramIdx++}`)
            params.push(row[key])
          }
          placeholders.push(`(${rowPlaceholders.join(', ')})`)
        }

        const insertSql = `INSERT INTO "${tbl}" (${colNames}) VALUES ${placeholders.join(', ')}`
        await client.query(insertSql, params)
      }

      console.log(`  ✅ ${tbl}: ${rows.length} rows migrated`)
      totalMigratedRows += rows.length
    }

    // Restore standard constraint validation
    await client.query("SET session_replication_role = 'origin';")

    console.log('\n============================================================')
    console.log(`🎉 SUCCESS! Migrated ${totalMigratedRows} total rows into Supabase PostgreSQL!`)
    console.log('============================================================\n')

    // Print summary verification
    const prodCount = await client.query('SELECT COUNT(*) FROM products')
    const varCount = await client.query('SELECT COUNT(*) FROM product_variants')
    const imgCount = await client.query('SELECT COUNT(*) FROM product_images')
    const brandCount = await client.query('SELECT COUNT(*) FROM brands')
    const catCount = await client.query('SELECT COUNT(*) FROM categories')

    console.log('📊 Supabase Database Verification:')
    console.log(`   - Products:         ${prodCount.rows[0].count}`)
    console.log(`   - Product Variants: ${varCount.rows[0].count}`)
    console.log(`   - Product Images:   ${imgCount.rows[0].count}`)
    console.log(`   - Brands:           ${brandCount.rows[0].count}`)
    console.log(`   - Categories:       ${catCount.rows[0].count}`)
  } catch (err: any) {
    console.error('❌ Migration error:', err.message)
    await client.query("SET session_replication_role = 'origin';").catch(() => {})
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
    sqlite.close()
  }
}

run()

