import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ShopProvider } from '@/context/ShopContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import ProductModal from '@/components/ProductModal'
import HomePage from '@/pages/HomePage'
import SearchPage from '@/pages/SearchPage'
import OfferPage from '@/pages/OfferPage'
import ProductPage from '@/pages/ProductPage'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminLogin from '@/pages/AdminLogin'
import AdminRoute from '@/components/AdminRoute'
import NotFound from '@/pages/NotFound'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ShopProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-zinc-50" dir="rtl">
            <Navbar />
            <CartDrawer />
            <ProductModal />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/offer" element={<OfferPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
            <Toaster />
          </div>
        </TooltipProvider>
      </ShopProvider>
    </QueryClientProvider>
  )
}