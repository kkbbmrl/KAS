import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Loader2,
  Package,
  Phone,
  RefreshCw,
  Search,
  Truck,
  User,
  X,
  XCircle,
} from 'lucide-react'

import {
  fetchAdminOrders,
  fetchAdminOrderDetails,
  updateAdminOrderStatus,
  updateAdminOrderNotes,
  bulkUpdateAdminOrderStatus,
} from '@/lib/adminApi'
import { ALGERIA_WILAYAS } from '@/data/wilayas'
import { formatPrice } from '@/data/products'
import { useAdminAuth } from '@/context/AdminAuthContext'

const STATUS_CONFIG: Record<string, { label: string; badgeCls: string; icon: any }> = {
  pending_confirmation: {
    label: 'بانتظار التأكيد',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  confirmed: {
    label: 'مؤكد',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: CheckCircle2,
  },
  processing: {
    label: 'قيد التجهيز',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Package,
  },
  dispatched: {
    label: 'تم الشحن',
    badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Truck,
  },
  out_for_delivery: {
    label: 'في التوزيع',
    badgeCls: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: Truck,
  },
  delivered: {
    label: 'تم التسليم',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  refused_returned: {
    label: 'راجع / ملغي',
    badgeCls: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
  },
  cancelled: {
    label: 'ملغي',
    badgeCls: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    icon: XCircle,
  },
}

export default function AdminOrders() {
  const { user } = useAdminAuth()

  // State
  const [orders, setOrders] = useState<any[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, pages: 1 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [wilaya, setWilaya] = useState('all')
  const [source, setSource] = useState('all')
  const [page, setPage] = useState(1)

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Details Modal Drawer
  const [activeOrder, setActiveOrder] = useState<any | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [trackingNum, setTrackingNum] = useState('')
  const [courierName, setCourierName] = useState('Yalidine')

  const loadOrders = () => {
    setLoading(true)
    fetchAdminOrders({ q: query, status, wilaya, source, page, limit: 25 })
      .then((res) => {
        setOrders(res.orders || [])
        setPagination(res.pagination || { total: 0, page: 1, limit: 25, pages: 1 })
      })
      .catch((err) => console.error('Failed to load orders:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [status, wilaya, source, page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadOrders()
  }

  const openOrderDrawer = (orderId: string) => {
    setActiveOrder(null)
    fetchAdminOrderDetails(orderId)
      .then((data) => {
        setActiveOrder(data)
        setNewStatus(data.status)
        setCallNotes(data.callCenterNotes || '')
        setTrackingNum(data.trackingNumber || '')
        setCourierName(data.courier || 'Yalidine')
      })
      .catch((err) => console.error('Failed to fetch order details:', err))
  }


  const handleUpdateStatus = async () => {
    if (!activeOrder || !newStatus) return
    setStatusUpdating(true)
    try {
      await updateAdminOrderStatus(activeOrder.id, {
        status: newStatus,
        note: statusNote,
        adminName: user?.name || 'Admin',
      })
      setStatusNote('')
      // Refresh active order & table
      openOrderDrawer(activeOrder.id)
      loadOrders()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!activeOrder) return
    try {
      await updateAdminOrderNotes(activeOrder.id, {
        callCenterNotes: callNotes,
        trackingNumber: trackingNum,
        courier: courierName,
      })
      alert('تم حفظ بيانات الشحن والملاحظات بنجاح')
      loadOrders()
    } catch (err) {
      console.error('Failed to save notes:', err)
    }
  }

  const handleBulkStatus = async (st: string) => {
    if (selectedIds.length === 0) return
    if (!confirm(`هل أنت متأكد من تغيير حالة ${selectedIds.length} طلب إلى "${STATUS_CONFIG[st]?.label || st}"؟`)) return

    try {
      await bulkUpdateAdminOrderStatus(selectedIds, st)
      setSelectedIds([])
      loadOrders()
    } catch (err) {
      console.error('Bulk update error:', err)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(orders.map((o) => o.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const exportCSV = () => {
    const headers = ['Order Ref', 'Customer', 'Phone', 'Wilaya', 'Total (DA)', 'Status', 'Date']
    const rows = orders.map((o) => [
      o.orderReference,
      `"${o.firstName} ${o.lastName}"`,
      `"${o.phone}"`,
      `"${o.wilayaNameAr || o.wilayaCode}"`,
      o.totalAmount,
      o.status,
      `"${new Date(o.createdAt).toLocaleDateString('en-US')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `kas_orders_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            <Package className="h-3.5 w-3.5" /> مركز إدارة ومتابعة الطلبيات
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            إدارة الطلبات (Orders Hub)
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            إجمالي {pagination.total} طلب مسجل في قاعدة البيانات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm hover:border-zinc-900 hover:text-zinc-900 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>تصدير CSV</span>
          </button>
          <button
            onClick={loadOrders}
            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── FILTERS BAR ─── */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm space-y-3">
        {/* Search row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث برقم الطلب (KAS-XXXXXX)، الاسم، رقم الهاتف، أو اسم القطعة..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-2.5 pe-4 ps-10 font-cairo text-xs font-bold text-zinc-900 outline-none transition-all focus:border-brand-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-5 py-2.5 font-cairo text-xs font-black text-white hover:bg-brand-700 transition-colors"
          >
            بحث
          </button>
        </form>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100">
          <span className="text-xs font-black text-zinc-400 ml-2">الحالة:</span>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'pending_confirmation', label: 'بانتظار التأكيد' },
            { id: 'confirmed', label: 'مؤكد' },
            { id: 'processing', label: 'قيد التجهيز' },
            { id: 'dispatched', label: 'تم الشحن' },
            { id: 'delivered', label: 'تم التسليم' },
            { id: 'cancelled', label: 'ملغي / راجع' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setStatus(st.id)
                setPage(1)
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                status === st.id
                  ? 'bg-zinc-900 text-white font-black shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Wilaya & Source Selectors */}
        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4 lg:grid-cols-6">
          <div>
            <label className="text-[11px] font-bold text-zinc-400 block mb-1">الولاية:</label>
            <select
              value={wilaya}
              onChange={(e) => {
                setWilaya(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs font-bold text-zinc-800 outline-none"
            >
              <option value="all">جميع الولايات (58)</option>
              {ALGERIA_WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} - {w.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-400 block mb-1">المصدر:</label>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs font-bold text-zinc-800 outline-none"
            >
              <option value="all">جميع المصادر</option>
              <option value="cart_checkout">سلة الشراء (Cart)</option>
              <option value="landing_offer">صفحة هبوط إعلانية (Landing Page)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── BULK ACTIONS BAR ─── */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/70 p-3">
          <span className="font-cairo text-xs font-black text-brand-900">
            تم تحديد {selectedIds.length} طلب
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkStatus('confirmed')}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              تأكيد جماعي
            </button>
            <button
              onClick={() => handleBulkStatus('dispatched')}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
            >
              شحن جماعي
            </button>
            <button
              onClick={() => handleBulkStatus('delivered')}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
            >
              تسليم جماعي
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-600"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* ─── ORDERS TABLE ─── */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/70 font-cairo font-extrabold text-zinc-500">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === orders.length && orders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-300 text-brand-600"
                  />
                </th>
                <th className="p-4">رقم الطلب</th>
                <th className="p-4">العميل / الهاتف</th>
                <th className="p-4">الولاية / العنوان</th>
                <th className="p-4">المنتجات</th>
                <th className="p-4">المجموع</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-bold">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-zinc-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                    جاري تحميل الطلبات...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-zinc-400">
                    لا توجد طلبات مطابقة للفلتر المحدد
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const statusInfo = STATUS_CONFIG[o.status] || {
                    label: o.status,
                    badgeCls: 'bg-zinc-100 text-zinc-600 border-zinc-200',
                  }
                  const isSelected = selectedIds.includes(o.id)

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        isSelected ? 'bg-brand-50/30' : ''
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(o.id)}
                          className="rounded border-zinc-300 text-brand-600"
                        />
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => openOrderDrawer(o.id)}
                          className="font-cairo font-black text-zinc-900 hover:text-brand-600 transition-colors"
                          dir="ltr"
                        >
                          {o.orderReference}
                        </button>
                        <span className="block text-[10px] text-zinc-400">
                          {o.source === 'landing_offer' ? 'صفحة إعلانية' : 'سلة المتجر'}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="font-cairo text-zinc-900">{o.firstName} {o.lastName}</p>
                        <a
                          href={`tel:${o.phone}`}
                          className="text-[11px] font-bold text-zinc-500 hover:text-brand-600"
                          dir="ltr"
                        >
                          {o.phone}
                        </a>
                      </td>

                      <td className="p-4">
                        <p className="text-zinc-900 font-cairo">{o.wilayaNameAr || o.wilayaCode}</p>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">{o.commune || o.address}</p>
                      </td>

                      <td className="p-4">
                        <p className="font-cairo text-zinc-900 line-clamp-1">
                          {o.mainProduct || 'قطعة غيار'}
                        </p>
                        <span className="text-[10px] text-zinc-400">
                          {o.itemsCount} قطع
                        </span>
                      </td>

                      <td className="p-4 font-cairo font-black text-brand-600">
                        {formatPrice(o.totalAmount)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-black ${statusInfo.badgeCls}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="p-4 text-[11px] text-zinc-500 font-normal">
                        {new Date(o.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => openOrderDrawer(o.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-cairo text-xs font-bold text-zinc-700 hover:border-brand-300 hover:text-brand-600 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>تفاصيل</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 p-4 text-xs font-bold text-zinc-500">
          <span>
            عرض {(pagination.page - 1) * pagination.limit + 1} إلى{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} من أصل{' '}
            {pagination.total} طلب
          </span>

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

      {/* ─── ORDER DETAILS DRAWER / MODAL ─── */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/70 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setActiveOrder(null)} />

          <div className="drawer-in relative flex w-full max-w-2xl flex-col bg-white shadow-2xl overflow-y-auto" dir="rtl">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-6 py-4 backdrop-blur">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-cairo text-lg font-black text-zinc-900" dir="ltr">
                    #{activeOrder.orderReference}
                  </h3>
                  <span
                    className={`rounded-md border px-2.5 py-0.5 text-[10px] font-black ${
                      STATUS_CONFIG[activeOrder.status]?.badgeCls
                    }`}
                  >
                    {STATUS_CONFIG[activeOrder.status]?.label || activeOrder.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-400">
                  تاريخ الإنشاء:{' '}
                  {new Date(activeOrder.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>

              <button
                onClick={() => setActiveOrder(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* 1. Status Management Box */}
              <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/40 p-5">
                <p className="font-cairo text-xs font-black text-brand-900 mb-3">
                  تحديث حالة الطلبية وتسجيل الملاحظات:
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">الحالة الجديدة:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-bold text-zinc-900 outline-none"
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">سبب الإلغاء / ملاحظة المتابعة:</label>
                    <input
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="مثال: تم الاتصال بالزبون وأكد الشحن..."
                      className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-bold text-zinc-900 outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={statusUpdating}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-50"
                  >
                    {statusUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    حفظ وتحديث الحالة
                  </button>
                </div>
              </div>

              {/* 2. Customer Profile & Delivery Details */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 space-y-3">
                <p className="font-cairo text-xs font-black text-zinc-900 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-brand-600" /> بيانات العميل والشحن
                </p>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400 font-bold block">الاسم واللقب:</span>
                    <span className="font-cairo font-black text-zinc-900">
                      {activeOrder.firstName} {activeOrder.lastName}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 font-bold block">رقم الهاتف:</span>
                    <a
                      href={`tel:${activeOrder.phone}`}
                      className="font-cairo font-black text-brand-600 hover:underline flex items-center gap-1"
                      dir="ltr"
                    >
                      <Phone className="h-3 w-3" /> {activeOrder.phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-zinc-400 font-bold block">الولاية:</span>
                    <span className="font-cairo font-bold text-zinc-800">
                      {activeOrder.wilayaCode} - {activeOrder.wilayaNameAr} ({activeOrder.wilayaNameFr})
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 font-bold block">العنوان / البلدية:</span>
                    <span className="font-bold text-zinc-800">
                      {activeOrder.address}
                    </span>
                  </div>
                </div>

                {activeOrder.customerNotes && (
                  <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 font-bold">
                    <span className="block font-black mb-0.5">ملاحظة العميل:</span>
                    {activeOrder.customerNotes}
                  </div>
                )}
              </div>

              {/* 3. Items Ordered */}
              <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200 flex justify-between items-center">
                  <p className="font-cairo text-xs font-black text-zinc-900">
                    القطع المطلوبة في هذه الشحنة:
                  </p>
                  <span className="text-xs font-bold text-zinc-400">
                    {activeOrder.items?.length || 0} صنف
                  </span>
                </div>

                <div className="divide-y divide-zinc-100 p-2">
                  {(activeOrder.items || []).map((it: any) => (
                    <div key={it.id} className="flex items-center justify-between p-3 text-xs">
                      <div>
                        <p className="font-cairo font-black text-zinc-900">{it.name}</p>
                        <p className="text-[10px] text-zinc-400 font-bold" dir="ltr">PN: {it.partNumber}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-cairo font-black text-brand-600">
                          {formatPrice(it.price)} × {it.qty}
                        </p>
                        <span className="text-[11px] font-bold text-zinc-500">
                          = {formatPrice(it.lineTotal || it.price * it.qty)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="bg-zinc-50/80 p-4 border-t border-zinc-200 space-y-1.5 text-xs font-bold">
                  <div className="flex justify-between text-zinc-600">
                    <span>مجموع المنتجات:</span>
                    <span>{formatPrice(activeOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>رسوم التوصيل:</span>
                    <span>{formatPrice(activeOrder.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-900 font-cairo font-black text-sm pt-2 border-t border-zinc-200">
                    <span>المبلغ الكلي المستحق عند الاستلام:</span>
                    <span className="text-brand-600">{formatPrice(activeOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* 4. Shipping & Call Center CRM Notes */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
                <p className="font-cairo text-xs font-black text-zinc-900 flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-indigo-600" /> بيانات شركة التوصيل (Yalidine)
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500 block mb-1">شركة الشحن:</label>
                    <input
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs font-bold text-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-500 block mb-1">رقم البوليصة / التتبع (Tracking):</label>
                    <input
                      value={trackingNum}
                      onChange={(e) => setTrackingNum(e.target.value)}
                      placeholder="YAL-XXXXXXX"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs font-bold text-zinc-800"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">ملاحظات الكول سنتر والمتابعة الداخلية:</label>
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={2}
                    placeholder="اكتب ملاحظات داخلية لفريق العمل..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs font-bold text-zinc-800 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 shadow-sm"
                  >
                    حفظ معلومات الشحن
                  </button>
                </div>
              </div>

              {/* 5. Order Timeline History */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
                <p className="font-cairo text-xs font-black text-zinc-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-purple-600" /> سجل وأحداث الطلب (Timeline)
                </p>

                <div className="relative border-r-2 border-zinc-200 pr-4 space-y-4 mr-2">
                  {(activeOrder.timeline || []).map((tl: any) => (
                    <div key={tl.id} className="relative">
                      <span className="absolute -right-[21px] top-1 h-3 w-3 rounded-full bg-brand-600 border-2 border-white shadow" />
                      <div>
                        <p className="font-cairo text-xs font-black text-zinc-900">{tl.title}</p>
                        {tl.note && <p className="text-[11px] text-zinc-600 mt-0.5">{tl.note}</p>}
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-400 font-bold">
                          <span>بواسطة: {tl.createdBy}</span>
                          <span>{new Date(tl.createdAt).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
