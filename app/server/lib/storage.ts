import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { buildImmutableImageKey } from './imageAssets.js'
import { generateImageVariants } from './imageProcessing.js'
import { createR2Adapter, r2Config, removeStoredImage, storageProvider } from './r2.js'

const provider = storageProvider(process.env)
const r2 = provider === 'r2' ? createR2Adapter(r2Config(process.env)) : undefined

export async function deleteImageObject(provider: string | null, key: string) {
  const r2Adapter = r2 ?? (provider === 'r2' && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME && process.env.R2_PUBLIC_URL
    ? createR2Adapter(r2Config(process.env)) : undefined)
  return removeStoredImage(provider, key, {
    r2: r2Adapter,
  })
}

export interface StorageUploadResult {
  provider: 'r2' | 'local'
  url: string
  key: string
  variants: { key: string; width: number }[]
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
 * Uploads an image buffer directly to R2 when configured.
 * Automatically compresses the image to WebP with sharp.
 * Uses local disk storage in development when R2 is not selected.
 */
export async function uploadImage(
  buffer: Buffer,
  _extension: 'jpg' | 'png' | 'webp' = 'webp',
  folder: string = 'products'
): Promise<StorageUploadResult> {
  const originalSize = buffer.length

  const generated = await generateImageVariants(buffer)
  const master = generated.variants.at(-1)!
  const optimizedBuffer = master.buffer
  const optimizedSize = optimizedBuffer.length
  const uploadVariants = generated.variants.map((variant) => ({
    width: variant.width,
    buffer: variant.buffer,
    key: buildImmutableImageKey(folder, createHash('sha256').update(variant.buffer).digest('hex'), variant.width),
  }))
  const masterKey = uploadVariants.at(-1)!.key
  const variants = uploadVariants.map(({ key, width }) => ({ key, width }))
  const ext = 'webp'

  if (r2) {
    for (const variant of uploadVariants) await r2.upload(variant.key, variant.buffer)
    return { provider: 'r2', url: r2.publicUrl(masterKey), key: masterKey, variants, isCloud: true, format: ext, originalSize, optimizedSize }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('فشل رفع الصورة: تخزين R2 غير مفعّل في بيئة الإنتاج.')
  }

  const uploadsDir = path.resolve(process.cwd(), 'server', 'data', 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const localFilename = `img_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 16)}.webp`
  const filePath = path.join(uploadsDir, localFilename)
  fs.writeFileSync(filePath, optimizedBuffer)

  console.warn('R2 not active. Saved image locally:', localFilename)

  return {
    provider: 'local',
    url: `/uploads/${localFilename}`,
    key: localFilename,
    variants: [],
    isCloud: false,
    format: ext,
    originalSize,
    optimizedSize,
  }
}
