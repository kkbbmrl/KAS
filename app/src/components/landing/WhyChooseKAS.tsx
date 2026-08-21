import { Shield, Sparkles, Truck, Headphones, BadgeCheck } from 'lucide-react'

const ADVANTAGES = [
  {
    icon: BadgeCheck,
    title: 'أصالة 100% بدون أي تقليد',
    desc: 'نتعامل مباشرة مع كبار الموزعين المعتمدين لماركات Valeo, Bosch, Hella, Brembo, Continental لضمان قطع غيار أصلية غير مقلدة.',
  },
  {
    icon: Shield,
    title: 'وصل ضمان رسمي ومختوم',
    desc: 'كل طلبية مرفقة بوصل ضمان رسمي يضمن لك استبدال القطعة أو استرجاع نقودك في حال وجود أي عيب مصنعي.',
  },
  {
    icon: Truck,
    title: 'شحن آمن وفحص عند الاستلام',
    desc: 'لا تدفع أي دينار مسبقاً. استلم طردك عند باب بيتك في أي ولاية من الـ 58 ولاية وعاين القطعة بنفسك قبل الدفع.',
  },
  {
    icon: Headphones,
    title: 'مرافقة تقنية من ميكانيكيين خبراء',
    desc: 'لا تخمن القطعة المناسبة — فريقنا المتخصص يتأكد معك من رقم الشاسيه ومواصفات المحرك لتفادي أي خطأ في الشراء.',
  },
]

export default function WhyChooseKAS() {
  return (
    <section className="rounded-3xl border-2 border-zinc-200/90 bg-gradient-to-b from-zinc-900 to-zinc-950 text-white p-6 sm:p-10 shadow-xl space-y-8" dir="rtl">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/20 px-3.5 py-1 font-cairo text-xs font-black text-brand-400 border border-brand-500/30">
          <Sparkles className="h-3.5 w-3.5" /> لماذا يثق بنا آلاف السائقين في الجزائر؟
        </span>
        <h3 className="font-cairo text-2xl sm:text-3xl font-black text-white">
          KAS Auto Parts — المعيار الذهبي لقطع الغيار الأصلية
        </h3>
        <p className="text-xs font-bold text-zinc-400 leading-relaxed">
          نحن نوفر لك قطع الغيار التي تحتاجها سيارتك بمواصفات المصنع وبأفضل سعر، دون مخاطرة التقليد أو عناء البحث في المحلات.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ADVANTAGES.map((adv, idx) => {
          const Icon = adv.icon
          return (
            <div
              key={idx}
              className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 hover:border-brand-500/40 transition-colors"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30 shadow-inner">
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-cairo text-sm font-black text-white">
                  {adv.title}
                </h4>
                <p className="text-xs font-bold text-zinc-400 leading-relaxed">
                  {adv.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
