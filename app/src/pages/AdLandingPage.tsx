import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router'
import {
  Frown,
  Home,
  Loader2,
  MessageSquare,
  PhoneCall,
  Sparkles,
  Truck,
} from 'lucide-react'

import Logo from '@/components/Logo'
import { PHONE_CALL, PHONE_DISPLAY, ADDRESS, WORK_HOURS } from '@/data/products'
import {
  CAMPAIGN_PRESETS,
  getCampaignBySlug,
  buildCampaignFromProduct,
  type AdCampaignConfig,
} from '@/data/adCampaigns'
import {
  getAndPersistUTM,
  trackCampaignVisit,
  trackConversionEvent,
  buildWhatsAppLink,
} from '@/lib/tracking'
import { fetchOfferBySlug, fetchProducts } from '@/lib/api'

import AdHero from '@/components/landing/AdHero'
import TrustBar from '@/components/landing/TrustBar'
import QuickOrderForm from '@/components/landing/QuickOrderForm'
import VehicleCompatibilityChecker from '@/components/landing/VehicleCompatibilityChecker'
import TechnicalDetailsSpecs from '@/components/landing/TechnicalDetailsSpecs'
import WhyChooseKAS from '@/components/landing/WhyChooseKAS'
import HowItWorks from '@/components/landing/HowItWorks'
import SocialProofBar from '@/components/landing/SocialProofBar'
import LandingFAQ from '@/components/landing/LandingFAQ'
import MobileStickyCTA from '@/components/landing/MobileStickyCTA'

export default function AdLandingPage() {
  const { slug, idOrSlug } = useParams<{ slug?: string; idOrSlug?: string }>()
  const [searchParams] = useSearchParams()
  const activeSlug = slug || idOrSlug || 'radiateur-peugeot-208'

  const [campaign, setCampaign] = useState<AdCampaignConfig | null>(() => {
    return getCampaignBySlug(activeSlug) || null
  })
  const [loading, setLoading] = useState(!campaign)

  // Track visit on mount
  useEffect(() => {
    const utms = getAndPersistUTM()
    trackCampaignVisit(activeSlug, utms)
    trackConversionEvent('landing_view', {
      campaign: activeSlug,
      variant: searchParams.get('variant') || 'A',
    })
  }, [activeSlug, searchParams])

  // Resolve campaign if not in static presets
  useEffect(() => {
    const preset = getCampaignBySlug(activeSlug)
    if (preset) {
      setCampaign(preset)
      setLoading(false)
      return
    }

    setLoading(true)
    // 1. Try fetching from backend offers or products
    fetchOfferBySlug(activeSlug)
      .then((offer) => {
        if (offer) {
          const config = buildCampaignFromProduct(offer, activeSlug)
          setCampaign(config)
          return
        }
        // 2. Try fetching as product ID/slug
        return fetchProducts({ q: activeSlug }).then((products) => {
          if (products && products.length > 0) {
            const config = buildCampaignFromProduct(products[0], activeSlug)
            setCampaign(config)
          } else {
            // Fallback to first available preset
            setCampaign(CAMPAIGN_PRESETS[0])
          }
        })
      })
      .catch(() => {
        setCampaign(CAMPAIGN_PRESETS[0])
      })
      .finally(() => setLoading(false))
  }, [activeSlug])

  const scrollToOrderForm = () => {
    const el = document.getElementById('order-form')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const firstInput = el.querySelector('input')
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 400)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-white font-tajawal" dir="rtl">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
        <p className="font-cairo text-sm font-bold text-zinc-400">جاري تحميل العرض الخاص بك...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 text-center font-tajawal" dir="rtl">
        <Frown className="h-16 w-16 text-zinc-300" />
        <h1 className="font-cairo text-2xl font-black text-zinc-900">العرض الترويجي غير متوفر</h1>
        <p className="text-zinc-500 max-w-md">
          الرابط الذي تبحث عنه غير موجود أو انتهت فترة العرض الترويجي. يمكنك تصفح العروض الحالية:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {CAMPAIGN_PRESETS.map((p) => (
            <Link
              key={p.slug}
              to={`/ads/${p.slug}`}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:border-brand-600 hover:text-brand-600 shadow-sm"
            >
              {p.productName}
            </Link>
          ))}
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-cairo text-xs font-black text-white hover:bg-brand-700 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>العودة لمتجر KAS الرئيسي</span>
        </Link>
      </div>
    )
  }

  const whatsAppLink = buildWhatsAppLink({
    productName: campaign.productName,
    partNumber: campaign.partNumber,
    brand: campaign.brand,
    price: campaign.price,
    campaign: campaign.slug,
  })

  return (
    <div className="min-h-screen bg-zinc-100 font-tajawal text-zinc-900 selection:bg-brand-600 selection:text-white" dir="rtl">
      
      {/* ─── TOP ANNOUNCEMENT BAR ─── */}
      <div className="bg-brand-700 text-white text-center py-2 px-4 text-xs font-black font-cairo flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        <span>عرض ترويجي رسمي من KAS Auto Parts • توصيل سريع لـ 58 ولاية مع الدفع عند الاستلام بعد المعاينة</span>
      </div>

      {/* ─── MINIMAL HIGH-CONVERTING HEADER ─── */}
      <header className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 text-white py-3 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            {/* Direct Phone */}
            <a
              href={`tel:${PHONE_CALL}`}
              onClick={() => trackConversionEvent('phone_call_click', { campaign: campaign.slug, source: 'header' })}
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-200 border border-zinc-700 hover:border-brand-500 hover:text-white transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5 text-brand-400" />
              <span dir="ltr">{PHONE_DISPLAY}</span>
            </a>

            {/* Direct WhatsApp */}
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversionEvent('whatsapp_click', { campaign: campaign.slug, source: 'header' })}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>واتساب سريع</span>
            </a>

            {/* Order Button */}
            <button
              type="button"
              onClick={scrollToOrderForm}
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-brand-600/30 hover:bg-brand-700 transition-colors cursor-pointer"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>اطلب الآن</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── 1. HERO SECTION ─── */}
      <AdHero campaign={campaign} onOrderClick={scrollToOrderForm} />

      {/* ─── 2. TRUST BAR ─── */}
      <TrustBar />

      {/* ─── 3. MAIN CONTENT BODY ─── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        
        {/* Fitment & Order Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Left Column: Compatibility & Specs */}
          <div className="lg:col-span-6 space-y-8">
            <VehicleCompatibilityChecker
              productName={campaign.productName}
              partNumber={campaign.partNumber}
              brand={campaign.brand}
              price={campaign.price}
              campaignSlug={campaign.slug}
              compatibleVehicles={campaign.compatibleVehicles}
            />

            <TechnicalDetailsSpecs
              specifications={campaign.specifications}
              partNumber={campaign.partNumber}
              brand={campaign.brand}
              category={campaign.category}
            />
          </div>

          {/* Right Column: 1-Step Fast COD Checkout Form */}
          <div className="lg:col-span-6 sticky top-20">
            <QuickOrderForm
              productId={campaign.productId}
              productName={campaign.productName}
              partNumber={campaign.partNumber}
              brand={campaign.brand}
              basePrice={campaign.price}
              oldPrice={campaign.oldPrice}
              variants={campaign.variants}
              campaignSlug={campaign.slug}
            />
          </div>
        </div>

        {/* Why Choose KAS */}
        <WhyChooseKAS />

        {/* How It Works */}
        <HowItWorks />

        {/* Social Proof & Algerian Reviews */}
        <SocialProofBar reviews={campaign.reviews} />

        {/* FAQ Accordion */}
        <LandingFAQ faq={campaign.faq} />

        {/* Final High-Impact Bottom CTA */}
        <div className="rounded-3xl border-2 border-brand-600 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-8 sm:p-12 text-center text-white shadow-2xl space-y-6">
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/20 px-3.5 py-1 text-xs font-black text-brand-400 border border-brand-500/30">
              <Truck className="h-4 w-4" /> توصيل لباب منزلك مع الدفع عند الاستلام
            </span>
            <h3 className="font-cairo text-2xl sm:text-3xl font-black text-white">
              جاهز لاستلام {campaign.productName} لسيارتك؟
            </h3>
            <p className="text-xs sm:text-sm font-bold text-zinc-400">
              لا تفوت فرصة التخفيض الحالي. اطلب الآن وسيتصل بك فريقنا لتأكيد الشحن فوراً.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              type="button"
              onClick={scrollToOrderForm}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 font-cairo text-sm sm:text-base font-black text-white shadow-xl shadow-brand-600/40 hover:bg-brand-700 active:scale-95 transition-all cursor-pointer"
            >
              <Truck className="h-5 w-5" />
              <span>اطلب الآن قبل نفاد الكمية</span>
            </button>

            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversionEvent('whatsapp_click', { campaign: campaign.slug, source: 'bottom_cta' })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-cairo text-sm sm:text-base font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <MessageSquare className="h-5 w-5" />
              <span>استفسار فوري عبر واتساب</span>
            </a>
          </div>
        </div>

      </main>

      {/* ─── CONVERSION FOOTER ─── */}
      <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400 py-10 px-4 text-center text-xs space-y-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <Logo />
          <p className="text-zinc-500 font-bold max-w-md text-right sm:text-center text-[11px]">
            KAS Auto Parts — المنصة الرائدة في الجزائر لتوفير قطع الغيار الأصلية والمضمونة مباشرة لباب بيتك.
          </p>
          <div className="flex items-center gap-3">
            <a href={`tel:${PHONE_CALL}`} className="text-zinc-300 hover:text-white font-bold" dir="ltr">
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-[11px] text-zinc-500">
          <span>{ADDRESS}</span>
          <span>•</span>
          <span>{WORK_HOURS}</span>
          <span>•</span>
          <span>جميع الحقوق محفوظة © {new Date().getFullYear()} KAS Auto Parts</span>
        </div>
      </footer>

      {/* ─── MOBILE STICKY BOTTOM BAR ─── */}
      <MobileStickyCTA
        productName={campaign.productName}
        partNumber={campaign.partNumber}
        brand={campaign.brand}
        price={campaign.price}
        oldPrice={campaign.oldPrice}
        campaignSlug={campaign.slug}
      />
    </div>
  )
}
