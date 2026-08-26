import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { useReveal } from '@/hooks/useReveal'

const POINTS = [
  'قطع أصلية وOEM من موردين معتمدين دوليًا',
  'خبرة تفوق 15 سنة في سوق قطع الغيار',
  'فريق فني يساعدك في اختيار القطعة الصحيحة',
  'أسعار شفافة بدون مفاجآت',
]

export default function About() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section id="about" className="scroll-mt-24 bg-zinc-50/70 py-20" ref={ref}>
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2">
        <div>
          <SectionHeading kicker="قصتنا" title="من نحن؟" />
          <p className="reveal -mt-6 text-lg leading-loose text-zinc-600" data-delay="60">
            <span className="font-cairo font-black text-zinc-900">Khaled Auto Parts</span> متخصص في توفير قطع غيار
            السيارات عالية الجودة لمختلف أنواع المركبات. نسعى لتقديم منتجات موثوقة، أسعار تنافسية وخدمة احترافية
            تساعد عملاءنا في العثور على القطعة المناسبة بسهولة وسرعة.
          </p>
          <ul className="mt-7 space-y-3.5">
            {POINTS.map((p, i) => (
              <li key={p} className="reveal flex items-center gap-3 text-[15px] font-semibold text-zinc-700" data-delay={i * 80}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <a
            href="#contact"
            className="reveal btn-shine group mt-9 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 font-cairo font-extrabold text-white shadow-xl shadow-brand-600/30 transition-all hover:-translate-y-1 hover:bg-brand-700"
            data-delay="120"
          >
            تعرّف علينا أكثر
            <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1.5" />
          </a>
        </div>

        {/* visual side */}
        <div className="reveal reveal-scale relative" data-delay="100">
          <div className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-2xl shadow-zinc-900/10">
            <div className="stripes-dark relative bg-gradient-to-b from-white to-zinc-100 p-8">
              <img src="/img/hero-car.png" alt="معرض Khaled Auto Parts" className="w-full object-contain" loading="lazy" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-x-reverse divide-zinc-100 border-t border-zinc-100 text-center">
              {[
                { n: '2011', t: 'سنة التأسيس' },
                { n: '3', t: 'فروع ومخازن' },
                { n: '98%', t: 'رضا العملاء' },
              ].map((s) => (
                <div key={s.t} className="py-5">
                  <p className="font-cairo text-xl font-black text-brand-600">{s.n}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">{s.t}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="animate-floaty absolute -right-4 -top-5 rounded-2xl bg-zinc-950 px-5 py-3 font-cairo text-sm font-black text-white shadow-xl">
            <span className="text-brand-500">KAS</span> — ثقة تتجدد كل يوم
          </div>
        </div>
      </div>
    </section>
  )
}
