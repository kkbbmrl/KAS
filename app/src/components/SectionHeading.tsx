export default function SectionHeading({
  kicker,
  title,
  sub,
  light = false,
}: {
  kicker: string
  title: string
  sub?: string
  light?: boolean
}) {
  return (
    <div className="reveal mx-auto mb-12 max-w-2xl text-center">
      <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-extrabold tracking-wide ${light ? 'border-white/25 bg-white/10 text-white' : 'border-brand-200 bg-brand-50 text-brand-700'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${light ? 'bg-white' : 'bg-brand-600'}`} />
        {kicker}
      </span>
      <h2 className={`mt-4 font-cairo text-3xl font-black leading-snug sm:text-4xl ${light ? 'text-white' : 'text-zinc-900'}`}>{title}</h2>
      <div className="mx-auto mt-4 flex items-center justify-center gap-2" aria-hidden>
        <span className={`h-1 w-10 rounded-full ${light ? 'bg-white/40' : 'bg-zinc-200'}`} />
        <span className="h-1.5 w-16 rounded-full bg-brand-600" />
        <span className={`h-1 w-10 rounded-full ${light ? 'bg-white/40' : 'bg-zinc-200'}`} />
      </div>
      {sub && <p className={`mt-4 text-base leading-relaxed ${light ? 'text-zinc-300' : 'text-zinc-500'}`}>{sub}</p>}
    </div>
  )
}
