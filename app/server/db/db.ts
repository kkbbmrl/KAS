import dotenv from 'dotenv'
import pg from 'pg'
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { AsyncLocalStorage } from 'node:async_hooks'

dotenv.config()

const rawDbUrl = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '')
let isPostgres = Boolean(rawDbUrl && !rawDbUrl.includes('[your-project-ref]'))
let pgPool: pg.Pool | null = null
let sqliteDb: any = null
const pgTransactionStorage = new AsyncLocalStorage<pg.PoolClient>()

// 1. Initialize SQLite Database always as a zero-latency engine and reliable fallback
try {
  const dbDir = path.resolve(process.cwd(), 'server', 'data')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  const dbPath = path.join(dbDir, 'kas_autoparts.sqlite')
  sqliteDb = new Database(dbPath)
  sqliteDb.pragma('journal_mode = WAL')
  sqliteDb.pragma('foreign_keys = ON')
  console.log(`🗄️ SQLite Database engine ready (${dbPath})`)
} catch (err: any) {
  console.warn('⚠️ SQLite initialization warning:', err.message)
}

// 2. If PostgreSQL is configured, initialize singleton pool
if (isPostgres && rawDbUrl) {
  try {
    const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
    pgPool = new pg.Pool({
      connectionString: rawDbUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
    pgPool.on('error', (err) => {
      console.warn('⚠️ PostgreSQL pool error:', err.message)
    })
    console.log('🐘 Initialized Singleton PostgreSQL Database Pool (max: 10, idleTimeout: 30s, connTimeout: 5s, SSL ready)')
  } catch (err: any) {
    console.warn('⚠️ Could not configure PostgreSQL pool:', err.message)
    isPostgres = false
  }
}

export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
}

/**
 * Universal query runner that translates parameterized queries ($1, $2)
 * to PostgreSQL or SQLite bindings transparently with resilient fallback.
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  if (isPostgres && pgPool) {
    const txClient = pgTransactionStorage.getStore()
    const runner = txClient || pgPool

    // Normalize cross-dialect boolean vs integer comparisons for PostgreSQL
    const pgSql = sql
      .replace(/\(([a-zA-Z0-9_.]*is_[a-zA-Z0-9_]+)\s*=\s*1\s+OR\s+[a-zA-Z0-9_.]*is_[a-zA-Z0-9_]+\s*=\s*(TRUE|true)\)/gi, '$1 = 1')
      .replace(/\b([a-zA-Z0-9_.]*is_[a-zA-Z0-9_]+)\s*=\s*(TRUE|true)\b/gi, '$1 = 1')

    try {
      const res = await runner.query(pgSql, params)
      return {
        rows: res.rows,
        rowCount: res.rowCount ?? res.rows.length,
      }
    } catch (err: any) {
      if (txClient) {
        // Within transaction, errors must propagate so the transaction rolls back cleanly
        throw err
      }
      console.warn(`⚠️ PostgreSQL query failed (${err.message}). Using local database engine...`)
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

    // Handle SELECT / PRAGMA / RETURNING vs INSERT / UPDATE / DELETE / DDL
    const trimmed = sqliteSql.trim()
    const isSelectOrReturning = /^SELECT|^PRAGMA|^WITH/i.test(trimmed) || /\bRETURNING\b/i.test(trimmed)

    try {
      if (isSelectOrReturning) {
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

/**
 * Execute a series of database operations within an atomic transaction.
 * Rolls back automatically if any query fails.
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  if (isPostgres && pgPool) {
    const existingTx = pgTransactionStorage.getStore()
    if (existingTx) {
      return fn()
    }

    const client = await pgPool.connect()
    try {
      await client.query('BEGIN')
      const result = await pgTransactionStorage.run(client, fn)
      await client.query('COMMIT')
      return result
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  }

  if (sqliteDb) {
    await query('BEGIN')
    try {
      const result = await fn()
      await query('COMMIT')
      return result
    } catch (err) {
      await query('ROLLBACK').catch(() => {})
      throw err
    }
  }

  return fn()
}

export async function getClient() {
  if (isPostgres && pgPool) {
    return pgPool.connect()
  }
  return null
}

export { isPostgres, sqliteDb, pgPool }
