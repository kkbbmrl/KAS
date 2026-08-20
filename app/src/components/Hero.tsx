import { ArrowLeft, BadgeCheck, MessageCircle, ShieldCheck, Truck } from 'lucide-react'
import { formatPrice, PRODUCTS } from '@/data/products'
import { useShop } from '@/context/ShopContext'

export default function Hero() {
  const { setSelected } = useShop()
  const rad = PRODUCTS.find((p) => p.id === 21) ?? PRODUCTS[0]
  const lamp = PRODUCTS.find((p) => p.id === 15) ?? PRODUCTS[1]

  return (
    <section id="home" className="relative overflow-hidden bg-white pt-36 pb-10 lg:pt-40">
      {/* decorative background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-50 to-transparent blur-2xl" />
        <div className="absolute -right-24 top-40 h-72 w-72 rounded-full border-[22px] border-brand-50" />
        <div className="absolute -left-28 bottom-10 h-80 w-80 rounded-full border-[26px] border-zinc-100" />
        <svg className="animate-spin-slow absolute left-[8%] top-32 h-16 w-16 text-brand-100" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9.4 3.5-.02.5.02.5 2.07 1.62-1.9 3.3-2.44-.98a9.6 9.6 0 0 1-.87.5l-.37 2.66h-3.8l-.37-2.66a9.6 9.6 0 0 1-.87-.5l-2.44.98-1.9-3.3L8.6 12a8.9 8.9 0 0 1 0-1L6.53 9.38l1.9-3.3 2.44.98c.28-.2.57-.36.87-.5l.37-2.66h3.8l.37 2.66c.3.14.6.3.87.5l2.44-.98 1.9 3.3-2.07 1.62v-.5z" />
        </svg>
        <div className="deco-line absolute bottom-24 right-0 hidden w-56 opacity-60 lg:block" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2">
        {/* text */}
        <div>
          <div className="hero-up inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-bold text-brand-700" style={{ animationDelay: '0.05s' }}>
            <ShieldCheck className="h-4 w-4" />
            قطع غيار أصلية 100% بضمان معتمد
          </div>

          <h1 className="hero-up mt-6 font-cairo text-4xl font-black leading-[1.25] text-zinc-900 sm:text-5xl lg:text-[3.4rem]" style={{ animationDelay: '0.15s' }}>
            قطع غيار أصلية.
            <br />
            
            <span className="mt-2 inline-block pb-1 leading-[1.2] text-gradient-red">جودة تثق بها.</span>
          </h1>

          <p className="hero-up mt-5 max-w-lg text-lg leading-relaxed text-zinc-600" style={{ animationDelay: '0.25s' }}>
            كل ما تحتاجه لسيارتك في مكان واحد، بأفضل جودة وأسعار تنافسية.
          </p>

          <div className="hero-up mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: '0.35s' }}>
            <a
              href="/themes"
              className="btn-shine group inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 font-cairo text-base font-extrabold text-white shadow-xl shadow-brand-600/35 transition-all duration-300 hover:-translate-y-1 hover:bg-brand-700 hover:shadow-2xl hover:shadow-brand-600/45"
            >
              تصفح المنتجات
              <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1.5" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-zinc-900 bg-white px-8 py-[14px] font-cairo text-base font-extrabold text-zinc-900 transition-all duration-300 hover:-translate-y-1 hover:border-brand-600 hover:text-brand-600 hover:shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
              تواصل معنا
            </a>
          </div>

          {/* mini stats */}
          <div className="hero-up mt-10 flex flex-wrap gap-8" style={{ animationDelay: '0.45s' }}>
            {[
              { n: '000 12+', t: 'قطعة متوفرة' },
              { n: '000 1+', t: 'عميل سعيد' },
              { n: '15', t: 'سنة خبرة' },
            ].map((s) => (
              <div key={s.t} className="border-r-2 border-brand-600 pr-4">
                <p className="font-cairo text-2xl font-black text-zinc-900">{s.n}</p>
                <p className="text-sm font-medium text-zinc-500">{s.t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* visual */}
        <div className="hero-up relative" style={{ animationDelay: '0.3s' }}>
          <div className="relative overflow-hidden rounded-[2rem] border border-zinc-100 bg-gradient-to-b from-white via-zinc-50 to-zinc-200 shadow-2xl shadow-zinc-900/10">
            <div className="stripes-dark absolute inset-0" aria-hidden />
            <img
              src="/img/hero-car.png"
              alt="سيارة حديثة بقطع غيار أصلية من Khaled Auto Spart"
              className="img-in relative w-full scale-[1.02] object-contain"
              loading="eager"
            />
            <span className="absolute right-5 top-5 rounded-full bg-zinc-900/85 px-4 py-1.5 text-xs font-bold text-white backdrop-blur">
              معرض <span className="text-brand-400">KAS</span> 2026
            </span>
          </div>

          {/* floating part chips */}
          <button
            onClick={() => setSelected(rad)}
            className="animate-floaty group absolute -right-3 top-8 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white/95 p-3 pe-5 text-right shadow-xl shadow-zinc-900/10 backdrop-blur transition-all hover:-translate-y-1 hover:border-brand-200 sm:right-6"
          >
            <img src={rad.image} alt={rad.name} className="h-14 w-14 rounded-xl bg-zinc-50 object-cover p-1 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
            <span>
              <span className="block text-xs font-bold text-zinc-800">{rad.brand} — {rad.category}</span>
              <span className="mt-0.5 block font-cairo text-sm font-black text-brand-600">{formatPrice(rad.price)}</span>
            </span>
          </button>

          <button
            onClick={() => setSelected(lamp)}
            className="animate-floaty-slow group absolute -left-3 bottom-16 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white/95 p-3 pe-5 text-right shadow-xl shadow-zinc-900/10 backdrop-blur transition-all hover:-translate-y-1 hover:border-brand-200 sm:left-6"
            style={{ animationDelay: '1.2s' }}
          >
            <img src={lamp.image} alt={lamp.name} className="h-14 w-14 rounded-xl bg-zinc-50 object-cover p-1 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" />
            <span>
              <span className="block text-xs font-bold text-zinc-800">{lamp.brand} — المصباح الأمامي</span>
              <span className="mt-0.5 block font-cairo text-sm font-black text-brand-600">{formatPrice(lamp.price)}</span>
            </span>
          </button>

          <div className="animate-floaty absolute -bottom-4 right-10 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg shadow-zinc-900/10" style={{ animationDelay: '0.7s' }}>
            <Truck className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-bold text-zinc-700">توصيل خلال 24–48 ساعة</span>
          </div>
        </div>
      </div>

      {/* trust bar */}
      <div className="relative mx-auto mt-14 max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-4 rounded-3xl border border-zinc-100 bg-white p-6 shadow-xl shadow-zinc-900/5 sm:grid-cols-3">
          {[
            { icon: BadgeCheck, t: 'منتجات أصلية مضمونة', d: 'ضمان حقيقي على جميع القطع' },
            { icon: Truck, t: 'توصيل سريع', d: 'لجميع الولايات خلال 24–48 ساعة' },
            { icon: ShieldCheck, t: 'دفع آمن عند الاستلام', d: 'افحص طلبك قبل الدفع' },
          ].map((f) => (
            <div key={f.t} className="group flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
                <f.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-cairo font-extrabold text-zinc-900">{f.t}</p>
                <p className="text-sm text-zinc-500">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
