import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Menu, Phone, ShoppingCart, X } from 'lucide-react'
import Logo from './Logo'
import { useShop } from '@/context/ShopContext'
import { useStoreSettings } from '@/context/SettingsContext'

// Hash targets live on the Home page, so they must be prefixed with "/" —
// a bare "#brands" on /search or /ads resolves to nothing.
const LINKS = [
  { href: '/#home', label: 'الرئيسية' },
  { href: '/#search', label: 'البحث عن القطع' },
  { href: '/#products', label: 'قطع الغيار' },
  { href: '/#brands', label: 'العلامات التجارية' },
  { href: '/#offers', label: 'العروض' },
  { href: '/#about', label: 'من نحن' },
  { href: '/#contact', label: 'اتصل بنا' },
]

export default function Navbar() {
  const { count, setCartOpen, lastAddedAt } = useShop()
  const { phoneDisplay, phoneCall } = useStoreSettings()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [pop, setPop] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!lastAddedAt) return
    setPop(true)
    const t = setTimeout(() => setPop(false), 500)
    return () => clearTimeout(t)
  }, [lastAddedAt])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled ? 'bg-white/90 shadow-lg shadow-zinc-900/5 backdrop-blur-xl' : 'bg-white/60 backdrop-blur-sm'
      }`}
    >
      {/* top thin strip */}
      <div className={`overflow-hidden bg-zinc-950 text-white transition-all duration-500 ${scrolled ? 'max-h-0' : 'max-h-10'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2 text-[11px] sm:text-xs">
          <p className="flex items-center gap-2 min-w-0">
            <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand-500" />
            <span className="truncate">توصيل سريع لجميع الولايات — الدفع عند الاستلام</span>
          </p>
          <a href={`tel:${phoneCall}`} dir="ltr" className="flex items-center gap-1.5 font-semibold transition-colors hover:text-brand-400">
            <Phone className="h-3.5 w-3.5" /> {phoneDisplay}
          </a>
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Logo />

        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              {l.href.startsWith('/') ? (
                <Link to={l.href} className="nav-link text-[15px] font-semibold text-zinc-700 transition-colors hover:text-brand-600">
                  {l.label}
                </Link>
              ) : (
                <a href={l.href} className="nav-link text-[15px] font-semibold text-zinc-700 transition-colors hover:text-brand-600">
                  {l.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCartOpen(true)}
            className="relative grid h-11 w-11 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-800 shadow-sm transition-all hover:border-brand-300 hover:text-brand-600 overflow-visible"
            aria-label="سلة التسوق"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span
                className={`absolute -left-2 -top-2 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 font-mono text-[11px] font-bold text-white shadow-md shadow-brand-600/40 ring-2 ring-white ${
                  pop ? 'badge-pop' : ''
                }`}
              >
                {count}
              </span>
            )}
          </button>
          <Link
            to="/#search"
            className="btn-shine hidden rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/40 md:block"
          >
            تسوّق الآن
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-800 lg:hidden"
            aria-label="القائمة"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* mobile menu — grid-rows transition instead of max-h so 7 links can never clip */}
      <div
        className={`grid overflow-hidden bg-white transition-all duration-500 lg:hidden ${
          open ? 'grid-rows-[1fr] border-t border-zinc-100' : 'grid-rows-[0fr]'
        }`}
      >
        <ul className="min-h-0 space-y-1 overflow-hidden px-6 py-4">
          {LINKS.map((l, i) => (
            <li key={l.href} style={{ transitionDelay: `${i * 40}ms` }}>
              <Link
                to={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg px-3 font-semibold text-zinc-700 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
