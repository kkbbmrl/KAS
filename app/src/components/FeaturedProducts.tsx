import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Filter,
  Star,
  Zap,
} from 'lucide-react'
import { fetchProducts } from '@/lib/api'
import type { Product } from '@/data/products'
import ProductCard from './ProductCard'
import { useReveal } from '@/hooks/useReveal'

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('الكل')
  const [inStockOnly, setInStockOnly] = useState(false)

  const sectionRef = useReveal()

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)

    fetchProducts({}, ac.signal)
      .then((list) => {
        setProducts(list)
        setLoading(false)
      })
      .catch(() => {
        setProducts([])
        setLoading(false)
      })

    return () => ac.abort()
  }, [])

  // Featured products are those marked with the Star (featuredHome === true) in the Admin Dashboard.
  // If fewer than 4 are starred, we supplement with top products so the section looks rich.
  const featuredProducts = useMemo(() => {
    const starred = products.filter((p) => p.featuredHome)
    if (starred.length >= 4) return starred
    // If fewer than 4 starred in admin, include other active products as fallback
    const other = products.filter((p) => !p.featuredHome)
    return [...starred, ...other]
  }, [products])

  // Extract available categories from the featured products
  const categories = useMemo(() => {
    const set = new Set<string>()
    featuredProducts.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['الكل', ...Array.from(set)]
  }, [featuredProducts])

  // Filter by category and stock status
  const displayedProducts = useMemo(() => {
    let list = featuredProducts

    if (activeCategory !== 'الكل') {
      list = list.filter((p) => p.category === activeCategory)
    }

    if (inStockOnly) {
      list = list.filter((p) => p.stock !== 'غير متوفر')
    }

    return list
  }, [featuredProducts, activeCategory, inStockOnly])

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white py-16 sm:py-24" dir="rtl">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b border-zinc-100">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200/60 px-3.5 py-1 text-xs font-black text-amber-700 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              <span>قطع غيار مختارة ومميزة</span>
              <span className="rounded-full bg-amber-200/80 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
                {featuredProducts.length} قطعة
              </span>
            </div>
            <h2 className="mt-3 font-cairo text-3xl font-black text-zinc-900 sm:text-4xl">
              القطع <span className="text-brand-600">الأكثر طلباً</span> والموصى بها
            </h2>
            <p className="mt-2 text-sm text-zinc-600 sm:text-base font-medium">
              مختارة ومفحوصة بدقة مع ضمان أصالة 100% وإمكانية الشحن السريع لجميع الولايات
            </p>
          </div>

          {/* Quick Links & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                inStockOnly
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 ${inStockOnly ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span>المتوفر بالمخزن فقط</span>
            </button>

            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-600 transition-colors"
            >
              <span>عرض كل الكتالوج</span>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Category Tabs */}
        {categories.length > 1 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-black text-zinc-400 pl-2">
              <Filter className="h-3.5 w-3.5" /> الفئات:
            </span>
            {categories.map((cat) => {
              const active = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-2 font-cairo text-xs font-black transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                      : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-brand-300 hover:bg-white hover:text-brand-600'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-96 animate-pulse rounded-3xl border border-zinc-100 bg-zinc-50 p-6" />
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="mt-12 rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-12 text-center">
            <Boxes className="mx-auto h-12 w-12 text-zinc-300" />
            <p className="mt-3 font-cairo text-lg font-black text-zinc-700">لا توجد قطع مطابقة للفلتر المحدد</p>
            <button
              onClick={() => {
                setActiveCategory('الكل')
                setInStockOnly(false)
              }}
              className="mt-4 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-700"
            >
              عرض جميع القطع المميزة
            </button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayedProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} delay={(i % 4) * 80} />
            ))}
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 p-8 text-white shadow-2xl sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-600/20 border border-brand-500/30 px-3 py-1 text-xs font-black text-brand-400">
                <Zap className="h-3.5 w-3.5 fill-brand-400" /> بحث دقيق برقم القطعة والماركة
              </div>
              <h3 className="mt-3 font-cairo text-2xl font-black text-white sm:text-3xl">
                لم تجد قطعة الغيار التي تبحث عنها؟
              </h3>
              <p className="mt-2 text-sm text-zinc-400 max-w-xl">
                استخدم محرك البحث الذكي للبحث بالماركة، الموديل، أو رقم القطعة الأصلي (Part Number) من بين أكثر من 33 قطعة متوفرة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/search"
                className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 font-cairo text-sm font-black text-white shadow-xl shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95"
              >
                <span>الانتقال إلى صفحة البحث</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
