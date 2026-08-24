import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  Car,
  ChevronDown,
  Eye,
  Frown,
  Layers,
  RefreshCw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  XCircle,
} from 'lucide-react'
import {
  CAR_BRANDS,
  CATEGORIES,
  formatPrice,
  matchesVehicle,
  normalizeSearchText,
  productHaystack,
  type Product,
} from '@/data/products'
import { fetchProducts } from '@/lib/api'
import { useShop } from '@/context/ShopContext'

const selectCls =
  'w-full appearance-none rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 pe-10 text-sm font-bold text-zinc-800 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 hover:border-brand-300 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-50'

const stockColors: Record<string, string> = {
  'متوفر': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'كمية محدودة': 'bg-amber-50 text-amber-700 border-amber-200',
  'غير متوفر': 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const { setSelected, addToCart } = useShop()

  // URL is the single source of truth for filters, so links and back/forward work.
  const query = params.get('q') ?? ''
  const brand = params.get('brand') ?? ''
  const model = params.get('model') ?? ''
  const cat = params.get('cat') ?? ''
  const inStockOnly = params.get('in_stock') === 'true'

  const [draft, setDraft] = useState(query)
  const [showFilters, setShowFilters] = useState(false)
  const [showSugg, setShowSugg] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const models = useMemo(() => (brand ? CAR_BRANDS[brand] ?? [] : []), [brand])

  /** Writes filter state to the URL; results then follow from the URL. */
  const patchParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(params)
      for (const [k, v] of Object.entries(patch)) {
        if (v) sp.set(k, v)
        else sp.delete(k)
      }
      setParams(sp, { replace: true })
    },
    [params, setParams]
  )

  // Keep the input in sync when the URL changes from outside (back button, pills).
  useEffect(() => setDraft(query), [query])

  // Guard against stale model if brand changed or model not in selected brand
  useEffect(() => {
    if (brand && model && models.length > 0 && !models.includes(model)) {
      patchParams({ model: undefined })
    }
  }, [brand, model, models, patchParams])

  // Debounced free-text search: one request per pause, not per keystroke.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (draft === query) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => patchParams({ q: draft.trim() || undefined }), 320)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [draft, query, patchParams])

  /*
   * Single fetch pipeline for search + every filter. AbortController kills the
   * race where a slow earlier response lands after a faster later one and
   * overwrites the results the customer is actually looking at.
   */
  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    setError('')

    fetchProducts({ q: query, brand, model, cat, in_stock: inStockOnly || undefined }, ac.signal)
      .then((list) => {
        setProducts(list)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return
        setProducts([])
        setError(err instanceof Error ? err.message : 'تعذر تحميل المنتجات')
        setLoading(false)
      })

    return () => ac.abort()
  }, [query, brand, model, cat, inStockOnly, reloadKey])

  /*
   * Client-side refinement: narrows what the server returned with robust
   * Arabic normalisation (diacritics, alef/taa/yaa variants), French accent folding,
   * SKU, part-number, brand and vehicle compatibility matching.
   */
  const results = useMemo(() => {
    let list = products

    if (brand || model) {
      list = list.filter((p) => matchesVehicle(p, brand, model))
    }

    const q = normalizeSearchText(query)
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean)
      list = list.filter((p) => {
        const haystack = productHaystack(p)
        return tokens.every((token) => haystack.includes(token))
      })
    }

    return list
  }, [products, query, brand, model])

  // Suggestions come from the live catalogue, never a hardcoded token list.
  const suggestions = useMemo(() => {
    const q = normalizeSearchText(draft)
    if (q.length < 2) return []
    const tokens = new Set<string>()
    for (const p of products) {
      for (const t of [p.nameFr, p.name, ...(p.aliases ?? [])]) {
        if (t && normalizeSearchText(t).includes(q)) tokens.add(t)
      }
    }
    return [...tokens].slice(0, 8)
  }, [draft, products])

  const activeFilters = [query, brand, model, cat].filter(Boolean).length + (inStockOnly ? 1 : 0)

  const resetAll = () => {
    setDraft('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const openDetails = (p: Product) => setSelected(p)

  return (
    <div className="min-h-screen bg-zinc-50 font-tajawal text-zinc-900" dir="rtl">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 rounded-xl p-2 text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
            aria-label="العودة إلى الرئيسية"
          >
            <ArrowRight className="h-5 w-5" />
            <span className="hidden font-cairo font-black sm:block">الرئيسية</span>
          </Link>

          {/* Search bar */}
          <div className="relative min-w-0 flex-1">
            <div className="flex overflow-hidden rounded-xl border-2 border-zinc-200 bg-white transition-all focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10">
              <input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  setShowSugg(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (debounceRef.current) clearTimeout(debounceRef.current)
                    patchParams({ q: draft.trim() || undefined })
                    setShowSugg(false)
                  }
                  if (e.key === 'Escape') setShowSugg(false)
                }}
                onFocus={() => draft.length >= 2 && setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                placeholder="Radiateur, مشعاع, رقم القطعة..."
                className="min-w-0 flex-1 bg-transparent px-3 py-3 font-cairo text-sm font-bold text-zinc-900 outline-none placeholder:font-medium placeholder:text-zinc-400 sm:px-4"
                aria-label="البحث عن قطعة"
              />
              <button
                onClick={() => {
                  if (debounceRef.current) clearTimeout(debounceRef.current)
                  patchParams({ q: draft.trim() || undefined })
                  setShowSugg(false)
                }}
                className="flex shrink-0 items-center gap-2 bg-brand-600 px-4 font-cairo text-sm font-black text-white transition-colors hover:bg-brand-700 sm:px-5"
                aria-label="بحث"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:block">بحث</span>
              </button>
            </div>

            {showSugg && suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => {
                      setDraft(s)
                      if (debounceRef.current) clearTimeout(debounceRef.current)
                      patchParams({ q: s })
                      setShowSugg(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-right text-sm font-bold text-zinc-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="min-w-0 truncate">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex shrink-0 items-center gap-2 rounded-xl border-2 px-3 py-2.5 font-cairo text-sm font-black transition-all sm:px-4 ${
              showFilters ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-200 text-zinc-700 hover:border-brand-300'
            }`}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:block">فلاتر</span>
            {activeFilters > 0 && (
              <span className="absolute -left-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-zinc-900 px-1 text-[11px] font-black text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Expandable filters — every control here actually filters. */}
        {showFilters && (
          <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-4 sm:px-6">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative">
                <label className="mb-1 block text-xs font-black text-zinc-600">الماركة</label>
                <select
                  value={brand}
                  onChange={(e) => patchParams({ brand: e.target.value || undefined, model: undefined })}
                  className={selectCls}
                >
                  <option value="">الكل</option>
                  {Object.keys(CAR_BRANDS).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-zinc-400" />
              </div>

              <div className="relative">
                <label className="mb-1 block text-xs font-black text-zinc-600">الموديل</label>
                <select
                  value={model}
                  onChange={(e) => patchParams({ model: e.target.value || undefined })}
                  disabled={!brand}
                  className={selectCls}
                >
                  <option value="">{brand ? 'الكل' : 'اختر الماركة أولاً'}</option>
                  {models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-zinc-400" />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => patchParams({ in_stock: inStockOnly ? undefined : 'true' })}
                  className={`min-h-[48px] w-full rounded-xl border-2 px-3 text-sm font-black transition-all ${
                    inStockOnly
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300'
                  }`}
                  aria-pressed={inStockOnly}
                >
                  {inStockOnly ? '✓ المتوفر فقط' : 'عرض المتوفر فقط'}
                </button>
              </div>
            </div>

            {activeFilters > 0 && (
              <div className="mx-auto mt-3 flex max-w-7xl justify-end">
                <button
                  onClick={resetAll}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 font-cairo text-sm font-black text-zinc-700 transition-colors hover:border-zinc-900"
                >
                  <XCircle className="h-4 w-4" /> مسح كل الفلاتر
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        {/* Category pills — write straight to the URL, no setTimeout race */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['الكل', ...CATEGORIES.filter((c) => c.available).map((c) => c.name)].map((c) => {
            const active = c === 'الكل' ? !cat : cat === c
            return (
              <button
                key={c}
                onClick={() => patchParams({ cat: c === 'الكل' ? undefined : c })}
                className={`rounded-full border-2 px-3.5 py-2 text-xs font-black transition-all ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>

        {/* Results header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-cairo text-xl font-black text-zinc-900 sm:text-2xl">
              {activeFilters > 0 ? (
                <>
                  نتائج البحث
                  {query && <span className="text-brand-600"> عن "{query}"</span>}
                </>
              ) : (
                'جميع قطع الغيار المتوفرة'
              )}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {loading
                ? 'جارٍ التحميل…'
                : error
                  ? 'تعذر تحميل المنتجات'
                  : results.length > 0
                    ? `${results.length} قطعة`
                    : 'لا توجد نتائج مطابقة'}
            </p>
          </div>
          {activeFilters > 0 && !loading && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 transition-all hover:border-zinc-400 hover:text-zinc-900"
            >
              <XCircle className="h-4 w-4" /> مسح البحث
            </button>
          )}
        </div>

        {/* ─── Loading ─── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl border-2 border-zinc-100 bg-white">
                <div className="h-40 bg-zinc-100" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-1/3 rounded bg-zinc-100" />
                  <div className="h-4 w-full rounded bg-zinc-100" />
                  <div className="h-4 w-2/3 rounded bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* ─── Error state — a real failure, never masked with demo data ─── */
          <div className="flex flex-col items-center py-20 text-center">
            <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-red-50">
              <AlertCircle className="h-12 w-12 text-brand-600" />
            </div>
            <h2 className="font-cairo text-2xl font-black text-zinc-900">تعذر تحميل المنتجات</h2>
            <p className="mt-3 max-w-sm text-sm text-zinc-500">{error}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="btn-shine mt-8 flex min-h-[48px] items-center gap-2 rounded-xl bg-brand-600 px-6 font-cairo font-black text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-700"
            >
              <RefreshCw className="h-4 w-4" /> إعادة المحاولة
            </button>
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((p) => {
              const out = p.stock === 'غير متوفر'
              return (
                <article
                  key={String(p.id)}
                  className="group flex flex-col overflow-hidden rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-600/10"
                >
                  <button
                    onClick={() => openDetails(p)}
                    className="relative block overflow-hidden bg-gradient-to-br from-zinc-50 to-red-50/30 p-4"
                    aria-label={`عرض تفاصيل ${p.name}`}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="mx-auto h-40 w-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                    {p.badge && (
                      <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-black text-white shadow-md">
                        {p.badge}
                      </span>
                    )}
                    <span
                      className={`absolute bottom-3 left-3 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${stockColors[p.stock] ?? stockColors['متوفر']}`}
                    >
                      {p.stock}
                    </span>
                  </button>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-black text-white" dir="ltr">
                        {p.brand}
                      </span>
                      {p.nameFr && (
                        <span className="max-w-full truncate rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700" dir="ltr">
                          {p.nameFr}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => openDetails(p)}
                      className="line-clamp-2 text-right font-cairo text-sm font-black leading-snug text-zinc-900 transition-colors hover:text-brand-600"
                    >
                      {p.name}
                    </button>

                    {(p.compat?.length ?? 0) > 0 && (
                      <p className="line-clamp-1 text-xs text-zinc-500">
                        {p.compat.slice(0, 3).join(' · ')}
                        {p.compat.length > 3 && ` +${p.compat.length - 3}`}
                      </p>
                    )}

                    <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                      <div className="min-w-0">
                        <p className="font-cairo text-base font-black text-brand-600">{formatPrice(p.price)}</p>
                        {p.oldPrice ? (
                          <p className="text-xs font-bold text-zinc-400 line-through">{formatPrice(p.oldPrice)}</p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => openDetails(p)}
                          className="grid h-11 w-11 place-items-center rounded-lg border-2 border-zinc-200 text-zinc-600 transition-all hover:border-brand-300 hover:text-brand-600"
                          aria-label={`تفاصيل ${p.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => addToCart(p)}
                          disabled={out}
                          className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-brand-600 px-3 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-95 disabled:bg-zinc-300 disabled:shadow-none"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {out ? 'غير متوفر' : 'أضف'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          /* ─── Empty state ─── */
          <div className="flex flex-col items-center py-20 text-center">
            <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-zinc-100">
              <Frown className="h-12 w-12 text-zinc-400" />
            </div>
            <h2 className="font-cairo text-2xl font-black text-zinc-900">
              {activeFilters > 0 ? 'لا توجد نتائج مطابقة' : 'لا توجد منتجات بعد'}
            </h2>
            <p className="mt-3 max-w-sm text-sm text-zinc-500">
              {activeFilters > 0
                ? 'لم نعثر على قطعة مطابقة. جرّب كلمة مختلفة أو امسح الفلاتر.'
                : 'لم تتم إضافة أي منتجات إلى المتجر حتى الآن.'}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {activeFilters > 0 && (
                <button
                  onClick={resetAll}
                  className="flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-zinc-200 bg-white px-6 font-cairo font-black text-zinc-700 transition-colors hover:border-zinc-900"
                >
                  <Layers className="h-4 w-4" /> عرض كل المنتجات
                </button>
              )}
              <Link
                to="/"
                className="flex min-h-[48px] items-center gap-2 rounded-xl bg-brand-600 px-6 font-cairo font-black text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-700"
              >
                <Car className="h-4 w-4" /> العودة للرئيسية
              </Link>
            </div>

            {activeFilters > 0 && (
              <p className="mt-8 flex items-center justify-center gap-2 text-xs font-black text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                نصيحة: ابحث برقم القطعة أو باسمها بالفرنسية
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
