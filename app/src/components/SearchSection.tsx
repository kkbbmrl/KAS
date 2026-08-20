import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Car,
  ChevronDown,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react'
import { CAR_BRANDS, CATEGORIES, ENGINE_TYPES, normalizeSearchText, PRODUCTS, YEARS, searchProducts } from '@/data/products'
import { useReveal } from '@/hooks/useReveal'

// Build suggestion pool from all product names + aliases + French names
const SUGGESTION_POOL: string[] = Array.from(
  new Set([
    ...PRODUCTS.map((p) => p.nameFr ?? '').filter(Boolean),
    ...PRODUCTS.flatMap((p) => p.aliases ?? []),
    ...CATEGORIES.map((c) => c.fr),
  ])
).sort()

const QUICK_TAGS = [
  'Radiateur',
  'Phare',
  'Capot',
  'Traverse',
  'Pare-chocs',
  'Ventilateur',
  'Verre de phare',
  'Perceau',
  'Cerceau',
  'Cache poussière',
  'Poignée de porte',
  'Essuie-glace',
  'Feu arrière',
  'Armature',
]

const selectCls =
  'w-full appearance-none rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3.5 pe-10 text-sm font-extrabold text-zinc-800 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 hover:border-brand-300 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-50'

export default function SearchSection() {
  const navigate = useNavigate()
  const ref = useReveal<HTMLDivElement>()
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [engine, setEngine] = useState('')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSugg, setShowSugg] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const models = useMemo(() => (brand ? CAR_BRANDS[brand] ?? [] : []), [brand])

  // Live availability preview (before navigating)
  const liveHits = useMemo(
    () => searchProducts({ brand, model, year, engine, query }),
    [brand, engine, model, query, year]
  )
  const availableCount = liveHits.filter((p) => p.stock !== 'غير متوفر').length

  // Build suggestions from typed query
  useEffect(() => {
    const q = normalizeSearchText(query)
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    setSuggestions(
      SUGGESTION_POOL.filter((t) => normalizeSearchText(t).includes(q)).slice(0, 7)
    )
  }, [query])

  const buildSearchUrl = (q: string) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (brand) sp.set('brand', brand)
    if (model) sp.set('model', model)
    if (year) sp.set('year', year)
    if (engine) sp.set('engine', engine)
    return `/search?${sp.toString()}`
  }

  const doSearch = (q?: string) => {
    const finalQ = (q ?? query).trim()
    navigate(buildSearchUrl(finalQ))
    setShowSugg(false)
  }

  const pickSuggestion = (s: string) => {
    setQuery(s)
    navigate(buildSearchUrl(s))
    setShowSugg(false)
  }

  const handleQuickTag = (tag: string) => {
    setQuery(tag)
    navigate(buildSearchUrl(tag))
  }

  const reset = () => {
    setBrand('')
    setModel('')
    setYear('')
    setEngine('')
    setQuery('')
    setShowSugg(false)
    setSuggestions([])
  }

  return (
    <section id="search" className="relative py-10 sm:py-16" ref={ref}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="reveal relative overflow-hidden rounded-[2.2rem] border-2 border-zinc-100 bg-white p-6 shadow-2xl shadow-brand-600/10 sm:p-10">
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-brand-600/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-brand-600/5 blur-3xl" aria-hidden />

          <div className="relative">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1 text-xs font-black text-brand-700">
                  <Sparkles className="h-3.5 w-3.5" /> نظام البحث الذكي
                </span>
                <h2 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl lg:text-4xl">
                  ابحث عن قطعة الغيار <span className="text-gradient-red">المتوافقة مع سيارتك</span>
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
                  اختر نوع السيارة وموديلها أو اكتب اسم القطعة (بالعربية أو الفرنسية) لمعرفة حالة التوفر فوراً.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-2.5 text-xs font-black text-brand-700 shadow-sm">
                <Car className="h-4 w-4" /> فحص التوافق والمخزون الفعلي
              </div>
            </div>

            {/* Main Part Search Bar with Autocomplete */}
            <div className="mt-7">
              <label className="mb-2 block font-cairo text-xs font-black text-zinc-700">
                اسم القطعة أو رقمها الأصلي (Part Number / Nom de pièce)
              </label>
              <div className="relative">
                <div className="flex overflow-hidden rounded-2xl border-2 border-zinc-200 bg-zinc-50/70 transition-all focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/10">
                  <input
                    ref={inputRef}
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
                    placeholder="مثال: Radiateur, Phare, Capot, Traverse, زجاج مصباح, مقبض باب..."
                    className="flex-1 bg-transparent px-5 py-4 font-cairo text-base font-bold text-zinc-900 outline-none placeholder:text-zinc-400"
                    aria-label="البحث عن قطعة الغيار"
                  />
                  <button
                    onClick={() => doSearch()}
                    className="flex items-center gap-2 bg-brand-600 px-5 text-white transition-all hover:bg-brand-700"
                    aria-label="تنفيذ البحث"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>

                {/* Autocomplete dropdown */}
                {showSugg && suggestions.length > 0 && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10">
                    <p className="border-b border-zinc-100 px-4 py-2 text-xs font-black text-zinc-400">
                      اقتراحات مطابقة:
                    </p>
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onMouseDown={() => pickSuggestion(s)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-right text-sm font-bold text-zinc-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick search suggestion tags */}
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-400">شائع:</span>
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleQuickTag(tag)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    query === tag
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Select Dropdowns */}
            <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Brand */}
              <div className="relative">
                <label className="mb-1.5 block font-cairo text-xs font-black text-zinc-700">1. نوع السيارة (Marque)</label>
                <div className="relative">
                  <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel('') }} className={selectCls} aria-label="نوع السيارة">
                    <option value="">جميع الماركات</option>
                    {Object.keys(CAR_BRANDS).map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
              </div>

              {/* Model */}
              <div className="relative">
                <label className="mb-1.5 block font-cairo text-xs font-black text-zinc-700">2. موديل السيارة (Modèle)</label>
                <div className="relative">
                  <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand} className={selectCls} aria-label="موديل السيارة">
                    <option value="">{brand ? 'جميع الموديلات' : 'اختر الماركة أولاً'}</option>
                    {models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
              </div>

              {/* Year */}
              <div className="relative">
                <label className="mb-1.5 block font-cairo text-xs font-black text-zinc-700">3. سنة الصنع (Année)</label>
                <div className="relative">
                  <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls} aria-label="سنة الصنع">
                    <option value="">اختياري (الكل)</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
              </div>

              {/* Engine */}
              <div className="relative">
                <label className="mb-1.5 block font-cairo text-xs font-black text-zinc-700">4. نوع المحرك (Motorisation)</label>
                <div className="relative">
                  <select value={engine} onChange={(e) => setEngine(e.target.value)} className={selectCls} aria-label="نوع المحرك">
                    <option value="">اختياري (الكل)</option>
                    {ENGINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                onClick={() => doSearch()}
                className="btn-shine group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-600 px-8 py-4 font-cairo text-sm font-black text-white shadow-xl shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 active:scale-95 sm:w-auto"
              >
                <Search className="h-5 w-5 transition-transform duration-300 group-hover:scale-125" />
                بحث وعرض النتائج
              </button>
              <button
                onClick={reset}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-zinc-200 bg-white px-6 py-4 font-cairo text-sm font-extrabold text-zinc-700 transition-all hover:border-zinc-900 hover:text-zinc-900 sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" /> إعادة تعيين
              </button>
            </div>

            {/* Live Count Preview */}
            {(query || brand) && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                  <Search className="h-4 w-4" />
                </div>
                <p className="font-cairo text-sm font-black text-brand-900">
                  {availableCount > 0
                    ? `${availableCount} قطعة متوفرة — اضغط "بحث وعرض النتائج" لعرضها`
                    : 'لا توجد قطع متوفرة بهذه المواصفات'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
