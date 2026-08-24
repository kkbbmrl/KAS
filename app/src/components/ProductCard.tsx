import { CheckCircle2, Eye, ShoppingCart, Star, XCircle, Zap } from 'lucide-react'
import { formatPrice, type Product } from '@/data/products'
import { useShop } from '@/context/ShopContext'

export default function ProductCard({
  product,
  delay = 0,
  reveal = false,
}: {
  product: Product
  delay?: number
  /**
   * Opt into the scroll-reveal animation. Only enable inside a container that
   * calls useReveal() — the .reveal class starts at opacity:0 and is only
   * cleared by that observer, so a card without one stays invisible forever.
   */
  reveal?: boolean
}) {
  const { addToCart, setSelected } = useShop()
  const out = product.stock === 'غير متوفر'

  return (
    <article
      className={`card-glow group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm transition-all duration-500 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-600/10 ${reveal ? 'reveal' : ''}`}
      data-delay={delay}
    >
      {/* image container */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-red-50/30 p-6">
        {product.badge && (
          <span className="absolute right-4 top-4 z-10 rounded-full bg-brand-600 px-3.5 py-1 text-xs font-black text-white shadow-lg shadow-brand-600/30">
            {product.badge}
          </span>
        )}
        <span className="absolute left-4 top-4 z-10 rounded-full bg-zinc-900/85 px-3 py-1 text-[11px] font-bold tracking-wider text-white backdrop-blur-md" dir="ltr">
          {product.partNumber}
        </span>

        <button onClick={() => setSelected(product)} className="block w-full cursor-pointer text-center" aria-label={`عرض ${product.name}`}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`img-in mx-auto h-48 w-full object-contain drop-shadow-xl transition-transform duration-700 ease-out group-hover:scale-110 ${product.flip ? '-scale-x-100' : ''}`}
          />
        </button>

        {/* quick view overlay */}
        <button
          onClick={() => setSelected(product)}
          className="absolute inset-x-6 bottom-3 flex translate-y-14 items-center justify-center gap-2 rounded-xl bg-zinc-900/90 py-2.5 text-sm font-bold text-white opacity-0 backdrop-blur-md transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-brand-600"
        >
          <Eye className="h-4 w-4" /> معاينة سريعة
        </button>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-extrabold text-zinc-700" dir="ltr">
              {product.brand}
            </span>
            {product.aliases?.[0] && (
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700" dir="ltr">
                {product.aliases[0]}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {product.rating}
          </span>
        </div>

        <h3
          onClick={() => setSelected(product)}
          className="mt-2.5 cursor-pointer font-cairo text-lg font-black leading-snug text-zinc-900 transition-colors group-hover:text-brand-600"
        >
          {product.name}
        </h3>

        {Array.isArray(product.compat) && product.compat.length > 0 ? (
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-zinc-500">
            متوافقة مع: {product.compat.slice(0, 2).join('، ')}{product.compat.length > 2 ? '…' : ''}
          </p>
        ) : (
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-zinc-400">
            {product.category || 'قطع غيار سيارات أصلية'}
          </p>
        )}

        {/* stock status */}
        <div className="mt-3.5 flex items-center justify-between">
          <div>
            {product.stock === 'متوفر' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <CheckCircle2 className="h-3.5 w-3.5" /> متوفر بالمخزن
              </span>
            ) : product.stock === 'كمية محدودة' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-600">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> كمية محدودة
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-extrabold text-zinc-500">
                <XCircle className="h-3.5 w-3.5" /> غير متوفر
              </span>
            )}
          </div>
        </div>

        {/* price */}
        <div className="mt-4 flex items-end justify-between border-t border-dashed border-zinc-200 pt-3.5">
          <div>
            {product.oldPrice && (
              <p className="text-xs font-bold text-zinc-400 line-through">{formatPrice(product.oldPrice)}</p>
            )}
            <p className="font-cairo text-xl font-black text-brand-600">{formatPrice(product.price)}</p>
          </div>
        </div>

        {/* action buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setSelected(product)}
            className="rounded-xl border-2 border-zinc-200 py-2.5 text-center font-cairo text-xs font-extrabold text-zinc-800 transition-all hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
          >
            التفاصيل
          </button>
          <button
            onClick={() => addToCart(product)}
            disabled={out}
            className="btn-shine flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-center font-cairo text-xs font-black text-white shadow-md shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> أضف للسلة
          </button>
        </div>
      </div>
    </article>
  )
}

