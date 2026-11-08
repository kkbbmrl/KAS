import dotenv from 'dotenv'
import pg from 'pg'
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { AsyncLocalStorage } from 'node:async_hooks'

dotenv.config()

// Default authoritative Supabase PostgreSQL connection (Transaction Pooler: Port 6543)
const DEFAULT_SUPABASE_PG =
  'postgresql://postgres.gqbwwymexbxdhosjslwz:0662136563bachir@aws-0-eu-west-2.pooler.supabase.com:6543/postgres'

const rawDbUrl = (process.env.DATABASE_URL || DEFAULT_SUPABASE_PG).trim().replace(/^["']|["']$/g, '')
let isPostgres = Boolean(rawDbUrl && !rawDbUrl.includes('[your-project-ref]'))
let pgPool: pg.Pool | null = null
let sqliteDb: any = null
const pgTransactionStorage = new AsyncLocalStorage<pg.PoolClient>()

// 1. Local SQLite Database: ONLY initialized in offline local dev when PostgreSQL is NOT configured.
// In production on Railway, Railway is 100% STATELESS — all database records and images live strictly in Supabase.
if (!isPostgres) {
  try {
    const dbDir = path.resolve(process.cwd(), 'server', 'data')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    const dbPath = path.join(dbDir, 'kas_autoparts.sqlite')
    sqliteDb = new Database(dbPath)
    sqliteDb.pragma('journal_mode = WAL')
    sqliteDb.pragma('foreign_keys = ON')
    console.log(`🗄️ SQLite Database engine ready for local offline dev (${dbPath})`)
  } catch (err: any) {
    console.warn('⚠️ SQLite initialization warning:', err.message)
  }
}

function isTransientConnectionError(err: any): boolean {
  if (!err) return false
  const msg = (err.message || '').toLowerCase()
  const code = String(err.code || '').toUpperCase()
  return (
    msg.includes('connection terminated') ||
    msg.includes('connection timeout') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('socket closed') ||
    msg.includes('server closed the connection') ||
    code === '57P01' || // admin_shutdown
    code === '57P02' || // crash_shutdown
    code === '57P03' || // cannot_connect_now
    code === '08006' || // connection_failure
    code === '08001' || // sqlclient_unable_to_establish_sqlconnection
    code === '08004'    // sqlserver_rejected_establishment_of_sqlconnection
  )
}

// 2. If PostgreSQL is configured, initialize singleton pool
if (isPostgres && rawDbUrl) {
  try {
    const isLocal = rawDbUrl.includes('localhost') || rawDbUrl.includes('127.0.0.1')
    pgPool = new pg.Pool({
      connectionString: rawDbUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 20,
      min: 2,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      maxUses: 7500,
    })
    pgPool.on('error', (err) => {
      console.warn('⚠️ PostgreSQL pool background notice:', err.message)
    })
    console.log('🐘 Initialized Singleton PostgreSQL Database Pool (max: 20, min: 2, idleTimeout: 20s, connTimeout: 15s, SSL ready)')
  } catch (err: any) {
    console.error('❌ Could not configure PostgreSQL pool:', err.message)
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Fatal: PostgreSQL pool failed in production: ${err.message}`)
    }
    isPostgres = false
  }
}

export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
}

/**
 * Universal query runner with automatic transient retry on PostgreSQL.
 * In production/Postgres mode, executes strictly against Supabase PostgreSQL.
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  if (isPostgres && pgPool) {
    const txClient = pgTransactionStorage.getStore()
    const runner = txClient || pgPool

    // Normalize cross-dialect boolean vs integer comparisons for PostgreSQL
    const pgSql = sql
      .replace(/\(([a-zA-Z0-9_.]+)\s*=\s*1\s+OR\s+[a-zA-Z0-9_.]+\s*=\s*(TRUE|true)\)/gi, '($1 = 1)')
      .replace(/\(([a-zA-Z0-9_.]+)\s*=\s*0\s+OR\s+[a-zA-Z0-9_.]+\s*=\s*(FALSE|false)(\s+OR\s+[a-zA-Z0-9_.]+\s+IS\s+NULL)?\)/gi, '($1 = 0 OR $1 IS NULL)')
      .replace(/([a-zA-Z0-9_.]+)\s*=\s*(TRUE|true)\b/gi, '$1 = 1')
      .replace(/([a-zA-Z0-9_.]+)\s*=\s*(FALSE|false)\b/gi, '$1 = 0')

    const maxAttempts = txClient ? 1 : 3
    let attempt = 0

    while (attempt < maxAttempts) {
      attempt++
      try {
        const res = await runner.query(pgSql, params)
        // When executing multi-statement scripts in pg, runner.query returns an array: [Result, Result, ...]
        if (Array.isArray(res)) {
          const lastResult = res[res.length - 1]
          return {
            rows: lastResult?.rows || [],
            rowCount: res.reduce((acc, r) => acc + (r.rowCount || 0), 0),
          }
        }
        return {
          rows: res?.rows || [],
          rowCount: res?.rowCount ?? (res?.rows ? res.rows.length : 0),
        }
      } catch (err: any) {
        if (attempt < maxAttempts && isTransientConnectionError(err)) {
          const backoff = 150 * attempt
          await new Promise((resolve) => setTimeout(resolve, backoff))
          continue
        }

        const sqlSnippet = pgSql.length > 120 ? `${pgSql.slice(0, 120).replace(/\s+/g, ' ')}...` : pgSql.replace(/\s+/g, ' ')
        console.error(`❌ PostgreSQL query failed [${err.code || 'TIMEOUT'}]:`, err.message, `| SQL: ${sqlSnippet}`)
        throw err
      }
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
      const sqlSnippet = sqliteSql.length > 100 ? `${sqliteSql.slice(0, 100).replace(/\s+/g, ' ')}...` : sqliteSql.replace(/\s+/g, ' ')
      console.error('SQLite query error:', err.message, '| SQL:', sqlSnippet)
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
    } catch (err: any) {
      console.error('❌ Database transaction failed:', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        table: err.table,
        constraint: err.constraint,
      })
      await client.query('ROLLBACK').catch(() => { })
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
      await query('ROLLBACK').catch(() => { })
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

export async function closeDatabase(): Promise<void> {
  if (pgPool) {
    try {
      await pgPool.end()
      console.log('🐘 PostgreSQL connection pool closed gracefully.')
    } catch (e: any) {
      console.warn('⚠️ Notice closing PostgreSQL pool:', e.message)
    }
  }
  if (sqliteDb) {
    try {
      sqliteDb.close()
      console.log('🗄️ SQLite local connection closed.')
    } catch (e: any) {
      console.warn('⚠️ Notice closing SQLite connection:', e.message)
    }
  }
}

export { isPostgres, sqliteDb, pgPool }
