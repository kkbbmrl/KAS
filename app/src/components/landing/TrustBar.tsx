import { ShieldCheck, Truck, Eye, Headphones, RotateCcw } from 'lucide-react'

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'أصلي ومضمون 100%',
    desc: 'قطع غيار أصلية مع وصل ضمان رسمي',
  },
  {
    icon: Eye,
    title: 'المعاينة قبل الدفع',
    desc: 'افحص القطعة وتأكد من سلامتها عند الباب',
  },
  {
    icon: Truck,
    title: 'توصيل لـ 58 ولاية',
    desc: 'شحن سريع ومحمي لباب المنزل (24–48 ساعة)',
  },
  {
    icon: RotateCcw,
    title: 'ضمان الاستبدال',
    desc: 'إمكانية الاسترجاع أو الاستبدال في حال عدم التوافق',
  },
  {
    icon: Headphones,
    title: 'استشارة فنية متخصصة',
    desc: 'فريق تقني يساعدك برقم الشاسيه والبطاقة الرمادية',
  },
]

export default function TrustBar() {
  return (
    <div className="border-y border-zinc-200/80 bg-zinc-900 text-white py-6" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {TRUST_POINTS.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-2xl bg-zinc-800/60 p-3.5 backdrop-blur-sm border border-zinc-700/50 hover:border-brand-500/50 transition-colors"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-cairo text-xs font-black text-white leading-tight">
                    {item.title}
                  </h4>
                  <p className="mt-0.5 text-[11px] font-bold text-zinc-400 leading-snug line-clamp-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
