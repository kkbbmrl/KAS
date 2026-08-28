import { useEffect, useState } from 'react'
import { ArrowLeft, BadgePercent, Package, Timer, Truck } from 'lucide-react'
import { Link } from 'react-router'
import SectionHeading from './SectionHeading'
import { useReveal } from '@/hooks/useReveal'

function useCountdown() {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    // countdown to next Sunday midnight (weekly offers reset)
    const target = (() => {
      const now = new Date()
      const t = new Date(now)
      t.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7))
      t.setHours(0, 0, 0, 0)
      return t.getTime()
    })()
    const tick = () => {
      const diff = Math.max(0, target - Date.now())
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return left
}

const OFFERS = [
  { icon: BadgePercent, title: 'خصم حتى 30%', desc: 'على تشكيلة مختارة من الفلاتر وقطع الفرامل الأصلية', tag: 'عروض الأسبوع' },
  { icon: Truck, title: 'توصيل مجاني', desc: 'لجميع الطلبات التي تفوق قيمتها 15 000 د.ج لكل الولايات', tag: 'بدون شروط' },
  { icon: Package, title: 'طقم الصيانة', desc: 'فلتر زيت + فلتر هواء بسعر موحّد مخفّض — 3 900 د.ج فقط', tag: 'الأكثر طلبًا' },
]

export default function Offers() {
  const ref = useReveal<HTMLDivElement>()
  const { d, h, m, s } = useCountdown()
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <section id="offers" className="scroll-mt-24 py-20" ref={ref}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="reveal relative overflow-hidden rounded-2xl bg-gradient-to-bl from-brand-700 via-brand-600 to-brand-900 px-4 py-10 shadow-2xl shadow-brand-900/30 sm:rounded-[2.5rem] sm:px-12 sm:py-14">
          <div className="stripes absolute inset-0" aria-hidden />
          <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-28 -right-16 h-96 w-96 rounded-full bg-zinc-950/30 blur-3xl" aria-hidden />

          <div className="relative">
            <SectionHeading
              light
              kicker="عروض حصرية"
              title="عروض KAS لا تُفوَّت"
              sub="خصومات حقيقية على قطع أصلية — الكمية محدودة والعرض حتى نهاية الأسبوع"
            />

            {/* countdown */}
            <div className="reveal mb-12 flex items-center justify-center gap-3 sm:gap-4" data-delay="80" dir="ltr">
              {[
                { v: pad(d), l: 'يوم' },
                { v: pad(h), l: 'ساعة' },
                { v: pad(m), l: 'دقيقة' },
                { v: pad(s), l: 'ثانية' },
              ].map((u) => (
                <div key={u.l} className="min-w-[60px] rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 text-center backdrop-blur transition-transform hover:scale-105 sm:min-w-[74px] sm:px-4 sm:py-3">
                  <p className="font-cairo text-2xl font-black tabular-nums text-white sm:text-3xl">{u.v}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-brand-100 sm:text-[11px]">{u.l}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {OFFERS.map((o, i) => (
                <div
                  key={o.title}
                  className="reveal group relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur transition-all duration-500 hover:-translate-y-2 hover:border-white/40 hover:bg-white/15"
                  data-delay={i * 100}
                >
                  <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-brand-700 shadow">{o.tag}</span>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-lg transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                    <o.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 font-cairo text-2xl font-black text-white">{o.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-100">{o.desc}</p>
                </div>
              ))}
            </div>

            <div className="reveal mt-12 text-center" data-delay="160">
              <Link
                to="/themes"
                className="group inline-flex items-center gap-3 rounded-2xl bg-white px-10 py-4 font-cairo text-lg font-black text-brand-700 shadow-2xl shadow-zinc-950/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-white/20"
              >
                <Timer className="h-5 w-5 text-brand-600 transition-transform duration-500 group-hover:rotate-[360deg]" />
                اكتشف العروض
                <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
