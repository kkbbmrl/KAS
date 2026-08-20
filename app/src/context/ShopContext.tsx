import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Product } from '@/data/products'
import { submitOrder } from '@/lib/api'

export interface CartItem {
  product: Product
  qty: number
}

export interface SearchFilter {
  brand: string
  model: string
  year: string
  engine: string
  query: string
  inStockOnly?: boolean
}

export interface CheckoutDetails {
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
}

export interface PlacedOrder extends CheckoutDetails {
  orderId: string
  items: { id: number; name: string; qty: number; price: number }[]
  total: number
  createdAt: string
}

interface ShopState {
  cart: CartItem[]
  cartOpen: boolean
  selected: Product | null
  toast: string | null
  searchFilter: SearchFilter | null
  addToCart: (p: Product, qty?: number) => void
  removeFromCart: (id: number) => void
  setQty: (id: number, qty: number) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void
  setSelected: (p: Product | null) => void
  setSearchFilter: (f: SearchFilter | null) => void
  placeOrder: (details: CheckoutDetails) => PlacedOrder
  orderSuccess: boolean
  lastOrder: PlacedOrder | null
  dismissOrderSuccess: () => void
  total: number
  count: number
  lastAddedAt: number
}

const ShopContext = createContext<ShopState | null>(null)

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('kas-cart')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState<SearchFilter | null>(null)
  const [lastAddedAt, setLastAddedAt] = useState(0)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem('kas-cart', JSON.stringify(cart))
    } catch {
      /* ignore */
    }
  }, [cart])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const addToCart = useCallback(
    (p: Product, qty = 1) => {
      setCart((prev) => {
        const found = prev.find((i) => i.product.id === p.id)
        if (found) return prev.map((i) => (i.product.id === p.id ? { ...i, qty: i.qty + qty } : i))
        return [...prev, { product: p, qty }]
      })
      setLastAddedAt(Date.now())
      showToast(`تمت إضافة "${p.name}" إلى السلة`)
    },
    [showToast]
  )

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id))
  }, [])

  const setQty = useCallback((id: number, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((i) => i.product.id !== id) : prev.map((i) => (i.product.id === id ? { ...i, qty } : i))
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const placeOrder = useCallback(
    (details: CheckoutDetails): PlacedOrder => {
      const orderId = `KAS-${Math.floor(100000 + Math.random() * 900000)}`
      const snapshot: PlacedOrder = {
        ...details,
        orderId,
        items: cart.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          qty: i.qty,
          price: i.product.price,
        })),
        total: cart.reduce((s, i) => s + i.product.price * i.qty, 0),
        createdAt: new Date().toISOString(),
      }

      // Submit to backend database
      submitOrder({
        source: 'cart_checkout',
        firstName: details.firstName,
        lastName: details.lastName,
        phone: details.phone,
        commune: details.city,
        address: details.address,
        items: cart.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          price: i.product.price,
          qty: i.qty,
        })),
      }).catch((err) => console.warn('Order submission background sync:', err))

      try {
        const raw = localStorage.getItem('kas-orders')
        const prev = raw ? JSON.parse(raw) : []
        localStorage.setItem('kas-orders', JSON.stringify([snapshot, ...prev]))
      } catch {
        /* ignore */
      }
      setCart([])
      setLastOrder(snapshot)
      setOrderSuccess(true)
      showToast('تم استلام طلبك بنجاح')
      return snapshot
    },
    [cart, showToast]
  )

  const dismissOrderSuccess = useCallback(() => {
    setOrderSuccess(false)
    setLastOrder(null)
  }, [])

  const total = useMemo(() => cart.reduce((s, i) => s + i.product.price * i.qty, 0), [cart])
  const count = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart])

  const value: ShopState = {
    cart,
    cartOpen,
    selected,
    toast,
    searchFilter,
    addToCart,
    removeFromCart,
    setQty,
    clearCart,
    setCartOpen,
    setSelected,
    setSearchFilter,
    placeOrder,
    orderSuccess,
    lastOrder,
    dismissOrderSuccess,
    total,
    count,
    lastAddedAt,
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopState {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}

