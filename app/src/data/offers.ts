import type { StockStatus } from './products'

export interface OfferFeature {
  icon: string // lucide icon name
  text: string
}

/**
 * A promotional landing offer.
 *
 * Shape returned by GET /api/v1/offers and /api/v1/offers/:slug
 * (server/routes/offers.ts), backed by the `landing_offers` table and managed in
 * the Admin Dashboard under Marketing → Landing Pages.
 *
 * There is deliberately no bundled sample data here — offers belong to the store
 * owner, and shipping placeholder offers would put products and images the owner
 * never chose in front of real customers.
 */
export interface OfferProduct {
  /** landing_offers.id (UUID) — present when served from the API */
  id?: string
  slug: string
  /** products.id — UUID from the database */
  productId: string | number
  title: string // Arabic title for the ad
  subtitle: string // e.g. "متوافق مع بيجو 208"
  nameFr: string
  brand: string
  image: string
  price: number
  oldPrice?: number
  stock: StockStatus
  partNumber: string
  /** short compat string for the hero */
  compat?: string
  features: OfferFeature[]
  badge?: string
  urgencyText?: string // e.g. "آخر 3 قطع متبقية!"
  deliveryNote?: string
}
