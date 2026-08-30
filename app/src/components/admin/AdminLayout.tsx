import { useEffect, useState } from 'react'
import { Link, useLocation, Outlet, Navigate } from 'react-router'
import {
  Activity,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  Layers,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Warehouse,
  X,
  Zap,
} from 'lucide-react'
import { useAdminAuth, type AdminRole } from '@/context/AdminAuthContext'
import { fetchAdminNotifications, markAdminNotificationsRead } from '@/lib/adminApi'
import AdminCommandModal from './AdminCommandModal'

interface NavItem {
  path: string
  label: string
  icon: any
  exact?: boolean
  badge?: string
  roles?: AdminRole[]
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'الرئيسية',
    items: [
      { path: '/admin', label: 'لوحة القيادة', icon: LayoutDashboard, exact: true, roles: ['super_admin', 'admin'] },
    ],
  },
  {
    title: 'العمليات والمبيعات',
    items: [
      { path: '/admin/orders', label: 'إدارة الطلبات', icon: Package, badge: 'جديد', roles: ['super_admin', 'admin', 'order_manager'] },
      { path: '/admin/inventory', label: 'المخزون والتنبيهات', icon: Warehouse, roles: ['super_admin', 'admin', 'inventory_manager'] },
      { path: '/admin/inventory/import', label: 'ترحيل واستيراد الـ PDF', icon: Database, roles: ['super_admin', 'admin', 'inventory_manager'] },
    ],
  },
  {
    title: 'الكتالوج والمنتجات',
    items: [
      { path: '/admin/products', label: 'المنتجات والمتغيرات', icon: Boxes, roles: ['super_admin', 'admin'] },
      { path: '/admin/categories', label: 'الأقسام والتصنيفات', icon: Layers, roles: ['super_admin', 'admin'] },
    ],
  },
  {
    title: 'التسويق والعملاء',
    items: [
      { path: '/admin/customers', label: 'سجل العملاء CRM', icon: ShieldCheck, roles: ['super_admin', 'admin'] },
      { path: '/admin/marketing', label: 'الحملات والـ UTM', icon: Megaphone, roles: ['super_admin', 'admin', 'marketing_manager'] },
      { path: '/admin/landing-pages', label: 'صفحات الهبوط', icon: Zap, roles: ['super_admin', 'admin', 'marketing_manager'] },
    ],
  },
  {
    title: 'الإدارة والنظام',
    items: [
      { path: '/admin/activity', label: 'سجل العمليات', icon: Activity, roles: ['super_admin', 'admin'] },
      { path: '/admin/users', label: 'فريق العمل والصلاحيات', icon: ShieldCheck, roles: ['super_admin'] },
      { path: '/admin/settings', label: 'الإعدادات العامة', icon: Settings, roles: ['super_admin', 'admin'] },
    ],
  },
]

export default function AdminLayout() {
  const location = useLocation()
  const { user, loading, logout, canAccess } = useAdminAuth()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchAdminNotifications()
        .then((res) => setNotifications(res || []))
        .catch(() => {})
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white font-tajawal" dir="rtl">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 shadow-2xl shadow-brand-600/50 mb-4 animate-pulse">
          <ShieldCheck className="h-9 w-9 text-white" />
        </div>
        <p className="font-cairo text-sm font-black text-white">التحقق من جلسة المسؤول...</p>
        <Loader2 className="mt-3 h-5 w-5 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  // Determine authorized default home path for user
  const defaultHomePath = user.role === 'inventory_manager' ? '/admin/inventory' : '/admin'

  // Route authorization check for current page
  const allNavItems = NAV_GROUPS.flatMap((g) => g.items)
  const matchingItem = allNavItems.find((it) =>
    it.exact ? location.pathname === it.path : location.pathname.startsWith(it.path)
  )

  if (matchingItem?.roles && !canAccess(matchingItem.roles)) {
    return <Navigate to={defaultHomePath} replace />
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkNotifsRead = async () => {
    await markAdminNotificationsRead().catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const roleLabels: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    admin: 'مدير عام',
    inventory_manager: 'مسؤول مخزون وجرد',
    order_manager: 'مدير طلبات',
    marketing_manager: 'مسؤول تسويق',
  }

  const roleBadgeColors: Record<AdminRole, string> = {
    super_admin: 'bg-red-50 text-brand-700 border-brand-200',
    admin: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    inventory_manager: 'bg-purple-50 text-purple-700 border-purple-200',
    order_manager: 'bg-blue-50 text-blue-700 border-blue-200',
    marketing_manager: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-tajawal text-zinc-900 antialiased" dir="rtl">
      {/* ─── SIDEBAR (Desktop & Mobile) ─── */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex flex-col border-l border-zinc-200/80 bg-white shadow-sm transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-100 px-4">
          {!collapsed ? (
            <Link to={defaultHomePath} className="flex items-center gap-2.5 group hover:opacity-80 transition-opacity" title="الرئيسية - لوحة التحكم">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-cairo text-sm font-black text-white shadow-md shadow-brand-600/30 group-hover:scale-105 transition-transform">
                KAS
              </div>
              <div>
                <p className="font-cairo text-sm font-black leading-none text-zinc-900">
                  Khaled <span className="text-brand-600">Auto</span> Parts
                </p>
                <p className="mt-1 text-[10px] font-bold text-zinc-400">لوحة التحكم المركزية</p>
              </div>
            </Link>
          ) : (
            <Link to={defaultHomePath} className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-cairo text-xs font-black text-white shadow-md hover:scale-105 transition-transform" title="الرئيسية - لوحة التحكم">
              KAS
            </Link>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 lg:block"
            title={collapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_GROUPS.map((group) => {
            // Filter by permission
            const visibleItems = group.items.filter((it) => !it.roles || canAccess(it.roles))
            if (visibleItems.length === 0) return null

            return (
              <div key={group.title}>
                {!collapsed && (
                  <p className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 font-cairo">
                    {group.title}
                  </p>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const active = item.exact
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path)
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                          active
                            ? 'bg-brand-600 text-white font-extrabold shadow-md shadow-brand-600/25'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                              active ? 'text-white' : 'text-zinc-500 group-hover:text-brand-600'
                            }`}
                          />
                          {!collapsed && <span>{item.label}</span>}
                        </div>

                        {!collapsed && item.badge && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                              active ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* User Footer Profile */}
        <div className="border-t border-zinc-100 p-3 bg-zinc-50/50">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              <Link to="/admin/settings" className="flex items-center gap-2.5 min-w-0 group hover:opacity-85 transition-opacity" title="إعدادات الحساب والملف الشخصي">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-9 w-9 rounded-xl object-cover shrink-0 ring-1 ring-zinc-200 group-hover:ring-brand-500 transition-all" />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 font-bold text-xs group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-cairo text-xs font-black text-zinc-900 truncate group-hover:text-brand-600 transition-colors">{user?.name}</p>
                  <p className="text-[10px] text-zinc-400 font-mono truncate" dir="ltr">@{user?.username || 'admin'}</p>
                  <span className={`mt-0.5 inline-block rounded border px-1.5 py-0.2 text-[9px] font-bold ${roleBadgeColors[user?.role || 'admin']}`}>
                    {roleLabels[user?.role || 'admin']}
                  </span>
                </div>
              </Link>

              <button
                onClick={logout}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={logout} className="mx-auto block p-2 text-zinc-400 hover:text-red-600" title="تسجيل الخروج">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:mr-20' : 'lg:mr-64'}`}>
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
          {/* Right side: Hamburger & Global Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-zinc-200 p-2 text-zinc-600 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-2 text-xs font-bold text-zinc-400 transition-all hover:border-brand-300 hover:bg-white hover:text-zinc-600 sm:w-80"
            >
              <Search className="h-4 w-4 text-zinc-400" />
              <span className="flex-1 text-right">بحث سريع (طلبات، عملاء، قطع)...</span>
              <kbd className="hidden rounded bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-zinc-500 border border-zinc-200 shadow-sm sm:inline-block">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Left side: Store link, Notifications, Profile */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-sm transition-all hover:border-zinc-900 hover:text-zinc-900 sm:flex"
            >
              <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
              <span>المتجر الحي</span>
            </Link>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all hover:border-brand-300 hover:text-brand-600"
                aria-label="الإشعارات"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -left-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-black text-white shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 bg-zinc-50">
                    <p className="font-cairo text-xs font-black text-zinc-900">مركز الإشعارات</p>
                    <button
                      onClick={handleMarkNotifsRead}
                      className="text-[11px] font-bold text-brand-600 hover:underline"
                    >
                      تحديد الكل كمقروء
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-zinc-400">لا توجد إشعارات جديدة</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-3 text-right transition-colors hover:bg-zinc-50 ${n.isRead ? 'opacity-60' : 'bg-red-50/20'}`}>
                          <p className="font-cairo text-xs font-bold text-zinc-900">{n.title}</p>
                          <p className="mt-0.5 text-[11px] text-zinc-500">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <Link
              to="/admin/settings"
              className="flex items-center gap-2 pr-2 border-r border-zinc-200 group hover:opacity-80 transition-opacity"
              title="إعدادات الحساب والملف الشخصي"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-lg object-cover ring-1 ring-zinc-200 group-hover:ring-brand-500 transition-all" />
              ) : (
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 text-xs font-bold text-white group-hover:bg-brand-600 transition-colors">
                  {user?.name.charAt(0)}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Main Routed Page Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Search Command Palette */}
      <AdminCommandModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
