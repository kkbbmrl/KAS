import { useState } from 'react'
import { CheckCircle2, Clock, MapPin, Search, Truck, X } from 'lucide-react'
import { ALGERIA_WILAYAS, type Wilaya } from '@/data/wilayas'
import { useShop } from '@/context/ShopContext'

export default function WilayaBar() {
  const { setCartOpen } = useShop()
  const [activeWilaya, setActiveWilaya] = useState<Wilaya | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredWilayas = ALGERIA_WILAYAS.filter(
    (w) =>
      w.nameAr.includes(searchQuery.trim()) ||
      w.nameFr.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      w.code.includes(searchQuery.trim())
  )

  const handleSelectWilaya = (w: Wilaya) => {
    setActiveWilaya(w)
    setIsModalOpen(true)
  }

  const proceedWithWilaya = () => {
    setIsModalOpen(false)
    setCartOpen(true)
  }

  return (
    <section className="relative overflow-hidden border-y border-zinc-200/80 bg-zinc-950 py-3.5 text-white">
      {/* Glow background */}
      <div className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-0 h-40 w-40 rounded-full bg-brand-600/20 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4">
        {/* Top title & quick search button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md shadow-brand-600/30">
              <Truck className="h-4 w-4" />
            </span>
            <p className="font-cairo text-xs font-black sm:text-sm">
              توصيل سريع يشمل <span className="text-brand-400">جميع ولايات الجزائر الـ 58</span> مع الدفع عند الاستلام
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-shine inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 font-cairo text-xs font-bold text-zinc-200 transition-all hover:border-brand-500 hover:text-white"
          >
            <MapPin className="h-3.5 w-3.5 text-brand-500" />
            تصفح واختر ولايتك (58 ولاية)
          </button>
        </div>
      </div>

      {/* 1. Continuous Smooth Animated Bar (Marquee) */}
      <div className="group relative mt-1 flex overflow-hidden py-1">
        <div className="marquee-track flex shrink-0 items-center gap-2.5">
          {ALGERIA_WILAYAS.map((w) => (
            <button
              key={`m1-${w.code}`}
              onClick={() => handleSelectWilaya(w)}
              className="group/chip inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 font-cairo text-xs font-bold text-zinc-300 transition-all hover:border-brand-500 hover:bg-brand-600 hover:text-white hover:shadow-lg hover:shadow-brand-600/30"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-800 text-[10px] font-black text-brand-400 group-hover/chip:bg-white group-hover/chip:text-brand-700" dir="ltr">
                {w.code}
              </span>
              <span>{w.nameAr}</span>
              <span className="text-[10px] text-zinc-500 group-hover/chip:text-white/80" dir="ltr">
                {w.nameFr}
              </span>
            </button>
          ))}
        </div>

        {/* Duplicate for seamless infinite loop */}
        <div className="marquee-track flex shrink-0 items-center gap-2.5" aria-hidden="true">
          {ALGERIA_WILAYAS.map((w) => (
            <button
              key={`m2-${w.code}`}
              onClick={() => handleSelectWilaya(w)}
              className="group/chip inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 font-cairo text-xs font-bold text-zinc-300 transition-all hover:border-brand-500 hover:bg-brand-600 hover:text-white hover:shadow-lg hover:shadow-brand-600/30"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-800 text-[10px] font-black text-brand-400 group-hover/chip:bg-white group-hover/chip:text-brand-700" dir="ltr">
                {w.code}
              </span>
              <span>{w.nameAr}</span>
              <span className="text-[10px] text-zinc-500 group-hover/chip:text-white/80" dir="ltr">
                {w.nameFr}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Wilaya Picker Modal */}
      {isModalOpen && (
        <div
          className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-in relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border-2 border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-md">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-cairo text-lg font-black sm:text-xl">
                    اختر ولايتك من ولايات الجزائر الـ 58
                  </h3>
                  <p className="text-xs text-zinc-400">توصيل لباب المنزل أو للمكتب مع خدمة الدفع عند الاستلام</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-zinc-800 text-zinc-400 transition-all hover:bg-brand-600 hover:text-white"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-4">
              <div className="relative">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو الرقم (مثال: 16، الجزائر، وهران، سطيف...)"
                  className="w-full rounded-2xl border-2 border-zinc-700 bg-zinc-950/80 px-4 py-3 pe-11 font-cairo text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-600/20"
                  autoFocus
                />
              </div>
            </div>

            {/* Active Selected Wilaya details preview */}
            {activeWilaya && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-500/40 bg-brand-950/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-cairo text-sm font-black text-white" dir="ltr">
                    {activeWilaya.code}
                  </span>
                  <div>
                    <p className="font-cairo text-sm font-black text-white">
                      ولاية {activeWilaya.nameAr} ({activeWilaya.nameFr})
                    </p>
                    <p className="flex items-center gap-1 text-xs text-brand-300">
                      <Clock className="h-3.5 w-3.5" /> مدة التوصيل المتوقعة: {activeWilaya.deliveryTime}
                    </p>
                  </div>
                </div>
                <button
                  onClick={proceedWithWilaya}
                  className="btn-shine rounded-xl bg-brand-600 px-5 py-2.5 font-cairo text-xs font-black text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700"
                >
                  تأكيد واختيار للطلب
                </button>
              </div>
            )}

            {/* Wilayas Grid */}
            <div className="mt-4 max-h-[45vh] overflow-y-auto pe-1">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {filteredWilayas.map((w) => {
                  const isSelected = activeWilaya?.code === w.code
                  return (
                    <button
                      key={w.code}
                      onClick={() => setActiveWilaya(w)}
                      className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-right transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-brand-500/60 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[11px] font-black ${
                            isSelected ? 'bg-white text-brand-700' : 'bg-zinc-800 text-brand-400'
                          }`}
                          dir="ltr"
                        >
                          {w.code}
                        </span>
                        <span className="truncate font-cairo text-xs font-bold">{w.nameAr}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />}
                    </button>
                  )
                })}
              </div>

              {filteredWilayas.length === 0 && (
                <div className="py-12 text-center text-zinc-400">
                  <p className="font-cairo text-sm font-bold">لا توجد ولاية مطابقة لبحثك</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
