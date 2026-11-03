import fs from 'node:fs'

const filePath = 'app/server/lib/supabase.ts'
let content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n')

const oldBlock = `// Support any naming variation of Supabase URL
let rawSupabaseUrl = cleanEnv(
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL
)

// Auto-correct if user accidentally pasted dashboard URL instead of API URL
const dashboardMatch = rawSupabaseUrl.match(/supabase\\.com\\/dashboard\\/project\\/([a-zA-Z0-9_-]+)/)
if (dashboardMatch) {
  rawSupabaseUrl = \`https://\${dashboardMatch[1]}.supabase.co\`
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
)`

const newBlock = `// Authoritative Supabase Credentials (Defaults ensure cloud persistence even if Railway env is unset)
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
const dashboardMatch = rawSupabaseUrl.match(/supabase\\.com\\/dashboard\\/project\\/([a-zA-Z0-9_-]+)/)
if (dashboardMatch) {
  rawSupabaseUrl = \`https://\${dashboardMatch[1]}.supabase.co\`
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
)`

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock)
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log('supabase.ts successfully updated with persistent cloud credentials!')
} else {
  console.log('oldBlock not found in supabase.ts')
}

