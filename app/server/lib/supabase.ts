import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

function cleanEnv(val?: string): string {
  return (val || '').trim().replace(/^["']|["']$/g, '').trim()
}

// Authoritative Supabase Credentials (Defaults ensure cloud persistence even if Railway env is unset)
const DEFAULT_SUPABASE_URL = 'https://gqbwwymexbxdhosjslwz.supabase.co'
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxYnd3eW1leGJ4ZGhvc2pzbHd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzYyOTg1MiwiZXhwIjoyMTA5MjA1ODUyfQ.wUa46PulZSxrSXA-eCEqhbu0woMBoKcI7RIMwXHg8s4'
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxYnd3eW1leGJ4ZGhvc2pzbHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2Mjk4NTIsImV4cCI6MjEwOTIwNTg1Mn0.I1J_tnkAxekrmGxO9BVbaagEmeqC36xUIj3WacoLnSU'

// Support any naming variation of Supabase URL with fallback
let rawSupabaseUrl = cleanEnv(
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL
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
  process.env.SUPABASE_ANON_KEY ||
  DEFAULT_SERVICE_ROLE_KEY
)

const rawAnonKey = cleanEnv(
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  rawServiceKey ||
  DEFAULT_ANON_KEY
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
