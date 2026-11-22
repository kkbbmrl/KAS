import sharp from 'sharp'
import { buildResponsiveWidths, IMAGE_MASTER_WIDTH } from './imageAssets.js'

export type ImageVariantRole = 'card' | 'medium' | 'detail' | 'detail-xl'

export interface GeneratedImageVariant {
  width: number
  role: ImageVariantRole
  buffer: Buffer
}

export interface GeneratedImageVariants {
  sourceWidth: number
  sourceHeight: number
  variants: GeneratedImageVariant[]
}

function roleForWidth(width: number): ImageVariantRole {
  if (width === 320) return 'card'
  if (width === 640) return 'medium'
  if (width === 960) return 'detail'
  return 'detail-xl'
}

function qualityForWidth(width: number): number {
  if (width === 320) return 75
  if (width === 640) return 76
  if (width === 960) return 78
  return 80
}

/**
 * Creates WebP derivatives from an auto-oriented source without retaining EXIF
 * metadata. The largest rendition is capped at IMAGE_MASTER_WIDTH.
 */
export async function generateImageVariants(input: Buffer): Promise<GeneratedImageVariants> {
  const oriented = await sharp(input).rotate().toBuffer()
  const metadata = await sharp(oriented).metadata()
  if (!metadata.width || !metadata.height) throw new Error('Unable to determine image dimensions')

  const widths = buildResponsiveWidths(metadata.width)
  const variants = await Promise.all(
    widths.map(async (width) => ({
      width,
      role: width === Math.min(metadata.width, IMAGE_MASTER_WIDTH) ? 'detail-xl' : roleForWidth(width),
      buffer: await sharp(oriented)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: qualityForWidth(width), effort: 4 })
        .toBuffer(),
    }))
  )

  return { sourceWidth: metadata.width, sourceHeight: metadata.height, variants }
}
