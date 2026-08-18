import { CheckCircle2 } from 'lucide-react'
import { useShop } from '@/context/ShopContext'

export default function Toast() {
  const { toast, setCartOpen } = useShop()
  if (!toast) return null
  return (
    <button
      onClick={() => setCartOpen(true)}
      className="toast-in fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-zinc-950 px-6 py-4 text-sm font-bold text-white shadow-2xl shadow-zinc-950/40"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
      {toast}
      <span className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-extrabold">عرض السلة</span>
    </button>
  )
}
