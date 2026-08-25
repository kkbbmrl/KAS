import { Routes, Route, useLocation, Navigate } from 'react-router'
import { useEffect } from 'react'
import { ShopProvider } from './context/ShopContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import ProductModal from './components/ProductModal'
import CartDrawer from './components/CartDrawer'
import Toast from './components/Toast'
import Home from './pages/Home'
import SearchPage from './pages/SearchPage'
import OfferPage from './pages/OfferPage'
import AdLandingPage from './pages/AdLandingPage'
import AdsCatalogPage from './pages/AdsCatalogPage'

// Admin Components & Pages
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminOverview from './pages/admin/AdminOverview'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminInventory from './pages/admin/AdminInventory'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminMarketing from './pages/admin/AdminMarketing'
import AdminActivityLogs from './pages/admin/AdminActivityLogs'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSettings from './pages/admin/AdminSettings'

export default function App() {
  const { pathname, hash } = useLocation()
  // Overlays are storefront-only — never mount them inside the admin dashboard.
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  /*
   * react-router does not scroll to hash targets itself. The navbar links to
   * "/#brands" etc. from any page, so resolve the target after the route renders.
   */
  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    // rAF lets the destination page paint before we look for the anchor.
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname, hash])

  return (
    <ShopProvider>
      <AdminAuthProvider>
        <Routes>
          {/* Public Store Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/themes" element={<Navigate to="/#search" replace />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/offer/:slug" element={<OfferPage />} />

          {/* Ad Landing Pages & Campaign System */}
          <Route path="/ads" element={<AdsCatalogPage />} />
          <Route path="/ads/:slug" element={<AdLandingPage />} />
          <Route path="/ads/product/:idOrSlug" element={<AdLandingPage />} />
          <Route path="/landing/:slug" element={<AdLandingPage />} />

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Enterprise Admin Dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="marketing" element={<AdminMarketing />} />
            <Route path="landing-pages" element={<AdminMarketing />} />
            <Route path="activity" element={<AdminActivityLogs />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>

        {/* Global storefront overlays — mounted once, outside <Routes>, so they
            survive navigation and work on every customer page. */}
        {!isAdmin && (
          <>
            <ProductModal />
            <CartDrawer />
            <Toast />
          </>
        )}
      </AdminAuthProvider>
    </ShopProvider>
  )
}

