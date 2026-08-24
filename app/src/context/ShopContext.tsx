import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Product, ProductVariant } from '@/data/products'
import { submitOrder, ApiError } from '@/lib/api'

export interface CartItem {
  product: Product
  qty: number
  /** Chosen variant, when the product has any. Drives price and part number. */
  variant?: ProductVariant
}

/** Cart line identity: same product + different variant = different line. */
export function lineKey(productId: Product['id'], variantId?: string): string {
  return `${productId}:${variantId ?? 'base'}`
}

/** Unit price actually charged for a line — variant overrides base product. */
export function unitPrice(item: CartItem): number {
  return Number(item.variant?.price ?? item.product.price) || 0
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
  /** Formatted wilaya label shown to the customer */
  city: string
  /** Two-digit wilaya code sent to the backend */
  wilayaCode: string
}

export interface PlacedOrder extends CheckoutDetails {
  orderId: string
  items: { id: string; name: string; qty: number; price: number }[]
  total: number
  createdAt: string
}

interface ShopState {
  cart: CartItem[]
  cartOpen: boolean
  selected: Product | null
  toast: string | null
  searchFilter: SearchFilter | null
  addToCart: (p: Product, qty?: number, variant?: ProductVariant) => void
  removeFromCart: (key: string) => void
  setQty: (key: string, qty: number) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void
  setSelected: (p: Product | null) => void
  setSearchFilter: (f: SearchFilter | null) => void
  placeOrder: (details: CheckoutDetails) => Promise<PlacedOrder>
  orderSuccess: boolean
  lastOrder: PlacedOrder | null
  dismissOrderSuccess: () => void
  total: number
  count: number
  lastAddedAt: number
}

const ShopContext = createContext<ShopState | null>(null)

/**
 * Drops anything that doesn't look like a usable cart line. Without this a stale
 * localStorage entry (different product shape, removed demo data) renders
 * undefined prices and NaN totals.
 */
function reviveCart(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (i: unknown): i is CartItem =>
        !!i &&
        typeof i === 'object' &&
        'product' in i &&
        !!(i as CartItem).product &&
        (i as CartItem).product.id != null &&
        Number.isFinite(Number((i as CartItem).product.price)) &&
        Number.isFinite(Number((i as CartItem).qty)) &&
        Number((i as CartItem).qty) > 0
    )
  } catch {
    return []
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => reviveCart(localStorage.getItem('kas-cart')))
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
      /* quota or private mode — cart still works in memory */
    }
  }, [cart])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const addToCart = useCallback(
    (p: Product, qty = 1, variant?: ProductVariant) => {
      const key = lineKey(p.id, variant?.id)
      setCart((prev) => {
        const found = prev.find((i) => lineKey(i.product.id, i.variant?.id) === key)
        if (found) {
          return prev.map((i) =>
            lineKey(i.product.id, i.variant?.id) === key ? { ...i, qty: i.qty + qty } : i
          )
        }
        return [...prev, { product: p, qty, variant }]
      })
      setLastAddedAt(Date.now())
      showToast(`تمت إضافة "${p.name}" إلى السلة`)
    },
    [showToast]
  )

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => lineKey(i.product.id, i.variant?.id) !== key))
  }, [])

  const setQty = useCallback((key: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => lineKey(i.product.id, i.variant?.id) !== key)
        : prev.map((i) =>
            lineKey(i.product.id, i.variant?.id) === key ? { ...i, qty: Math.min(qty, 99) } : i
          )
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  /**
   * Submits the order and only reports success once the server has confirmed it.
   * Throws on failure so the checkout form can show the real reason and keep the
   * cart intact for a retry.
   */
  const placeOrder = useCallback(
    async (details: CheckoutDetails): Promise<PlacedOrder> => {
      if (cart.length === 0) throw new ApiError('السلة فارغة', 0)

      const res = await submitOrder({
        source: 'cart_checkout',
        firstName: details.firstName,
        lastName: details.lastName,
        phone: details.phone,
        wilayaCode: details.wilayaCode,
        commune: details.city,
        address: details.address,
        items: cart.map((i) => ({
          id: i.product.id,
          productId: String(i.product.id),
          variantId: i.variant?.id,
          name: i.product.name,
          partNumber: i.variant?.partNumber ?? i.product.partNumber,
          price: unitPrice(i),
          qty: i.qty,
        })),
      })

      // Use the server's reference — never a locally invented one.
      const snapshot: PlacedOrder = {
        ...details,
        orderId: res.orderReference,
        items: (res.items ?? []).map((it) => ({
          id: it.id,
          name: it.name,
          qty: it.qty,
          price: Number(it.price) || 0,
        })),
        total: Number(res.totalAmount) || 0,
        createdAt: res.createdAt,
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

  const total = useMemo(() => cart.reduce((s, i) => s + unitPrice(i) * i.qty, 0), [cart])
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
