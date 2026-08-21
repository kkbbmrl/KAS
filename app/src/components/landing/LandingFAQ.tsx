import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface Props {
  faq: { q: string; a: string }[]
}

export default function LandingFAQ({ faq }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx))
  }

  if (!faq || faq.length === 0) return null

  return (
    <section className="rounded-3xl border-2 border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6" dir="rtl">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
          <HelpCircle className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-cairo text-lg sm:text-xl font-black text-zinc-900">
            الأسئلة الشائعة وإجابات الخبراء
          </h3>
          <p className="text-[11px] font-bold text-zinc-500">
            كل ما تحتاج معرفته عن جودة القطع، الضمان، التوصيل والاستبدال
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faq.map((item, idx) => {
          const isOpen = openIdx === idx
          return (
            <div
              key={idx}
              className={`rounded-2xl border-2 transition-all ${
                isOpen
                  ? 'border-brand-600/60 bg-brand-50/20 shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between p-4 text-right cursor-pointer"
              >
                <span className="font-cairo text-xs sm:text-sm font-black text-zinc-900">
                  {item.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-brand-600' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 text-xs font-bold text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
