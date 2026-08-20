import { Routes, Route } from 'react-router'
import { ShopProvider } from './context/ShopContext'
import Home from './pages/Home'
import SearchPage from './pages/SearchPage'
import ThemesPage from './pages/ThemesPage'
import OfferPage from './pages/OfferPage'

export default function App() {
  return (
    <ShopProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/themes" element={<ThemesPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/offer/:slug" element={<OfferPage />} />
      </Routes>
    </ShopProvider>
  )
}
