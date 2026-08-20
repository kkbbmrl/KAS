import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Eye,
  Filter,
  Layers,
  Search,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import * as icons from 'lucide-react'
import ProductCard from './ProductCard'
import SectionHeading from './SectionHeading'
import {
  CATEGORIES,
  FEATURED_HOMEPAGE_PRODUCTS,
  formatPrice,
  PRODUCTS,
  searchProducts,
} from '@/data/products'
import { useShop } from '@/context/ShopContext'
import { useReveal } from '@/hooks/useReveal'

const FILTER_CATS = [
  'الكل',
  'المشعاع',
  'زجاج المصباح',
  'غطاء الغبار',
  'المروحة',
  'المصباح الأمامي',
  'ماسحة الزجاج',
  'بيرسو',
  'سيرسو',
  'الترافرس',
  'حامل الصدام',
  'الضوء الخلفي',
  'الصدام',
  'مقبض الباب',
  'الغطاء الأمامي',
  'الآرما تور',
  'فلاتر الزيت',
  'فلاتر الهواء',
  'أقراص الفرامل',
  'بطانات الفرامل',
]

export default function ProductsSection() {
  const { searchFilter, addToCart, setSelected } = useShop()
  const ref = useReveal<HTMLDivElement>()
  const [cat, setCat] = useState('الكل')
  const [inStockOnly, setInStockOnly] = useState(false)

  const products = useMemo(() => {
    let list = searchFilter
      ? searchProducts({
          brand: searchFilter.brand,
          model: searchFilter.model,
          year: searchFilter.year,
          engine: searchFilter.engine,
          query: searchFilter.query,
          inStockOnly,
        })
      : PRODUCTS

    if (cat !== 'الكل') {
      list = list.filter((p) => p.category === cat)
    }
    if (inStockOnly) {
      list = list.filter((p) => p.stock !== 'غير متوفر')
    }
    return list
  }, [cat, inStockOnly, searchFilter])

  const pickCategory = (name: string, available: boolean) => {
    if (!available) return
    setCat(name)
    document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="products" className="relative scroll-mt-24 bg-zinc-50/60 py-16 sm:py-24" ref={ref}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Heading */}
        <SectionHeading
          kicker="تصفح منتجاتنا المميزة"
          title="قطع الغيار الأكثر طلباً بجودة أصلية"
          sub="تشكيلات هيكل، إضاءة، تبريد ومحرك مختارة بعناية لتمنح سيارتك الأداء والأمان المثاليين"
        />

        {/* 1. Large Modern Cards: 6 Featured Homepage Products */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED_HOMEPAGE_PRODUCTS.map((item, i) => {
            const correspondingProduct = PRODUCTS.find((p) => p.id === item.id) ?? PRODUCTS[0]
            return (
              <div
                key={item.fr}
                className="reveal group relative flex flex-col overflow-hidden rounded-[2rem] border border-zinc-200/90 bg-white p-6 shadow-xl shadow-zinc-900/5 transition-all duration-500 hover:-translate-y-2 hover:border-brand-500 hover:shadow-2xl hover:shadow-brand-600/20"
                data-delay={i * 80}
              >
                {/* Accent glow background on hover */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-brand-500/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                {/* Top header: French Badge + Stock Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-950 px-3.5 py-1 font-cairo text-xs font-black tracking-wider text-white shadow-sm" dir="ltr">
                      {item.fr}
                    </span>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-extrabold text-brand-700" dir="ltr">
                      {item.brand}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    {item.stock}
                  </span>
                </div>

                {/* Main Large Visual */}
                <div className="relative mt-5 flex h-60 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-50 via-zinc-100/60 to-red-50/40 p-4">
                  <span className="absolute left-3 top-3 rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-bold text-zinc-500 backdrop-blur" dir="ltr">
                    PN: {item.partNumber}
                  </span>
                  {item.badge && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-black text-white shadow-md">
                      <Sparkles className="h-3 w-3" /> {item.badge}
                    </span>
                  )}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-48 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Hover overlay button */}
                  <button
                    onClick={() => setSelected(correspondingProduct)}
                    className="absolute inset-x-4 bottom-3 flex translate-y-12 items-center justify-center gap-2 rounded-xl bg-zinc-900/90 py-3 font-cairo text-xs font-black text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-brand-600"
                  >
                    <Eye className="h-4 w-4" /> فحص ومواصفات القطعة
                  </button>
                </div>

                {/* Card Title & Description */}
                <div className="mt-5 flex-1">
                  <h3
                    onClick={() => setSelected(correspondingProduct)}
                    className="cursor-pointer font-cairo text-xl font-black leading-tight text-zinc-900 transition-colors group-hover:text-brand-600"
                  >
                    {item.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 line-clamp-2">
                    {item.desc}
                  </p>

                  {/* Specs summary pills */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.specsSummary.map((spec) => (
                      <span
                        key={spec}
                        className="rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-700"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price and Action Buttons */}
                <div className="mt-5 border-t border-zinc-100 pt-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      {item.oldPrice && (
                        <span className="text-xs font-bold text-zinc-400 line-through">
                          {formatPrice(item.oldPrice)}
                        </span>
                      )}
                      <p className="font-cairo text-2xl font-black text-brand-600">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-zinc-400">شامل الضمان</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setSelected(correspondingProduct)}
                      className="rounded-xl border-2 border-zinc-200 py-3 text-center font-cairo text-xs font-black text-zinc-800 transition-all hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                    >
                      عرض التفاصيل
                    </button>
                    <button
                      onClick={() => addToCart(correspondingProduct)}
                      className="btn-shine flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-3 text-center font-cairo text-xs font-black text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95"
                    >
                      <ShoppingCart className="h-4 w-4" /> أضف إلى السلة
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 2. Visual Categories Navigation */}
        <div className="reveal mt-16" data-delay="100">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
            <div>
              <p className="text-xs font-extrabold tracking-widest text-brand-600">تصفح الفئات الـ 14</p>
              <h3 className="mt-1 font-cairo text-2xl font-black text-zinc-900">
                كتالوج قطع الغيار المتوفرة
              </h3>
            </div>
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition-all ${
                inStockOnly
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 ${inStockOnly ? 'text-emerald-600' : 'text-zinc-400'}`} />
              عرض المتوفر في المخزن فقط
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {CATEGORIES.map((c) => {
              const Icon =
                ((icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon] ??
                  icons.Package)
              const active = cat === c.name
              return (
                <button
                  key={c.name}
                  onClick={() => pickCategory(c.name, c.available)}
                  className={`group relative flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all duration-300 ${
                    active
                      ? 'border-brand-600 bg-brand-600 text-white shadow-xl shadow-brand-600/30 ring-2 ring-brand-600/30'
                      : c.available
                        ? 'border-zinc-200 bg-white text-zinc-700 hover:-translate-y-1 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-600/10'
                        : 'cursor-default border-zinc-100 bg-white/60 text-zinc-400'
                  }`}
                >
                  {!c.available && (
                    <span className="absolute -top-2 right-2 rounded-full bg-zinc-200 px-2 py-0.5 text-[9px] font-bold text-zinc-500">
                      قريبًا
                    </span>
                  )}
                  <Icon
                    className={`h-6 w-6 transition-transform duration-300 ${c.available ? 'group-hover:scale-125' : ''} ${active ? 'text-white' : c.available ? 'text-brand-600' : 'text-zinc-300'}`}
                  />
                  <span className="font-cairo text-xs font-black leading-tight">{c.name}</span>
                  <span className={`text-[10px] font-semibold ${active ? 'text-white/80' : 'text-zinc-400'}`} dir="ltr">
                    {c.fr}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Filter Category Chips */}
        <div id="products-grid" className="reveal mt-12 flex flex-wrap items-center gap-2.5" data-delay="120">
          <span className="flex items-center gap-1 text-xs font-black text-zinc-400">
            <Filter className="h-3.5 w-3.5" /> تصفية:
          </span>
          {FILTER_CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-2 font-cairo text-xs font-extrabold transition-all duration-300 ${
                cat === c
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {c}
            </button>
          ))}
          {searchFilter && (
            <span className="fade-in flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white">
              <Search className="h-3.5 w-3.5 text-brand-400" />
              تصفية البحث: {searchFilter.query} {searchFilter.brand} {searchFilter.model}
            </span>
          )}
        </div>

        {/* 4. Products Grid */}
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-zinc-500">
          <p>عرض {products.length} قطعة غيار</p>
          {cat !== 'الكل' && (
            <button onClick={() => setCat('الكل')} className="text-brand-600 underline hover:text-brand-700">
              إلغاء التصفية وعرض الكل
            </button>
          )}
        </div>

        {products.length > 0 ? (
          <div key={cat + String(!!searchFilter) + String(inStockOnly)} className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} delay={(i % 4) * 70} />
            ))}
          </div>
        ) : (
          <div className="reveal is-visible mt-8 rounded-3xl border-2 border-dashed border-zinc-200 bg-white p-14 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-zinc-100 text-zinc-400">
              <Layers className="h-8 w-8" />
            </div>
            <p className="mt-4 font-cairo text-xl font-black text-zinc-800">لا توجد قطع مطابقة حاليًا</p>
            <p className="mt-2 text-sm text-zinc-500">جرّب اختيار فئة أخرى أو تغيير كلمات البحث أو نوع السيارة</p>
            <button
              onClick={() => {
                setCat('الكل')
                setInStockOnly(false)
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 font-cairo text-xs font-black text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700"
            >
              عرض جميع القطع
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

