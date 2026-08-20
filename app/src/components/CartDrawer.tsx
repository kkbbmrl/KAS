import { useState } from 'react'
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react'
import { formatPrice } from '@/data/products'
import { useShop, type CheckoutDetails } from '@/context/ShopContext'

const emptyForm: CheckoutDetails = { firstName: '', lastName: '', phone: '', address: '', city: '' }

const fieldCls =
  'w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3.5 pe-4 ps-11 font-cairo text-sm font-bold text-zinc-900 outline-none transition-all placeholder:font-medium placeholder:text-zinc-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10'

export default function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    setQty,
    removeFromCart,
    total,
    placeOrder,
    orderSuccess,
    lastOrder,
    dismissOrderSuccess,
  } = useShop()

  const [checkout, setCheckout] = useState(false)
  const [form, setForm] = useState<CheckoutDetails>(emptyForm)
  const [error, setError] = useState('')

  if (!cartOpen) return null

  const close = () => {
    setCartOpen(false)
    setCheckout(false)
    setError('')
    dismissOrderSuccess()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim()
    ) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    const cleanPhone = form.phone.replace(/\s+/g, '')
    if (!/^(0[5-7]\d{8}|\+?213[5-7]\d{8}|0[2-4]\d{7})$/.test(cleanPhone)) {
      setError('يرجى إدخال رقم هاتف صحيح (مثال: 0555 12 34 56)')
      return
    }

    placeOrder(form)
    setForm(emptyForm)
    setCheckout(false)
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="fade-in absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" onClick={close} />
      <aside
        className="drawer-in absolute inset-y-0 left-0 flex w-full max-w-lg flex-col bg-white shadow-2xl"
        role="dialog"
        aria-label="سلة التسوق وإتمام الطلب"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
          <h3 className="flex items-center gap-3 font-cairo text-xl font-black text-zinc-900">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm">
              <ShoppingBag className="h-5 w-5" />
            </span>
            {orderSuccess ? 'تم تأكيد طلبك' : checkout ? 'بيانات تأكيد الطلب والتوصيل' : 'سلة التسوق'}
          </h3>
          <button
            onClick={close}
            className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-600 transition-all hover:rotate-90 hover:bg-brand-600 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. ORDER SUCCESS SCREEN */}
        {orderSuccess ? (
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8 text-center sm:px-8">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <h4 className="mt-5 font-cairo text-2xl font-black text-zinc-900">
              طلبك قيد المتابعة والتجهيز
            </h4>

            {/* Exact Required Confirmation Message */}
            <div className="mt-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 p-5 text-emerald-950 shadow-sm">
              <p className="font-cairo text-base font-black leading-relaxed">
                «تم استلام طلبك بنجاح، وسيتواصل معك فريقنا في أقرب وقت لتأكيد الطلب.»
              </p>
            </div>

            {/* Order Details Receipt Box */}
            {lastOrder && (
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 text-right">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <span className="font-cairo text-xs font-black text-zinc-500">رقم الطلب:</span>
                  <span className="rounded-lg bg-zinc-900 px-3 py-1 font-cairo text-xs font-black text-white" dir="ltr">
                    {lastOrder.orderId}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <p className="font-bold text-zinc-700">
                    <span className="text-zinc-400">الاسم واللقب:</span> {lastOrder.firstName} {lastOrder.lastName}
                  </p>
                  <p className="font-bold text-zinc-700" dir="ltr">
                    <span className="text-zinc-400">الهاتف:</span> {lastOrder.phone}
                  </p>
                  <p className="font-bold text-zinc-700">
                    <span className="text-zinc-400">العنوان:</span> {lastOrder.address} — {lastOrder.city}
                  </p>
                </div>

                <div className="mt-4 border-t border-zinc-200 pt-3">
                  <p className="font-cairo text-xs font-black text-zinc-500">القطع المطلوبة:</p>
                  <ul className="mt-2 space-y-1 text-xs font-bold text-zinc-800">
                    {lastOrder.items.map((it) => (
                      <li key={it.id} className="flex justify-between">
                        <span>{it.name} (×{it.qty})</span>
                        <span className="text-brand-600">{formatPrice(it.price * it.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex justify-between border-t border-dashed border-zinc-300 pt-2 font-cairo text-sm font-black text-zinc-900">
                    <span>المجموع الإجمالي:</span>
                    <span className="text-brand-600">{formatPrice(lastOrder.total)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500">
              <Truck className="h-4 w-4 text-brand-600" /> الدفع نقداً عند استلام وفحص الطرد
            </div>

            <button
              onClick={close}
              className="btn-shine mt-6 rounded-2xl bg-brand-600 py-3.5 font-cairo text-sm font-black text-white shadow-xl shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95"
            >
              العودة إلى المتجر
            </button>
          </div>
        ) : checkout ? (
          /* 2. NATIVE CHECKOUT FORM */
          <form onSubmit={submit} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-xs">
                <p className="font-cairo font-black text-brand-800">تأكيد طلب الشراء والدفع عند الاستلام</p>
                <p className="mt-1 text-brand-900/70">
                  يرجى ملء بيانات التوصيل بدقة ليتسنى لفريقنا الاتصال بك وتأكيد إرسال الطلبية.
                </p>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="الاسم"
                    className={fieldCls}
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
                    className={fieldCls}
                    aria-label="اللقب"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="relative">
                <Phone className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="رقم الهاتف (مثال: 0555 12 34 56)"
                  className={fieldCls}
                  dir="ltr"
                  inputMode="tel"
                  aria-label="رقم الهاتف"
                />
              </div>

              {/* Address */}
              <div className="relative">
                <MapPin className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="العنوان السكني أو موقع العمل"
                  className={fieldCls}
                  aria-label="العنوان"
                />
              </div>

              {/* City */}
              <div className="relative">
                <Building className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="المدينة / الولاية"
                  className={fieldCls}
                  aria-label="المدينة"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 font-cairo text-xs font-black text-brand-700">
                  {error}
                </div>
              )}

              {/* Order quick summary */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between text-xs font-extrabold text-zinc-600">
                  <span>عدد القطع في السلة:</span>
                  <span className="font-black text-zinc-900">{cart.reduce((s, i) => s + i.qty, 0)} قطعة</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-2 font-cairo text-base font-black">
                  <span className="text-zinc-800">المجموع الواجب دفعه:</span>
                  <span className="text-brand-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-5">
              <button
                type="button"
                onClick={() => setCheckout(false)}
                className="rounded-2xl border-2 border-zinc-200 py-3.5 font-cairo text-xs font-black text-zinc-700 transition-all hover:border-zinc-900 hover:text-zinc-900"
              >
                العودة للسلة
              </button>
              <button
                type="submit"
                className="btn-shine rounded-2xl bg-brand-600 py-3.5 font-cairo text-xs font-black text-white shadow-xl shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95"
              >
                تأكيد وإرسال الطلب
              </button>
            </div>
          </form>
        ) : (
          /* 3. CART ITEMS LIST */
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-12">
                  <div className="grid h-24 w-24 place-items-center rounded-3xl bg-zinc-100 text-zinc-400">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                  <p className="mt-5 font-cairo text-xl font-black text-zinc-900">سلة التسوق فارغة</p>
                  <p className="mt-1.5 text-xs text-zinc-500">تصفح المنتجات وأضف قطع الغيار التي تحتاجها سيارتك</p>
                  <button
                    onClick={() => {
                      setCartOpen(false)
                      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="btn-shine mt-6 rounded-2xl bg-brand-600 px-8 py-3.5 font-cairo text-xs font-black text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700"
                  >
                    تصفح المنتجات الآن
                  </button>
                </div>
              ) : (
                <ul className="space-y-3.5">
                  {cart.map((i) => (
                    <li
                      key={i.product.id}
                      className="fade-in flex gap-4 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <img
                        src={i.product.image}
                        alt={i.product.name}
                        className={`h-20 w-20 shrink-0 rounded-xl bg-zinc-50 object-cover p-1.5 ${i.product.flip ? '-scale-x-100' : ''}`}
                      />
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-cairo text-sm font-black text-zinc-900 line-clamp-1">{i.product.name}</p>
                            <p className="text-[11px] font-bold text-zinc-400" dir="ltr">
                              {i.product.brand} — {i.product.partNumber}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(i.product.id)}
                            className="text-zinc-400 transition-colors hover:text-brand-600"
                            aria-label="حذف المنتج"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50">
                            <button
                              onClick={() => setQty(i.product.id, i.qty + 1)}
                              className="grid h-7 w-7 place-items-center text-zinc-600 hover:text-brand-600"
                              aria-label="زيادة"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center font-cairo text-xs font-black">{i.qty}</span>
                            <button
                              onClick={() => setQty(i.product.id, i.qty - 1)}
                              className="grid h-7 w-7 place-items-center text-zinc-600 hover:text-brand-600"
                              aria-label="تقليل"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="font-cairo text-sm font-black text-brand-600">
                            {formatPrice(i.product.price * i.qty)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-zinc-200/80 bg-zinc-50/80 px-6 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="font-cairo text-sm font-bold text-zinc-600">المجموع الإجمالي:</span>
                  <span className="font-cairo text-2xl font-black text-brand-600">{formatPrice(total)}</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> الدفع عند الاستلام بعد فحص الطلبية
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCartOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-zinc-200 py-3.5 font-cairo text-xs font-black text-zinc-700 transition-all hover:border-zinc-900"
                  >
                    <ArrowLeft className="h-4 w-4" /> متابعة التسوق
                  </button>
                  <button
                    onClick={() => setCheckout(true)}
                    className="btn-shine rounded-2xl bg-brand-600 py-3.5 text-center font-cairo text-xs font-black text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700"
                  >
                    إتمام الطلب
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  )
}

