import { CheckCircle2, Eye, ShoppingCart, Star, XCircle } from 'lucide-react'
import { formatPrice, type Product } from '@/data/products'
import { useShop } from '@/context/ShopContext'

export default function ProductCard({ product, delay = 0 }: { product: Product; delay?: number }) {
  const { addToCart, setSelected } = useShop()
  const out = product.stock === 'غير متوفر'

  return (
    <article
      className="reveal card-glow group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm"
      data-delay={delay}
    >
      {/* image */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-brand-50/40 p-6">
        {product.badge && (
          <span className="absolute right-4 top-4 z-10 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-lg shadow-brand-600/30">
            {product.badge}
          </span>
        )}
        <span className="absolute left-4 top-4 z-10 rounded-full bg-zinc-900/85 px-3 py-1 text-[11px] font-bold text-white backdrop-blur" dir="ltr">
          {product.partNumber}
        </span>
        <button onClick={() => setSelected(product)} className="block w-full cursor-pointer" aria-label={`عرض ${product.name}`}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`img-in mx-auto h-44 w-44 object-contain drop-shadow-xl transition-transform duration-700 ease-out group-hover:scale-115 group-hover:-rotate-3 ${product.flip ? '-scale-x-100 group-hover:rotate-3' : ''}`}
          />
        </button>
        {/* quick view overlay */}
        <button
          onClick={() => setSelected(product)}
          className="absolute inset-x-6 bottom-3 flex translate-y-14 items-center justify-center gap-2 rounded-xl bg-zinc-900/90 py-2.5 text-sm font-bold text-white opacity-0 backdrop-blur transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-brand-600"
        >
          <Eye className="h-4 w-4" /> عرض سريع
        </button>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wide text-zinc-400" dir="ltr">{product.brand}</span>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {product.rating}
          </span>
        </div>

        <h3 className="mt-1.5 font-cairo text-lg font-extrabold leading-snug text-zinc-900 transition-colors group-hover:text-brand-600">
          {product.name}
        </h3>

        <p className="mt-1 line-clamp-1 text-xs font-medium text-zinc-500">
          متوافقة مع: {product.compat.slice(0, 2).join('، ')}{product.compat.length > 2 ? '…' : ''}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {product.stock === 'متوفر' ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> متوفر
            </span>
          ) : product.stock === 'كمية محدودة' ? (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" /> كمية محدودة
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold text-zinc-500">
              <XCircle className="h-3.5 w-3.5" /> غير متوفر
            </span>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-dashed border-zinc-200 pt-4">
          <div>
            {product.oldPrice && (
              <p className="text-xs font-semibold text-zinc-400 line-through">{formatPrice(product.oldPrice)}</p>
            )}
            <p className="font-cairo text-xl font-black text-brand-600">{formatPrice(product.price)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setSelected(product)}
            className="rounded-xl border-2 border-zinc-200 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-900 hover:text-zinc-900"
          >
            عرض التفاصيل
          </button>
          <button
            onClick={() => addToCart(product)}
            disabled={out}
            className="btn-shine flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
          >
            <ShoppingCart className="h-4 w-4" /> أضف إلى السلة
          </button>
        </div>
      </div>
    </article>
  )
}
