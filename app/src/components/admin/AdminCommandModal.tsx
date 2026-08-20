import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Boxes,
  ChevronRight,
  Loader2,
  Package,
  Search,
  User,
  X,
} from 'lucide-react'

import { adminGlobalSearch } from '@/lib/adminApi'
import { formatPrice } from '@/data/products'

interface AdminCommandModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdminCommandModal({ isOpen, onClose }: AdminCommandModalProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ orders: any[]; customers: any[]; products: any[] }>({
    orders: [],
    customers: [],
    products: [],
  })

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // trigger open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Live search debounce
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ orders: [], customers: [], products: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    const t = setTimeout(() => {
      adminGlobalSearch(query)
        .then((res) => {
          setResults(res)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 200)

    return () => clearTimeout(t)
  }, [query])

  if (!isOpen) return null

  const handleSelectOrder = (orderRef: string) => {
    onClose()
    navigate(`/admin/orders?q=${encodeURIComponent(orderRef)}`)
  }

  const handleSelectCustomer = (phone: string) => {
    onClose()
    navigate(`/admin/customers?q=${encodeURIComponent(phone)}`)
  }

  const handleSelectProduct = (sku: string) => {
    onClose()
    navigate(`/admin/products?q=${encodeURIComponent(sku)}`)
  }

  const hasAnyResults = results.orders.length > 0 || results.customers.length > 0 || results.products.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/70 p-4 pt-16 backdrop-blur-sm">
      <div className="fade-in absolute inset-0" onClick={onClose} />

      <div className="modal-in relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl" dir="rtl">
        {/* Search input header */}
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5">
          <Search className="h-5 w-5 shrink-0 text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم، رقم الطلب KAS-XXXX، رقم الهاتف، أو اسم ورقم القطعة..."
            className="flex-1 bg-transparent font-cairo text-sm font-bold text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-brand-600" />}
          <kbd className="hidden rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-extrabold text-zinc-500 sm:inline-block">
            ESC
          </kbd>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="py-8 text-center">
              <p className="font-cairo text-xs font-bold text-zinc-400">
                جرّب البحث عن: "KAS-", "055", "مشعاع", "بيجو", "Phare", "وهران"
              </p>
            </div>
          )}

          {query.trim().length >= 2 && !loading && !hasAnyResults && (
            <div className="py-8 text-center text-zinc-400 font-cairo text-sm">
              لا توجد نتائج مطابقة لـ "{query}"
            </div>
          )}

          {/* 1. Orders matching */}
          {results.orders.length > 0 && (
            <div>
              <p className="mb-2 font-cairo text-xs font-black text-zinc-400 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-brand-600" /> الطلبات المطابقة
              </p>
              <div className="space-y-1.5">
                {results.orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleSelectOrder(o.orderReference)}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-right transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-zinc-900 px-2.5 py-1 font-cairo text-xs font-black text-white" dir="ltr">
                        {o.orderReference}
                      </span>
                      <div>
                        <p className="font-cairo text-xs font-bold text-zinc-900">{o.firstName} {o.lastName}</p>
                        <p className="text-[11px] font-bold text-zinc-500" dir="ltr">{o.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-cairo text-xs font-black text-brand-600">{formatPrice(o.totalAmount)}</span>
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Customers matching */}
          {results.customers.length > 0 && (
            <div>
              <p className="mb-2 font-cairo text-xs font-black text-zinc-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" /> العملاء المطابقون
              </p>
              <div className="space-y-1.5">
                {results.customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c.phone)}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-right transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <div>
                      <p className="font-cairo text-xs font-bold text-zinc-900">{c.firstName} {c.lastName}</p>
                      <p className="text-[11px] font-bold text-zinc-500" dir="ltr">{c.phone} — {c.commune}</p>
                    </div>
                    <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-[10px] font-bold text-zinc-700">
                      {c.totalOrdersCount} طلبات
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Products matching */}
          {results.products.length > 0 && (
            <div>
              <p className="mb-2 font-cairo text-xs font-black text-zinc-400 flex items-center gap-1.5">
                <Boxes className="h-3.5 w-3.5 text-purple-600" /> المنتجات المطابقة
              </p>
              <div className="space-y-1.5">
                {results.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProduct(p.sku)}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-right transition-colors hover:border-purple-200 hover:bg-purple-50/50"
                  >
                    <div className="flex items-center gap-3">
                      {p.image && <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-contain bg-white p-1" />}
                      <div>
                        <p className="font-cairo text-xs font-bold text-zinc-900 line-clamp-1">{p.name}</p>
                        <p className="text-[10px] font-bold text-zinc-400" dir="ltr">PN: {p.partNumber} — {p.sku}</p>
                      </div>
                    </div>
                    <span className="font-cairo text-xs font-black text-brand-600">{formatPrice(p.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-4 py-2.5 text-[11px] font-bold text-zinc-500">
          <span>التنقل بالأسهم والمفتاح Enter</span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border bg-white px-1.5 py-0.5">ESC</kbd> للإغلاق
          </span>
        </div>
      </div>
    </div>
  )
}
