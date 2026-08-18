import { BadgeCheck, Clock3, Headset, Medal, ShieldCheck, Wallet } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { useCountUp, useReveal } from '@/hooks/useReveal'

const FEATURES = [
  { icon: Medal, t: 'قطع غيار بجودة عالية', d: 'نتعامل فقط مع موردين معتمدين وقطع أصلية أو OEM بجودة التصنيع الأولى.' },
  { icon: Wallet, t: 'أسعار تنافسية', d: 'أسعار مدروسة بعناية لتمنحك أفضل قيمة مقابل المال في السوق.' },
  { icon: Clock3, t: 'توصيل سريع', d: 'شبكة توصيل تغطي جميع الولايات، وطلبك يصلك خلال 24 إلى 48 ساعة.' },
  { icon: Headset, t: 'دعم العملاء', d: 'فريق خبير يرافقك لاختيار القطعة الصحيحة المتوافقة مع سيارتك.' },
  { icon: ShieldCheck, t: 'منتجات مضمونة', d: 'ضمان حقيقي على جميع المنتجات مع إمكانية الاستبدال والاسترجاع.' },
  { icon: BadgeCheck, t: 'خبرة في قطع الغيار', d: 'أكثر من 15 سنة من الخبرة الميدانية في سوق قطع غيار السيارات.' },
]

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useCountUp(value)
  return (
    <div className="reveal text-center" data-delay="60">
      <p className="font-cairo text-4xl font-black text-white sm:text-5xl">
        <span ref={ref}>0</span>
        <span className="text-brand-500">{suffix}</span>
      </p>
      <p className="mt-2 text-sm font-semibold text-zinc-400">{label}</p>
    </div>
  )
}

export default function WhyUs() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section id="why-us" className="scroll-mt-24 bg-white pb-20 pt-4" ref={ref}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          kicker="لماذا نحن؟"
          title="لماذا Khaled Auto Spart؟"
          sub="لأن سيارتك تستحق الأفضل — نحن لا نبيع قطعًا فقط، بل نبيعك راحة البال"
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.t}
              className="reveal card-glow group relative overflow-hidden rounded-3xl border border-zinc-100 bg-white p-7 shadow-sm"
              data-delay={i * 80}
            >
              <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-brand-50 transition-transform duration-500 group-hover:scale-[2.6]" aria-hidden />
              <div className="relative">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 font-cairo text-lg font-extrabold text-zinc-900">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.d}</p>
              </div>
            </div>
          ))}
        </div>

        {/* stats band */}
        <div className="reveal relative mt-16 overflow-hidden rounded-[2rem] bg-zinc-950 px-8 py-12 shadow-2xl shadow-zinc-900/25" data-delay="100">
          <div className="stripes absolute inset-0 opacity-50" aria-hidden />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-600/25 blur-3xl" aria-hidden />
          <div className="relative grid grid-cols-2 gap-10 lg:grid-cols-4">
            <Stat value={12000} suffix="+" label="قطعة متوفرة في المخزون" />
            <Stat value={9000} suffix="+" label="عميل يثق بنا" />
            <Stat value={15} suffix=" سنة" label="من الخبرة في المجال" />
            <Stat value={40} suffix="+" label="علامة تجارية مدعومة" />
          </div>
        </div>
      </div>
    </section>
  )
}
