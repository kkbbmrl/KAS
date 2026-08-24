import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { PRODUCTS } from '@/data/products'
import { useShop } from '@/context/ShopContext'
import ProductModal from '@/components/ProductModal'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setSelected } = useShop()
  const [loading, setLoading] = useState(true)
  const [found, setFound] = useState(false)

  useEffect(() => {
    const productId = parseInt(id || '', 10)
    const product = PRODUCTS.find((p) => p.id === productId)

    if (product) {
      setSelected(product)
      setFound(true)
    } else {
      setFound(false)
    }
    setLoading(false)
  }, [id, setSelected])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!found) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-zinc-300" />
        <h1 className="mt-4 font-cairo text-2xl font-black text-zinc-900">المنتج غير موجود</h1>
        <p className="mt-2 text-sm font-bold text-zinc-500">
          لم نتمكن من العثور على المنتج المطلوب. قد يكون قد تمت إزالته أو أن الرابط غير صحيح.
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-shine mt-6 flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 font-cairo text-sm font-black text-white shadow-lg shadow-brand-600/25"
        >
          <ArrowLeft className="h-4 w-4" /> العودة إلى المتجر
        </button>
      </div>
    )
  }

  // Render the modal inline as a full-page view
  return <ProductModal />
}