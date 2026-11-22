import 'dotenv/config'
import { closeDatabase } from '../server/db/db.js'
import { supabaseAdmin } from '../server/lib/supabase.js'
import { cleanupCandidates, options, stillReferenced } from '../server/lib/r2Cutover.js'
import { matchingRows, readManifest, tables } from './r2-cutover-db.js'

async function main() {
  const cli = options(process.argv.slice(2), true)
  if (!cli.manifest) throw new Error('--manifest=<file> is required')
  if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL is required')
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'product-images'
  const prefix = `${new URL(process.env.SUPABASE_URL).origin}/storage/v1/object/public/${encodeURIComponent(bucket)}/`
  const candidates = cleanupCandidates(await readManifest(cli.manifest), prefix)
  if (cli.execute && !supabaseAdmin) throw new Error('Supabase storage credentials are required')
  for (const { key, url } of candidates) {
    let referenced = false
    for (const { name } of await tables()) {
      if ((await matchingRows(name, '')).some(row => stillReferenced(row, key, url))) {
        referenced = true
        break
      }
    }
    if (referenced) {
      console.warn(`Refused (still referenced): ${key}`)
      process.exitCode = 1
      continue
    }
    if (cli.execute) {
      const { error } = await supabaseAdmin!.storage.from(bucket).remove([key])
      if (error) throw new Error(`Supabase cleanup failed for ${key}: ${error.message}`)
    }
    console.log(`${cli.execute ? 'Removed' : 'Would remove'}: ${key}`)
  }
}

try { await main() } finally { await closeDatabase() }
