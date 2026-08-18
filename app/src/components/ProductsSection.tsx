import { useMemo, useState } from 'react'
import * as icons from 'lucide-react'
import ProductCard from './ProductCard'
import SectionHeading from './SectionHeading'
import { CATEGORIES, PRODUCTS } from '@/data/products'
import { useShop } from '@/context/ShopContext'
import { useReveal } from '@/hooks/useReveal'

const FILTER_CATS = ['الكل', 'فلاتر الزيت', 'فلاتر الهواء', 'أقراص الفرامل', 'بطانات الفرامل']

export default function ProductsSection() {
  const { searchFilter } = useShop()
  const ref = useReveal<HTMLDivElement>()
  const [cat, setCat] = useState('الكل')

  const products = useMemo(() => {
    let list = PRODUCTS
    if (searchFilter) {
      const pn = searchFilter.partNumber.toLowerCase()
      const filtered = list.filter(
        (p) => (pn && p.partNumber.toLowerCase().includes(pn)) || (searchFilter.brand && p.compat.some((c) => c.includes(searchFilter.brand)))
      )
      if (filtered.length || pn || searchFilter.brand) list = filtered
    }
    if (cat !== 'الكل') list = list.filter((p) => p.category === cat)
    return list
  }, [cat, searchFilter])

  const pickCategory = (name: string, available: boolean) => {
    if (!available) return
    setCat(name)
    document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="products" className="relative scroll-mt-24 bg-zinc-50/70 py-20" ref={ref}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          kicker="متجر القطع"
          title="تصفّح منتجاتنا"
          sub="قطع غيار أصلية وعالية الجودة من أفضل العلامات العالمية"
        />

        {/* categories grid */}
        <div className="reveal mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9" data-delay="80">
          {CATEGORIES.map((c) => {
            const Icon =
              ((icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon] ??
                icons.Package)
            const active = cat === c.name
            return (
              <button
                key={c.name}
                onClick={() => pickCategory(c.name, c.available)}
                className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all duration-300 ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : c.available
                      ? 'border-zinc-200 bg-white text-zinc-700 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-600/10'
                      : 'cursor-default border-zinc-100 bg-white/60 text-zinc-400'
                }`}
              >
                {!c.available && (
                  <span className="absolute -top-2 right-2 rounded-full bg-zinc-200 px-2 py-0.5 text-[9px] font-bold text-zinc-500">قريبًا</span>
                )}
                <Icon className={`h-6 w-6 transition-transform duration-300 ${c.available ? 'group-hover:scale-125' : ''} ${active ? 'text-white' : c.available ? 'text-brand-600' : 'text-zinc-300'}`} />
                <span className="text-[11px] font-bold leading-tight">{c.name}</span>
              </button>
            )
          })}
        </div>

        {/* filter chips */}
        <div id="products-grid" className="reveal mt-12 flex flex-wrap items-center gap-3" data-delay="120">
          {FILTER_CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                cat === c
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {c}
            </button>
          ))}
          {searchFilter && (
            <span className="fade-in flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white">
              نتائج البحث: {searchFilter.brand || ''} {searchFilter.model} {searchFilter.year} {searchFilter.partNumber}
            </span>
          )}
        </div>

        {/* grid */}
        {products.length > 0 ? (
          <div key={cat + String(!!searchFilter)} className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} delay={(i % 4) * 90} />
            ))}
          </div>
        ) : (
          <div className="reveal is-visible mt-8 rounded-3xl border border-dashed border-zinc-300 bg-white p-14 text-center">
            <p className="font-cairo text-xl font-extrabold text-zinc-700">لا توجد قطع مطابقة حاليًا</p>
            <p className="mt-2 text-sm text-zinc-500">تواصل معنا عبر واتساب وسنوفر لك القطعة المطلوبة في أقرب وقت</p>
          </div>
        )}
      </div>
    </section>
  )
}
