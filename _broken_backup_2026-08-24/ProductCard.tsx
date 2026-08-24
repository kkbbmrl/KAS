import { ShoppingCart } from 'lucide-react'
import { formatPrice } from '@/data/products'
import type { Product } from '@/data/products'
import { useShop } from '@/context/ShopContext'

export default function ProductCard({ product }: { product: Product }) {
  const { setSelected, addToCart } = useShop()
  const out = product.stock === 'غير متوفر'

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <button
        onClick={() => setSelected(product)}
        className="relative block w-full cursor-pointer overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-red-50/30 p-4 text-center"
        aria-label={`عرض ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className={`mx-auto h-32 w-full object-contain transition-transform duration-500 group-hover:scale-110 sm:h-40 ${product.flip ? '-scale-x-100' : ''}`}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = '/img/oil-filter.png' }}
        />
        {product.badge && (
          <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-2.5 py-0.5 font-cairo text-[10px] font-black text-white shadow-md">
            {product.badge}
          </span>
        )}
        {/* Quick view: always visible on mobile, hover on desktop */}
        <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center bg-gradient-to-t from-zinc-950/70 to-transparent py-4 transition-transform duration-300 group-hover:translate-y-0 max-sm:translate-y-0">
          <span className="rounded-full bg-white/95 px-4 py-1.5 font-cairo text-[10px] font-black text-zinc-900 shadow-lg backdrop-blur-sm">
            عرض التفاصيل
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col p-4 text-right">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-zinc-950 px-2 py-0.5 font-cairo text-[10px] font-black text-white" dir="ltr">
            {product.brand}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
              product.stock === 'متوفر'
                ? 'bg-emerald-50 text-emerald-700'
                : product.stock === 'كمية محدودة'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-zinc-100 text-zinc-400'
            }`}
          >
            {product.stock}
          </span>
        </div>

        <h3
          onClick={() => setSelected(product)}
          className="mt-2 cursor-pointer font-cairo text-sm font-black text-zinc-900 transition-colors hover:text-brand-600"
        >
          {product.name}
        </h3>
        <p className="mt-1 text-xs font-bold text-zinc-400" dir="ltr">
          {product.partNumber}
        </p>

        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <p className="font-cairo text-base font-black text-brand-600">{formatPrice(product.price)}</p>
            {product.oldPrice && (
              <p className="text-xs font-bold text-zinc-400 line-through">{formatPrice(product.oldPrice)}</p>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            disabled={out}
            className="btn-shine mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-95 disabled:bg-zinc-300"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {out ? 'غير متوفر' : 'أضف إلى السلة'}
          </button>
        </div>
      </div>
    </div>
  )
}