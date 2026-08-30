import { Eye, ShoppingCart, Star } from 'lucide-react'
import { formatPrice, type Product } from '@/data/products'
import { useShop } from '@/context/ShopContext'

const stockColors: Record<string, string> = {
  'متوفر': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'كمية محدودة': 'bg-amber-50 text-amber-700 border-amber-200',
  'غير متوفر': 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

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
      className={`group flex flex-col overflow-hidden rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-600/10 ${
        reveal ? 'reveal' : ''
      }`}
      data-delay={delay}
    >
      {/* Image & Badges Header */}
      <button
        onClick={() => setSelected(product)}
        className="relative block overflow-hidden bg-gradient-to-br from-zinc-50 to-red-50/30 p-4 text-center cursor-pointer"
        aria-label={`عرض تفاصيل ${product.name}`}
      >
        <img
          src={product.image || '/img/parts/calandre-grille.jpg'}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = '/img/parts/calandre-grille.jpg'
          }}
          className={`mx-auto h-40 w-full object-contain transition-transform duration-500 group-hover:scale-110 ${
            product.flip ? '-scale-x-100' : ''
          }`}
        />
        {product.badge && (
          <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-black text-white shadow-md">
            {product.badge}
          </span>
        )}
        <span
          className={`absolute bottom-3 left-3 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${
            stockColors[product.stock] ?? stockColors['متوفر']
          }`}
        >
          {product.stock}
        </span>
        {product.partNumber && (
          <span className="absolute left-3 top-3 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs" dir="ltr">
            {product.partNumber}
          </span>
        )}
      </button>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-black text-white" dir="ltr">
              {product.brand}
            </span>
            {product.nameFr && (
              <span className="max-w-[140px] truncate rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700" dir="ltr">
                {product.nameFr}
              </span>
            )}
          </div>
          {product.rating && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {product.rating}
            </span>
          )}
        </div>

        <button
          onClick={() => setSelected(product)}
          className="line-clamp-2 text-right font-cairo text-sm font-black leading-snug text-zinc-900 transition-colors hover:text-brand-600 cursor-pointer"
        >
          {product.name}
        </button>

        {Array.isArray(product.compat) && product.compat.length > 0 ? (
          <p className="line-clamp-1 text-xs text-zinc-500 font-medium">
            {product.compat.slice(0, 3).join(' · ')}
            {product.compat.length > 3 && ` +${product.compat.length - 3}`}
          </p>
        ) : (
          <p className="line-clamp-1 text-xs text-zinc-400 font-medium">
            {product.category || 'قطع غيار سيارات أصلية'}
          </p>
        )}

        {/* Price & Action Buttons */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2 border-t border-zinc-100/80">
          <div className="min-w-0">
            <p className="font-cairo text-base font-black text-brand-600">{formatPrice(product.price)}</p>
            {product.oldPrice ? (
              <p className="text-xs font-bold text-zinc-400 line-through">{formatPrice(product.oldPrice)}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-1.5">
            <button
              onClick={() => setSelected(product)}
              className="grid h-10 w-10 place-items-center rounded-lg border-2 border-zinc-200 text-zinc-600 transition-all hover:border-brand-300 hover:text-brand-600 cursor-pointer"
              aria-label={`تفاصيل ${product.name}`}
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => addToCart(product)}
              disabled={out}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-brand-600 px-3 font-cairo text-xs font-black text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-95 disabled:bg-zinc-300 disabled:shadow-none cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {out ? 'غير متوفر' : 'أضف'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
