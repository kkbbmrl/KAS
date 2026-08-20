import { useMemo, useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router'
import {
  ArrowRight,
  Car,
  ChevronDown,
  Filter,
  Frown,
  Layers,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  XCircle,
} from 'lucide-react'
import {
  CAR_BRANDS,
  CATEGORIES,
  ENGINE_TYPES,
  formatPrice,
  normalizeSearchText,
  PRODUCTS,
  searchProducts,
  YEARS,
} from '@/data/products'
import { useShop } from '@/context/ShopContext'

// Flat list of all product names + aliases for suggestions
const ALL_SUGGESTION_TOKENS: string[] = Array.from(
  new Set([
    ...PRODUCTS.map((p) => p.nameFr ?? '').filter(Boolean),
    ...PRODUCTS.flatMap((p) => p.aliases ?? []),
    ...CATEGORIES.map((c) => c.fr),
  ])
).sort()

const selectCls =
  'w-full appearance-none rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 pe-10 text-sm font-bold text-zinc-800 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 hover:border-brand-300 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-50'

export default function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setSelected, addToCart } = useShop()

  // URL-driven query
  const urlQ = params.get('q') ?? ''
  const urlBrand = params.get('brand') ?? ''
  const urlModel = params.get('model') ?? ''
  const urlCat = params.get('cat') ?? ''

  const [query, setQuery] = useState(urlQ)
  const [brand, setBrand] = useState(urlBrand)
  const [model, setModel] = useState(urlModel)
  const [year, setYear] = useState(params.get('year') ?? '')
  const [engine, setEngine] = useState(params.get('engine') ?? '')
  const [cat, setCat] = useState(urlCat)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSugg, setShowSugg] = useState(false)

  const models = useMemo(() => (brand ? CAR_BRANDS[brand] ?? [] : []), [brand])

  // Update suggestions live as user types
  useEffect(() => {
    const q = normalizeSearchText(query)
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    const hits = ALL_SUGGESTION_TOKENS.filter((t) =>
      normalizeSearchText(t).includes(q)
    ).slice(0, 8)
    setSuggestions(hits)
  }, [query])

  // Recompute results whenever any filter changes
  const results = useMemo(
    () =>
      searchProducts({
        brand,
        model,
        year,
        engine,
        query: query.trim(),
        inStockOnly,
      }).filter((p) => {
        if (!cat || cat === 'الكل') return true
        return p.category === cat
      }),
    [brand, cat, engine, inStockOnly, model, query, year]
  )

  const doSearch = (q?: string) => {
    const finalQ = (q ?? query).trim()
    const sp = new URLSearchParams()
    if (finalQ) sp.set('q', finalQ)
    if (brand) sp.set('brand', brand)
    if (model) sp.set('model', model)
    if (year) sp.set('year', year)
    if (engine) sp.set('engine', engine)
    if (cat && cat !== 'الكل') sp.set('cat', cat)
    navigate(`/search?${sp.toString()}`, { replace: true })
    if (q) setQuery(q)
    setShowSugg(false)
  }

  const pickSuggestion = (s: string) => {
    setQuery(s)
    doSearch(s)
  }

  const stockColors: Record<string, string> = {
    'متوفر': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'كمية محدودة': 'bg-amber-50 text-amber-700 border-amber-200',
    'غير متوفر': 'bg-zinc-100 text-zinc-500 border-zinc-200',
  }

  const hasAnyFilter = !!(urlQ || urlBrand || urlModel || urlCat)

  return (
    <div className="min-h-screen bg-zinc-50 font-tajawal text-zinc-900" dir="rtl">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-brand-600 hover:text-brand-700 transition-colors">
            <ArrowRight className="h-5 w-5" />
            <span className="hidden font-cairo font-black sm:block">الرئيسية</span>
          </Link>

          {/* Search bar */}
          <div className="relative flex-1">
            <div className="flex overflow-hidden rounded-xl border-2 border-zinc-200 bg-white focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10 transition-all">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowSugg(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') doSearch()
                  if (e.key === 'Escape') setShowSugg(false)
                }}
                onFocus={() => query.length >= 2 && setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                placeholder="Radiateur, Phare, مشعاع, مصباح أمامي..."
                className="flex-1 bg-transparent px-4 py-3 font-cairo text-sm font-bold text-zinc-900 outline-none placeholder:font-medium placeholder:text-zinc-400"
                aria-label="البحث عن قطعة"
                autoFocus
              />
              <button
                onClick={() => doSearch()}
                className="flex items-center gap-2 bg-brand-600 px-5 font-cairo text-sm font-black text-white transition-colors hover:bg-brand-700"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:block">بحث</span>
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {showSugg && suggestions.length > 0 && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => pickSuggestion(s)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-right text-sm font-bold text-zinc-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Search className="h-3.5 w-3.5 text-zinc-400" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 font-cairo text-sm font-black transition-all ${
              showFilters
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-zinc-200 text-zinc-700 hover:border-brand-300'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:block">فلاتر</span>
          </button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-4 sm:px-6">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {/* Brand */}
              <div className="relative">
                <label className="mb-1 block text-xs font-black text-zinc-600">الماركة</label>
                <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel('') }} className={selectCls}>
                  <option value="">الكل</option>
                  {Object.keys(CAR_BRANDS).map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-zinc-400" />
              </div>
              {/* Model */}
              <div className="relative">
                <label className="mb-1 block text-xs font-black text-zinc-600">الموديل</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand} className={selectCls}>
                  <option value="">{brand ? 'الكل' : 'اختر الماركة'}</option>
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-zinc-400" />
              </div>
              {/* Year */}
              <div className="relative">
                <label className="mb-1 block text-xs font-black text-zinc-600">السنة</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls}>
                  <option value="">الكل</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-zinc-400" />
              </div>
              {/* Engine */}
              <div className="relative">
                <label className="mb-1 block text-xs font-black text-zinc-600">المحرك</label>
                <select value={engine} onChange={(e) => setEngine(e.target.value)} className={selectCls}>
                  <option value="">الكل</option>
                  {ENGINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-zinc-400" />
              </div>
              {/* In-stock toggle */}
              <div className="flex items-end">
                <button
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className={`w-full rounded-xl border-2 px-3 py-3 text-sm font-black transition-all ${
                    inStockOnly
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-zinc-200 text-zinc-700 hover:border-emerald-300'
                  }`}
                >
                  {inStockOnly ? '✓ متوفر فقط' : 'عرض المتوفر فقط'}
                </button>
              </div>
            </div>
            <div className="mx-auto mt-3 flex max-w-7xl justify-end">
              <button onClick={() => doSearch()} className="rounded-xl bg-brand-600 px-6 py-2.5 font-cairo text-sm font-black text-white hover:bg-brand-700 transition-colors">
                تطبيق الفلاتر
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─── Main content ─── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Category pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['الكل', ...CATEGORIES.filter((c) => c.available).map((c) => c.name)].map((c) => (
            <button
              key={c}
              onClick={() => { setCat(c); setTimeout(() => doSearch(), 0) }}
              className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-black transition-all ${
                cat === c || (c === 'الكل' && !cat)
                  ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Results header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {hasAnyFilter ? (
              <h1 className="font-cairo text-xl font-black text-zinc-900 sm:text-2xl">
                نتائج البحث عن:{' '}
                <span className="text-brand-600">"{urlQ || urlBrand || urlCat}"</span>
              </h1>
            ) : (
              <h1 className="font-cairo text-xl font-black text-zinc-900 sm:text-2xl">
                جميع قطع الغيار المتوفرة
              </h1>
            )}
            <p className="mt-1 text-sm text-zinc-500">
              {results.length > 0
                ? `${results.length} قطعة ${inStockOnly ? 'متوفرة' : ''} — مرتبة حسب الأكثر تطابقًا`
                : 'لا توجد نتائج مطابقة'}
            </p>
          </div>
          {hasAnyFilter && (
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-600 transition-all hover:border-zinc-400 hover:text-zinc-900"
            >
              <XCircle className="h-4 w-4" />
              مسح البحث
            </Link>
          )}
        </div>

        {/* ─── Results Grid ─── */}
        {results.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((p) => {
              const out = p.stock === 'غير متوفر'
              return (
                <article
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-600/10"
                >
                  {/* Image */}
                  <button
                    onClick={() => setSelected(p)}
                    className="relative block overflow-hidden bg-gradient-to-br from-zinc-50 to-red-50/30 p-4"
                    aria-label={`عرض تفاصيل ${p.name}`}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="mx-auto h-40 w-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                    {p.badge && (
                      <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-black text-white shadow-md">
                        {p.badge}
                      </span>
                    )}
                    <span
                      className={`absolute bottom-3 left-3 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${stockColors[p.stock]}`}
                    >
                      {p.stock}
                    </span>
                  </button>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-black text-white" dir="ltr">
                        {p.brand}
                      </span>
                      {p.nameFr && (
                        <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700" dir="ltr">
                          {p.nameFr.split(' ').slice(0, 2).join(' ')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelected(p)}
                      className="text-right font-cairo text-sm font-black leading-snug text-zinc-900 line-clamp-2 hover:text-brand-600 transition-colors"
                    >
                      {p.name}
                    </button>

                    <p className="text-xs text-zinc-500 line-clamp-1">
                      {p.compat.slice(0, 3).join(' · ')}
                      {p.compat.length > 3 && ` +${p.compat.length - 3}`}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div>
                        <p className="font-cairo text-base font-black text-brand-600">{formatPrice(p.price)}</p>
                        {p.oldPrice && (
                          <p className="text-xs font-bold text-zinc-400 line-through">{formatPrice(p.oldPrice)}</p>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelected(p)}
                          className="grid h-9 w-9 place-items-center rounded-lg border-2 border-zinc-200 text-zinc-600 transition-all hover:border-brand-300 hover:text-brand-600"
                          title="تفاصيل"
                        >
                          <Filter className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => addToCart(p)}
                          disabled={out}
                          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-95 disabled:bg-zinc-300 disabled:shadow-none"
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
              لا توجد نتائج لـ "{urlQ}"
            </h2>
            <p className="mt-3 max-w-sm text-zinc-500">
              لم نعثر على قطعة مطابقة. جرّب البحث بكلمة مختلفة أو تصفح الفئات أدناه.
            </p>

            {/* Suggestions */}
            <div className="mt-8">
              <p className="mb-3 text-sm font-black text-zinc-600 flex items-center gap-2 justify-center">
                <Sparkles className="h-4 w-4 text-brand-600" />
                قد تبحث عن:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Radiateur', 'Phare', 'Ventilateur', 'Verre de phare', 'Cache poussière', 'Capot', 'Pare-chocs', 'Traverse'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); doSearch(s) }}
                    className="rounded-full border-2 border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                to="/"
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-cairo font-black text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 transition-colors"
              >
                <Car className="h-4 w-4" />
                العودة للرئيسية
              </Link>
              <button
                onClick={() => { setQuery(''); setBrand(''); setModel(''); setCat('الكل'); doSearch('') }}
                className="flex items-center gap-2 rounded-xl border-2 border-zinc-200 px-6 py-3 font-cairo font-black text-zinc-700 hover:border-zinc-900 transition-colors"
              >
                <Layers className="h-4 w-4" />
                عرض كل المنتجات
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
