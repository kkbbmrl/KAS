import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  Boxes,
  Car,
  CheckCircle2,
  Phone,
  RotateCcw,
  Search,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import { CAR_BRANDS, type Product, PHONE_DISPLAY, PHONE_CALL } from '@/data/products'
import { fetchProducts } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// Ordered car brands as specified by user
const ORDERED_BRANDS = [
  'تويوتا',
  'رينو',
  'بيجو',
  'فولكسفاغن',
  'داسيا',
  'هيونداي',
  'كيا',
  'مرسيدس',
  'BMW',
  'نيسان',
  'سيات',
  'سكودا',
  'فورد',
  'سيتروين',
]

// Grouped Automotive Systems
const AUTO_SYSTEMS = [
  {
    id: 'cooling',
    title: 'نظام التبريد والتهوية',
    titleFr: 'Refroidissement & Climatisation',
    icon: '❄️',
    color: 'from-blue-500/10 to-cyan-500/10 text-cyan-700 border-cyan-200',
    categories: ['المشعاع', 'المروحة', 'الآرما تور'],
    description: 'مشعاعات تبريد، مراوح كهربائية، وهياكل تثبيت الواجهة',
  },
  {
    id: 'lighting',
    title: 'نظام الإنارة والإضاءة',
    titleFr: 'Éclairage & Optiques',
    icon: '💡',
    color: 'from-amber-500/10 to-yellow-500/10 text-amber-700 border-amber-200',
    categories: ['المصباح الأمامي', 'الضوء الخلفي', 'زجاج المصباح'],
    description: 'مصابيح أمامية LED، أضواء خلفية، وزجاج شفاف بديل',
  },
  {
    id: 'braking',
    title: 'نظام الفرامل والسلامة',
    titleFr: 'Freinage & Sécurité',
    icon: '🛑',
    color: 'from-red-500/10 to-rose-500/10 text-red-700 border-red-200',
    categories: ['أقراص الفرامل', 'بطانات الفرامل'],
    description: 'أقراص فرامل مهواة ومثقوبة، وبطانات سيراميك عالية الأداء',
  },
  {
    id: 'filters',
    title: 'الفلاتر والصيانة الدورية',
    titleFr: 'Filtres & Entretien Moteur',
    icon: '🌬️',
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-200',
    categories: ['فلاتر الزيت', 'فلاتر الهواء'],
    description: 'فلاتر زيت عالية التدفق وفلاتر هواء لحماية المحرك',
  },
  {
    id: 'bodywork',
    title: 'الهيكل والواجهات الأمامية',
    titleFr: 'Carrosserie & Châssis',
    icon: '🚘',
    color: 'from-zinc-500/10 to-slate-500/10 text-zinc-800 border-zinc-200',
    categories: ['الصدام', 'الغطاء الأمامي', 'الترافرس', 'بيرسو', 'سيرسو', 'حامل الصدام'],
    description: 'صدامات جاهزة للدهان، كبوت محرك، دعامات وترافرس تصادم',
  },
  {
    id: 'accessories',
    title: 'المسّاحات والقطع الخارجية',
    titleFr: 'Accessoires & Finitions',
    icon: '🧼',
    color: 'from-purple-500/10 to-indigo-500/10 text-purple-700 border-purple-200',
    categories: ['ماسحة الزجاج', 'مقبض الباب', 'غطاء الغبار'],
    description: 'مسّاحات زجاج سيلكون، مقابض أبواب ذكية، وسوفليهات حماية',
  },
]

export default function ThemesPage() {
  const [params, setParams] = useSearchParams()

  const selectedBrand = params.get('brand') || ''
  const selectedModel = params.get('model') || ''
  const selectedSystem = params.get('system') || 'all'
  const searchQuery = params.get('q') || ''
  const inStockOnly = params.get('in_stock') === 'true'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(searchQuery)

  const models = useMemo(() => {
    return selectedBrand ? CAR_BRANDS[selectedBrand] ?? [] : []
  }, [selectedBrand])

  // Sync search input if query param changes outside
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  // Update single search param in URL
  const updateParam = (key: string, val: string | undefined) => {
    const next = new URLSearchParams(params)
    if (val && val !== 'all' && val !== 'الكل') {
      next.set(key, val)
    } else {
      next.delete(key)
    }
    setParams(next, { replace: true })
  }

  // Load products based on current filters
  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)

    fetchProducts(
      {
        q: searchQuery || undefined,
        brand: selectedBrand || undefined,
        model: selectedModel || undefined,
        in_stock: inStockOnly || undefined,
      },
      ac.signal
    )
      .then((list) => {
        setProducts(list)
        setLoading(false)
      })
      .catch(() => {
        setProducts([])
        setLoading(false)
      })

    return () => ac.abort()
  }, [searchQuery, selectedBrand, selectedModel, inStockOnly])

  // Filter products by selected automotive system if active
  const filteredProducts = useMemo(() => {
    if (selectedSystem === 'all') return products
    const sys = AUTO_SYSTEMS.find((s) => s.id === selectedSystem)
    if (!sys) return products
    return products.filter((p) => {
      if (!p.category) return false
      return sys.categories.some(
        (c) =>
          p.category.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(p.category.toLowerCase())
      )
    })
  }, [products, selectedSystem])

  const resetFilters = () => {
    setSearchInput('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const activeFiltersCount =
    (selectedBrand ? 1 : 0) +
    (selectedModel ? 1 : 0) +
    (selectedSystem !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (inStockOnly ? 1 : 0)

  return (
    <div className="min-h-screen bg-zinc-50 font-tajawal text-zinc-900" dir="rtl">
      <Navbar />

      <main className="pt-24 pb-20">
        {/* ─── Hero Header & Catalog Introduction ─── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-zinc-50 to-zinc-100/70 border-b border-zinc-200/80 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-6">
              <Link to="/" className="hover:text-brand-600 transition-colors">
                الرئيسية
              </Link>
              <span>/</span>
              <span className="text-brand-600 font-black">كتالوج ودليل قطع الغيار</span>
            </div>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200/60 px-3.5 py-1 text-xs font-black text-brand-700">
                <Sparkles className="h-3.5 w-3.5" />
                <span>الدليل الشامل لقطع الغيار والتوافق</span>
              </div>
              <h1 className="mt-4 font-cairo text-3xl font-black text-zinc-900 sm:text-5xl leading-tight">
                كتالوج قطع الغيار <span className="text-brand-600">التفاعلي والذكي</span>
              </h1>
              <p className="mt-3 text-base text-zinc-600 sm:text-lg leading-relaxed font-medium">
                ابحث عن القطعة الأصلية المتوافقة تماماً مع سيارتك حسب الماركة، الموديل، أو نظام السيارة، مع فحص التوافق المباشر والطلب الفوري.
              </p>
            </div>

            {/* Quick Live Search Bar */}
            <div className="mt-8 max-w-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  updateParam('q', searchInput.trim() || undefined)
                }}
                className="flex items-center gap-2 overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white p-1.5 shadow-lg shadow-zinc-900/5 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10 transition-all"
              >
                <Search className="mr-3 h-5 w-5 text-zinc-400 shrink-0" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ابحث باسم القطعة (مشعاع، مصباح...) أو رقم القطعة (RAD-8800)..."
                  className="w-full bg-transparent px-2 text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      updateParam('q', undefined)
                    }}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                    title="مسح البحث"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-6 py-2.5 font-cairo text-xs font-black text-white hover:bg-brand-700 transition-colors shrink-0"
                >
                  بحث سريع
                </button>
              </form>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
          {/* ─── STEP 1: Visual Vehicle Selector (المحدد التفاعلي للسيارة) ─── */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 font-cairo text-sm font-black text-white">
                  1
                </span>
                <div>
                  <h3 className="font-cairo text-lg font-black text-zinc-900">
                    اختر ماركة وموديل سيارتك (Marque & Modèle)
                  </h3>
                  <p className="text-xs text-zinc-500">حدد ماركة سيارتك لعرض القطع المتوافقة بنسبة 100%</p>
                </div>
              </div>

              {(selectedBrand || selectedModel) && (
                <button
                  type="button"
                  onClick={() => {
                    updateParam('brand', undefined)
                    updateParam('model', undefined)
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> إعادة تعيين السيارة
                </button>
              )}
            </div>

            {/* Car Brands Grid with Exact User Brand List */}
            <div className="mt-5 flex flex-wrap gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => {
                  updateParam('brand', undefined)
                  updateParam('model', undefined)
                }}
                className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
                  !selectedBrand
                    ? 'bg-zinc-900 text-white shadow-md'
                    : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-brand-300 hover:bg-white hover:text-brand-600'
                }`}
              >
                جميع الماركات
              </button>

              {ORDERED_BRANDS.map((b) => {
                const active = selectedBrand === b
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      updateParam('brand', active ? undefined : b)
                      updateParam('model', undefined)
                    }}
                    className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
                      active
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-2 ring-brand-600/20'
                        : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-brand-300 hover:bg-white hover:text-brand-600'
                    }`}
                  >
                    {b}
                  </button>
                )
              })}
            </div>

            {/* Model Selector if brand is chosen */}
            {selectedBrand && models.length > 0 && (
              <div className="mt-5 rounded-2xl bg-brand-50/60 border border-brand-100 p-4 animate-in fade-in">
                <p className="text-xs font-black text-brand-900 mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4 text-brand-600" />
                  اختر موديل سيارة <span className="underline">{selectedBrand}</span>:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateParam('model', undefined)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      !selectedModel
                        ? 'bg-brand-600 text-white'
                        : 'bg-white text-brand-800 border border-brand-200 hover:bg-brand-100'
                    }`}
                  >
                    كل موديلات {selectedBrand}
                  </button>
                  {models.map((m) => {
                    const active = selectedModel === m
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => updateParam('model', active ? undefined : m)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          active
                            ? 'bg-brand-600 text-white shadow-md'
                            : 'bg-white text-zinc-700 border border-brand-200/80 hover:border-brand-400 hover:text-brand-600'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ─── STEP 2: Automotive Systems Navigator (تصفح أنظمة السيارة) ─── */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 font-cairo text-sm font-black text-white">
                2
              </span>
              <div>
                <h3 className="font-cairo text-xl font-black text-zinc-900">
                  تصفح قطع الغيار حسب أنظمة السيارة (Systèmes Auto)
                </h3>
                <p className="text-xs text-zinc-500">اختر المنظومة الفنية لاستعراض جميع قطع الغيار المندرجة تحتها</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AUTO_SYSTEMS.map((sys) => {
                const active = selectedSystem === sys.id
                return (
                  <button
                    key={sys.id}
                    type="button"
                    onClick={() => updateParam('system', active ? 'all' : sys.id)}
                    className={`group rounded-3xl border-2 p-5 text-right transition-all duration-300 bg-white hover:-translate-y-1 hover:shadow-xl ${
                      active
                        ? 'border-brand-600 ring-4 ring-brand-600/10 shadow-lg shadow-brand-600/10'
                        : 'border-zinc-200/80 hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 text-2xl group-hover:scale-110 transition-transform">
                        {sys.icon}
                      </div>
                      <span
                        className={`text-[10px] font-black rounded-full px-2.5 py-1 transition-colors ${
                          active
                            ? 'bg-brand-600 text-white'
                            : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200'
                        }`}
                        dir="ltr"
                      >
                        {sys.titleFr}
                      </span>
                    </div>

                    <h4 className="mt-4 font-cairo text-lg font-black text-zinc-900 group-hover:text-brand-600 transition-colors">
                      {sys.title}
                    </h4>
                    <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {sys.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-zinc-100">
                      {sys.categories.map((c) => (
                        <span
                          key={c}
                          className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── STEP 3: Live Catalog Results (الكتالوج الحي) ─── */}
          <div className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
              <div>
                <h3 className="font-cairo text-2xl font-black text-zinc-900 flex items-center gap-2">
                  <span>القطع المتاحة</span>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-black text-brand-600">
                    {filteredProducts.length} قطعة
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {selectedBrand
                    ? `متوافقة مع ${selectedBrand} ${selectedModel || ''}`
                    : 'جميع القطع المتوفرة بالمتجر'}
                </p>
              </div>

              {/* Active Filter Badges & Clear Button */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateParam('in_stock', inStockOnly ? undefined : 'true')}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                    inStockOnly
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${inStockOnly ? 'text-emerald-600' : 'text-zinc-400'}`}
                  />
                  <span>المتوفر بالمخزن</span>
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> مسح كل الفلاتر ({activeFiltersCount})
                  </button>
                )}
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div
                    key={n}
                    className="h-96 animate-pulse rounded-3xl border border-zinc-100 bg-white p-6"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="mt-8 rounded-3xl border-2 border-dashed border-zinc-200 bg-white p-14 text-center">
                <Boxes className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-4 font-cairo text-xl font-black text-zinc-800">
                  لا توجد قطع مطابقة للبحث المحدد
                </p>
                <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
                  جرّب إزالة فلتر الموديل أو اختيار ماركة أخرى، أو تواصل معنا مباشرة لتوفير القطعة المطلوبة.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md transition-all"
                >
                  عرض جميع قطع الغيار
                </button>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredProducts.map((p, idx) => (
                  <ProductCard key={p.id} product={p} delay={(idx % 4) * 60} />
                ))}
              </div>
            )}
          </div>

          {/* ─── STEP 4: VIN / WhatsApp Support Strip (مساعدة رقم الهيكل) ─── */}
          <div className="mt-16 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 sm:p-10 text-white shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-400">
                  <Wrench className="h-3.5 w-3.5" /> خدمة البحث برقم الهيكل (Numéro de Châssis / VIN)
                </span>
                <h3 className="mt-3 font-cairo text-2xl font-black text-white sm:text-3xl">
                  لم تجد قطعة الغيار المحددة لسيارتك؟
                </h3>
                <p className="mt-2 text-sm text-zinc-400 max-w-xl leading-relaxed">
                  فريقنا الفني جاهز لمساعدتك فوراً. أرسل لنا صورة البطاقة الرمادية أو رقم الهيكل وسنقوم بتحديد وتوفير القطعة الأصلية المطابقة لسيارتك بنسبة 100%.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`tel:${PHONE_CALL}`}
                  className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 font-cairo text-sm font-black text-white shadow-xl shadow-brand-600/30 hover:bg-brand-700 transition-all active:scale-95"
                >
                  <Phone className="h-4 w-4" />
                  <span>اتصل بالفني: {PHONE_DISPLAY}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}


