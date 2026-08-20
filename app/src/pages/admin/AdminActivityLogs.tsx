import { useEffect, useState } from 'react'
import { Activity, Clock, Loader2, RefreshCw, User } from 'lucide-react'
import { fetchAdminActivityLogs } from '@/lib/adminApi'


export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadLogs = () => {
    setLoading(true)
    fetchAdminActivityLogs()
      .then((data) => setLogs(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLogs()
  }, [])

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700">
            <Activity className="h-3.5 w-3.5" /> سجل التدقيق والأمان
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            سجل العمليات والنشاطات (Audit Trail)
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            تسجيل فوري لجميع التعديلات على الطلبات، الأسعار، المخزون وإعدادات النظام
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
          title="تحديث"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ─── LOGS STREAM ─── */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-400">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
            جاري استرجاع سجل العمليات...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-zinc-400">
            لا توجد سجلات عمليات مسجلة بعد في قاعدة البيانات.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {logs.map((log, idx) => (
              <div key={log.id || idx} className="flex items-center justify-between p-4 hover:bg-zinc-50/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-cairo text-xs font-black text-zinc-900">
                      {log.note || `إجراء ${log.actionType} على جدول ${log.tableName}`}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-zinc-400 font-bold">
                      <span className="flex items-center gap-1 text-zinc-600">
                        <User className="h-3 w-3" /> {log.performedBy || 'System'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-[10px] font-black text-zinc-700 uppercase" dir="ltr">
                  {log.actionType || 'UPDATE'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
