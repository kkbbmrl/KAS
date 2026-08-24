import { useState, useMemo } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Lock,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Truck,
  User,
  MapPin,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { ALGERIA_WILAYAS } from '@/data/wilayas'
import { formatPrice } from '@/data/products'
import { submitOrder } from '@/lib/api'
import { trackConversionEvent, getAndPersistUTM, buildWhatsAppLink } from '@/lib/tracking'
import type { AdVariantChoice } from '@/data/adCampaigns'

interface Props {
  productId?: string | number
  productName: string
  partNumber: string
  brand: string
  basePrice: number
  oldPrice?: number
  variants?: AdVariantChoice[]
  campaignSlug?: string
  onOrderSuccess?: (orderId: string) => void
}

export default function QuickOrderForm({
  productId,
  productName,
  partNumber,
  brand,
  basePrice,
  oldPrice,
  variants,
  campaignSlug,
  onOrderSuccess,
}: Props) {
  const [selectedVariant, setSelectedVariant] = useState<AdVariantChoice | null>(() => {
    return variants && variants.length > 0 ? variants[0] : null
  })

  const unitPrice = selectedVariant ? selectedVariant.price : basePrice
  const unitOldPrice = selectedVariant ? selectedVariant.oldPrice || oldPrice : oldPrice

  const [qty, setQty] = useState(1)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedWilayaCode, setSelectedWilayaCode] = useState('16') // Default Alger
  const [commune, setCommune] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null)

  // Find wilaya shipping fee
  const selectedWilaya = useMemo(() => {
    return (
      ALGERIA_WILAYAS.find((w) => w.code === selectedWilayaCode) ||
      ALGERIA_WILAYAS[15] // 16 - Alger
    )
  }, [selectedWilayaCode])

  const shippingFee = selectedWilaya?.shippingFee ?? 500
  const subtotal = unitPrice * qty
  const total = subtotal + shippingFee

  const handleQtyChange = (delta: number) => {
    setQty((prev) => Math.max(1, Math.min(10, prev + delta)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    const cleanPhone = phone.replace(/\s+/g, '')
    if (!fullName.trim()) {
      setError('يرجى كتابة الاسم واللقب')
      return
    }
    if (!/^(0[5-7]\d{8}|\+?213[5-7]\d{8}|0[2-4]\d{7})$/.test(cleanPhone)) {
      setError('يرجى إدخال رقم هاتف جزائري صحيح (مثال: 0555123456)')
      return
    }
    if (!selectedWilayaCode) {
      setError('يرجى اختيار الولاية')
      return
    }

    setLoading(true)
    trackConversionEvent('begin_checkout', {
      productName,
      partNumber,
      price: unitPrice,
      value: total,
      campaign: campaignSlug,
    })

    const utms = getAndPersistUTM()
    const parts = fullName.trim().split(' ')
    const firstName = parts[0] || 'زبون'
    const lastName = parts.slice(1).join(' ') || 'الطلب السريع'

    const orderPayload = {
      source: 'landing_offer' as const,
      offerId: campaignSlug || 'ad-campaign',
      firstName,
      lastName,
      phone: cleanPhone,
      wilayaCode: selectedWilayaCode,
      commune: commune.trim() || selectedWilaya.nameAr,
      address: address.trim() || `${selectedWilaya.nameAr} — توصيل لباب المنزل`,
      notes: notes.trim()
        ? `${notes.trim()} | [حملة: ${campaignSlug || 'إعلان'}] ${utms.utmSource ? `[UTM: ${utms.utmSource}]` : ''}`
        : `[حملة: ${campaignSlug || 'إعلان'}] ${utms.utmSource ? `[UTM: ${utms.utmSource}]` : ''}`,
      items: [
        {
          productId: String(productId || ''),
          variantId: selectedVariant?.id,
          name: selectedVariant ? `${productName} (${selectedVariant.label})` : productName,
          partNumber: selectedVariant?.partNumber || partNumber,
          price: unitPrice,
          qty,
        },
      ],
    }

    try {
      const res = await submitOrder(orderPayload)
      // Server reference only — a missing one means the order did not land.
      if (!res?.orderReference) {
        throw new Error('لم يتم تأكيد الطلب من الخادم. يرجى المحاولة مرة أخرى.')
      }
      const finalId = res.orderReference
      setSuccessOrderId(finalId)

      trackConversionEvent('order_placed', {
        orderId: finalId,
        productName,
        partNumber,
        price: unitPrice,
        value: total,
        campaign: campaignSlug,
      })

      if (onOrderSuccess) {
        onOrderSuccess(finalId)
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى أو الطلب عبر واتساب')
    } finally {
      setLoading(false)
    }
  }

  const successWhatsAppLink = useMemo(() => {
    if (!successOrderId) return '#'
    return buildWhatsAppLink({
      productName,
      partNumber: selectedVariant?.partNumber || partNumber,
      brand,
      price: total,
      carDetails: `رقم طلبي هو: ${successOrderId} بولاية ${selectedWilaya.nameAr}`,
    })
  }, [successOrderId, productName, selectedVariant, partNumber, brand, total, selectedWilaya])

  // If order is placed successfully, render confirmation screen
  if (successOrderId) {
    return (
      <div
        id="order-form"
        className="rounded-3xl border-2 border-emerald-500 bg-white p-6 sm:p-8 shadow-2xl text-center space-y-6 scroll-mt-24"
        dir="rtl"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div>
          <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 mb-2 border border-emerald-200">
            تم استلام طلبك بنجاح ✓
          </span>
          <h3 className="font-cairo text-2xl font-black text-zinc-900">
            شكراً لك، {fullName.split(' ')[0]}!
          </h3>
          <p className="mt-1 text-xs font-bold text-zinc-600">
            رقم الطلب الخاص بك:{' '}
            <span className="font-black text-brand-600 tracking-wider text-sm font-cairo">
              {successOrderId}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-right space-y-2 text-xs font-bold text-zinc-700">
          <div className="flex justify-between border-b border-zinc-200/80 pb-2">
            <span className="text-zinc-500">المنتج:</span>
            <span className="font-black text-zinc-900">{productName}</span>
          </div>
          {selectedVariant && (
            <div className="flex justify-between border-b border-zinc-200/80 pb-2">
              <span className="text-zinc-500">النوع:</span>
              <span className="font-black text-zinc-900">{selectedVariant.label}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-zinc-200/80 pb-2">
            <span className="text-zinc-500">الكمية:</span>
            <span>{qty} قطعة</span>
          </div>
          <div className="flex justify-between border-b border-zinc-200/80 pb-2">
            <span className="text-zinc-500">عنوان التوصيل:</span>
            <span>{selectedWilaya.nameAr} {commune ? `— ${commune}` : ''}</span>
          </div>
          <div className="flex justify-between pt-1 font-cairo font-black text-sm text-zinc-900">
            <span>المبلغ الإجمالي عند الاستلام:</span>
            <span className="text-brand-600">{formatPrice(total)}</span>
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-900 text-right space-y-1">
          <p className="font-black flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-blue-600 shrink-0" />
            ما هي الخطوة التالية؟
          </p>
          <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
            سيتصل بك فريق خدمة عملاء KAS هاتفياً خلال ساعات لتأكيد التوافق وموعد وصول مندوب التوصيل لباب منزلك.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href={successWhatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackConversionEvent('whatsapp_click', { campaign: campaignSlug, orderId: successOrderId })}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 font-cairo text-xs font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            <span>تأكيد الطلب الفوري عبر واتساب</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      id="order-form"
      className="relative overflow-hidden rounded-3xl border-2 border-brand-600 bg-white p-5 sm:p-7 shadow-2xl scroll-mt-24"
      dir="rtl"
    >
      {/* Header Banner */}
      <div className="mb-5 border-b border-zinc-100 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-cairo text-lg font-black text-zinc-900">
                استمارة الطلب السريع (الدفع عند الاستلام)
              </h3>
              <p className="text-[11px] font-bold text-zinc-500">
                املأ معلوماتك وسنتصل بك لتأكيد طلبك وتوصيله لباب منزلك
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            دفع آمن عند الباب
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Variants Selector (if available) */}
        {variants && variants.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-xs font-black text-zinc-700 block">
              اختر النوع / المقاس المطلوب:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {variants.map((v) => (
                <label
                  key={v.id}
                  className={`flex items-center justify-between rounded-xl border-2 p-3 cursor-pointer transition-all ${
                    selectedVariant?.id === v.id
                      ? 'border-brand-600 bg-brand-50/50 shadow-sm'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="variant"
                      checked={selectedVariant?.id === v.id}
                      onChange={() => setSelectedVariant(v)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    <span className="font-cairo text-xs font-black text-zinc-900">
                      {v.label}
                    </span>
                  </div>
                  <span className="font-cairo text-xs font-black text-brand-600">
                    {formatPrice(v.price)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="text-xs font-black text-zinc-700 block mb-1">
            الاسم واللقب *
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: كريم بلخيري"
              className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50/60 px-4 py-3 pe-4 ps-10 font-cairo text-xs font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-600/10"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-black text-zinc-700 block mb-1">
            رقم الهاتف (للتأكيد والشحن) *
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05 / 06 / 07 XX XX XX XX"
              className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50/60 px-4 py-3 pe-4 ps-10 font-cairo text-xs font-black text-zinc-900 outline-none transition-all placeholder:font-normal placeholder:text-zinc-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-600/10"
              dir="ltr"
            />
          </div>
        </div>

        {/* Wilaya & Commune */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-black text-zinc-700 block mb-1">
              الولاية (58 ولاية) *
            </label>
            <div className="relative">
              <select
                value={selectedWilayaCode}
                onChange={(e) => setSelectedWilayaCode(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-zinc-200 bg-zinc-50/60 px-4 py-3 pe-8 font-cairo text-xs font-bold text-zinc-900 outline-none transition-all focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-600/10"
              >
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {w.nameAr} ({w.nameFr})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-zinc-700 block mb-1">
              البلدية / الدائرة (اختياري)
            </label>
            <input
              type="text"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              placeholder="مثال: الدار البيضاء، بئر مراد رايس..."
              className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50/60 px-4 py-3 font-cairo text-xs font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-600/10"
            />
          </div>
        </div>

        {/* Address Details */}
        <div>
          <label className="text-xs font-black text-zinc-700 block mb-1">
            عنوان التوصيل الدقيق أو الحي (اختياري)
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="الشارع، رقم العمارة، أو نقطة استدلال..."
              className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50/60 px-4 py-3 pe-4 ps-10 font-cairo text-xs font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-600/10"
            />
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="text-xs font-black text-zinc-700 block mb-1">
            ملاحظات إضافية أو تفاصيل السيارة (اختياري)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: بيجو 208 محرك 1.6 HDI سنة 2015..."
            className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50/60 px-4 py-3 font-cairo text-xs font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-600/10"
          />
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div>
            <span className="font-cairo text-xs font-black text-zinc-900 block">
              الكمية المطلوبة:
            </span>
            <span className="text-[10px] text-zinc-500 font-bold">
              سعر القطعة: {formatPrice(unitPrice)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleQtyChange(-1)}
              disabled={qty <= 1}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-zinc-300 text-zinc-700 shadow-sm hover:border-brand-500 hover:text-brand-600 disabled:opacity-40 transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-cairo font-black text-base text-zinc-900 min-w-[20px] text-center">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(1)}
              disabled={qty >= 10}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-zinc-300 text-zinc-700 shadow-sm hover:border-brand-500 hover:text-brand-600 disabled:opacity-40 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-2 text-xs font-bold">
          <div className="flex justify-between text-zinc-600">
            <span>سعر المنتجات ({qty} قطع):</span>
            <span className="text-zinc-900">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>تكلفة التوصيل ({selectedWilaya.nameAr}):</span>
            <span className="text-zinc-900">{formatPrice(shippingFee)}</span>
          </div>
          <div className="border-t border-zinc-200 pt-2 flex items-center justify-between font-cairo">
            <div>
              <span className="font-black text-zinc-900 text-sm block">المجموع الإجمالي:</span>
              <span className="text-[10px] text-emerald-600 font-bold">الدفع عند استلام الطرد وفحصه</span>
            </div>
            <div className="text-left">
              {unitOldPrice && (
                <span className="text-xs text-zinc-400 line-through block" dir="ltr">
                  {formatPrice((unitOldPrice * qty) + shippingFee)}
                </span>
              )}
              <span className="text-xl font-black text-brand-600 block">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit CTA Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-brand-600 py-4 font-cairo text-base font-black text-white shadow-xl shadow-brand-600/40 hover:bg-brand-700 active:scale-[0.99] disabled:opacity-60 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>جاري تسجيل وتأكيد طلبك...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span>تأكيد الطلب الآن — الدفع عند الاستلام ({formatPrice(total)})</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-zinc-400 pt-1">
          <span className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-zinc-400" />
            معلوماتك مشفرة ومحمية
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Truck className="h-3.5 w-3.5 text-zinc-400" />
            توصيل سريع لباب المنزل
          </span>
        </div>
      </form>
    </div>
  )
}
