import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { supabaseAdmin, isSupabaseStorageReady } from './supabase.js'

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'product-images'

export interface StorageUploadResult {
  url: string
  key: string
  isCloud: boolean
  format: string
  originalSize: number
  optimizedSize: number
}

/**
 * Optimizes and compresses any image buffer to WebP using sharp.
 * Resizes images exceeding 1600px width/height while maintaining aspect ratio.
 */
export async function optimizeImageToWebp(
  buffer: Buffer,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 82
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate() // Auto-orient based on EXIF
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 4 })
      .toBuffer()
  } catch (err: any) {
    console.warn('⚠️ Sharp optimization failed, falling back to original buffer:', err.message)
    return buffer
  }
}

/**
 * Uploads an image buffer directly to Supabase Public Storage when configured.
 * Automatically compresses the image to WebP with sharp.
 * Gracefully falls back to local disk storage in development if Supabase keys are not set.
 */
export async function uploadImage(
  buffer: Buffer,
  _extension: 'jpg' | 'png' | 'webp' = 'webp',
  folder: string = 'products'
): Promise<StorageUploadResult> {
  const originalSize = buffer.length

  // Compress and convert to WebP
  const optimizedBuffer = await optimizeImageToWebp(buffer)
  const optimizedSize = optimizedBuffer.length
  const ext = 'webp'

  const fileName = `${folder}/${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 16)}.${ext}`

  // 1. If Supabase is configured, upload to Cloud Storage
  if (isSupabaseStorageReady() && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, optimizedBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000, immutable', // 1 year CDN cache
        upsert: false,
      })

    if (error) {
      console.error('⚠️ Supabase Storage upload error:', error.message)
      throw new Error(`فشل رفع الصورة إلى التخزين السحابي: ${error.message}`)
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    return {
      url: publicData.publicUrl,
      key: data.path,
      isCloud: true,
      format: ext,
      originalSize,
      optimizedSize,
    }
  }

  // 2. Graceful Fallback: Local Disk Storage for offline / testing environments
  const uploadsDir = path.resolve(process.cwd(), 'server', 'data', 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const localFilename = `img_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 16)}.${ext}`
  const filePath = path.join(uploadsDir, localFilename)
  fs.writeFileSync(filePath, optimizedBuffer)

  return {
    url: `/uploads/${localFilename}`,
    key: localFilename,
    isCloud: false,
    format: ext,
    originalSize,
    optimizedSize,
  }
}
