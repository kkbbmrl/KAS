import { Link } from 'react-router'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { CATEGORIES } from '@/data/products'

const themeIcons: Record<string, string> = {
  المشعاع: '❄️',
  'زجاج المصباح': '💡',
  'غطاء الغبار': '🛡️',
  المروحة: '🌀',
  'المصباح الأمامي': '🚘',
  'ماسحة الزجاج': '🧼',
  بيرسو: '📦',
  سيرسو: '⚙️',
  الترافرس: '🧱',
  'حامل الصدام': '🛠️',
  'الضوء الخلفي': '🔦',
  الصدام: '🧰',
  'مقبض الباب': '🚪',
  'الغطاء الأمامي': '🪟',
  'الآرما تور': '🔩',
  'فلاتر الزيت': '🫧',
  'فلاتر الهواء': '🌬️',
  'أقراص الفرامل': '🛑',
  'بطانات الفرامل': '🧲',
}

export default function ThemesPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-tajawal text-zinc-900" dir="rtl">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-brand-600">
            <ArrowLeft className="h-4 w-4" />
            العودة للرئيسية
          </Link>
          <div className="flex items-center gap-2 text-brand-700">
            <Sparkles className="h-5 w-5" />
            <span className="font-cairo text-lg font-black">الأقسام</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            اختر نوع القطعة المناسب لك
          </p>
          <h1 className="mt-5 font-cairo text-3xl font-black text-zinc-900 sm:text-4xl">
            تصفح المنتجات حسب <span className="text-brand-600">النوع/الموضوع</span>
          </h1>
          <p className="mt-4 text-sm text-zinc-600 sm:text-base">
            اختر القسم الذي يناسب سيارتك ثم انتقل إلى الصفحة المخصصة للمنتجات والبحث داخل هذا النوع.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.filter((category) => category.available).map((category) => (
            <Link
              key={category.name}
              to={`/search?cat=${encodeURIComponent(category.name)}`}
              className="group rounded-[1.75rem] border border-zinc-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-600/10"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-2xl bg-brand-50 px-3 py-2 text-brand-700">
                  <span className="text-xl">{themeIcons[category.name] ?? '🛠️'}</span>
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-black text-zinc-600">
                  {category.fr}
                </span>
              </div>

              <h2 className="mt-5 font-cairo text-xl font-black text-zinc-900 transition-colors group-hover:text-brand-600">
                {category.name}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {category.fr} • قطع غيار متوافقة مع سيارات مختلفة وقطع أصلية بجودة عالية.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-black text-white transition-colors group-hover:bg-brand-700">
                عرض المنتجات
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
