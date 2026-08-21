import { FileText, PhoneCall, Truck, CheckCircle2 } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    icon: FileText,
    title: 'اطلب في دقيقة واحدة',
    desc: 'املأ اسمك ورقم هاتفك وولايتك في الاستمارة أعلاه بدون دفع مسبق.',
  },
  {
    num: '02',
    icon: PhoneCall,
    title: 'تأكيد التوافق هاتفياً',
    desc: 'يتصل بك خبيرنا التقني لمراجعة رقم الشاسيه ومواصفات المحرك لتأكيد المطابقة 100%.',
  },
  {
    num: '03',
    icon: Truck,
    title: 'شحن سريع لعنوانك',
    desc: 'نغلف القطعة بحماية مضاعفة ونشحنها لباب منزلك في أي ولاية (24–48 ساعة).',
  },
  {
    num: '04',
    icon: CheckCircle2,
    title: 'افحص ثم ادفع عند الباب',
    desc: 'افحص الصندوق وعاين القطعة الأصلية بنفسك، ثم ادفع المبلغ لموزع التوصيل.',
  },
]

export default function HowItWorks() {
  return (
    <section className="rounded-3xl border-2 border-zinc-200/90 bg-zinc-50 p-6 sm:p-10 shadow-sm space-y-8" dir="rtl">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-3 py-1 font-cairo text-xs font-black text-zinc-800">
          خطوات بسيطة ومضمونة
        </span>
        <h3 className="font-cairo text-2xl sm:text-3xl font-black text-zinc-900">
          كيف تسير عملية الطلب والتوصيل؟
        </h3>
        <p className="text-xs font-bold text-zinc-500">
          تجربة شراء سهلة ومريحة تحميك من أي خطأ أو مخاطرة
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          return (
            <div
              key={idx}
              className="relative rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-3 shadow-sm hover:border-brand-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100 font-cairo font-black">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-cairo text-2xl font-black text-zinc-200">
                  {step.num}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-cairo text-sm font-black text-zinc-900">
                  {step.title}
                </h4>
                <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
