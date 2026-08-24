import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import { formatPrice, type Product, type ProductVariant } from '@/data/products'
import { fetchProducts } from '@/lib/api'
import { useShop } from '@/context/ShopContext'

const VIEWS = ['الواجهة', 'منظر جانبي', 'لقطة مقرّبة'] as const

export default function ProductModal() {
  const { selected, setSelected, addToCart, setCartOpen } = useShop()
  const [qty, setQtyLocal] = useState(1)
  const [view, setView] = useState(0)
  const [zooming, setZooming] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [variantOpen, setVariantOpen] = useState(false)
  const [similar, setSimilar] = useState<Product[]>([])
  const imgBox = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQtyLocal(1)
    setView(0)
    setSelectedVariant(null)
    setVariantOpen(false)
  }, [selected])

  // Related products come from the live catalogue (same category + complementary recommendations).
  useEffect(() => {
    if (!selected) {
      setSimilar([])
      return
    }
    const ac = new AbortController()
    fetchProducts({ cat: selected.category }, ac.signal)
      .then((list) => {
        const filtered = list.filter((x) => String(x.id) !== String(selected.id))
        if (filtered.length >= 4) {
          setSimilar(filtered.slice(0, 4))
        } else {
          // If category has few items, fetch all products to fill 4 recommendations
          fetchProducts({}, ac.signal)
            .then((allList) => {
              const extra = allList.filter((x) => String(x.id) !== String(selected.id) && !filtered.some((f) => String(f.id) === String(x.id)))
              setSimilar([...filtered, ...extra].slice(0, 4))
            })
            .catch(() => setSimilar(filtered.slice(0, 4)))
        }
      })
      .catch(() => setSimilar([]))
    return () => ac.abort()
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

  // Effective values — variant overrides base product
  const effectivePrice = selectedVariant?.price ?? p.price
  const effectiveOldPrice = selectedVariant?.oldPrice ?? p.oldPrice
  const effectiveStock = selectedVariant?.stock ?? p.stock
  const effectiveImage = selectedVariant?.image ?? p.image
  const effectivePartNumber = selectedVariant?.partNumber ?? p.partNumber
  const effectiveSpecs = [
    ...p.specs,
    ...(selectedVariant?.extraSpecs ?? []),
  ]

  const out = effectiveStock === 'غير متوفر'
  const hasVariants = (p.variants ?? []).length > 0

  const onMove = (e: React.MouseEvent) => {
    const r = imgBox.current?.getBoundingClientRect()
    if (!r) return
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    setOrigin(`${x}% ${y}%`)
  }

  const directOrder = () => {
    addToCart(p, qty, selectedVariant ?? undefined)
    setSelected(null)
    setCartOpen(true)
  }

  const stockBadgeClass =
    effectiveStock === 'متوفر'
      ? 'bg-emerald-50 text-emerald-700'
      : effectiveStock === 'كمية محدودة'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-zinc-100 text-zinc-500'

  return (
    <div
      className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-4 backdrop-blur-md"
      onClick={() => setSelected(null)}
    >
      <div
        className="modal-in relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border-2 border-zinc-100 bg-white shadow-2xl supports-[max-height:1dvh]:max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={p.name}
      >
        <button
          onClick={() => setSelected(null)}
          className="absolute left-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-600 transition-all hover:rotate-90 hover:bg-brand-600 hover:text-white"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-2">
          {/* Gallery side */}
          <div>
            <div
              ref={imgBox}
              onMouseMove={onMove}
              onMouseEnter={() => setZooming(true)}
              onMouseLeave={() => setZooming(false)}
              className="relative cursor-zoom-in overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-white to-red-50/40"
            >
              <img
                src={effectiveImage}
                alt={p.name}
                className="h-80 w-full object-contain p-8 transition-transform duration-300 sm:h-96"
                style={{
                  transformOrigin: origin,
                  transform: `${zooming ? 'scale(2)' : 'scale(1)'} ${p.flip ? 'scaleX(-1)' : ''} ${view === 2 ? 'scale(1.5)' : ''} ${view === 1 && !p.flip ? 'scaleX(-1)' : ''}`,
                }}
              />
              {p.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-brand-600 px-3.5 py-1.5 font-cairo text-xs font-black text-white shadow-lg shadow-brand-600/30">
                  {p.badge}
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {VIEWS.map((v, i) => (
                <button
                  key={v}
                  onClick={() => setView(i)}
                  className={`overflow-hidden rounded-2xl border-2 bg-zinc-50 p-2 transition-all ${
                    view === i ? 'border-brand-600 shadow-md shadow-brand-600/20' : 'border-zinc-200/80 hover:border-brand-200'
                  }`}
                >
                  <img
                    src={effectiveImage}
                    alt={`${p.name} — ${v}`}
                    className={`h-16 w-full object-contain ${i === 1 ? '-scale-x-100' : ''} ${i === 2 ? 'scale-150' : ''}`}
                  />
                  <span className="mt-1 block font-cairo text-[10px] font-bold text-zinc-600">{v}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs font-medium text-zinc-400">مرّر مؤشر الفأرة فوق الصورة للتكبير والتفاصيل الدقيقة</p>
          </div>

          {/* Details side */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-zinc-950 px-3 py-1 font-cairo text-xs font-black text-white" dir="ltr">
                {p.brand}
              </span>
              {p.nameFr && (
                <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700" dir="ltr">
                  {p.nameFr}
                </span>
              )}
              <span className="text-xs font-bold text-zinc-400" dir="ltr">
                PN: {effectivePartNumber}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400" /> {p.rating}
              </span>
            </div>

            <h3 className="mt-3 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
              {p.name}
            </h3>

            {/* ─── VARIANT SELECTOR ─── */}
            {hasVariants && (
              <div className="mt-5 rounded-2xl border-2 border-zinc-100 bg-zinc-50/50 p-4">
                <p className="mb-2 font-cairo text-xs font-black text-zinc-700 flex items-center gap-1.5">
                  <ChevronDown className="h-4 w-4 text-brand-600" />
                  اختر نوع المنتج المناسب لسيارتك:
                </p>

                {/* Trigger */}
                <button
                  onClick={() => setVariantOpen(!variantOpen)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-right transition-all ${
                    selectedVariant
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-brand-300'
                  }`}
                >
                  <span className="font-cairo text-sm font-bold">
                    {selectedVariant ? selectedVariant.label : '— اختر السيارة / الموديل —'}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${variantOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown options */}
                {variantOpen && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                    {/* Reset option */}
                    <button
                      onClick={() => { setSelectedVariant(null); setVariantOpen(false) }}
                      className="flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-2.5 text-right text-sm font-bold text-zinc-500 transition-colors hover:bg-zinc-50"
                    >
                      <XCircle className="h-4 w-4 text-zinc-400" />
                      الإعداد الافتراضي (عام)
                    </button>

                    {(p.variants ?? []).map((v) => {
                      const isOut = v.stock === 'غير متوفر'
                      const isSelected = selectedVariant?.id === v.id
                      return (
                        <button
                          key={v.id}
                          onClick={() => {
                            if (!isOut) { setSelectedVariant(v); setVariantOpen(false) }
                          }}
                          disabled={isOut}
                          className={`flex w-full items-center justify-between px-4 py-3 text-right transition-colors ${
                            isSelected
                              ? 'bg-brand-50 text-brand-800'
                              : isOut
                                ? 'cursor-not-allowed opacity-50'
                                : 'text-zinc-800 hover:bg-zinc-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />}
                            <div className="text-right">
                              <p className="font-cairo text-sm font-black">{v.label}</p>
                              {v.partNumber && (
                                <p className="text-[10px] font-bold text-zinc-400" dir="ltr">PN: {v.partNumber}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-0.5">
                            <span className="font-cairo text-sm font-black text-brand-600">
                              {formatPrice(v.price ?? p.price)}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                v.stock === 'متوفر'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : v.stock === 'كمية محدودة'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-zinc-100 text-zinc-400'
                              }`}
                            >
                              {v.stock}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {!selectedVariant && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    يُنصح باختيار سيارتك لضمان التوافق التام
                  </p>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <p className="font-cairo text-3xl font-black text-brand-600">{formatPrice(effectivePrice)}</p>
              {effectiveOldPrice && (
                <p className="text-lg font-bold text-zinc-400 line-through">{formatPrice(effectiveOldPrice)}</p>
              )}
              {effectiveOldPrice && (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
                  وفّر {formatPrice(effectiveOldPrice - effectivePrice)}
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="mt-4">
              {out ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-black text-zinc-500">
                  <XCircle className="h-4 w-4" /> غير متوفر حاليًا
                </span>
              ) : (
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black ${stockBadgeClass}`}>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                  <CheckCircle2 className="h-4 w-4" /> {effectiveStock} — جاهز للتوصيل الفوري
                </span>
              )}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-zinc-600">{p.description}</p>

            {/* Compatible Cars */}
            <div className="mt-5">
              <p className="font-cairo text-xs font-black text-zinc-800">السيارات المتوافقة:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(selectedVariant?.compat ?? p.compat ?? []).length > 0 ? (
                  (selectedVariant?.compat ?? p.compat ?? []).map((c) => (
                    <span
                      key={c}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1 font-cairo text-xs font-bold text-zinc-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1 font-cairo text-xs font-bold text-zinc-500">
                    متوافقة مع عدة طرازات (يرجى التحقق برقم القطعة أو الهيكل)
                  </span>
                )}
              </div>
            </div>

            {/* Quantity + Dual Action Buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center justify-between rounded-xl border-2 border-zinc-200 bg-zinc-50 px-2 py-1">
                <button
                  onClick={() => setQtyLocal((q) => Math.min(q + 1, 99))}
                  className="grid h-10 w-10 place-items-center text-zinc-700 transition-colors hover:text-brand-600"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-cairo text-lg font-black text-zinc-900">{qty}</span>
                <button
                  onClick={() => setQtyLocal((q) => Math.max(q - 1, 1))}
                  className="grid h-10 w-10 place-items-center text-zinc-700 transition-colors hover:text-brand-600"
                  aria-label="تقليل الكمية"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 gap-2.5">
                <button
                  onClick={() => addToCart(p, qty, selectedVariant ?? undefined)}
                  disabled={out}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand-600 bg-white py-3.5 font-cairo text-xs font-black text-brand-600 transition-all hover:bg-brand-50 active:scale-95 disabled:border-zinc-300 disabled:text-zinc-400"
                >
                  <ShoppingCart className="h-4 w-4" /> أضف إلى السلة
                </button>
                <button
                  onClick={directOrder}
                  disabled={out}
                  className="btn-shine flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-cairo text-xs font-black text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95 disabled:bg-zinc-300"
                >
                  <Zap className="h-4 w-4" /> طلب فوري
                </button>
              </div>
            </div>

            {/* Trust strip */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-50 p-3 text-xs font-bold text-zinc-600">
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-brand-600" /> توصيل 58 ولاية</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand-600" /> ضمان حقيقي واستبدال</span>
            </div>

            {/* Technical Specs */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
              <p className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 font-cairo text-xs font-black text-zinc-800">
                المواصفات والخصائص التقنية
              </p>
              <dl>
                {effectiveSpecs.map((s, i) => (
                  <div
                    key={s.label + i}
                    className={`flex items-center justify-between px-5 py-2.5 text-xs ${i % 2 ? 'bg-zinc-50/70' : 'bg-white'}`}
                  >
                    <dt className="font-semibold text-zinc-500">{s.label}</dt>
                    <dd className="font-bold text-zinc-800">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Similar items */}
        {similar.length > 0 && (
          <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-7 sm:px-10">
            <p className="font-cairo text-base font-black text-zinc-900">قطع غيار مشابهة وموصى بها</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {similar.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="group rounded-2xl border border-zinc-200 bg-white p-3 text-right transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
                >
                  <img
                    src={s.image}
                    alt={s.name}
                    className={`h-20 w-full object-contain transition-transform duration-500 group-hover:scale-110 ${s.flip ? '-scale-x-100' : ''}`}
                  />
                  <p className="mt-2 line-clamp-1 font-cairo text-xs font-bold text-zinc-800">{s.name}</p>
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
