import { MessageCircle } from 'lucide-react'
import { WHATSAPP_NUMBER } from '@/data/products'

export default function WhatsAppFloat() {
  const text = encodeURIComponent('مرحبًا، أحتاج مساعدة في اختيار قطعة غيار لسيارتي.')
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      className="group fixed bottom-6 left-6 z-40 flex items-center gap-3"
      aria-label="تواصل معنا على واتساب"
    >
      <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap rounded-full bg-white text-sm font-bold text-zinc-800 shadow-xl transition-all duration-500 group-hover:max-w-72 group-hover:px-5 group-hover:py-3">
        هل تحتاج مساعدة في اختيار القطعة؟ تواصل معنا على واتساب.
      </span>
      <span className="pulse-ring relative grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 transition-transform duration-300 group-hover:scale-110">
        <MessageCircle className="h-7 w-7" />
      </span>
    </a>
  )
}
