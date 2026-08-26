import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  RefreshCw,
  TrendingUp,
  Truck,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { fetchAdminOverview, fetchAdminCharts } from '@/lib/adminApi'
import { formatPrice } from '@/data/products'

export default function AdminOverview() {
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<any>(null)
  const [charts, setCharts] = useState<any>(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([fetchAdminOverview(range), fetchAdminCharts()])
      .then(([overviewData, chartData]) => {
        setKpis(overviewData.kpis)
        setCharts(chartData)
      })
      .catch((err) => console.error('Failed to load dashboard data:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [range])

  const RANGES = [
    { id: 'today', label: 'اليوم' },
    { id: '7d', label: 'آخر 7 أيام' },
    { id: '30d', label: 'آخر 30 يوم' },
    { id: 'this_month', label: 'هذا الشهر' },
  ]

  return (
    <div className="space-y-8" dir="rtl">
      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
            <Zap className="h-3.5 w-3.5" /> مركز القيادة والتحليلات الحية
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            نظرة عامة على الأداء والمبيعات
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            متابعة دقيقة للطلبات، المخزون، الحملات التسويقية ومعدلات التحويل
          </p>
        </div>

        {/* Range Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`rounded-lg px-3 py-1.5 font-cairo text-xs font-bold transition-all ${
                  range === r.id
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 1. CORE REVENUE & ORDERS KPI CARDS ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-extrabold text-zinc-500">إجمالي المبيعات</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 font-cairo text-2xl font-black text-zinc-900">
            {formatPrice(kpis?.totalRevenue ?? 0)}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-black text-emerald-600">
              <ArrowUpRight className="h-4 w-4" /> {kpis?.revenueTrend ?? '0%'}
            </span>
            <span className="text-zinc-400 font-bold">مقارنة بالفترة السابقة</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-extrabold text-zinc-500">إجمالي الطلبات</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Package className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 font-cairo text-2xl font-black text-zinc-900">
            {(kpis?.totalOrders ?? 0).toLocaleString('en-US')} <span className="text-sm font-bold text-zinc-400">طلب</span>
          </p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-black text-emerald-600">
              <ArrowUpRight className="h-4 w-4" /> {kpis?.ordersTrend ?? '0%'}
            </span>
            <span className="text-zinc-400 font-bold">طلبات اليوم: {kpis?.todayOrders ?? 0}</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-extrabold text-zinc-500">متوسط قيمة الطلب (AOV)</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 font-cairo text-2xl font-black text-zinc-900">
            {formatPrice(kpis?.aov ?? 0)}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              معدل التحويل: {kpis?.conversionRate ?? 0}%
            </span>
            <span className="text-zinc-400 font-bold">طلبات الإعلانات: {kpis?.adOrdersCount ?? 0}</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-extrabold text-zinc-500">قاعدة العملاء المسجلين</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 font-cairo text-2xl font-black text-zinc-900">
            {(kpis?.totalCustomers ?? 0).toLocaleString('en-US')} <span className="text-sm font-bold text-zinc-400">عميل</span>
          </p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              توصيل لـ 58 ولاية
            </span>
            <span className="text-zinc-400 font-bold">إجمالي المنتجات: {kpis?.totalProducts ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ─── 2. ORDER STATUS PIPELINE CARDS ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          to="/admin/orders?status=pending_confirmation"
          className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-4 transition-all hover:bg-amber-50"
        >
          <div>
            <p className="text-xs font-extrabold text-amber-800">بانتظار التأكيد</p>
            <p className="mt-1 font-cairo text-xl font-black text-amber-950">{kpis?.newOrders ?? 0}</p>
          </div>
          <Clock className="h-5 w-5 text-amber-600" />
        </Link>

        <Link
          to="/admin/orders?status=confirmed"
          className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-4 transition-all hover:bg-blue-50"
        >
          <div>
            <p className="text-xs font-extrabold text-blue-800">طلبات مؤكدة</p>
            <p className="mt-1 font-cairo text-xl font-black text-blue-950">{kpis?.confirmedOrders ?? 0}</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
        </Link>

        <Link
          to="/admin/orders?status=delivered"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 transition-all hover:bg-emerald-50"
        >
          <div>
            <p className="text-xs font-extrabold text-emerald-800">تم التسليم</p>
            <p className="mt-1 font-cairo text-xl font-black text-emerald-950">{kpis?.deliveredOrders ?? 0}</p>
          </div>
          <Truck className="h-5 w-5 text-emerald-600" />
        </Link>

        <Link
          to="/admin/orders?status=cancelled"
          className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/50 p-4 transition-all hover:bg-red-50"
        >
          <div>
            <p className="text-xs font-extrabold text-red-800">ملغاة / راجعة</p>
            <p className="mt-1 font-cairo text-xl font-black text-red-950">{kpis?.cancelledOrders ?? 0}</p>
          </div>
          <XCircle className="h-5 w-5 text-red-600" />
        </Link>
      </div>

      {/* ─── 2.5 INVENTORY ALERTS QUICK TOGGLES ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/admin/inventory?status=low_stock"
          className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/40 p-4 transition-all hover:bg-amber-50 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-amber-900">تنبيهات مخزون منخفض (≤ 5)</p>
              <p className="text-[11px] text-amber-700 font-bold">انقر لعرض الأصناف التي تحتاج إعادة طلب في المستودع</p>
            </div>
          </div>
          <span className="font-cairo text-lg font-black text-amber-950 px-2.5 py-0.5 rounded-lg bg-amber-100/80">
            {kpis?.lowStockCount ?? 0}
          </span>
        </Link>

        <Link
          to="/admin/inventory?status=out_of_stock"
          className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/40 p-4 transition-all hover:bg-red-50 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-700">
              <XCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-red-900">أصناف نفد مخزونها (0)</p>
              <p className="text-[11px] text-red-700 font-bold">انقر لعرض الأصناف غير المتوفرة حالياً في المستودع</p>
            </div>
          </div>
          <span className="font-cairo text-lg font-black text-red-950 px-2.5 py-0.5 rounded-lg bg-red-100/80">
            {kpis?.outOfStockCount ?? 0}
          </span>
        </Link>
      </div>

      {/* ─── 3. CHARTS SECTION ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue & Orders Curve (2 cols) */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-cairo text-base font-black text-zinc-900">
                منحنى المبيعات والطلبات (Sales & Orders Trend)
              </h2>
              <p className="text-xs text-zinc-400 font-bold">تطور الإيرادات اليومية مقارنة بعدد الطلبات المكتملة</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="h-3 w-3 rounded-full bg-brand-600" /> الإيرادات (دج)
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="h-3 w-3 rounded-full bg-zinc-900" /> عدد الطلبات
              </span>
            </div>
          </div>

          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.salesOverTime || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e10600" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#e10600" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none', color: '#fff' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString('en-US')} DA`, 'الإيراد']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#e10600" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status Donut (1 col) */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-cairo text-base font-black text-zinc-900">
              توزيع حالات الطلبات (Status Distribution)
            </h2>
            <p className="text-xs text-zinc-400 font-bold">نسبة كل مرحلة في خط معالجة الطلبيات</p>
          </div>

          <div className="h-56 w-full my-auto" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.ordersByStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts?.ordersByStatus || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            {(charts?.ordersByStatus || []).map((st: any) => (
              <div key={st.name} className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                  <span className="text-zinc-700">{st.name}</span>
                </span>
                <span className="font-cairo font-black text-zinc-900">{st.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 4. TOP PRODUCTS & TOP WILAYAS TABLES ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cairo text-base font-black text-zinc-900">
              القطع الأكثر مبيعاً (Top Products)
            </h2>
            <Link to="/admin/products" className="text-xs font-bold text-brand-600 hover:underline">
              عرض الكل ↗
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-extrabold pb-2">
                  <th className="pb-3">المنتج / رقم القطعة</th>
                  <th className="pb-3">القسم</th>
                  <th className="pb-3 text-center">الطلبات</th>
                  <th className="pb-3 text-left">المبيعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-bold">
                {(charts?.topProducts || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-400">
                      لا توجد مبيعات مسجلة في هذه الفترة
                    </td>
                  </tr>
                ) : (
                  (charts?.topProducts || []).map((p: any) => (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3">
                        <p className="font-cairo font-black text-zinc-900 line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-zinc-400 font-bold" dir="ltr">PN: {p.partNumber}</p>
                      </td>
                      <td className="py-3 text-zinc-600">{p.category}</td>
                      <td className="py-3 text-center font-cairo font-black text-zinc-900">{p.sales_count ?? 0}</td>
                      <td className="py-3 text-left font-cairo font-black text-brand-600">
                        {formatPrice(p.total_revenue ?? 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Wilayas & Traffic Sources */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cairo text-base font-black text-zinc-900">
              أعلى الولايات طلباً (Top Wilayas)
            </h2>
            <span className="text-xs font-bold text-zinc-400">توزيع الشحن السريع</span>
          </div>

          <div className="space-y-3">
            {(charts?.topWilayas || []).length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-400 font-bold">لا توجد طلبات مسجلة للولايات حالياً</p>
            ) : (
              (() => {
                const maxOrders = Math.max(...(charts?.topWilayas || []).map((w: any) => Number(w.orders || 1)), 1)
                return (charts?.topWilayas || []).map((w: any) => {
                  const pct = Math.min(100, Math.round((Number(w.orders || 0) / maxOrders) * 100))
                  return (
                    <div key={w.code} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-zinc-900 font-cairo">
                          {w.code} - {w.wilaya}
                        </span>
                        <span className="text-zinc-600 font-cairo font-black">
                          {w.orders} طلب ({formatPrice(w.revenue)})
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-brand-600 to-brand-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
