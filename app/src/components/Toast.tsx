import { CheckCircle2 } from 'lucide-react'
import { useShop } from '@/context/ShopContext'

export default function Toast() {
  const { toast, setCartOpen, cartOpen } = useShop()
  // Suppressed while the drawer is open: at z-50 it sat on top of the
  // confirm-order button and swallowed the tap.
  if (!toast || cartOpen) return null
  return (
    <button
      onClick={() => setCartOpen(true)}
      className="toast-in fixed bottom-24 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-bold text-white shadow-2xl shadow-zinc-950/40"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
      <span className="min-w-0 truncate">{toast}</span>
      <span className="shrink-0 rounded-lg bg-brand-600 px-3 py-1 text-xs font-extrabold">عرض السلة</span>
    </button>
  )
}
