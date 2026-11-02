import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

function cleanEnv(val?: string): string {
  return (val || '').trim().replace(/^["']|["']$/g, '').trim()
}

const rawSupabaseUrl = cleanEnv(process.env.SUPABASE_URL)
const rawServiceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
const rawAnonKey = cleanEnv(process.env.SUPABASE_ANON_KEY)

function isValidSupabaseUrl(urlStr: string): boolean {
  if (!urlStr || urlStr.includes('[your-project-ref]')) return false
  try {
    const parsed = new URL(urlStr)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidKey(keyStr: string): boolean {
  return Boolean(keyStr && !keyStr.includes('[your-') && keyStr.length > 20)
}

const isConfigured = isValidSupabaseUrl(rawSupabaseUrl)

/**
 * Privileged Admin Client (Server-side ONLY).
 * Uses the Service Role Key to bypass RLS for uploads, deletions, and maintenance.
 */
export const supabaseAdmin: SupabaseClient | null =
  isConfigured && isValidKey(rawServiceKey)
    ? createClient(rawSupabaseUrl, rawServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    : null

/**
 * Public Anonymous Client for client-safe read operations.
 */
export const supabasePublic: SupabaseClient | null =
  isConfigured && isValidKey(rawAnonKey)
    ? createClient(rawSupabaseUrl, rawAnonKey)
    : null

if (supabaseAdmin) {
  console.log(`☁️ Initialized Supabase Admin Storage Client (${rawSupabaseUrl})`)
} else {
  console.warn(`⚠️ Supabase Storage not initialized. URL configured: ${isConfigured}, Key present: ${Boolean(rawServiceKey)}`)
}

export function isSupabaseStorageReady(): boolean {
  return Boolean(supabaseAdmin && isConfigured)
}
