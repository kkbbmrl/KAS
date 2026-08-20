import type { Product } from '@/data/products'
import type { Wilaya } from '@/data/wilayas'
import type { OfferProduct } from '@/data/offers'

const API_BASE = '/api/v1'

export async function fetchWilayas(): Promise<Wilaya[]> {
  try {
    const res = await fetch(`${API_BASE}/wilayas`)
    if (!res.ok) throw new Error('Network error')
    return await res.json()
  } catch (err) {
    console.warn('API unavailable, falling back to local dataset for wilayas')
    const { ALGERIA_WILAYAS } = await import('@/data/wilayas')
    return ALGERIA_WILAYAS
  }
}

export async function fetchCategories(): Promise<{ name: string; fr: string; icon: string; available: boolean }[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`)
    if (!res.ok) throw new Error('Network error')
    return await res.json()
  } catch (err) {
    const { CATEGORIES } = await import('@/data/products')
    return CATEGORIES
  }
}

export async function fetchProducts(params: {
  q?: string
  brand?: string
  model?: string
  cat?: string
  in_stock?: boolean
} = {}): Promise<Product[]> {
  try {
    const sp = new URLSearchParams()
    if (params.q) sp.set('q', params.q)
    if (params.brand) sp.set('brand', params.brand)
    if (params.model) sp.set('model', params.model)
    if (params.cat && params.cat !== 'الكل') sp.set('cat', params.cat)
    if (params.in_stock) sp.set('in_stock', 'true')

    const res = await fetch(`${API_BASE}/products?${sp.toString()}`)
    if (!res.ok) throw new Error('Network error')
    return await res.json()
  } catch (err) {
    console.warn('API unavailable, falling back to local product search')
    const { searchProducts } = await import('@/data/products')
    return searchProducts({
      query: params.q || '',
      brand: params.brand || '',
      model: params.model || '',
      year: '',
      engine: '',
      inStockOnly: params.in_stock,
    }).filter((p) => !params.cat || params.cat === 'الكل' || p.category === params.cat)
  }
}

export async function fetchOfferBySlug(slug: string): Promise<OfferProduct | undefined> {
  try {
    const res = await fetch(`${API_BASE}/offers/${slug}`)
    if (!res.ok) throw new Error('Network error')
    return await res.json()
  } catch (err) {
    const { getOfferBySlug } = await import('@/data/offers')
    return getOfferBySlug(slug)
  }
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

export async function submitOrder(payload: PlaceOrderPayload) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to submit order')
    }
    return await res.json()
  } catch (err: any) {
    console.warn('Backend API order failed, storing in localStorage fallback', err)
    // Fallback: store locally
    const id = `KAS-${Math.floor(100000 + Math.random() * 900000)}`
    const snapshot = {
      ...payload,
      orderId: id,
      orderReference: id,
      total: payload.items.reduce((s, i) => s + i.price * i.qty, 0),
      createdAt: new Date().toISOString(),
    }
    const raw = localStorage.getItem('kas-orders')
    const prev = raw ? JSON.parse(raw) : []
    localStorage.setItem('kas-orders', JSON.stringify([snapshot, ...prev]))
    return snapshot
  }
}

export async function submitContactMessage(payload: { name: string; phone: string; msg: string; email?: string }) {
  try {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to submit message')
    return await res.json()
  } catch (err) {
    console.warn('Backend API message failed, storing locally', err)
    const raw = localStorage.getItem('kas-messages')
    const prev = raw ? JSON.parse(raw) : []
    localStorage.setItem('kas-messages', JSON.stringify([{ ...payload, createdAt: new Date().toISOString() }, ...prev]))
    return { success: true }
  }
}

export async function trackOrder(orderReference: string) {
  const res = await fetch(`${API_BASE}/orders/${orderReference}`)
  if (!res.ok) throw new Error('Order not found')
  return await res.json()
}
