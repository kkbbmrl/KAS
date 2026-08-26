import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  AlertTriangle,
  Boxes,
  Edit,
  History,
  Loader2,
  RefreshCw,
  Search,
  Warehouse,
  X,
  XCircle,
} from 'lucide-react'
import {
  fetchAdminInventory,
  adjustAdminInventory,
  fetchAdminInventoryTransactions,
} from '@/lib/adminApi'
import { formatPrice } from '@/data/products'
import { resolveImageUrl } from '@/lib/api'

export default function AdminInventory() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 30, pages: 1 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all')
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<'stock' | 'ledger'>('stock')

  // Synchronize statusFilter with URL query params
  useEffect(() => {
    const urlStatus = searchParams.get('status') || 'all'
    if (urlStatus !== statusFilter) {
      setStatusFilter(urlStatus)
      setPage(1)
    }
  }, [searchParams])

  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter)
    setPage(1)
    const nextParams = new URLSearchParams(searchParams)
    if (newFilter === 'all') {
      nextParams.delete('status')
    } else {
      nextParams.set('status', newFilter)
    }
    setSearchParams(nextParams)
  }

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [activeVariant, setActiveVariant] = useState<any | null>(null)
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustReason, setAdjustReason] = useState('استلام بضاعة جديدة من المورد')
  const [saving, setSaving] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetchAdminInventory({ status: statusFilter, q: query, page, limit: 30 }),
      fetchAdminInventoryTransactions(),
    ])
      .then(([invRes, txRes]) => {
        setItems(invRes.items || [])
        setPagination(invRes.pagination || { total: 0, page: 1, limit: 30, pages: 1 })
        setTransactions(txRes || [])
      })
      .catch((err) => console.error('Error loading inventory:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {

    loadData()
  }, [statusFilter, page])

  const openAdjust = (item: any) => {
    setActiveVariant(item)
    setAdjustQty(item.stockQuantity)
    setAdjustReason('جرد دوري للمخزن')
    setAdjustModalOpen(true)
  }

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeVariant) return
    setSaving(true)
    try {
      await adjustAdminInventory({
        variantId: activeVariant.variantId,
        newQuantity: adjustQty,
        reason: adjustReason,
      })
      setAdjustModalOpen(false)
      loadData()
    } catch (err) {
      console.error('Failed to adjust inventory:', err)
    } finally {
      setSaving(false)
    }
  }

  // Calculate high-level stock counts
  const totalStockItems = items.reduce((s, i) => s + Number(i.stockQuantity || 0), 0)
  const lowStockCount = items.filter((i) => i.stockQuantity > 0 && i.stockQuantity <= 5).length
  const outOfStockCount = items.filter((i) => i.stockQuantity === 0).length

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
            <Warehouse className="h-3.5 w-3.5" /> نظام الجرد المزدوج وتنبيهات النواقص
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            إدارة المخزون والمستودعات
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            متابعة حية للكميات المتوفرة، حركات الجرد وسجل العمليات
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setTab('stock')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-cairo text-xs font-bold transition-all ${
                tab === 'stock' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
              }`}
            >
              <Boxes className="h-3.5 w-3.5" /> المخزون الفعلي
            </button>
            <button
              onClick={() => setTab('ledger')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-cairo text-xs font-bold transition-all ${
                tab === 'ledger' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
              }`}
            >
              <History className="h-3.5 w-3.5" /> سجل الحركات (Ledger)
            </button>
          </div>

          <button
            onClick={loadData}
            className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── QUICK METRICS (Clickable Filter Toggles) ─── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => handleFilterChange('all')}
          className={`text-right rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
            statusFilter === 'all'
              ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/30'
              : 'border-zinc-200/80 bg-white hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-extrabold text-zinc-600">إجمالي القطع في المستودع</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Warehouse className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-cairo text-2xl font-black text-zinc-900">
            {totalStockItems.toLocaleString('en-US')} <span className="text-xs text-zinc-400">قطعة جاهزة للشحن</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('low_stock')}
          className={`text-right rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
            statusFilter === 'low_stock'
              ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/40'
              : 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-extrabold text-amber-800">تنبيهات مخزون منخفض (≤ 5)</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-cairo text-2xl font-black text-amber-950">
            {lowStockCount} <span className="text-xs font-bold text-amber-700">أصناف تحتاج إعادة طلب</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('out_of_stock')}
          className={`text-right rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
            statusFilter === 'out_of_stock'
              ? 'border-red-500 bg-red-50/80 ring-2 ring-red-500/40'
              : 'border-red-200 bg-red-50/30 hover:bg-red-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-extrabold text-red-800">أصناف نفد مخزونها (0)</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-700">
              <XCircle className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-cairo text-2xl font-black text-red-950">
            {outOfStockCount} <span className="text-xs font-bold text-red-700">غير متوفرة حالياً</span>
          </p>
        </button>
      </div>

      {tab === 'stock' ? (
        /* ─── STOCK TAB ─── */
        <div className="space-y-4">
          {/* Filters */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث برقم القطعة PN، اسم المتغير، أو كود SKU..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-2.5 pe-4 ps-10 font-cairo text-xs font-bold text-zinc-900 outline-none focus:border-brand-600 focus:bg-white"
                />
              </div>
              <button
                onClick={() => {
                  setPage(1)
                  loadData()
                }}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 font-cairo text-xs font-black text-white hover:bg-black transition-colors"
              >
                تصفية
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
              <span className="text-xs font-black text-zinc-400 ml-2">حالة التوفر:</span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'low_stock', label: 'مخزون منخفض فقط' },
                { id: 'out_of_stock', label: 'نفد المخزون فقط' },
                { id: 'in_stock', label: 'متوفر بكمية كافية' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleFilterChange(st.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    statusFilter === st.id
                      ? 'bg-zinc-900 text-white font-black shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50/70 font-cairo font-extrabold text-zinc-500">
                  <tr>
                    <th className="p-4">المنتج / المتغير</th>
                    <th className="p-4">الماركة / الفئة</th>
                    <th className="p-4">رقم القطعة PN</th>
                    <th className="p-4">سعر الوحدة</th>
                    <th className="p-4">الكمية الحالية</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">آخر تعديل</th>
                    <th className="p-4 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-bold">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-zinc-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                        جاري جرد المخزون...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-zinc-400">
                        لا توجد أصناف مطابقة للفلتر
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => {
                      const stockQty = Number(it.stockQuantity || 0)
                      const stockBadge =
                        stockQty === 0
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : stockQty <= 5
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'

                      return (
                        <tr key={it.variantId} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {it.image && (
                                <img src={resolveImageUrl(it.image)} alt={it.productName} className="h-10 w-10 rounded-xl object-contain bg-zinc-50 border p-1" />
                              )}
                              <div>
                                <p className="font-cairo font-black text-zinc-900">{it.productName}</p>
                                <p className="text-[11px] text-zinc-500">{it.variantLabel}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="font-cairo text-zinc-800 block">{it.category}</span>
                            <span className="text-[10px] text-zinc-400">{it.brand}</span>
                          </td>

                          <td className="p-4">
                            <span className="font-cairo font-black text-zinc-900 block" dir="ltr">{it.partNumber}</span>
                            <span className="text-[10px] text-zinc-400" dir="ltr">{it.sku}</span>
                          </td>

                          <td className="p-4 font-cairo font-black text-brand-600">
                            {formatPrice(it.price || 0)}
                          </td>

                          <td className="p-4 font-cairo font-black text-base text-zinc-900">
                            {stockQty} <span className="text-xs text-zinc-400">قطعة</span>
                          </td>

                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-black ${stockBadge}`}>
                              {stockQty === 0 ? 'نفد' : stockQty <= 5 ? 'منخفض' : 'متوفر'}
                            </span>
                          </td>

                          <td className="p-4 text-[11px] text-zinc-400 font-normal">
                            {new Date(it.updatedAt).toLocaleDateString('fr-FR')}
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => openAdjust(it)}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-cairo text-xs font-bold text-zinc-700 hover:border-brand-300 hover:text-brand-600 shadow-sm transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>تعديل الجرد</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 p-4 text-xs font-bold text-zinc-500">

              <span>إجمالي {pagination.total} صنف بالمستودع</span>
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
        </div>
      ) : (
        /* ─── TRANSACTIONS / LEDGER TAB ─── */
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="bg-zinc-50/70 p-4 border-b border-zinc-100">
            <h3 className="font-cairo text-xs font-black text-zinc-800">
              سجل حركات المخزون والمبيعات (Inventory Audit Ledger)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-cairo font-extrabold text-zinc-500">
                <tr>
                  <th className="p-4">المنتج / المتغير</th>
                  <th className="p-4">نوع الحركة</th>
                  <th className="p-4">التغيير (Delta)</th>
                  <th className="p-4">الرصيد بعد الحركة</th>
                  <th className="p-4">السبب / الملاحظة</th>
                  <th className="p-4">بواسطة</th>
                  <th className="p-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-bold">
                {transactions.map((tx) => {
                  const isPositive = Number(tx.quantityDelta) > 0
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-4">
                        <p className="font-cairo font-black text-zinc-900">{tx.productName}</p>
                        <p className="text-[10px] text-zinc-400" dir="ltr">PN: {tx.partNumber}</p>
                      </td>

                      <td className="p-4">
                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-700">
                          {tx.deltaType}
                        </span>
                      </td>

                      <td className="p-4 font-cairo font-black">
                        <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                          {isPositive ? `+${tx.quantityDelta}` : tx.quantityDelta}
                        </span>
                      </td>

                      <td className="p-4 font-cairo font-black text-zinc-900">
                        {tx.quantityAfter} قطعة
                      </td>

                      <td className="p-4 text-zinc-600 font-normal">
                        {tx.reason || 'تعديل آلي'}
                      </td>

                      <td className="p-4 text-zinc-500 font-cairo">
                        {tx.createdBy}
                      </td>

                      <td className="p-4 text-[11px] text-zinc-400 font-normal" dir="ltr">
                        {new Date(tx.createdAt).toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ADJUST STOCK MODAL ─── */}
      {adjustModalOpen && activeVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setAdjustModalOpen(false)} />

          <div className="modal-in relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="font-cairo text-base font-black text-zinc-900">تعديل كمية المخزون</h3>
                <p className="text-xs text-zinc-500">{activeVariant.productName}</p>
              </div>
              <button onClick={() => setAdjustModalOpen(false)} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الكمية الإجمالية الجديدة *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 p-3 font-cairo text-lg font-black text-zinc-900 text-center"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">سبب التعديل (لتسجيله في Audit Ledger):</label>
                <input
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="مثال: شحنة جديدة من المورد، إرجاع طرد، تصحيح جرد..."
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-bold text-zinc-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  تأكيد التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
