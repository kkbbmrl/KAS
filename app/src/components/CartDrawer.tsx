import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { formatPrice, WHATSAPP_NUMBER } from '@/data/products'
import { useShop } from '@/context/ShopContext'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, removeFromCart, total } = useShop()

  if (!cartOpen) return null

  const waText = encodeURIComponent(
    'مرحبًا، أريد إتمام هذا الطلب:\n' +
      cart.map((i) => `• ${i.product.name} (${i.product.partNumber}) × ${i.qty} = ${formatPrice(i.product.price * i.qty)}`).join('\n') +
      `\n— المجموع: ${formatPrice(total)}`
  )

  return (
    <div className="fixed inset-0 z-50">
      <div className="fade-in absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      <aside className="drawer-in absolute inset-y-0 left-0 flex w-full max-w-md flex-col bg-white shadow-2xl" role="dialog" aria-label="سلة التسوق">
        {/* head */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
          <h3 className="flex items-center gap-2.5 font-cairo text-xl font-black text-zinc-900">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><ShoppingBag className="h-5 w-5" /></span>
            سلة التسوق
          </h3>
          <button onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-600 transition-all hover:rotate-90 hover:bg-brand-600 hover:text-white" aria-label="إغلاق السلة">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-zinc-100">
                <ShoppingBag className="h-10 w-10 text-zinc-400" />
              </div>
              <p className="mt-5 font-cairo text-lg font-extrabold text-zinc-800">سلتك فارغة</p>
              <p className="mt-1.5 text-sm text-zinc-500">تصفح المنتجات وأضف القطع التي تحتاجها سيارتك</p>
              <button
                onClick={() => { setCartOpen(false); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="btn-shine mt-6 rounded-xl bg-brand-600 px-7 py-3 font-cairo text-sm font-extrabold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.map((i) => (
                <li key={i.product.id} className="fade-in flex gap-4 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
                  <img src={i.product.image} alt={i.product.name} className={`h-20 w-20 shrink-0 rounded-xl bg-zinc-50 object-contain p-1.5 ${i.product.flip ? '-scale-x-100' : ''}`} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-extrabold text-zinc-900">{i.product.name}</p>
                      <button onClick={() => removeFromCart(i.product.id)} className="text-zinc-400 transition-colors hover:text-brand-600" aria-label="حذف المنتج">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-400" dir="ltr">{i.product.partNumber}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-zinc-200">
                        <button onClick={() => setQty(i.product.id, i.qty + 1)} className="grid h-7 w-7 place-items-center text-zinc-600 hover:text-brand-600" aria-label="زيادة"><Plus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm font-black">{i.qty}</span>
                        <button onClick={() => setQty(i.product.id, i.qty - 1)} className="grid h-7 w-7 place-items-center text-zinc-600 hover:text-brand-600" aria-label="تقليل"><Minus className="h-3.5 w-3.5" /></button>
                      </div>
                      <p className="font-cairo text-sm font-black text-brand-600">{formatPrice(i.product.price * i.qty)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* footer */}
        {cart.length > 0 && (
          <div className="border-t border-zinc-100 bg-zinc-50/60 px-6 py-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-zinc-500">المجموع الإجمالي</p>
              <p className="font-cairo text-2xl font-black text-brand-600">{formatPrice(total)}</p>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">التوصيل مجاني للطلبات فوق 15 000 د.ج — الدفع عند الاستلام</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setCartOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 py-3 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" /> متابعة التسوق
              </button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="btn-shine rounded-xl bg-brand-600 py-3 text-center font-cairo text-sm font-extrabold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700"
              >
                إتمام الطلب
              </a>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
