import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import WilayaBar from '@/components/WilayaBar'
import SearchSection from '@/components/SearchSection'
import FeaturedProducts from '@/components/FeaturedProducts'
import Brands from '@/components/Brands'
import WhyUs from '@/components/WhyUs'
import Offers from '@/components/Offers'
import About from '@/components/About'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-tajawal text-zinc-900">
      <Navbar />
      <main>
        <Hero />
        <WilayaBar />
        <SearchSection />
        <FeaturedProducts />
        <Brands />
        <WhyUs />
        <Offers />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
