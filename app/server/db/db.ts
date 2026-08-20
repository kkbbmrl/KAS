import dotenv from 'dotenv'
import pg from 'pg'
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

dotenv.config()

const isPostgres = Boolean(process.env.DATABASE_URL)

let pgPool: pg.Pool | null = null
let sqliteDb: Database.Database | null = null

if (isPostgres) {
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  })
  console.log('🐘 Connected to PostgreSQL Database')
} else {
  const dbDir = path.resolve(process.cwd(), 'server', 'data')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  const dbPath = path.join(dbDir, 'kas_autoparts.sqlite')
  sqliteDb = new Database(dbPath)
  sqliteDb.pragma('journal_mode = WAL')
  sqliteDb.pragma('foreign_keys = ON')
  console.log(`🗄️ Connected to Local SQLite Database (${dbPath})`)
}

export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
}

/**
 * Universal query runner that translates parameterized queries ($1, $2)
 * to PostgreSQL or SQLite bindings transparently.
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  if (isPostgres && pgPool) {
    const res = await pgPool.query(sql, params)
    return {
      rows: res.rows,
      rowCount: res.rowCount ?? res.rows.length,
    }
  }

  if (sqliteDb) {
    // Correctly map positional parameters ($1, $2, $1...) to SQLite ? and expand parameters
    const orderedParams: any[] = []
    const sqliteSql = sql
      .replace(/\$(\d+)/g, (_, match) => {
        const index = parseInt(match, 10) - 1
        orderedParams.push(params[index])
        return '?'
      })
      .replace(/\bILIKE\b/gi, 'LIKE')

    // Handle SELECT / PRAGMA vs INSERT / UPDATE / DELETE / DDL
    const trimmed = sqliteSql.trim()
    const isSelect = /^SELECT|^PRAGMA|^WITH/i.test(trimmed)

    try {
      if (isSelect) {
        const stmt = sqliteDb.prepare(sqliteSql)
        const rows = stmt.all(...orderedParams) as T[]
        return { rows, rowCount: rows.length }
      } else {
        const stmt = sqliteDb.prepare(sqliteSql)
        const info = stmt.run(...orderedParams)
        return { rows: [], rowCount: info.changes }
      }
    } catch (err: any) {
      console.error('Database query error:', err.message, 'SQL:', sqliteSql)
      throw err
    }
  }

  throw new Error('No database client initialized')
}

export async function getClient() {
  if (isPostgres && pgPool) {
    return pgPool.connect()
  }
  return null
}

export { isPostgres, sqliteDb, pgPool }
