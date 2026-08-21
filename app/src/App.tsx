import { Routes, Route } from 'react-router'
import { ShopProvider } from './context/ShopContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import Home from './pages/Home'
import SearchPage from './pages/SearchPage'
import ThemesPage from './pages/ThemesPage'
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
  return (
    <ShopProvider>
      <AdminAuthProvider>
        <Routes>
          {/* Public Store Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/themes" element={<ThemesPage />} />
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
      </AdminAuthProvider>
    </ShopProvider>
  )
}

