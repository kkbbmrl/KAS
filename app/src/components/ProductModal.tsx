import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, MessageCircle, Minus, Plus, ShoppingCart, Star, X, XCircle } from 'lucide-react'
import { formatPrice, PRODUCTS, WHATSAPP_NUMBER } from '@/data/products'
import { useShop } from '@/context/ShopContext'

const VIEWS = ['الواجهة', 'منظر جانبي', 'لقطة مقرّبة'] as const

export default function ProductModal() {
  const { selected, setSelected, addToCart } = useShop()
  const [qty, setQtyLocal] = useState(1)
  const [view, setView] = useState(0)
  const [zooming, setZooming] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  const imgBox = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQtyLocal(1)
    setView(0)
  }, [selected])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSelected])

  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  if (!selected) return null
  const p = selected
  const similar = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4)
  const out = p.stock === 'غير متوفر'

  const onMove = (e: React.MouseEvent) => {
    const r = imgBox.current?.getBoundingClientRect()
    if (!r) return
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    setOrigin(`${x}% ${y}%`)
  }

  const waText = encodeURIComponent(`مرحبًا، أريد طلب: ${p.name} (${p.partNumber}) — الكمية: ${qty} — السعر: ${formatPrice(p.price * qty)}`)

  return (
    <div className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
      <div
        className="modal-in relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[1.8rem] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={p.name}
      >
        <button
          onClick={() => setSelected(null)}
          className="absolute left-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-600 transition-all hover:rotate-90 hover:bg-brand-600 hover:text-white"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-2">
          {/* gallery */}
          <div>
            <div
              ref={imgBox}
              onMouseMove={onMove}
              onMouseEnter={() => setZooming(true)}
              onMouseLeave={() => setZooming(false)}
              className="relative cursor-zoom-in overflow-hidden rounded-3xl border border-zinc-100 bg-gradient-to-br from-zinc-50 via-white to-brand-50/50"
            >
              <img
                src={p.image}
                alt={p.name}
                className="h-80 w-full object-contain p-8 transition-transform duration-300 sm:h-96"
                style={{
                  transformOrigin: origin,
                  transform: `${zooming ? 'scale(2)' : 'scale(1)'} ${p.flip ? 'scaleX(-1)' : ''} ${view === 2 ? 'scale(1.6)' : ''} ${view === 1 && !p.flip ? 'scaleX(-1)' : ''}`,
                }}
              />
              {p.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-lg">{p.badge}</span>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {VIEWS.map((v, i) => (
                <button
                  key={v}
                  onClick={() => setView(i)}
                  className={`overflow-hidden rounded-2xl border-2 bg-zinc-50 p-2 transition-all ${view === i ? 'border-brand-600 shadow-md shadow-brand-600/20' : 'border-zinc-100 hover:border-brand-200'}`}
                >
                  <img
                    src={p.image}
                    alt={`${p.name} — ${v}`}
                    className={`h-16 w-full object-contain ${i === 1 ? '-scale-x-100' : ''} ${i === 2 ? 'scale-150' : ''}`}
                  />
                  <span className="mt-1 block text-[10px] font-bold text-zinc-500">{v}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-zinc-400">مرّر الفأرة فوق الصورة للتكبير</p>
          </div>

          {/* details */}
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-zinc-900 px-3.5 py-1 text-xs font-bold text-white" dir="ltr">{p.brand}</span>
              <span className="text-xs font-bold text-zinc-400" dir="ltr">PN: {p.partNumber}</span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400" /> {p.rating}
              </span>
            </div>

            <h3 className="mt-3 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">{p.name}</h3>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <p className="font-cairo text-3xl font-black text-brand-600">{formatPrice(p.price)}</p>
              {p.oldPrice && <p className="pb-1 text-lg font-bold text-zinc-400 line-through">{formatPrice(p.oldPrice)}</p>}
              {p.oldPrice && (
                <span className="mb-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700">
                  وفّر {formatPrice(p.oldPrice - p.price)}
                </span>
              )}
            </div>

            <div className="mt-4">
              {out ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-bold text-zinc-500"><XCircle className="h-4 w-4" /> غير متوفر حاليًا</span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> {p.stock} — جاهز للتوصيل
                </span>
              )}
            </div>

            <p className="mt-5 leading-relaxed text-zinc-600">{p.description}</p>

            <div className="mt-5">
              <p className="text-sm font-extrabold text-zinc-800">السيارات المتوافقة:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.compat.map((c) => (
                  <span key={c} className="rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-bold text-zinc-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">{c}</span>
                ))}
              </div>
            </div>

            {/* qty + actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border-2 border-zinc-200">
                <button onClick={() => setQtyLocal((q) => Math.min(q + 1, 99))} className="grid h-11 w-11 place-items-center text-zinc-600 transition-colors hover:text-brand-600" aria-label="زيادة الكمية"><Plus className="h-4 w-4" /></button>
                <span className="w-10 text-center font-cairo text-lg font-black text-zinc-900">{qty}</span>
                <button onClick={() => setQtyLocal((q) => Math.max(q - 1, 1))} className="grid h-11 w-11 place-items-center text-zinc-600 transition-colors hover:text-brand-600" aria-label="تقليل الكمية"><Minus className="h-4 w-4" /></button>
              </div>
              <button
                onClick={() => addToCart(p, qty)}
                disabled={out}
                className="btn-shine flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-cairo font-extrabold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95 disabled:bg-zinc-300 disabled:shadow-none"
              >
                <ShoppingCart className="h-5 w-5" /> أضف إلى السلة
              </button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 font-cairo font-extrabold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600 active:scale-95"
              >
                <MessageCircle className="h-5 w-5" /> طلب عبر واتساب
              </a>
            </div>

            {/* specs */}
            <div className="mt-7 overflow-hidden rounded-2xl border border-zinc-100">
              <p className="border-b border-zinc-100 bg-zinc-50 px-5 py-3 font-cairo text-sm font-extrabold text-zinc-800">المواصفات التقنية</p>
              <dl>
                {p.specs.map((s, i) => (
                  <div key={s.label} className={`flex items-center justify-between px-5 py-2.5 text-sm ${i % 2 ? 'bg-zinc-50/60' : ''}`}>
                    <dt className="font-semibold text-zinc-500">{s.label}</dt>
                    <dd className="font-bold text-zinc-800">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* similar */}
        {similar.length > 0 && (
          <div className="border-t border-zinc-100 px-6 py-7 sm:px-9">
            <p className="font-cairo text-lg font-extrabold text-zinc-900">منتجات مشابهة</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {similar.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="group rounded-2xl border border-zinc-100 bg-white p-3 text-right transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
                >
                  <img src={s.image} alt={s.name} className={`h-20 w-full object-contain transition-transform duration-500 group-hover:scale-110 ${s.flip ? '-scale-x-100' : ''}`} />
                  <p className="mt-2 line-clamp-1 text-xs font-bold text-zinc-800">{s.name}</p>
                  <p className="mt-1 font-cairo text-sm font-black text-brand-600">{formatPrice(s.price)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
