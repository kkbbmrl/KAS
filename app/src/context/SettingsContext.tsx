import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { fetchPublicSettings } from '@/lib/api'
import {
  ADDRESS as DEFAULT_ADDRESS,
  ADDRESS_FR as DEFAULT_ADDRESS_FR,
  EMAIL as DEFAULT_EMAIL,
  MAPS_URL as DEFAULT_MAPS_URL,
  PHONE_CALL as DEFAULT_PHONE_CALL,
  PHONE_DISPLAY as DEFAULT_PHONE_DISPLAY,
  WORK_HOURS as DEFAULT_WORK_HOURS,
} from '@/data/products'

export interface StoreSettings {
  storeName: string
  phoneDisplay: string
  phoneCall: string
  email: string
  address: string
  addressFr: string
  mapsUrl: string
  workHours: string
  currency: string
  defaultCourier: string
  freeShippingThreshold: number
  seoTitle?: string
  seoDesc?: string
  facebookPixelId?: string
  tiktokPixelId?: string
  googleAnalyticsId?: string
  raw: Record<string, string>
  loading: boolean
  refreshSettings: () => Promise<void>
}

const defaultValues: StoreSettings = {
  storeName: 'Khaled Auto Parts',
  phoneDisplay: DEFAULT_PHONE_DISPLAY,
  phoneCall: DEFAULT_PHONE_CALL,
  email: DEFAULT_EMAIL,
  address: DEFAULT_ADDRESS,
  addressFr: DEFAULT_ADDRESS_FR,
  mapsUrl: DEFAULT_MAPS_URL,
  workHours: DEFAULT_WORK_HOURS,
  currency: 'DA',
  defaultCourier: 'Yalidine Fast Logistics',
  freeShippingThreshold: 15000,
  raw: {},
  loading: true,
  refreshSettings: async () => {},
}

const SettingsContext = createContext<StoreSettings>(defaultValues)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    try {
      const data = await fetchPublicSettings()
      if (data && Object.keys(data).length > 0) {
        setRaw(data)
      }
    } catch {
      // Graceful fallback to static defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Compute clean values
  const storeName = raw.store_name || defaultValues.storeName
  const phoneDisplay = raw.store_phone || defaultValues.phoneDisplay
  const cleanDigits = phoneDisplay.replace(/\s+/g, '').replace(/^0/, '')
  const phoneCall = cleanDigits ? `+213${cleanDigits}` : defaultValues.phoneCall
  const email = raw.store_email || defaultValues.email
  const address = raw.store_address || defaultValues.address
  const addressFr = defaultValues.addressFr
  const mapsUrl = defaultValues.mapsUrl
  const workHours = defaultValues.workHours
  const currency = raw.store_currency || defaultValues.currency
  const defaultCourier = raw.default_courier || defaultValues.defaultCourier
  const freeShippingThreshold = Number(raw.free_shipping_threshold) || defaultValues.freeShippingThreshold
  const seoTitle = raw.seo_title || undefined
  const seoDesc = raw.seo_desc || undefined
  const facebookPixelId = raw.facebook_pixel_id || undefined
  const tiktokPixelId = raw.tiktok_pixel_id || undefined
  const googleAnalyticsId = raw.google_analytics_id || undefined

  // Dynamically update document title / meta description
  useEffect(() => {
    if (seoTitle && typeof document !== 'undefined') {
      document.title = seoTitle
    }
    if (seoDesc && typeof document !== 'undefined') {
      const meta = document.querySelector('meta[name="description"]')
      if (meta) {
        meta.setAttribute('content', seoDesc)
      }
    }
  }, [seoTitle, seoDesc])

  return (
    <SettingsContext.Provider
      value={{
        storeName,
        phoneDisplay,
        phoneCall,
        email,
        address,
        addressFr,
        mapsUrl,
        workHours,
        currency,
        defaultCourier,
        freeShippingThreshold,
        seoTitle,
        seoDesc,
        facebookPixelId,
        tiktokPixelId,
        googleAnalyticsId,
        raw,
        loading,
        refreshSettings: loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useStoreSettings() {
  return useContext(SettingsContext)
}
