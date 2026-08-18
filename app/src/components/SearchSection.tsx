import { useMemo, useState } from 'react'
import { Car, Cog, Hash, RotateCcw, Search } from 'lucide-react'
import { CAR_BRANDS, ENGINE_TYPES, YEARS, PRODUCTS } from '@/data/products'
import { useShop } from '@/context/ShopContext'
import { useReveal } from '@/hooks/useReveal'

const selectCls =
  'w-full appearance-none rounded-xl border border-zinc-700/60 bg-zinc-800/80 px-4 py-3.5 pe-10 text-sm font-semibold text-white outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-600/40 hover:border-zinc-500'

export default function SearchSection() {
  const { setSearchFilter } = useShop()
  const ref = useReveal<HTMLDivElement>()
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [engine, setEngine] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  const models = useMemo(() => (brand ? CAR_BRANDS[brand] ?? [] : []), [brand])

  const doSearch = () => {
    if (!brand && !partNumber.trim()) {
      setResultMsg('اختر ماركة السيارة أو أدخل رقم القطعة للبحث')
      return
    }
    const filter = { brand, model, year, engine, partNumber: partNumber.trim() }
    setSearchFilter(filter)
    const pn = partNumber.trim().toLowerCase()
    const hits = PRODUCTS.filter(
      (p) =>
        (pn && p.partNumber.toLowerCase().includes(pn)) ||
        (brand && p.compat.some((c) => c.includes(brand)))
    ).length
    setResultMsg(hits > 0 ? `وجدنا ${hits} ${hits === 1 ? 'قطعة متوافقة' : 'قطع متوافقة'} مع طلبك` : 'لا توجد نتائج مطابقة حاليًا — تواصل معنا وسنوفرها لك')
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  const reset = () => {
    setBrand(''); setModel(''); setYear(''); setEngine(''); setPartNumber('')
    setSearchFilter(null)
    setResultMsg(null)
  }

  return (
    <section id="search" className="relative py-16" ref={ref}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="reveal relative overflow-hidden rounded-[2rem] bg-zinc-950 p-8 shadow-2xl shadow-zinc-900/30 sm:p-10">
          <div className="stripes absolute inset-0 opacity-60" aria-hidden />
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl" aria-hidden />
          <Cog className="animate-spin-slow pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 text-white/5" aria-hidden />

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-cairo text-2xl font-black text-white sm:text-3xl">
                  ابحث عن القطعة <span className="text-brand-500">المناسبة</span> لسيارتك
                </h2>
                <p className="mt-2 text-sm text-zinc-400">حدّد مواصفات سيارتك وسنعرض لك القطع المتوافقة فورًا</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-300 sm:flex">
                <Car className="h-4 w-4 text-brand-500" /> أكثر من 40 ماركة مدعومة
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel('') }} className={selectCls} aria-label="ماركة السيارة">
                  <option value="">ماركة السيارة</option>
                  {Object.keys(CAR_BRANDS).map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <Chevron />
              </div>
              <div className="relative">
                <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand} className={`${selectCls} disabled:cursor-not-allowed disabled:opacity-40`} aria-label="الموديل">
                  <option value="">الموديل</option>
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <Chevron />
              </div>
              <div className="relative">
                <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls} aria-label="سنة الصنع">
                  <option value="">سنة الصنع</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <Chevron />
              </div>
              <div className="relative">
                <select value={engine} onChange={(e) => setEngine(e.target.value)} className={selectCls} aria-label="نوع المحرك">
                  <option value="">نوع المحرك</option>
                  {ENGINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <Chevron />
              </div>
              <div className="relative">
                <input
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="رقم القطعة (Part Number)"
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/80 px-4 py-3.5 pe-10 text-sm font-semibold text-white placeholder-zinc-500 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-600/40"
                  aria-label="رقم القطعة"
                />
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={doSearch}
                className="btn-shine group inline-flex items-center gap-2.5 rounded-xl bg-brand-600 px-9 py-4 font-cairo font-extrabold text-white shadow-xl shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-500"
              >
                <Search className="h-5 w-5 transition-transform duration-300 group-hover:scale-125" />
                بحث عن القطعة
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-6 py-4 text-sm font-bold text-zinc-300 transition-all hover:border-zinc-500 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" /> إعادة تعيين
              </button>
              {resultMsg && (
                <p className="fade-in rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-brand-300 backdrop-blur">{resultMsg}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Chevron() {
  return (
    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
