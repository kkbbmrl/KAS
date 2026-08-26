import { useEffect, useState } from 'react'
import {
  Activity,
  Boxes,
  Clock,
  KeyRound,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import { fetchAdminActivityLogs } from '@/lib/adminApi'

const CATEGORIES = [
  { id: 'all', label: 'جميع النشاطات', icon: Activity },
  { id: 'orders', label: 'الطلبيات والمبيعات', icon: Package },
  { id: 'product_variants', label: 'حركات المخزون', icon: Boxes },
  { id: 'system_settings', label: 'إعدادات المتجر', icon: Settings },
  { id: 'admin_sessions', label: 'تسجيل الدخول والأمان', icon: KeyRound },
  { id: 'admin_users', label: 'فريق العمل والصلاحيات', icon: Users },
]

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CREATE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  STATUS_CHANGE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  LOGIN: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ADJUST: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  UPDATE: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  DELETE: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadLogs = () => {
    setLoading(true)
    fetchAdminActivityLogs({
      category: activeCategory,
      q: searchQuery,
    })
      .then((data) => setLogs(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLogs()
  }, [activeCategory])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadLogs()
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> سجل التدقيق والأمان والعمليات
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            سجل العمليات والنشاطات (Audit Trail)
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            تسجيل فوري لجميع التعديلات على الطلبات، الأسعار، حركات المخزون، وتسجيلات الدخول
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
          title="تحديث السجل"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ─── FILTERS & SEARCH ─── */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، نوع الإجراء، رقم الطلبية، أو التفاصيل..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-2.5 pe-4 ps-10 font-cairo text-xs font-bold text-zinc-900 outline-none transition-all focus:border-brand-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-5 py-2.5 font-cairo text-xs font-black text-white hover:bg-black transition-colors"
          >
            بحث
          </button>
        </form>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100">
          <span className="text-xs font-black text-zinc-400 ml-2">تصنيف السجل:</span>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const active = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-zinc-900 text-white font-black shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── LOGS STREAM ─── */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-zinc-400">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-600 mb-3" />
            <p className="font-cairo text-sm font-black text-zinc-700">جاري قراءة سجل العمليات...</p>
            <p className="text-xs font-bold text-zinc-400 mt-1">يتم استرجاع السجلات من قاعدة البيانات</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-400 mb-3">
              <Activity className="h-6 w-6" />
            </div>
            <p className="font-cairo text-sm font-black text-zinc-800">لا توجد سجلات تطابق البحث المحدد</p>
            <p className="text-xs font-bold text-zinc-400 mt-1">
              سيتم تسجيل كل حركة بيع، تعديل مخزون أو تغيير إعدادات هنا تلقائياً
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {logs.map((log, idx) => {
              const actionStyle = ACTION_COLORS[log.actionType] || {
                bg: 'bg-zinc-100',
                text: 'text-zinc-700',
                border: 'border-zinc-200',
              }

              let IconComponent = Activity
              if (log.tableName === 'orders') IconComponent = Package
              else if (log.tableName === 'product_variants' || log.tableName === 'inventory') IconComponent = Boxes
              else if (log.tableName === 'system_settings') IconComponent = Settings
              else if (log.tableName === 'admin_sessions' || log.actionType === 'LOGIN') IconComponent = KeyRound
              else if (log.tableName === 'admin_users') IconComponent = Users

              return (
                <div
                  key={log.id || idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-zinc-50/70 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-cairo text-xs font-black text-zinc-900">
                        {log.note || `إجراء ${log.actionType} على جدول ${log.tableName}`}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-bold">
                        <span className="flex items-center gap-1 text-zinc-700">
                          <User className="h-3 w-3 text-brand-600" />
                          <span>{log.performedBy || 'System'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(log.createdAt).toLocaleString('fr-FR')}</span>
                        </span>
                        {log.ipAddress && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-zinc-400">IP: {log.ipAddress}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${actionStyle.bg} ${actionStyle.text} ${actionStyle.border}`}
                      dir="ltr"
                    >
                      {log.actionType || 'LOG'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
