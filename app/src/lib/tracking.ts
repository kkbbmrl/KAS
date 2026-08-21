// Ad Tracking, Attribution, Meta Pixel, Google Analytics, and Conversion System

export interface UTMParams {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  variant?: string
  ref?: string
}

const STORAGE_KEY = 'kas_ad_attribution'
const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/v1`

/**
 * Parses UTM parameters and A/B test variant from current URL and persists to session.
 */
export function getAndPersistUTM(): UTMParams {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  const current: UTMParams = {}

  if (params.get('utm_source')) current.utmSource = params.get('utm_source')!
  if (params.get('utm_medium')) current.utmMedium = params.get('utm_medium')!
  if (params.get('utm_campaign')) current.utmCampaign = params.get('utm_campaign')!
  if (params.get('utm_term')) current.utmTerm = params.get('utm_term')!
  if (params.get('utm_content')) current.utmContent = params.get('utm_content')!
  if (params.get('variant')) current.variant = params.get('variant')!
  if (params.get('ref')) current.ref = params.get('ref')!

  // If any new UTM is present in URL, update storage
  if (Object.keys(current).length > 0) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    } catch {
      /* ignore storage errors */
    }
    return current
  }

  // Otherwise return existing stored attribution
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }

  return {}
}

/**
 * Tracks a page visit on the server (for marketing campaign analytics)
 */
export async function trackCampaignVisit(slug: string, utms?: UTMParams) {
  try {
    const data = utms || getAndPersistUTM()
    await fetch(`${API_BASE}/offers/track-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        landingSlug: slug,
        utmSource: data.utmSource || 'direct',
        utmMedium: data.utmMedium || 'none',
        utmCampaign: data.utmCampaign || slug,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    })
  } catch {
    /* Silently fail analytics */
  }
}

export type AdConversionEvent =
  | 'landing_view'
  | 'product_view'
  | 'cta_click'
  | 'whatsapp_click'
  | 'phone_call_click'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'order_placed'
  | 'compatibility_check'

export interface EventData {
  productId?: string | number
  productName?: string
  partNumber?: string
  price?: number
  currency?: string
  campaign?: string
  orderId?: string
  value?: number
  [key: string]: any
}

/**
 * Dispatches conversion events to Meta Pixel, Google Analytics, GTM, and custom logger
 */
export function trackConversionEvent(event: AdConversionEvent, data: EventData = {}) {
  if (typeof window === 'undefined') return

  const utms = getAndPersistUTM()
  const payload = {
    ...data,
    ...utms,
    timestamp: new Date().toISOString(),
  }

  // 1. Google Tag Manager (dataLayer)
  if ((window as any).dataLayer) {
    ;(window as any).dataLayer.push({
      event: `kas_${event}`,
      ...payload,
    })
  }

  // 2. Google Analytics / Google Ads (gtag)
  if (typeof (window as any).gtag === 'function') {
    const gtagEventMap: Record<AdConversionEvent, string> = {
      landing_view: 'page_view',
      product_view: 'view_item',
      cta_click: 'select_content',
      whatsapp_click: 'generate_lead',
      phone_call_click: 'generate_lead',
      add_to_cart: 'add_to_cart',
      begin_checkout: 'begin_checkout',
      order_placed: 'purchase',
      compatibility_check: 'search',
    }
    ;(window as any).gtag('event', gtagEventMap[event] || event, {
      item_id: data.partNumber || data.productId,
      item_name: data.productName,
      value: data.price || data.value,
      currency: 'DZD',
      campaign: utms.utmCampaign,
      source: utms.utmSource,
    })
  }

  // 3. Meta Pixel (fbq)
  if (typeof (window as any).fbq === 'function') {
    const metaEventMap: Partial<Record<AdConversionEvent, string>> = {
      product_view: 'ViewContent',
      add_to_cart: 'AddToCart',
      begin_checkout: 'InitiateCheckout',
      order_placed: 'Purchase',
      whatsapp_click: 'Lead',
      phone_call_click: 'Contact',
    }
    const metaEvent = metaEventMap[event]
    if (metaEvent) {
      ;(window as any).fbq('track', metaEvent, {
        content_name: data.productName,
        content_ids: [String(data.partNumber || data.productId || '')],
        content_type: 'product',
        value: data.price || data.value,
        currency: 'DZD',
      })
    }
  }
}

/**
 * Builds pre-filled, conversion-optimized WhatsApp link with automotive intent
 */
export function buildWhatsAppLink(options: {
  phone?: string
  productName?: string
  partNumber?: string
  brand?: string
  price?: number
  campaign?: string
  carDetails?: string
}): string {
  const phone = options.phone || import.meta.env.VITE_WHATSAPP_NUMBER || '+213555123456'
  const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^0/, '+213')

  const lines = [
    'السلام عليكم، أريد الاستفسار بخصوص هذه القطعة من KAS Auto Parts:',
    options.productName ? `📌 القطعة: ${options.productName}` : '',
    options.brand ? `🏷️ الماركة: ${options.brand}` : '',
    options.partNumber ? `🔢 رقم القطعة (PN): ${options.partNumber}` : '',
    options.price ? `💰 السعر المعروض: ${options.price.toLocaleString('fr-FR')} دج` : '',
    options.carDetails ? `🚗 سيارتي: ${options.carDetails}` : '',
    'هل القطعة متوفرة حالياً ومتوافقة مع سيارتي؟',
  ].filter(Boolean)

  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${cleanPhone.replace('+', '')}?text=${text}`
}
