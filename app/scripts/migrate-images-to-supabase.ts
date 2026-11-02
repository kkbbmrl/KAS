import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { query } from '../server/db/db.js'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'product-images'

async function optimizeToWebp(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer()
  } catch (err: any) {
    console.warn(`⚠️ Warning: Sharp optimization failed (${err.message}). Using raw buffer.`)
    return buffer
  }
}

function resolveLocalFilePath(imageUrl: string): string | null {
  const root = process.cwd()
  const clean = imageUrl.replace(/^\/+/, '')

  const candidatePaths = [
    path.resolve(root, 'public', clean),
    path.resolve(root, clean),
    path.resolve(root, 'server', 'data', clean),
    path.resolve(root, 'dist', clean),
    path.resolve(root, 'server', 'data', 'uploads', path.basename(clean)),
  ]

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate
    }
  }

  return null
}

async function main() {
  console.log('\n🚀 Starting KAS Product Image Migration to Supabase Storage')
  console.log('===========================================================')

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('\n❌ ERROR: Supabase credentials are missing!')
    console.error('Please configure the following in your .env file:')
    console.error('  SUPABASE_URL="https://your-project.supabase.co"')
    console.error('  SUPABASE_SERVICE_ROLE_KEY="your-service-role-or-secret-key"')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Test Supabase Storage connection
  console.log(`📡 Connecting to Supabase project: ${SUPABASE_URL}`)
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
  if (bucketError) {
    console.error(`❌ Failed to connect to Supabase Storage: ${bucketError.message}`)
    console.error('Verify your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
  }

  const bucketExists = buckets?.some((b) => b.id === BUCKET_NAME)
  if (!bucketExists) {
    console.warn(`⚠️ Warning: Bucket "${BUCKET_NAME}" was not found in Supabase buckets list.`)
    console.warn(`Attempting upload anyway (ensure bucket is created in SQL Editor or Supabase dashboard)...`)
  } else {
    console.log(`✅ Verified bucket "${BUCKET_NAME}" exists in Supabase.`)
  }

  // 1. Fetch all distinct local image paths from the database
  console.log('\n🔍 Scanning database for local image references...')
  const imgRes = await query<{ image_url: string }>(
    `SELECT DISTINCT image_url 
     FROM product_images 
     WHERE image_url NOT LIKE 'http://%' AND image_url NOT LIKE 'https://%'`
  )

  const distinctUrls = imgRes.rows.map((r) => r.image_url)
  console.log(`📦 Found ${distinctUrls.length} distinct local images referenced across catalog products.`)

  if (distinctUrls.length === 0) {
    console.log('✅ All images are already migrated or using cloud URLs. Nothing to do!')
    process.exit(0)
  }

  let successCount = 0
  let missingCount = 0
  let totalOriginalBytes = 0
  let totalOptimizedBytes = 0

  for (let i = 0; i < distinctUrls.length; i++) {
    const localUrl = distinctUrls[i]
    const localPath = resolveLocalFilePath(localUrl)

    if (!localPath) {
      console.warn(`⚠️ [${i + 1}/${distinctUrls.length}] Local file not found on disk: "${localUrl}"`)
      missingCount++
      continue
    }

    try {
      const originalBuffer = fs.readFileSync(localPath)
      const originalSize = originalBuffer.length
      totalOriginalBytes += originalSize

      // Compress to WebP
      const webpBuffer = await optimizeToWebp(originalBuffer)
      const optimizedSize = webpBuffer.length
      totalOptimizedBytes += optimizedSize

      // Build target object key in Supabase: products/<cleaned_filename>.webp
      const baseName = path.parse(localPath).name.replace(/[^a-zA-Z0-9_-]/g, '_')
      const remoteKey = `catalog/${baseName}.webp`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(remoteKey, webpBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000, immutable',
          upsert: true,
        })

      if (uploadErr) {
        console.error(`❌ [${i + 1}/${distinctUrls.length}] Failed uploading "${remoteKey}":`, uploadErr.message)
        continue
      }

      // Retrieve Public URL
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path)

      const cloudUrl = publicUrlData.publicUrl

      // Update Database records
      const updateRes = await query(
        `UPDATE product_images SET image_url = $1 WHERE image_url = $2`,
        [cloudUrl, localUrl]
      )

      // Also check landing_offers if applicable
      await query(
        `UPDATE landing_offers SET image_url = $1 WHERE image_url = $2`,
        [cloudUrl, localUrl]
      ).catch(() => {})

      const savings = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1)
      const origKb = (originalSize / 1024).toFixed(1)
      const optKb = (optimizedSize / 1024).toFixed(1)

      console.log(
        `✅ [${i + 1}/${distinctUrls.length}] ${path.basename(localPath)} -> ${remoteKey} (${origKb}KB -> ${optKb}KB, -${savings}% saved, ${updateRes.rowCount} rows updated)`
      )

      successCount++
    } catch (err: any) {
      console.error(`❌ [${i + 1}/${distinctUrls.length}] Error processing "${localUrl}":`, err.message)
    }
  }

  console.log('\n===========================================================')
  console.log('🎉 Migration Completed Summary:')
  console.log(`- Successfully uploaded & updated: ${successCount} images`)
  console.log(`- Missing files skipped: ${missingCount}`)
  if (totalOriginalBytes > 0) {
    const totalOrigMb = (totalOriginalBytes / (1024 * 1024)).toFixed(2)
    const totalOptMb = (totalOptimizedBytes / (1024 * 1024)).toFixed(2)
    const overallSavings = (((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100).toFixed(1)
    console.log(`- Original Size: ${totalOrigMb} MB`)
    console.log(`- Optimized WebP Cloud Size: ${totalOptMb} MB`)
    console.log(`- Reclaimed / Saved: -${overallSavings}%`)
  }
  console.log('===========================================================\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal migration error:', err)
  process.exit(1)
})

