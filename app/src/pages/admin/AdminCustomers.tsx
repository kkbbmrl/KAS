import { useEffect, useState } from 'react'
import {
  Ban,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react'
import {
  fetchAdminCustomers,
  fetchAdminCustomerDetails,
  toggleAdminCustomerBlacklist,
  updateAdminCustomerNotes,
} from '@/lib/adminApi'
import { formatPrice } from '@/data/products'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, pages: 1 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [query, setQuery] = useState('')
  const [blacklistFilter, setBlacklistFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Profile Drawer
  const [activeCust, setActiveCust] = useState<any | null>(null)
  const [notes, setNotes] = useState('')

  const loadCustomers = () => {
    setLoading(true)
    fetchAdminCustomers({
      q: query,
      isBlacklisted: blacklistFilter === 'blacklisted' ? 'true' : undefined,
      page,
      limit: 25,
    })
      .then((res) => {
        setCustomers(res.customers || [])
        setPagination(res.pagination || { total: 0, page: 1, limit: 25, pages: 1 })
      })
      .catch((err) => console.error('Error fetching customers:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCustomers()
  }, [blacklistFilter, page])

  const openDrawer = (id: string) => {
    fetchAdminCustomerDetails(id)
      .then((data) => {
        setActiveCust(data)
        setNotes(data.internalNotes || '')
      })
      .catch((err) => console.error(err))
  }


  const handleToggleBlacklist = async (id: string) => {
    try {
      await toggleAdminCustomerBlacklist(id)
      loadCustomers()
      if (activeCust && activeCust.id === id) {
        setActiveCust((prev: any) => ({ ...prev, isBlacklisted: !prev.isBlacklisted }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveNotes = async () => {
    if (!activeCust) return
    try {
      await updateAdminCustomerNotes(activeCust.id, notes)
      alert('تم حفظ ملاحظات العميل بنجاح')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            <Users className="h-3.5 w-3.5" /> سجل العملاء وإدارة علاقات الزبائن (CRM)
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            سجل العملاء وإحصائيات الزبائن
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            إجمالي {pagination.total} عميل مسجل مع تاريخ الطلبيات والقيمة الدائمة (LTV)
          </p>
        </div>

        <button
          onClick={loadCustomers}
          className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
          title="تحديث"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ─── FILTERS ─── */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            loadCustomers()
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم، رقم الهاتف (0555...)، أو البلدية..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-2.5 pe-4 ps-10 font-cairo text-xs font-bold text-zinc-900 outline-none focus:border-brand-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-5 py-2.5 font-cairo text-xs font-black text-white hover:bg-black transition-colors"
          >
            بحث
          </button>
        </form>

        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
          <span className="text-xs font-black text-zinc-400 ml-2">فلترة الحسابات:</span>
          {[
            { id: 'all', label: 'جميع العملاء' },
            { id: 'blacklisted', label: 'القائمة السوداء (محظور)' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setBlacklistFilter(st.id)
                setPage(1)
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                blacklistFilter === st.id
                  ? 'bg-zinc-900 text-white font-black shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── CUSTOMERS TABLE ─── */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/70 font-cairo font-extrabold text-zinc-500">
              <tr>
                <th className="p-4">العميل</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">الولاية / البلدية</th>
                <th className="p-4 text-center">الطلبات الكلية</th>
                <th className="p-4 text-left">إجمالي المشتريات (LTV)</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-bold">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                    جاري تحميل سجل العملاء...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400">
                    لا يوجد عملاء مطابقون للبحث
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 font-cairo font-black text-brand-700">
                          {c.firstName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-cairo font-black text-zinc-900">
                            {c.firstName} {c.lastName}
                          </p>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            مسجل منذ: {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <a href={`tel:${c.phone}`} className="font-cairo font-black text-zinc-900 hover:text-brand-600" dir="ltr">
                        {c.phone}
                      </a>
                    </td>

                    <td className="p-4">
                      <p className="text-zinc-900 font-cairo">{c.wilayaNameAr || c.wilayaCode}</p>
                      <p className="text-[10px] text-zinc-400">{c.commune || c.address}</p>
                    </td>

                    <td className="p-4 text-center font-cairo font-black text-zinc-900">
                      {c.totalOrdersCount || 1} طلبات
                    </td>

                    <td className="p-4 text-left font-cairo font-black text-brand-600">
                      {formatPrice(c.totalSpent || 16500)}
                    </td>

                    <td className="p-4">
                      {c.isBlacklisted ? (
                        <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700">
                          محظور
                        </span>
                      ) : (
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                          نشط
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openDrawer(c.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-cairo text-xs font-bold text-zinc-700 hover:border-brand-300 hover:text-brand-600 shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>الملف</span>
                        </button>
                        <button
                          onClick={() => handleToggleBlacklist(c.id)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            c.isBlacklisted ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'
                          }`}
                          title={c.isBlacklisted ? 'رفع الحظر' : 'إضافة للقائمة السوداء'}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 p-4 text-xs font-bold text-zinc-500">
          <span>إجمالي {pagination.total} عميل</span>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40"
            >
              السابق
            </button>
            <span className="px-2 font-cairo font-black text-zinc-900">
              صفحة {pagination.page} من {pagination.pages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {/* ─── CUSTOMER PROFILE DRAWER ─── */}
      {activeCust && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/70 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setActiveCust(null)} />

          <div className="drawer-in relative flex w-full max-w-lg flex-col bg-white shadow-2xl overflow-y-auto" dir="rtl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-6 py-4 backdrop-blur">
              <div>
                <h3 className="font-cairo text-lg font-black text-zinc-900">
                  {activeCust.firstName} {activeCust.lastName}
                </h3>
                <p className="text-xs text-zinc-400" dir="ltr">{activeCust.phone}</p>
              </div>
              <button onClick={() => setActiveCust(null)} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* Stats Card */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div>
                  <span className="text-[11px] font-bold text-zinc-400">إجمالي الطلبات:</span>
                  <p className="font-cairo text-lg font-black text-zinc-900">{activeCust.totalOrdersCount} طلبات</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400">حالة الحساب:</span>
                  <p className="font-cairo text-sm font-black mt-1">
                    {activeCust.isBlacklisted ? (
                      <span className="text-red-600">محظور في القائمة السوداء</span>
                    ) : (
                      <span className="text-emerald-600">عميل نشط وموثوق</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Order History */}
              <div>
                <p className="font-cairo text-xs font-black text-zinc-900 mb-3 flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-brand-600" /> سجل الطلبيات السابقة
                </p>

                <div className="space-y-2">
                  {(activeCust.orders || []).map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between rounded-xl border border-zinc-100 p-3 text-xs bg-white shadow-sm">
                      <div>
                        <span className="font-cairo font-black text-zinc-900 block" dir="ltr">{o.orderReference}</span>
                        <span className="text-[10px] text-zinc-400">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="text-left">
                        <span className="font-cairo font-black text-brand-600 block">{formatPrice(o.totalAmount)}</span>
                        <span className="rounded bg-zinc-100 px-2 py-0.2 text-[9px] font-bold text-zinc-700">{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CRM Notes */}
              <div>
                <label className="font-cairo text-xs font-black text-zinc-900 block mb-1">
                  ملاحظات خدمة العملاء (CRM Internal Notes):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="سجل أي تفاصيل هامة عن العميل..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-bold text-zinc-800 resize-none"
                />
                <button
                  onClick={handleSaveNotes}
                  className="mt-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-black"
                >
                  حفظ الملاحظات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
