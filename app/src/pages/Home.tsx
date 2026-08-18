import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import SearchSection from '@/components/SearchSection'
import ProductsSection from '@/components/ProductsSection'
import Brands from '@/components/Brands'
import WhyUs from '@/components/WhyUs'
import Offers from '@/components/Offers'
import About from '@/components/About'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import ProductModal from '@/components/ProductModal'
import CartDrawer from '@/components/CartDrawer'
import Toast from '@/components/Toast'

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-tajawal text-zinc-900">
      <Navbar />
      <main>
        <Hero />
        <SearchSection />
        <ProductsSection />
        <Brands />
        <WhyUs />
        <Offers />
        <About />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
      <ProductModal />
      <CartDrawer />
      <Toast />
    </div>
  )
}
