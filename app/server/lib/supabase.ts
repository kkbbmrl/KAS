import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

function cleanEnv(val?: string): string {
  return (val || '').trim().replace(/^["']|["']$/g, '').trim()
}

// Supabase is optional during the R2/Neon rollout and must be configured explicitly.
let rawSupabaseUrl = cleanEnv(
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL
)

// Auto-correct if user accidentally pasted dashboard URL instead of API URL
const dashboardMatch = rawSupabaseUrl.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/)
if (dashboardMatch) {
  rawSupabaseUrl = `https://${dashboardMatch[1]}.supabase.co`
}

// Support any naming variation of Supabase Keys (Service Role or Anon)
const rawServiceKey = cleanEnv(
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY
)

const rawAnonKey = cleanEnv(
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  rawServiceKey
)

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
const effectiveKey = isValidKey(rawServiceKey) ? rawServiceKey : isValidKey(rawAnonKey) ? rawAnonKey : ''

/**
 * Privileged Admin / Active Client (Server-side).
 * Uses Service Role Key (or Anon Key with RLS upload policies) to interact with Storage.
 */
export const supabaseAdmin: SupabaseClient | null =
  isConfigured && effectiveKey
    ? createClient(rawSupabaseUrl, effectiveKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null

/**
 * Public Anonymous Client for client-safe operations.
 */
export const supabasePublic: SupabaseClient | null =
  isConfigured && isValidKey(rawAnonKey)
    ? createClient(rawSupabaseUrl, rawAnonKey)
    : supabaseAdmin

if (supabaseAdmin) {
  console.log(`☁️ Initialized Supabase Storage Client (${rawSupabaseUrl})`)
} else {
  console.warn(`⚠️ Supabase Storage not initialized. URL configured: ${isConfigured}, Key present: ${Boolean(effectiveKey)}`)
}

export function isSupabaseStorageReady(): boolean {
  return Boolean(supabaseAdmin && isConfigured)
}
