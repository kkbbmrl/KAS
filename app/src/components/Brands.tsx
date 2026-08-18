import SectionHeading from './SectionHeading'
import { useReveal } from '@/hooks/useReveal'

const BRANDS = ['TOYOTA', 'RENAULT', 'PEUGEOT', 'VOLKSWAGEN', 'MERCEDES-BENZ', 'BMW', 'HYUNDAI', 'KIA', 'FORD', 'NISSAN', 'BOSCH', 'BREMBO']

export default function Brands() {
  const ref = useReveal<HTMLDivElement>()
  const row = [...BRANDS, ...BRANDS]

  return (
    <section id="brands" className="scroll-mt-24 bg-white py-20" ref={ref}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          kicker="شركاؤنا"
          title="نوفر قطع الغيار لأشهر العلامات"
          sub="نتعامل مع أفضل الشركات العالمية لضمان جودة كل قطعة نبيعها"
        />
      </div>

      <div className="reveal relative overflow-hidden" data-delay="120">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-white to-transparent" />
        <div className="marquee-track flex w-max" style={{ direction: 'ltr' }}>
          {[0, 1].map((half) => (
            <div key={half} className="flex">
              {row.map((b, i) => (
                <div
                  key={`${half}-${i}`}
                  className="group mx-3 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-8 py-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-600/10"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 transition-colors duration-300 group-hover:bg-brand-600" />
                  <span className="whitespace-nowrap font-cairo text-lg font-black tracking-wider text-zinc-400 transition-colors duration-300 group-hover:text-zinc-900">
                    {b}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
