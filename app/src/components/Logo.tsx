import { useLocation, useNavigate } from 'react-router'
import { Cog } from 'lucide-react'

export default function Logo({ dark = false }: { dark?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (location.pathname === '/') {
      if (window.location.hash) {
        window.history.pushState(null, '', '/')
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      const homeEl = document.getElementById('home')
      if (homeEl) {
        homeEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      navigate('/')
      window.scrollTo({ top: 0, behavior: 'instant' })
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 50)
    }
  }

  return (
    <a
      href="/"
      onClick={handleClick}
      className="group flex items-center gap-3 cursor-pointer select-none"
      aria-label="Khaled Auto Parts - الصفحة الرئيسية"
    >
      <div className="relative">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 shadow-lg shadow-brand-600/30 transition-transform duration-500 group-hover:rotate-90">
          <Cog className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
      </div>
      <div className="leading-none">
        <p className={`font-cairo text-lg font-black tracking-tight ${dark ? 'text-white' : 'text-zinc-900'}`}>
          Khaled <span className="text-brand-600">Auto</span> Parts
        </p>
        <p className={`mt-1 text-[11px] font-medium tracking-wider ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          قطع غيار السيارات الأصلية
        </p>
      </div>
    </a>
  )
}
