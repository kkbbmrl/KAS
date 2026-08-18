import { Routes, Route } from 'react-router'
import { ShopProvider } from './context/ShopContext'
import Home from './pages/Home'

export default function App() {
  return (
    <ShopProvider>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </ShopProvider>
  )
}
