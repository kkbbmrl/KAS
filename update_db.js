import fs from 'node:fs'

const filePath = 'app/server/db/db.ts'
let content = fs.readFileSync(filePath, 'utf-8')

// 1. Set default Supabase PostgreSQL URL
const oldPgInit = "const rawDbUrl = (process.env.DATABASE_URL || '').trim().replace(/^[\"']|[\"']$/g, '')"
const newPgInit = `// Default authoritative Supabase PostgreSQL connection (Transaction Pooler: Port 6543)
const DEFAULT_SUPABASE_PG =
  'postgresql://postgres.gqbwwymexbxdhosjslwz:0662136563bachir@aws-0-eu-west-2.pooler.supabase.com:6543/postgres'

const rawDbUrl = (process.env.DATABASE_URL || DEFAULT_SUPABASE_PG).trim().replace(/^["']|["']$/g, '')`

if (content.includes(oldPgInit)) {
  content = content.replace(oldPgInit, newPgInit)
  console.log('Updated rawDbUrl in db.ts')
} else {
  console.log('oldPgInit not found')
}

// 2. Prevent mutating operations from ever falling back to SQLite
const oldFallback = `    } catch (err: any) {
      if (txClient) {
        // Within transaction, errors must propagate so the transaction rolls back cleanly
        throw err
      }
      console.warn(\`⚠️ PostgreSQL query failed (\${err.message}). Using local database engine...\`)
    }`

const newFallback = `    } catch (err: any) {
      if (txClient) {
        // Within transaction, errors must propagate so the transaction rolls back cleanly
        throw err
      }
      const isMutation = /^\\s*(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE)\\b/i.test(sql)
      if (isMutation) {
        // NEVER divert database writes to local SQLite when PostgreSQL is configured!
        // All mutations must succeed in Supabase PostgreSQL to protect data integrity.
        console.error('❌ Supabase PostgreSQL mutation failed:', err.message, 'SQL:', pgSql)
        throw err
      }
      console.warn(\`⚠️ PostgreSQL query failed (\${err.message}). Using local database engine...\`)
    }`

content = content.replace(/\r\n/g, '\n')
const cleanOldFallback = oldFallback.replace(/\r\n/g, '\n')
const cleanNewFallback = newFallback.replace(/\r\n/g, '\n')

if (content.includes(cleanOldFallback)) {
  content = content.replace(cleanOldFallback, cleanNewFallback)
  console.log('Updated query error fallback in db.ts')
} else {
  console.log('cleanOldFallback not found')
}

fs.writeFileSync(filePath, content, 'utf-8')
console.log('db.ts successfully updated!')

