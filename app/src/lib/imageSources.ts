export type ImageVariant = { key: string; width: number }
function storedBase(src: string, variants: ImageVariant[] | undefined) {
  if (!/^https?:\/\//i.test(src)) return undefined
  for (const { key } of variants ?? []) {
    const suffix = '/' + key.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')
    if (src.endsWith(suffix)) return src.slice(0, -suffix.length)
  }
}

export function listingSources(src: string, variants?: ImageVariant[]) {
  const base = storedBase(src, variants)
  if (!base || !variants?.length) return { src }
  const selected = variants.filter((v) => v.width <= 640).sort((a, b) => a.width - b.width)
  if (!selected.length) return { src }
  const url = (key: string) => `${base.replace(/\/$/, '')}/${key.replace(/^\//, '')}`
  return { src: url(selected.at(-1)!.key), srcSet: selected.map((v) => `${url(v.key)} ${v.width}w`).join(', ') }
}
export function detailSources(src: string, variants?: ImageVariant[]) {
  const base = storedBase(src, variants)
  if (!base || !variants?.length) return { src }
  const selected = variants.filter((v) => v.width >= 640).sort((a, b) => a.width - b.width)
  if (!selected.length) return { src }
  const url = (key: string) => `${base.replace(/\/$/, '')}/${key.replace(/^\//, '')}`
  return { src: url(selected.at(-1)!.key), srcSet: selected.map((v) => `${url(v.key)} ${v.width}w`).join(', ') }
}
