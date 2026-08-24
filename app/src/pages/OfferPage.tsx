import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Frown,
  Home,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  Truck,
  User,
  Zap,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatPrice } from '@/data/products'
import { ALGERIA_WILAYAS } from '@/data/wilayas'
import type { OfferProduct } from '@/data/offers'
import Logo from '@/components/Logo'
import { fetchOfferBySlug, fetchOffers, submitOrder } from '@/lib/api'

interface OrderForm {
  firstName: string
  lastName: string
  phone: string
  wilaya: string
  commune: string
  qty: number
  note: string
}

const emptyForm: OrderForm = {
  firstName: '',
  lastName: '',
  phone: '',
  wilaya: '',
  commune: '',
  qty: 1,
  note: '',
}

const fieldCls =
  'w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3.5 font-cairo text-sm font-bold text-zinc-900 outline-none transition-all placeholder:font-normal placeholder:text-zinc-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10'

function getIcon(name: string): LucideIcon {
  return (LucideIcons as unknown as Record<string, LucideIcon>)[name] ?? CheckCircle2
}

export default function OfferPage() {
  const { slug } = useParams<{ slug: string }>()

  const [offer, setOffer] = useState<OfferProduct | null>(null)
  const [offerLoading, setOfferLoading] = useState(true)
  const [otherOffers, setOtherOffers] = useState<OfferProduct[]>([])

  const [form, setForm] = useState<OrderForm>(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState('')

  // Offer comes from the owner's database, never a bundled sample.
  useEffect(() => {
    if (!slug) {
      setOfferLoading(false)
      return
    }
    const ac = new AbortController()
    setOfferLoading(true)
    fetchOfferBySlug(slug, ac.signal)
      .then((o) => {
        setOffer(o)
        setOfferLoading(false)
      })
      .catch(() => {
        setOffer(null)
        setOfferLoading(false)
        // Only for the "not found" screen — suggest other live offers.
        fetchOffers(ac.signal)
          .then((list) => setOtherOffers(list.filter((o) => o.slug !== slug).slice(0, 6)))
          .catch(() => setOtherOffers([]))
      })
    return () => ac.abort()
  }, [slug])

  if (offerLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50" dir="rtl">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 text-center font-tajawal" dir="rtl">
        <Frown className="h-16 w-16 text-zinc-300" />
        <h1 className="font-cairo text-2xl font-black text-zinc-900">العرض غير موجود</h1>
        <p className="text-zinc-500">الرابط الذي تبحث عنه غير متوفر أو انتهت صلاحيته.</p>
        {otherOffers.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {otherOffers.map((o) => (
              <Link key={o.slug} to={`/offer/${o.slug}`} className="rounded-xl border-2 border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition-colors hover:border-brand-400 hover:text-brand-700">
                {o.nameFr || o.title}
              </Link>
            ))}
          </div>
        )}
        <Link to="/" className="mt-2 flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-cairo font-black text-white transition-colors hover:bg-brand-700">
          <Home className="h-4 w-4" /> العودة للرئيسية
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!form.wilaya) { setError('يرجى اختيار الولاية'); return }
    if (form.phone.replace(/\s/g, '').length < 9) { setError('رقم الهاتف غير صحيح'); return }
    setError('')
    setLoading(true)

    const selectedWilaya = ALGERIA_WILAYAS.find(
      (w) => `${w.code} - ${w.nameAr}` === form.wilaya || w.nameAr === form.wilaya
    )

    try {
      const apiRes = await submitOrder({
        source: 'landing_offer',
        offerId: offer.id,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        wilayaCode: selectedWilaya?.code,
        commune: form.commune || selectedWilaya?.nameAr || form.wilaya,
        address: form.commune ? `${form.commune} — ${form.wilaya}` : form.wilaya,
        notes: form.note,
        items: [
          {
            productId: String(offer.productId),
            name: offer.title,
            partNumber: offer.partNumber,
            price: offer.price,
            qty: form.qty,
          },
        ],
      })

      // Always the server's reference — never a locally invented one.
      setOrderId(apiRes.orderReference)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      // Form stays filled so the customer can retry.
      setError(err instanceof Error ? err.message : 'تعذر إرسال الطلب. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const out = offer.stock === 'غير متوفر'

  return (
    <div className="min-h-screen bg-white font-tajawal text-zinc-900" dir="rtl">

      {/* ─── Minimal header ─── */}
      <header className="border-b border-zinc-100 bg-white/95 py-3 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
          <Link to="/" aria-label="الرئيسية">
            <Logo />
          </Link>
          <a
            href="tel:+213555123456"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 font-cairo text-sm font-black text-white shadow-md shadow-brand-600/25 hover:bg-brand-700 transition-colors"
          >
            <Phone className="h-4 w-4" />
            اتصل الآن
          </a>
        </div>
      </header>

      {/* ─── Success screen ─── */}
      {submitted ? (
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-emerald-50 shadow-inner">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          </div>
          <h2 className="font-cairo text-3xl font-black text-zinc-900">تم استلام طلبك!</h2>
          <div className="mt-4 max-w-md rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 p-5">
            <p className="font-cairo text-base font-black leading-relaxed text-emerald-900">
              «تم استلام طلبك بنجاح، وسيتواصل معك فريقنا في أقرب وقت لتأكيد الطلب.»
            </p>
          </div>
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-5 text-right w-full max-w-sm">
            <p className="text-xs font-black text-zinc-500 mb-3">تفاصيل الطلب</p>
            <div className="space-y-2 text-sm font-bold text-zinc-800">
              <p><span className="text-zinc-400">رقم الطلب: </span><span className="font-cairo text-brand-600" dir="ltr">{orderId}</span></p>
              <p><span className="text-zinc-400">المنتج: </span>{offer.title} — {offer.nameFr}</p>
              <p><span className="text-zinc-400">الاسم: </span>{form.firstName} {form.lastName}</p>
              <p><span className="text-zinc-400">الهاتف: </span><span dir="ltr">{form.phone}</span></p>
              <p><span className="text-zinc-400">الولاية: </span>{form.wilaya}</p>
              <p><span className="text-zinc-400">الكمية: </span>{form.qty}</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-zinc-500">
            <Truck className="h-4 w-4 text-brand-600" />
            الدفع نقداً عند استلام وفحص الطرد
          </div>
          <Link to="/" className="mt-8 flex items-center gap-2 rounded-xl border-2 border-zinc-200 px-6 py-3 font-cairo font-black text-zinc-700 hover:border-zinc-900 transition-colors">
            <Home className="h-4 w-4" /> العودة للمتجر
          </Link>
        </div>
      ) : (
        <main>
          {/* ─── Hero section ─── */}
          <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950 py-14 sm:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(225,6,0,0.3),transparent)]" />
            <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 lg:grid-cols-2">

              {/* Left: image */}
              <div className="flex items-center justify-center order-2 lg:order-1">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[2rem] bg-brand-600/20 blur-3xl" />
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="relative z-10 h-72 w-full max-w-sm object-contain drop-shadow-2xl sm:h-80"
                  />
                </div>
              </div>

              {/* Right: info */}
              <div className="order-1 lg:order-2 text-right">
                {offer.badge && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-brand-600/30">
                    <Star className="h-3.5 w-3.5 fill-white" />
                    {offer.badge}
                  </span>
                )}

                <h1 className="mt-4 font-cairo text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                  {offer.title}
                </h1>
                <p className="mt-2 font-cairo text-lg font-bold text-red-300" dir="ltr">
                  {offer.nameFr}
                </p>
                <p className="mt-3 text-base font-bold text-zinc-300">
                  {offer.subtitle}
                </p>

                {/* Price */}
                <div className="mt-5 flex flex-wrap items-baseline gap-3">
                  <span className="font-cairo text-4xl font-black text-white">{formatPrice(offer.price)}</span>
                  {offer.oldPrice && (
                    <>
                      <span className="text-xl font-bold text-zinc-500 line-through">{formatPrice(offer.oldPrice)}</span>
                      <span className="rounded-full bg-brand-600 px-3 py-1 text-sm font-black text-white">
                        وفّر {formatPrice(offer.oldPrice - offer.price)}
                      </span>
                    </>
                  )}
                </div>

                {/* Stock */}
                <div className="mt-4">
                  {out ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-zinc-700 px-4 py-2 text-sm font-black text-zinc-300">
                      غير متوفر حالياً
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-900/60 px-4 py-2 text-sm font-black text-emerald-300">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                      {offer.stock} — جاهز للشحن الفوري
                    </span>
                  )}
                </div>

                {offer.urgencyText && (
                  <p className="mt-4 flex items-center gap-2 text-sm font-black text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    {offer.urgencyText}
                  </p>
                )}

                {/* Features */}
                <ul className="mt-6 space-y-2.5">
                  {offer.features.map((f) => {
                    const Icon = getIcon(f.icon)
                    return (
                      <li key={f.text} className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600/20">
                          <Icon className="h-4 w-4 text-brand-400" />
                        </span>
                        <span className="text-sm font-bold text-zinc-300">{f.text}</span>
                      </li>
                    )
                  })}
                </ul>

                <a
                  href="#order-form"
                  className="btn-shine mt-8 inline-flex items-center gap-3 rounded-2xl bg-brand-600 px-8 py-4 font-cairo text-base font-black text-white shadow-xl shadow-brand-600/40 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  <Zap className="h-5 w-5" />
                  اطلب الآن — دفع عند الاستلام
                </a>
              </div>
            </div>
          </section>

          {/* ─── Compat strip ─── */}
          <div className="border-y border-zinc-100 bg-zinc-50 py-4">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 px-4 text-sm font-bold text-zinc-600">
              <Car className="h-5 w-5 text-brand-600" aria-hidden />
              <span className="font-black text-zinc-800">متوافق مع:</span>
              <span>{offer.compat}</span>
            </div>
          </div>

          {/* ─── Trust bar ─── */}
          <div className="bg-white py-6">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 sm:grid-cols-4">
              {[
                { icon: Truck, text: 'توصيل لـ 58 ولاية', sub: 'خلال 24-48 ساعة' },
                { icon: ShieldCheck, text: 'ضمان أصلي', sub: 'استبدال مضمون' },
                { icon: Star, text: 'قطع معتمدة', sub: 'VALEO • BOSCH • HELLA' },
                { icon: CheckCircle2, text: 'دفع عند الاستلام', sub: 'بدون دفع مسبق' },
              ].map(({ icon: Icon, text, sub }) => (
                <div key={text} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600/10">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-cairo text-sm font-black text-zinc-900">{text}</p>
                    <p className="text-xs font-bold text-zinc-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Order Form ─── */}
          <section id="order-form" className="bg-zinc-50 py-14">
            <div className="mx-auto max-w-xl px-4">
              <div className="mb-8 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-black text-brand-700">
                  <Zap className="h-3.5 w-3.5" /> اطلب الآن
                </span>
                <h2 className="mt-3 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
                  أكمل طلبك في ثوانٍ
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  أدخل بياناتك وسيتواصل معك فريقنا لتأكيد الطلب والتوصيل
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="overflow-hidden rounded-[2rem] border-2 border-zinc-100 bg-white shadow-2xl shadow-zinc-900/5"
              >
                {/* Product preview at top of form */}
                <div className="flex items-center gap-4 border-b border-zinc-100 bg-zinc-50/70 px-6 py-4">
                  <img src={offer.image} alt={offer.title} className="h-16 w-16 object-contain" />
                  <div>
                    <p className="font-cairo text-sm font-black text-zinc-900">{offer.title}</p>
                    <p className="text-xs font-bold text-zinc-500" dir="ltr">{offer.nameFr} — {offer.brand}</p>
                    <p className="mt-1 font-cairo text-base font-black text-brand-600">{formatPrice(offer.price)}</p>
                  </div>
                </div>

                <div className="space-y-4 p-6 sm:p-8">
                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        required
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        placeholder="الاسم"
                        className={`${fieldCls} ps-11`}
                        aria-label="الاسم"
                      />
                    </div>
                    <div className="relative">
                      <User className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        required
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        placeholder="اللقب"
                        className={`${fieldCls} ps-11`}
                        aria-label="اللقب"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <Phone className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="رقم الهاتف (0555 12 34 56)"
                      className={`${fieldCls} ps-11`}
                      dir="ltr"
                      inputMode="tel"
                      aria-label="رقم الهاتف"
                    />
                  </div>

                  {/* Wilaya */}
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <select
                      required
                      value={form.wilaya}
                      onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
                      className={`${fieldCls} cursor-pointer appearance-none ps-11`}
                      aria-label="الولاية"
                    >
                      <option value="">-- اختر ولايتك (58 ولاية) --</option>
                      {ALGERIA_WILAYAS.map((w) => (
                        <option key={w.code} value={`${w.code} - ${w.nameAr}`}>
                          {w.code} - {w.nameAr} ({w.nameFr}) — {w.deliveryTime}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  </div>

                  {/* Commune */}
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      value={form.commune}
                      onChange={(e) => setForm({ ...form, commune: e.target.value })}
                      placeholder="البلدية / الحي (اختياري)"
                      className={`${fieldCls} ps-11`}
                      aria-label="البلدية"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="mb-2 block text-xs font-black text-zinc-700">الكمية المطلوبة</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center rounded-xl border-2 border-zinc-200 bg-zinc-50">
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, qty: Math.max(1, f.qty - 1) }))}
                          className="grid h-11 w-11 place-items-center text-zinc-700 hover:text-brand-600 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center font-cairo text-lg font-black text-zinc-900">{form.qty}</span>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, qty: Math.min(10, f.qty + 1) }))}
                          className="grid h-11 w-11 place-items-center text-zinc-700 hover:text-brand-600 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm font-black text-brand-600">
                        المجموع: {formatPrice(offer.price * form.qty)}
                      </p>
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="ملاحظة اختيارية (موديل السيارة، السنة، ...)"
                      rows={2}
                      className={`${fieldCls} resize-none`}
                      aria-label="ملاحظة"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || out}
                    className="btn-shine w-full rounded-2xl bg-brand-600 py-4 font-cairo text-base font-black text-white shadow-xl shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95 disabled:bg-zinc-300 disabled:shadow-none flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> جاري إرسال الطلب...</>
                    ) : (
                      <><Zap className="h-5 w-5" /> تأكيد الطلب — دفع عند الاستلام</>
                    )}
                  </button>

                  {offer.deliveryNote && (
                    <p className="text-center text-xs font-bold text-zinc-500 flex items-center justify-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-brand-600" />
                      {offer.deliveryNote}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

// Car icon inline (not in Lucide)
function Car({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14l4 4v4a2 2 0 0 1-2 2h-2" />
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    </svg>
  )
}
