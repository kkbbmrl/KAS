import { Link } from 'react-router'
import {
  Flame,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import Logo from '@/components/Logo'
import { CAMPAIGN_PRESETS } from '@/data/adCampaigns'
import { formatPrice, PHONE_CALL, PHONE_DISPLAY } from '@/data/products'
import { buildWhatsAppLink } from '@/lib/tracking'

export default function AdsCatalogPage() {
  const generalWhatsApp = buildWhatsAppLink({
    productName: 'استفسار عام بخصوص العروض الترويجية وقطع الغيار',
  })

  return (
    <div className="min-h-screen bg-zinc-100 font-tajawal text-zinc-900 selection:bg-brand-600 selection:text-white" dir="rtl">
      
      {/* Top Banner */}
      <div className="bg-brand-700 text-white text-center py-2 px-4 text-xs font-black font-cairo flex items-center justify-center gap-2">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        <span>العروض الترويجية وحملات التخفيض الحصرية — توصيل مجاني وسريع لـ 58 ولاية والدفع عند الاستلام</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 text-white py-3.5 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${PHONE_CALL}`}
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-200 border border-zinc-700 hover:border-brand-500 hover:text-white transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5 text-brand-400" />
              <span dir="ltr">{PHONE_DISPLAY}</span>
            </a>

            <a
              href={generalWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>واتساب المبيعات</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="bg-gradient-to-b from-zinc-900 to-zinc-950 text-white py-12 sm:py-16 px-4 text-center space-y-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/20 px-3.5 py-1 text-xs font-black text-brand-400 border border-brand-500/30">
            <Flame className="h-3.5 w-3.5 text-brand-400 animate-pulse" />
            عروض الحملات الإعلانية الحصرية
          </span>
          <h1 className="font-cairo text-2xl sm:text-4xl font-black text-white">
            صفحات الهبوط والعروض الترويجية المباشرة
          </h1>
          <p className="text-xs sm:text-sm font-bold text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            اختر القطعة أو العرض المناسب لسيارتك للاستفادة من أسعار الحملة الخاصة، الضمان المعتمد، والتوصيل السريع لباب المنزل مع حق المعاينة قبل الدفع.
          </p>
        </div>
      </section>

      {/* Campaign Cards Grid */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPAIGN_PRESETS.map((campaign) => {
            const diff = campaign.oldPrice ? campaign.oldPrice - campaign.price : 0
            return (
              <div
                key={campaign.slug}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-zinc-200 bg-white p-5 shadow-sm hover:border-brand-600 hover:shadow-xl transition-all"
              >
                <div className="space-y-4">
                  {/* Image with Badges */}
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-50 border p-2 flex items-center justify-center">
                    <img
                      src={campaign.primaryImage}
                      alt={campaign.productName}
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {campaign.badge && (
                      <span className="absolute top-2.5 right-2.5 rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow">
                        {campaign.badge}
                      </span>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-zinc-900/80 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm">
                      {campaign.brand}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-brand-600 block">
                      {campaign.category}
                    </span>
                    <h2 className="font-cairo text-base font-black text-zinc-900 line-clamp-2">
                      {campaign.productName}
                    </h2>
                    <p className="text-[11px] font-bold text-zinc-500 line-clamp-2 leading-relaxed">
                      {campaign.heroSubtitle}
                    </p>
                  </div>

                  {/* Key points */}
                  <div className="space-y-1 pt-1 border-t border-zinc-100 text-[11px] font-bold text-zinc-600">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>قطع أصلية مع وصل ضمان رسمي</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>توصيل لـ 58 ولاية — الدفع عند الاستلام</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-4 mt-4 border-t border-zinc-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-cairo text-lg font-black text-brand-600 block leading-tight">
                        {formatPrice(campaign.price)}
                      </span>
                      {campaign.oldPrice && (
                        <span className="text-xs text-zinc-400 line-through block" dir="ltr">
                          {formatPrice(campaign.oldPrice)}
                        </span>
                      )}
                    </div>
                    {diff > 0 && (
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 border border-emerald-200">
                        وفر {formatPrice(diff)}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/ads/${campaign.slug}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/30 group-hover:bg-brand-700 transition-colors"
                  >
                    <span>عرض صفحة العرض والطلب المباشر</span>
                    <Truck className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500 space-y-2">
        <p className="font-bold">جميع الحقوق محفوظة © {new Date().getFullYear()} KAS Auto Parts</p>
      </footer>
    </div>
  )
}
