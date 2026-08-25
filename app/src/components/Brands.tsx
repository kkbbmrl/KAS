import { useState } from 'react'
import {
  Car,
  CheckCircle2,
  ChevronLeft,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react'
import SectionHeading from './SectionHeading'
import { useReveal } from '@/hooks/useReveal'

interface BrandItem {
  nameAr: string
  nameEn: string
  logoUrl: string
  popularModels: string[]
  accentColor: string
  badge?: string
}

const CAR_BRANDS_LIST: BrandItem[] = [
  {
    nameAr: 'رينو',
    nameEn: 'Renault',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/renault.svg',
    popularModels: ['كليو 4', 'كليو 5', 'سيمبول', 'ميغان'],
    accentColor: 'hover:border-amber-400 hover:shadow-amber-500/10 group-hover:text-amber-600',
    badge: 'الأكثر طلباً',
  },
  {
    nameAr: 'بيجو',
    nameEn: 'Peugeot',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/peugeot.svg',
    popularModels: ['208', '301', '2008', '308'],
    accentColor: 'hover:border-blue-500 hover:shadow-blue-500/10 group-hover:text-blue-600',
    badge: 'شائع جداً',
  },
  {
    nameAr: 'فولكسفاغن',
    nameEn: 'Volkswagen',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/volkswagen.svg',
    popularModels: ['غولف 7', 'غولف 8', 'بولو', 'كادي'],
    accentColor: 'hover:border-sky-500 hover:shadow-sky-500/10 group-hover:text-sky-600',
  },
  {
    nameAr: 'داسيا',
    nameEn: 'Dacia',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/dacia.svg',
    popularModels: ['ستيبواي', 'سانديرو', 'لوغان', 'داستر'],
    accentColor: 'hover:border-emerald-500 hover:shadow-emerald-500/10 group-hover:text-emerald-600',
    badge: 'الأكثر مبيعاً',
  },
  {
    nameAr: 'هيونداي',
    nameEn: 'Hyundai',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/hyundai.svg',
    popularModels: ['أكسنت', 'إلنترا', 'i20', 'توسان'],
    accentColor: 'hover:border-blue-700 hover:shadow-blue-700/10 group-hover:text-blue-700',
  },
  {
    nameAr: 'تويوتا',
    nameEn: 'Toyota',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/toyota.svg',
    popularModels: ['ياريس', 'كورولا', 'هيلوكس', 'راف 4'],
    accentColor: 'hover:border-red-500 hover:shadow-red-500/10 group-hover:text-red-600',
  },
  {
    nameAr: 'كيا',
    nameEn: 'Kia',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/kia.svg',
    popularModels: ['ريو', 'بيكانتو', 'سيراتو', 'سبورتاج'],
    accentColor: 'hover:border-rose-600 hover:shadow-rose-600/10 group-hover:text-rose-600',
  },
  {
    nameAr: 'سيات',
    nameEn: 'Seat',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/seat.svg',
    popularModels: ['إبيزا', 'ليون', 'أرونا', 'أتيكا'],
    accentColor: 'hover:border-red-600 hover:shadow-red-600/10 group-hover:text-red-600',
  },
  {
    nameAr: 'سيتروين',
    nameEn: 'Citroën',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/citroen.svg',
    popularModels: ['C3', 'C-Elysée', 'Berlingo', 'C4'],
    accentColor: 'hover:border-red-700 hover:shadow-red-700/10 group-hover:text-red-700',
  },
  {
    nameAr: 'مرسيدس',
    nameEn: 'Mercedes-Benz',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/mercedes.svg',
    popularModels: ['Class A', 'Class C', 'Class E', 'GLA'],
    accentColor: 'hover:border-zinc-500 hover:shadow-zinc-500/10 group-hover:text-zinc-900',
  },
  {
    nameAr: 'BMW',
    nameEn: 'BMW',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/bmw.svg',
    popularModels: ['الفئة 1', 'الفئة 3', 'الفئة 5', 'X1'],
    accentColor: 'hover:border-blue-600 hover:shadow-blue-600/10 group-hover:text-blue-600',
  },
  {
    nameAr: 'نيسان',
    nameEn: 'Nissan',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/nissan.svg',
    popularModels: ['صني', 'ميكرا', 'قشقاي', 'جوك'],
    accentColor: 'hover:border-zinc-800 hover:shadow-zinc-800/10 group-hover:text-zinc-900',
  },
  {
    nameAr: 'فورد',
    nameEn: 'Ford',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/ford.svg',
    popularModels: ['Fiesta', 'Focus', 'Ranger', 'Kuga'],
    accentColor: 'hover:border-blue-800 hover:shadow-blue-800/10 group-hover:text-blue-800',
  },
  {
    nameAr: 'سكودا',
    nameEn: 'Škoda',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/skoda.svg',
    popularModels: ['فابيا', 'أوكتافيا', 'سوبرب', 'كاميك'],
    accentColor: 'hover:border-emerald-600 hover:shadow-emerald-600/10 group-hover:text-emerald-600',
  },
  {
    nameAr: 'أودي',
    nameEn: 'Audi',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/audi.svg',
    popularModels: ['A3', 'A4', 'A6', 'Q3'],
    accentColor: 'hover:border-zinc-900 hover:shadow-zinc-900/10 group-hover:text-zinc-900',
  },
]

const OEM_PARTS_MAKERS = [
  { name: 'VALEO', country: 'فرنسا 🇫🇷', desc: 'أنظمة التبريد، الكهرباء، والمساحات', icon: '❄️' },
  { name: 'BOSCH', country: 'ألمانيا 🇩🇪', desc: 'أنظمة الحقن، الفلاتر، وشمعات الإشعال', icon: '⚡' },
  { name: 'BREMBO', country: 'إيطاليا 🇮🇹', desc: 'أقراص وبطانات الفرامل الرياضية', icon: '🛑' },
  { name: 'MAHLE', country: 'ألمانيا 🇩🇪', desc: 'فلاتر الهواء والزيت وأجزاء المحرك', icon: '🌬️' },
  { name: 'MANN-FILTER', country: 'ألمانيا 🇩🇪', desc: 'فلاتر أصلية معتمدة عالمياً', icon: '🫧' },
  { name: 'DENSO', country: 'اليابان 🇯🇵', desc: 'المشعات، شمعات الإشعال ومكيفات الهواء', icon: '🔧' },
  { name: 'MAGNETI MARELLI', country: 'إيطاليا 🇮🇹', desc: 'المصابيح والأنظمة الإلكترونية', icon: '💡' },
  { name: 'CONTINENTAL', country: 'ألمانيا 🇩🇪', desc: 'سيور التوزيع ومضخات المياه', icon: '⚙️' },
]

export default function Brands() {
  const ref = useReveal<HTMLDivElement>()
  const [activeTab, setActiveTab] = useState<'cars' | 'oem'>('cars')

  const marqueeRow = [...CAR_BRANDS_LIST, ...CAR_BRANDS_LIST]

  return (
    <section id="brands" className="scroll-mt-24 bg-gradient-to-b from-white via-zinc-50/50 to-white py-20" ref={ref}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Heading with User's Exact Texts */}
        <SectionHeading
          kicker="العلامات المعتمدة"
          title="نوفر قطع الغيار لأشهر العلامات"
          sub="نتعامل مع أفضل الشركات العالمية لضمان جودة كل قطعة نبيعها"
        />

        {/* Brand Selector Tabs */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-2xl bg-zinc-100 p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('cars')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-cairo text-xs font-black transition-all ${
                activeTab === 'cars'
                  ? 'bg-white text-zinc-900 shadow-md shadow-zinc-900/5'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Car className="h-4 w-4 text-brand-600" />
              <span>ماركات السيارات ({CAR_BRANDS_LIST.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('oem')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-cairo text-xs font-black transition-all ${
                activeTab === 'oem'
                  ? 'bg-white text-zinc-900 shadow-md shadow-zinc-900/5'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Wrench className="h-4 w-4 text-brand-600" />
              <span>مصنعو قطع الغيار العالمية ({OEM_PARTS_MAKERS.length})</span>
            </button>
          </div>
        </div>

        {/* ─── TAB 1: CAR BRANDS GRID ─── */}
        {activeTab === 'cars' && (
          <div className="mt-10 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {CAR_BRANDS_LIST.map((b) => (
              <a
                key={b.nameEn}
                href={`/#search?brand=${encodeURIComponent(b.nameAr)}`}
                className={`group relative flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${b.accentColor}`}
              >
                {b.badge && (
                  <span className="absolute left-3 top-3 rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-[9px] font-black text-brand-700">
                    {b.badge}
                  </span>
                )}

                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 p-2.5 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <img
                      src={b.logoUrl}
                      alt={b.nameEn}
                      className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>

                  <h3 className="mt-4 font-cairo text-base font-black text-zinc-900 transition-colors">
                    {b.nameAr}
                  </h3>
                  <p className="text-[11px] font-bold text-zinc-400" dir="ltr">
                    {b.nameEn}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-500 truncate mb-1">
                    {b.popularModels.join(' • ')}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-brand-600 group-hover:underline">
                    <span>عرض القطع</span>
                    <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* ─── TAB 2: OEM PARTS MANUFACTURERS ─── */}
        {activeTab === 'oem' && (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OEM_PARTS_MAKERS.map((m) => (
              <a
                key={m.name}
                href={`/#search?q=${encodeURIComponent(m.name)}`}
                className="group flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-50 border border-zinc-100 text-2xl shadow-xs">
                      {m.icon}
                    </span>
                    <span className="text-xs font-black text-zinc-400" dir="rtl">
                      {m.country}
                    </span>
                  </div>

                  <h3 className="mt-4 font-cairo text-lg font-black text-zinc-900 group-hover:text-brand-600 transition-colors">
                    {m.name}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-zinc-500 leading-relaxed">
                    {m.desc}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                    ✓ قطع أصلية 100%
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-brand-600 group-hover:underline">
                    <span>استعراض القطع</span>
                    <ChevronLeft className="h-3 w-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ─── INFINITE BRAND LOGOS MARQUEE ─── */}
      <div className="reveal relative mt-16 overflow-hidden border-y border-zinc-100 bg-white py-6" data-delay="120">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-white to-transparent" />

        <div className="marquee-track flex w-max items-center" style={{ direction: 'ltr' }}>
          {[0, 1].map((half) => (
            <div key={half} className="flex items-center">
              {marqueeRow.map((b, i) => (
                <a
                  key={`${half}-${i}`}
                  href={`/#search?brand=${encodeURIComponent(b.nameAr)}`}
                  className="group mx-3 flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 px-5 py-3 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-brand-400 hover:bg-white hover:shadow-md"
                >
                  <img
                    src={b.logoUrl}
                    alt={b.nameEn}
                    className="h-5 w-5 object-contain grayscale opacity-60 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110"
                    loading="lazy"
                  />
                  <span className="whitespace-nowrap font-cairo text-sm font-black tracking-wider text-zinc-600 transition-colors duration-300 group-hover:text-zinc-900">
                    {b.nameAr} ({b.nameEn})
                  </span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── TRUST & QUALITY PROMISES ─── */}
      <div className="mx-auto max-w-7xl px-4 mt-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-cairo text-xs font-black text-zinc-900">قطع غيار أصلية ومطابقة 100%</h4>
              <p className="text-[11px] font-bold text-zinc-400 mt-0.5">ضمان التوافق التام مع كتالوج الصانع</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-cairo text-xs font-black text-zinc-900">توصيل لـ 58 ولاية جزائرية</h4>
              <p className="text-[11px] font-bold text-zinc-400 mt-0.5">شحن سريع وآمن حتى باب منزلك</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-cairo text-xs font-black text-zinc-900">فحص وضمان الجودة</h4>
              <p className="text-[11px] font-bold text-zinc-400 mt-0.5">إمكانية المعاينة قبل الاستلام والدفع</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

