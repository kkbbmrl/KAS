import type { Product } from '@/data/products'
import type { Wilaya } from '@/data/wilayas'
import type { OfferProduct } from '@/data/offers'

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://kas-production-01e9.up.railway.app'
    : '')

const API_BASE = `${RAW_API_URL}/api/v1`

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Single fetch helper for every customer-facing call.
 *
 * Deliberately has NO static-data fallback: a backend failure must surface as an
 * error the UI can show, never as demo products that look like real stock.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, init)
  } catch {
    // Network-level failure (offline, DNS, CORS, server down).
    throw new ApiError('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.', 0)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new ApiError(body.error || `فشل الطلب (${res.status})`, res.status)
  }

  return (await res.json()) as T
}

export function resolveImageUrl(url?: string): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  const apiBase = RAW_API_URL || ''
  if (url.startsWith('/')) {
    return `${apiBase}${url}`
  }
  return `${apiBase}/${url}`
}

function normalizeProduct(p: Product): Product {
  return {
    ...p,
    image: resolveImageUrl(p.image),
    variants: p.variants?.map((v) => ({
      ...v,
      image: v.image ? resolveImageUrl(v.image) : undefined,
    })),
  }
}

function normalizeOffer(o: OfferProduct): OfferProduct {
  return {
    ...o,
    image: resolveImageUrl(o.image),
  }
}

export async function fetchWilayas(): Promise<Wilaya[]> {
  return request<Wilaya[]>('/wilayas')
}

export async function fetchCategories(): Promise<
  { name: string; fr: string; icon: string; available: boolean }[]
> {
  return request('/categories')
}

export interface ProductQuery {
  q?: string
  brand?: string
  model?: string
  cat?: string
  in_stock?: boolean
}

export async function fetchProducts(
  params: ProductQuery = {},
  signal?: AbortSignal
): Promise<Product[]> {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.brand) sp.set('brand', params.brand)
  if (params.model) sp.set('model', params.model)
  if (params.cat && params.cat !== 'الكل') sp.set('cat', params.cat)
  if (params.in_stock) sp.set('in_stock', 'true')

  const qs = sp.toString()
  const list = await request<Product[]>(`/products${qs ? `?${qs}` : ''}`, { signal })
  return list.map(normalizeProduct)
}

export async function fetchProductById(id: string | number, signal?: AbortSignal): Promise<Product> {
  const prod = await request<Product>(`/products/${encodeURIComponent(String(id))}`, { signal })
  return normalizeProduct(prod)
}

export async function fetchOffers(signal?: AbortSignal): Promise<OfferProduct[]> {
  const list = await request<OfferProduct[]>('/offers', { signal })
  return list.map(normalizeOffer)
}

export async function fetchOfferBySlug(slug: string, signal?: AbortSignal): Promise<OfferProduct> {
  const offer = await request<OfferProduct>(`/offers/${encodeURIComponent(slug)}`, { signal })
  return normalizeOffer(offer)
}

export interface PlaceOrderPayload {
  source?: 'cart_checkout' | 'landing_offer'
  offerId?: string
  firstName: string
  lastName: string
  phone: string
  wilayaCode?: string
  commune?: string
  address: string
  notes?: string
  items: {
    id?: number | string
    productId?: string
    variantId?: string
    name?: string
    partNumber?: string
    price: number
    qty: number
  }[]
}

export interface PlacedOrderResponse {
  success: boolean
  orderId: string
  orderReference: string
  firstName: string
  lastName: string
  phone: string
  address: string
  commune?: string
  wilayaCode?: string
  subtotal: number
  shippingFee: number
  totalAmount: number
  items: { id: string; name: string; partNumber: string; price: number; qty: number; lineTotal: number }[]
  createdAt: string
}

/**
 * Places a COD order. Throws ApiError on failure — the caller must surface it.
 * No localStorage queueing: an order the business never receives must not look
 * like a confirmed sale to the customer.
 */
export async function submitOrder(payload: PlaceOrderPayload): Promise<PlacedOrderResponse> {
  return request<PlacedOrderResponse>('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function submitContactMessage(payload: {
  name: string
  phone: string
  msg: string
  email?: string
}) {
  return request<{ success: boolean }>('/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function trackOrder(orderReference: string) {
  return request(`/orders/${encodeURIComponent(orderReference)}`)
}
