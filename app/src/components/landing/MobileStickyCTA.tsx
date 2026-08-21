import { useEffect, useState } from 'react'
import { MessageSquare, Sparkles, Truck } from 'lucide-react'
import { formatPrice } from '@/data/products'
import { trackConversionEvent, buildWhatsAppLink } from '@/lib/tracking'

interface Props {
  productName: string
  partNumber: string
  brand: string
  price: number
  oldPrice?: number
  campaignSlug?: string
}

export default function MobileStickyCTA({
  productName,
  partNumber,
  brand,
  price,
  oldPrice,
  campaignSlug,
}: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling past the first 350px
      if (window.scrollY > 350) {
        setVisible(true)
      } else {
        setVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToOrderForm = () => {
    trackConversionEvent('cta_click', {
      productName,
      partNumber,
      price,
      campaign: campaignSlug,
      source: 'mobile_sticky_bar',
    })

    const el = document.getElementById('order-form')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const firstInput = el.querySelector('input')
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 400)
      }
    }
  }

  const whatsAppLink = buildWhatsAppLink({
    productName,
    partNumber,
    brand,
    price,
    campaign: campaignSlug,
  })

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 block lg:hidden bg-white/95 backdrop-blur-md border-t-2 border-brand-600/30 p-3 shadow-2xl animate-slide-up"
      dir="rtl"
    >
      <div className="flex items-center gap-2 max-w-lg mx-auto">
        {/* Price column */}
        <div className="shrink-0 text-right pr-1">
          <span className="font-cairo text-base font-black text-brand-600 block leading-tight">
            {formatPrice(price)}
          </span>
          {oldPrice && (
            <span className="text-[10px] text-zinc-400 line-through block" dir="ltr">
              {formatPrice(oldPrice)}
            </span>
          )}
        </div>

        {/* Order Now CTA */}
        <button
          type="button"
          onClick={scrollToOrderForm}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-3 px-3 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/30 active:scale-95 transition-all"
        >
          <Truck className="h-4 w-4 shrink-0" />
          <span>اطلب الآن — دفع عند الباب</span>
        </button>

        {/* WhatsApp Icon Button */}
        <a
          href={whatsAppLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackConversionEvent('whatsapp_click', { campaign: campaignSlug, source: 'mobile_sticky_bar' })}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
          title="استفسار عبر واتساب"
        >
          <MessageSquare className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}
