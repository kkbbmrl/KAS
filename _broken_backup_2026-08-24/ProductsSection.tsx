import { ArrowLeft, ArrowRight, Eye, ShoppingCart, Star } from 'lucide-react'
import { useRef, useState } from 'react'
import { PRODUCTS, FEATURED, formatPrice } from '@/data/products'
import { useShop } from '@/context/ShopContext'

export default function ProductsSection() {
  const { setSelected, addToCart } = useShop()
  const [cat, setCat] = useState('الكل')
  const scrollRef = useRef<HTMLDivElement>(null)

  const cats = ['الكل', ...Array.from(new Set(PRODUCTS.map((p) => p.category)))]
  const filtered = cat === 'الكل' ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat)

  const scroll = (dir: number) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  return (
    <section id="products" className="relative bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-cairo text-sm font-black text-brand-600">المنتجات المتوفرة حاليًا</p>
            <h2 className="mt-1 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">قطع غيار أصلية ومضمونة</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)} className="grid h-10 w-10 place-items-center rounded-full border-2 border-zinc-200 text-zinc-600 transition-colors hover:border-brand-600 hover:text-brand-600">
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => scroll(1)} className="grid h-10 w-10 place-items-center rounded-full border-2 border-zinc-200 text-zinc-600 transition-colors hover:border-brand-600 hover:text-brand-600">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Featured */}
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FEATURED.map((item) => {
            const correspondingProduct = PRODUCTS.find((p) => p.id === item.id)
            if (!correspondingProduct) return null
            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <button
                  onClick={() => setSelected(correspondingProduct)}
                  className="relative block w-full cursor-pointer overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-red-50/30 p-3 text-center"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="mx-auto h-20 w-full object-contain transition-transform duration-500 group-hover:scale-110 sm:h-24"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/img/oil-filter.png' }}
                  />
                  {/* Always-visible overlay on mobile, hover on desktop */}
                  <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center bg-gradient-to-t from-zinc-950/70 to-transparent py-3 transition-transform duration-300 group-hover:translate-y-0 max-sm:translate-y-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 font-cairo text-[10px] font-black text-zinc-900 shadow-lg backdrop-blur-sm">
                      <Eye className="h-3 w-3" /> فحص ومواصفات القطعة
                    </span>
                  </span>
                </button>
                <div className="p-3 text-right">
                  <h3
                    onClick={() => setSelected(correspondingProduct)}
                    className="cursor-pointer font-cairo text-xs font-black text-zinc-900 transition-colors hover:text-brand-600"
                  >
                    {item.name}
                  </h3>
                  <p className="mt-1 font-cairo text-sm font-black text-brand-600">{formatPrice(correspondingProduct.price)}</p>
                  <button
                    onClick={() => addToCart(correspondingProduct)}
                    disabled={correspondingProduct.stock === 'غير متوفر'}
                    className="btn-shine mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2 font-cairo text-[10px] font-black text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-95 disabled:bg-zinc-300"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    {correspondingProduct.stock === 'غير متوفر' ? 'غير متوفر' : 'أضف إلى السلة'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-5 py-2 font-cairo text-xs font-black transition-all ${
                cat === c
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                  : 'border-2 border-zinc-200 text-zinc-600 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div ref={scrollRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <button
                onClick={() => setSelected(p)}
                className="relative block w-full cursor-pointer overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-red-50/30 p-4 text-center"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className={`mx-auto h-32 w-full object-contain transition-transform duration-500 group-hover:scale-110 sm:h-40 ${p.flip ? '-scale-x-100' : ''}`}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/img/oil-filter.png' }}
                />
                {p.badge && (
                  <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-2.5 py-0.5 font-cairo text-[10px] font-black text-white shadow-md">
                    {p.badge}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center bg-gradient-to-t from-zinc-950/70 to-transparent py-4 transition-transform duration-300 group-hover:translate-y-0 max-sm:translate-y-0">
                  <span className="rounded-full bg-white/95 px-4 py-1.5 font-cairo text-[10px] font-black text-zinc-900 shadow-lg backdrop-blur-sm">
                    عرض التفاصيل
                  </span>
                </span>
              </button>
              <div className="flex flex-1 flex-col p-4 text-right">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-zinc-950 px-2 py-0.5 font-cairo text-[10px] font-black text-white" dir="ltr">
                    {p.brand}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                      p.stock === 'متوفر'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.stock === 'كمية محدودة'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-zinc-100 text-zinc-400'
                    }`}
                  >
                    {p.stock}
                  </span>
                </div>
                <h3
                  onClick={() => setSelected(p)}
                  className="mt-2 cursor-pointer font-cairo text-sm font-black text-zinc-900 transition-colors hover:text-brand-600"
                >
                  {p.name}
                </h3>
                <p className="mt-1 text-xs font-bold text-zinc-400" dir="ltr">
                  {p.partNumber}
                </p>
                <div className="mt-auto pt-3">
                  <div className="flex items-baseline gap-2">
                    <p className="font-cairo text-base font-black text-brand-600">{formatPrice(p.price)}</p>
                    {p.oldPrice && (
                      <p className="text-xs font-bold text-zinc-400 line-through">{formatPrice(p.oldPrice)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    disabled={p.stock === 'غير متوفر'}
                    className="btn-shine mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-95 disabled:bg-zinc-300"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {p.stock === 'غير متوفر' ? 'غير متوفر' : 'أضف إلى السلة'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}