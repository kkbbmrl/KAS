export const IMAGE_VARIANT_WIDTHS = [320, 640, 960] as const
export const IMAGE_MASTER_WIDTH = 1200

export interface ImageVariant {
  key: string
  width: number
}

export interface ImageSourceInput {
  legacyUrl: string
  variants?: ImageVariant[] | null
  baseUrl?: string
}

export interface ImageSources {
  src: string
  srcSet?: string
}

export function buildResponsiveWidths(sourceWidth: number): number[] {
  const maxWidth = Math.max(1, Math.floor(sourceWidth))
  const widths = IMAGE_VARIANT_WIDTHS.filter((width) => width < maxWidth)
  return [...widths, Math.min(maxWidth, IMAGE_MASTER_WIDTH)]
}

export function buildImmutableImageKey(folder: string, sha256: string, width: number): string {
  if (!/^[a-f0-9]{64}$/i.test(sha256)) throw new Error('Expected a SHA-256 hex digest')
  if (!Number.isInteger(width) || width < 1) throw new Error('Expected a positive variant width')
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '')
  if (!cleanFolder) throw new Error('Expected a storage folder')
  return `${cleanFolder}/v1/${sha256.toLowerCase()}-${width}w.webp`
}

function publicUrl(key: string, baseUrl?: string): string {
  if (!baseUrl) return key
  return `${baseUrl.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`
}

export function resolveImageSources({ legacyUrl, variants, baseUrl }: ImageSourceInput): ImageSources {
  const sorted = [...(variants || [])].sort((a, b) => a.width - b.width)
  if (sorted.length === 0 || !baseUrl) return { src: legacyUrl }

  return {
    src: publicUrl(sorted.at(-1)!.key, baseUrl),
    srcSet: sorted.map((variant) => `${publicUrl(variant.key, baseUrl)} ${variant.width}w`).join(', '),
  }
}
