import { DeleteObjectCommand, PutObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3'

const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'] as const
type Sender = { send(command: PutObjectCommand | DeleteObjectCommand): Promise<unknown> }

export function storageProvider(env: NodeJS.ProcessEnv) {
  const provider = env.STORAGE_PROVIDER || 'supabase'
  if (provider !== 'supabase' && provider !== 'r2') throw new Error('STORAGE_PROVIDER must be supabase or r2')
  return provider
}

export function r2Config(env: NodeJS.ProcessEnv) {
  const missing = required.filter((key) => !env[key]?.trim())
  if (missing.length) throw new Error(`Missing R2 configuration: ${missing.join(', ')}`)
  const publicUrl = new URL(env.R2_PUBLIC_URL!.trim())
  if (publicUrl.protocol !== 'https:' || publicUrl.username || publicUrl.password || publicUrl.search || publicUrl.hash) {
    throw new Error('R2_PUBLIC_URL must be a public HTTPS base URL')
  }
  if (!/^[a-z0-9]+$/i.test(env.R2_ACCOUNT_ID!.trim())) throw new Error('Invalid R2_ACCOUNT_ID')
  const client: S3ClientConfig = {
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID!.trim()}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!.trim(), secretAccessKey: env.R2_SECRET_ACCESS_KEY!.trim() },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  }
  return { client, bucket: env.R2_BUCKET_NAME!.trim(), base: publicUrl.href.replace(/\/+$/, '') }
}

export function createR2Adapter(config: ReturnType<typeof r2Config>, factory: (config: S3ClientConfig) => Sender = (options) => new S3Client(options)) {
  let client: Sender | undefined
  const sender = () => client ??= factory(config.client)
  const keyOf = (key: string) => key.replace(/^\/+/, '')
  return {
    publicUrl: (key: string) => `${config.base}/${keyOf(key).split('/').map(encodeURIComponent).join('/')}`,
    async upload(key: string, body: Buffer, contentType = 'image/webp') {
      try {
        await sender().send(new PutObjectCommand({
          Bucket: config.bucket, Key: keyOf(key), Body: body, ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable', IfNoneMatch: '*',
        }))
      } catch (error) {
        if ((error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode !== 412) throw error
      }
    },
    async remove(key: string) {
      await sender().send(new DeleteObjectCommand({ Bucket: config.bucket, Key: keyOf(key) }))
    },
  }
}

export async function removeStoredImage(provider: string | null, key: string, adapters: Partial<Record<'supabase' | 'r2', { remove(key: string): Promise<void> }>>) {
  if (!key || (provider !== 'supabase' && provider !== 'r2')) return false
  const adapter = adapters[provider]
  if (!adapter) return false
  await adapter.remove(key)
  return true
}

export function isAllowedImageUrl(value: string, env: NodeJS.ProcessEnv) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false
    return [env.SUPABASE_URL, env.IMAGE_CDN_BASE_URL, env.R2_PUBLIC_URL].some((base) => {
      try { return !!base && new URL(base).origin === url.origin } catch { return false }
    })
  } catch { return false }
}
