import {
  CheckCircle2,
  Clock,
  Flame,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react'
import { formatPrice, PHONE_CALL, PHONE_DISPLAY } from '@/data/products'
import { trackConversionEvent, buildWhatsAppLink } from '@/lib/tracking'
import ProductGalleryInteractive from './ProductGalleryInteractive'
import type { AdCampaignConfig } from '@/data/adCampaigns'

interface Props {
  campaign: AdCampaignConfig
  onOrderClick: () => void
}

export default function AdHero({ campaign, onOrderClick }: Props) {
  const whatsAppLink = buildWhatsAppLink({
    productName: campaign.productName,
    partNumber: campaign.partNumber,
    brand: campaign.brand,
    price: campaign.price,
    campaign: campaign.slug,
  })

  const handleOrderClick = () => {
    trackConversionEvent('cta_click', {
      productName: campaign.productName,
      partNumber: campaign.partNumber,
      price: campaign.price,
      campaign: campaign.slug,
      source: 'hero_primary_button',
    })
    onOrderClick()
  }

  const handleWhatsAppClick = () => {
    trackConversionEvent('whatsapp_click', {
      productName: campaign.productName,
      partNumber: campaign.partNumber,
      price: campaign.price,
      campaign: campaign.slug,
      source: 'hero_whatsapp_button',
    })
  }

  const handlePhoneClick = () => {
    trackConversionEvent('phone_call_click', {
      productName: campaign.productName,
      partNumber: campaign.partNumber,
      price: campaign.price,
      campaign: campaign.slug,
      source: 'hero_phone_button',
    })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 text-white pt-8 pb-14 sm:py-16" dir="rtl">
      {/* Background Accent Lighting */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-brand-600/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          
          {/* ─── DESKTOP LEFT / MOBILE SECOND: VALUE PROPOSITION & CTAs ─── */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-5">
            {/* Campaign Kicker & Urgency Chip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/20 px-3 py-1 font-cairo text-xs font-black text-brand-400 border border-brand-500/30">
                <Flame className="h-3.5 w-3.5 text-brand-400 animate-pulse" />
                <span>{campaign.heroKicker}</span>
              </span>

              {campaign.urgencyBadge && (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-[11px] font-bold text-zinc-300 border border-zinc-700/60">
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span>{campaign.urgencyBadge}</span>
                </span>
              )}
            </div>

            {/* Main Headline */}
            <h1 className="font-cairo text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              {campaign.heroTitle}
            </h1>

            {/* Subtitle / Product description */}
            <p className="text-xs sm:text-sm font-bold text-zinc-300 leading-relaxed max-w-2xl">
              {campaign.heroSubtitle}
            </p>

            {/* Key Benefits Bullets */}
            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              {campaign.heroBullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600/20 text-brand-400 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
                  </div>
                  <span className="text-xs font-bold text-zinc-200 leading-snug">
                    {bullet}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Box with Real Savings */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-cairo text-2xl sm:text-3xl font-black text-brand-400">
                    {formatPrice(campaign.price)}
                  </span>
                  {campaign.oldPrice && (
                    <span className="text-xs sm:text-sm font-bold text-zinc-500 line-through" dir="ltr">
                      {formatPrice(campaign.oldPrice)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {campaign.savingsText && (
                    <span className="inline-block rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-black text-emerald-400 border border-emerald-500/30">
                      {campaign.savingsText}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-zinc-400">
                    • {campaign.deliveryNote}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {campaign.stockCountText || 'متوفر في المخزن — شحن فوري'}
                </span>
              </div>
            </div>

            {/* Conversion CTA Group */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Primary Order Now Button */}
              <button
                type="button"
                onClick={handleOrderClick}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 font-cairo text-sm sm:text-base font-black text-white shadow-xl shadow-brand-600/40 hover:bg-brand-700 active:scale-[0.99] transition-all cursor-pointer group"
              >
                <Truck className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                <span>اطلب الآن — الدفع عند الاستلام</span>
              </button>

              {/* WhatsApp Secondary Button */}
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-cairo text-sm font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-[0.99] transition-all"
              >
                <MessageSquare className="h-5 w-5" />
                <span>استفسار واتساب</span>
              </a>

              {/* Phone Direct Call Button */}
              <a
                href={`tel:${PHONE_CALL}`}
                onClick={handlePhoneClick}
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-brand-500 hover:text-white transition-colors"
                title={`اتصال مباشر: ${PHONE_DISPLAY}`}
              >
                <PhoneCall className="h-5 w-5" />
              </a>
            </div>

            {/* Reassurance Micro-Copy */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-zinc-400 pt-1">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                الدفع بعد المعاينة والفحص عند الباب
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                ضمان رسمي من KAS Auto Parts
              </span>
            </div>
          </div>

          {/* ─── DESKTOP RIGHT / MOBILE FIRST: PRODUCT GALLERY & VISUAL ─── */}
          <div className="order-1 lg:order-2 lg:col-span-5">
            <ProductGalleryInteractive
              images={campaign.galleryImages}
              productName={campaign.productName}
              badge={campaign.badge}
              brand={campaign.brand}
            />
          </div>

        </div>
      </div>
    </section>
  )
}
