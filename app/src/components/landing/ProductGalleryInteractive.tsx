import { useState } from 'react'
import { Check, ShieldCheck, Sparkles, ZoomIn } from 'lucide-react'

interface Props {
  images: string[]
  productName: string
  badge?: string
  brand?: string
}

export default function ProductGalleryInteractive({ images, productName, badge, brand }: Props) {
  const safeImages = images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85']
  const [activeIdx, setActiveIdx] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  return (
    <div className="space-y-3" dir="rtl">
      {/* Main Image Container */}
      <div
        className="relative overflow-hidden rounded-3xl border-2 border-zinc-200/90 bg-gradient-to-b from-zinc-50 to-white shadow-xl aspect-square sm:aspect-[4/3] flex items-center justify-center p-4 cursor-crosshair group select-none"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Badges Overlay */}
        <div className="absolute top-3.5 right-3.5 z-10 flex flex-col gap-1.5 items-start pointer-events-none">
          {badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 font-cairo text-xs font-black text-white shadow-lg shadow-brand-600/40">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{badge}</span>
            </span>
          )}
          {brand && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/90 px-3 py-1 font-cairo text-[11px] font-black text-white shadow backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>علامة {brand} الأصلية</span>
            </span>
          )}
        </div>

        <div className="absolute bottom-3.5 left-3.5 z-10 flex items-center gap-1 rounded-lg bg-zinc-900/70 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-sm pointer-events-none sm:flex hidden">
          <ZoomIn className="h-3 w-3" />
          <span>مرر الفأرة للتكبير والتفاصيل الدقيقة</span>
        </div>

        {/* Regular Image */}
        <img
          src={safeImages[activeIdx] || safeImages[0]}
          alt={productName}
          className={`h-full w-full object-contain transition-transform duration-200 ${
            isZoomed ? 'scale-105 opacity-90' : 'scale-100'
          }`}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85'
          }}
        />

        {/* Magnifier Zoom Lens */}
        {isZoomed && (
          <div
            className="absolute inset-0 pointer-events-none hidden sm:block z-20 overflow-hidden bg-white"
            style={{
              backgroundImage: `url(${safeImages[activeIdx] || safeImages[0]})`,
              backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
              backgroundSize: '250%',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </div>

      {/* Thumbnails row */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-zinc-50 p-1 transition-all ${
                activeIdx === idx
                  ? 'border-brand-600 ring-2 ring-brand-600/30 shadow-md scale-105'
                  : 'border-zinc-200 hover:border-zinc-400 opacity-75 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`صورة ${idx + 1}`} className="h-full w-full object-contain" />
              {activeIdx === idx && (
                <div className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-white shadow">
                  <Check className="h-2.5 w-2.5" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
