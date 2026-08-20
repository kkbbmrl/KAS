import { Link } from 'react-router'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import WilayaBar from '@/components/WilayaBar'
import SearchSection from '@/components/SearchSection'
import Brands from '@/components/Brands'
import WhyUs from '@/components/WhyUs'
import Offers from '@/components/Offers'
import About from '@/components/About'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import ProductModal from '@/components/ProductModal'
import CartDrawer from '@/components/CartDrawer'
import Toast from '@/components/Toast'

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-tajawal text-zinc-900">
      <Navbar />
      <main>
        <Hero />
        <WilayaBar />
        <SearchSection />

        <section className="border-y border-zinc-100 bg-zinc-50 py-12">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <p className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
              تصفح الأقسام
            </p>
            <h2 className="mt-4 font-cairo text-3xl font-black text-zinc-900 sm:text-4xl">
              اختر <span className="text-brand-600">النوع</span> المناسب لك
            </h2>
            <p className="mt-3 text-sm text-zinc-600 sm:text-base">
              لا تعرض المنتجات مباشرة في الصفحة الرئيسية. اختر القسم أولاً ثم انتقل إلى صفحة المنتجات للبحث والتصفية.
            </p>
            <Link
              to="/themes"
              className="mt-6 inline-flex items-center rounded-full bg-brand-600 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-brand-700"
            >
              عرض جميع الأقسام
            </Link>
          </div>
        </section>

        <Brands />
        <WhyUs />
        <Offers />
        <About />
        <Contact />
      </main>
      <Footer />
      <ProductModal />
      <CartDrawer />
      <Toast />
    </div>
  )
}
