import { Cog } from 'lucide-react'

export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="#home" className="group flex items-center gap-3" aria-label="Khaled Auto Spart">
      <div className="relative">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 shadow-lg shadow-brand-600/30 transition-transform duration-500 group-hover:rotate-90">
          <Cog className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <span className="absolute -bottom-1 -left-1 grid h-5 w-5 place-items-center rounded-md bg-zinc-900 font-cairo text-[11px] font-black text-white shadow">
          K
        </span>
      </div>
      <div className="leading-none">
        <p className={`font-cairo text-lg font-black tracking-tight ${dark ? 'text-white' : 'text-zinc-900'}`}>
          Khaled <span className="text-brand-600">Auto</span> Spart
        </p>
        <p className={`mt-1 text-[11px] font-medium tracking-wider ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          قطع غيار السيارات الأصلية
        </p>
      </div>
    </a>
  )
}
