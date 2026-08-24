const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://kas-production-01e9.up.railway.app'
    : '')

const API_BASE = `${RAW_API_URL}/api/v1/admin`

function getAuthHeaders() {
  const token = localStorage.getItem('kas_admin_token') || ''
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  }
}

// 1. AUTH
export async function adminLogin(usernameOrEmail: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: usernameOrEmail, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'بيانات الدخول غير صحيحة')
  }
  return await res.json()
}

export async function adminGetMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Unauthorized')
  return await res.json()
}

// 2. ANALYTICS
export async function fetchAdminOverview(range = '30d') {
  const res = await fetch(`${API_BASE}/analytics/overview?range=${range}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch analytics overview')
  return await res.json()
}

export async function fetchAdminCharts() {
  const res = await fetch(`${API_BASE}/analytics/charts`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch analytics charts')
  return await res.json()
}

// 3. ORDERS
export async function fetchAdminOrders(params: {
  q?: string
  status?: string
  wilaya?: string
  source?: string
  page?: number
  limit?: number
} = {}) {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.status && params.status !== 'all') sp.set('status', params.status)
  if (params.wilaya && params.wilaya !== 'all') sp.set('wilaya', params.wilaya)
  if (params.source && params.source !== 'all') sp.set('source', params.source)
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))

  const res = await fetch(`${API_BASE}/orders?${sp.toString()}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch orders')
  return await res.json()
}

export async function fetchAdminOrderDetails(id: string) {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch order details')
  return await res.json()
}

export async function updateAdminOrderStatus(id: string, payload: { status: string; note?: string; adminName?: string }) {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update status')
  return await res.json()
}

export async function updateAdminOrderNotes(id: string, payload: { callCenterNotes?: string; trackingNumber?: string; courier?: string }) {
  const res = await fetch(`${API_BASE}/orders/${id}/notes`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update order notes')
  return await res.json()
}

export async function bulkUpdateAdminOrderStatus(orderIds: string[], status: string) {
  const res = await fetch(`${API_BASE}/orders/bulk-status`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderIds, status }),
  })
  if (!res.ok) throw new Error('Failed to bulk update orders')
  return await res.json()
}

// 4. PRODUCTS
export async function fetchAdminProducts(params: {
  q?: string
  category?: string
  brand?: string
  status?: string
  page?: number
  limit?: number
} = {}) {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.category && params.category !== 'all') sp.set('category', params.category)
  if (params.brand && params.brand !== 'all') sp.set('brand', params.brand)
  if (params.status && params.status !== 'all') sp.set('status', params.status)
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))

  const res = await fetch(`${API_BASE}/products?${sp.toString()}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch products')
  return await res.json()
}

export async function fetchAdminProductDetails(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch product details')
  return await res.json()
}

export async function createAdminProduct(data: any) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create product')
  }
  return await res.json()
}

export async function updateAdminProduct(id: string, data: any) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update product')
  }
  return await res.json()
}

export async function duplicateAdminProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}/duplicate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to duplicate product')
  }
  return await res.json()
}

export async function deleteAdminProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to delete product')
  }
  return await res.json()
}

export async function toggleAdminProductActive(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}/toggle-active`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to toggle active status')
  }
  return await res.json()
}

export async function toggleAdminProductFeatured(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}/toggle-featured`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to toggle featured status')
  }
  return await res.json()
}

// 5. BRANDS
export async function fetchAdminBrands() {
  const res = await fetch(`${API_BASE}/brands`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch brands')
  return await res.json()
}

export async function createAdminBrand(data: { name: string; slug?: string; logoUrl?: string; originCountry?: string; isFeatured?: boolean }) {
  const res = await fetch(`${API_BASE}/brands`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create brand')
  }
  return await res.json()
}

export async function updateAdminBrand(id: string, data: any) {
  const res = await fetch(`${API_BASE}/brands/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update brand')
  }
  return await res.json()
}

export async function deleteAdminBrand(id: string) {
  const res = await fetch(`${API_BASE}/brands/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to delete brand')
  }
  return await res.json()
}

// 6. CATEGORIES
export async function fetchAdminCategories() {
  const res = await fetch(`${API_BASE}/categories`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch categories')
  return await res.json()
}

export async function createAdminCategory(data: any) {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create category')
  }
  return await res.json()
}

export async function updateAdminCategory(id: string, data: any) {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update category')
  }
  return await res.json()
}

export async function deleteAdminCategory(id: string) {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to delete category')
  }
  return await res.json()
}

// 7. IMAGE UPLOAD
export async function uploadAdminImage(data: { image: string; filename?: string }) {
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to upload image')
  }
  return await res.json()
}


// 6. INVENTORY
export async function fetchAdminInventory(params: { status?: string; q?: string; page?: number; limit?: number } = {}) {
  const sp = new URLSearchParams()
  if (params.status && params.status !== 'all') sp.set('status', params.status)
  if (params.q) sp.set('q', params.q)
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))

  const res = await fetch(`${API_BASE}/inventory?${sp.toString()}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch inventory')
  return await res.json()
}

export async function adjustAdminInventory(data: { variantId: string; quantityDelta?: number; newQuantity?: number; reason?: string }) {
  const res = await fetch(`${API_BASE}/inventory/adjust`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to adjust inventory')
  return await res.json()
}

export async function fetchAdminInventoryTransactions() {
  const res = await fetch(`${API_BASE}/inventory/transactions`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return await res.json()
}

// 7. CUSTOMERS
export async function fetchAdminCustomers(params: { q?: string; wilaya?: string; isBlacklisted?: string; page?: number; limit?: number } = {}) {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.wilaya && params.wilaya !== 'all') sp.set('wilaya', params.wilaya)
  if (params.isBlacklisted) sp.set('isBlacklisted', params.isBlacklisted)
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))

  const res = await fetch(`${API_BASE}/customers?${sp.toString()}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch customers')
  return await res.json()
}

export async function fetchAdminCustomerDetails(id: string) {
  const res = await fetch(`${API_BASE}/customers/${id}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch customer details')
  return await res.json()
}

export async function toggleAdminCustomerBlacklist(id: string) {
  const res = await fetch(`${API_BASE}/customers/${id}/blacklist`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to toggle blacklist')
  return await res.json()
}

export async function updateAdminCustomerNotes(id: string, internalNotes: string) {
  const res = await fetch(`${API_BASE}/customers/${id}/notes`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ internalNotes }),
  })
  if (!res.ok) throw new Error('Failed to update notes')
  return await res.json()
}

// 8. MARKETING & LANDING PAGES
export async function fetchAdminCampaigns() {
  const res = await fetch(`${API_BASE}/marketing/campaigns`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch campaigns')
  return await res.json()
}

export async function createAdminCampaign(data: any) {
  const res = await fetch(`${API_BASE}/marketing/campaigns`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create campaign')
  return await res.json()
}

export async function fetchAdminLandingPages() {
  const res = await fetch(`${API_BASE}/marketing/landing-pages`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch landing pages')
  return await res.json()
}

export async function fetchAdminLandingPageDetails(id: string) {
  const res = await fetch(`${API_BASE}/marketing/landing-pages/${id}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch landing page details')
  return await res.json()
}

export async function createAdminLandingPage(data: any) {
  const res = await fetch(`${API_BASE}/marketing/landing-pages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create landing page')
  }
  return await res.json()
}

export async function updateAdminLandingPage(id: string, data: any) {
  const res = await fetch(`${API_BASE}/marketing/landing-pages/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update landing page')
  }
  return await res.json()
}

export async function deleteAdminLandingPage(id: string) {
  const res = await fetch(`${API_BASE}/marketing/landing-pages/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete landing page')
  return await res.json()
}

export async function duplicateAdminLandingPage(id: string) {
  const res = await fetch(`${API_BASE}/marketing/landing-pages/${id}/duplicate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to duplicate landing page')
  return await res.json()
}

export async function toggleAdminLandingPage(id: string) {
  const res = await fetch(`${API_BASE}/marketing/landing-pages/${id}/toggle`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to toggle landing page')
  return await res.json()
}

// 9. MISC (ACTIVITY, USERS, SETTINGS, NOTIFICATIONS, SEARCH)
export async function fetchAdminActivityLogs() {
  const res = await fetch(`${API_BASE}/activity`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch activity logs')
  return await res.json()
}

export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE}/users`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  return await res.json()
}

export async function createAdminUser(data: any) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create user')
  }
  return await res.json()
}

export async function updateAdminUser(id: string, data: any) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update user')
  }
  return await res.json()
}

export async function toggleAdminUserActive(id: string) {
  const res = await fetch(`${API_BASE}/users/${id}/toggle-active`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to toggle user status')
  }
  return await res.json()
}

export async function deleteAdminUser(id: string) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to delete user')
  }
  return await res.json()
}

export async function fetchAdminSettings() {
  const res = await fetch(`${API_BASE}/settings`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch settings')
  return await res.json()
}

export async function updateAdminSettings(settings: Record<string, string>) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  })
  if (!res.ok) throw new Error('Failed to update settings')
  return await res.json()
}

export async function fetchAdminNotifications() {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return await res.json()
}

export async function markAdminNotificationsRead() {
  const res = await fetch(`${API_BASE}/notifications/mark-read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to mark notifications read')
  return await res.json()
}

export async function adminGlobalSearch(q: string) {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Search failed')
  return await res.json()
}
