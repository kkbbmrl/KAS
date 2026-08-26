import { Clock3, Facebook, Instagram, Mail, MapPin, Music2, Phone } from 'lucide-react'
import { Link } from 'react-router'
import Logo from './Logo'
import { useStoreSettings } from '@/context/SettingsContext'

const QUICK = [
  { href: '/#home', label: 'الرئيسية' },
  { href: '/#search', label: 'البحث عن القطع' },
  { href: '/#products', label: 'قطع الغيار' },
  { href: '/#brands', label: 'العلامات التجارية' },
  { href: '/#offers', label: 'العروض' },
  { href: '/#about', label: 'من نحن' },
  { href: '/#contact', label: 'اتصل بنا' },
]

const CATS = ['المشعاع', 'المصباح الأمامي', 'زجاج المصباح', 'الصدام', 'المروحة', 'غطاء الغبار', 'الغطاء الأمامي', 'ماسحة الزجاج']

const FACEBOOK_PROFILE_URL = 'https://www.facebook.com/profile.php?id=61551072453312'
const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/khaledautosparts'

const SOCIALS = [
  { icon: Facebook, label: 'فيسبوك', href: FACEBOOK_PROFILE_URL },
  { icon: Instagram, label: 'إنستغرام', href: INSTAGRAM_PROFILE_URL },
  { icon: Music2, label: 'تيك توك', href: FACEBOOK_PROFILE_URL },
]

export default function Footer() {
  const { storeName, phoneDisplay, phoneCall, email, address, mapsUrl, workHours } = useStoreSettings()

  return (
    <footer className="relative overflow-hidden bg-zinc-950 text-zinc-300">
      <div className="stripes absolute inset-0 opacity-40" aria-hidden />
      <div className="pointer-events-none absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-brand-600/15 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-16">
        <div className="grid gap-12 lg:grid-cols-4">
          <div>
            <Logo dark />
            <p className="mt-5 text-sm leading-relaxed text-zinc-400">
              وجهتك الأولى لقطع غيار السيارات الأصلية — جودة تثق بها، وخدمة تليق بك وبسيارتك.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-800 text-zinc-400 transition-all duration-300 hover:-translate-y-1 hover:border-brand-600 hover:bg-brand-600 hover:text-white"
                >
                  <s.icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="font-cairo text-base font-extrabold text-white">روابط سريعة</p>
            <div className="mt-2 h-0.5 w-10 rounded bg-brand-600" />
            <ul className="mt-5 space-y-2.5">
              {QUICK.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="group flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white">
                    <span className="h-px w-3 bg-brand-600 transition-all group-hover:w-5" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-cairo text-base font-extrabold text-white">فئات المنتجات</p>
            <div className="mt-2 h-0.5 w-10 rounded bg-brand-600" />
            <ul className="mt-5 grid grid-cols-1 gap-2.5">
              {CATS.map((c) => (
                <li key={c}>
                  <a href={`/#search?cat=${encodeURIComponent(c)}`} className="group flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white">
                    <span className="h-px w-3 bg-brand-600 transition-all group-hover:w-5" />
                    {c}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-cairo text-base font-extrabold text-white">معلومات التواصل</p>
            <div className="mt-2 h-0.5 w-10 rounded bg-brand-600" />
            <ul className="mt-5 space-y-3.5 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-brand-500" />
                <a href={`tel:${phoneCall}`} className="hover:text-brand-400 transition-colors" dir="ltr">
                  {phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-brand-500" />
                <a href={`mailto:${email}`} className="hover:text-brand-400 transition-colors" dir="ltr">
                  {email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-400 transition-colors">
                  {address}
                </a>
              </li>
              <li className="flex items-center gap-3"><Clock3 className="h-4 w-4 shrink-0 text-brand-500" />{workHours}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-zinc-800/80 pt-7 sm:flex-row">
          <p className="text-sm text-zinc-500">© 2026 {storeName}. جميع الحقوق محفوظة.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400">
            <p className="flex items-center gap-1.5">
              <span className="text-zinc-500">تطوير وتصميم:</span>
              <a
                href="https://github.com/kkbbmrl"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-brand-400 hover:text-brand-300 hover:underline transition-colors"
                title="GitHub: kkbbmrl"
              >
                kkbbmrl
              </a>
            </p>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <p className="flex items-center gap-2 text-zinc-600">
              صُنع بإتقان
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
              قطع أصلية — جودة مضمونة
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
