import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('Supabase storage stays disabled when credentials are not explicitly configured', () => {
  const env = {
    ...process.env,
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    SUPABASE_SECRET_KEY: '',
    SUPABASE_SERVICE_KEY: '',
    SUPABASE_KEY: '',
    SUPABASE_ANON_KEY: '',
    VITE_SUPABASE_URL: '',
    VITE_SUPABASE_ANON_KEY: '',
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  }
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--eval', "const m = await import('./server/lib/supabase.ts'); console.log(Boolean(m.supabaseAdmin))"],
    { cwd: process.cwd(), env, encoding: 'utf8' }
  )

  assert.equal(result.status, 0)
  assert.match(result.stdout, /false\s*$/)
})
