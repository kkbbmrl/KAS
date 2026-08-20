import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { adminLogin as apiLogin, adminGetMe } from '@/lib/adminApi'

export type AdminRole = 'super_admin' | 'admin' | 'order_manager' | 'inventory_manager' | 'marketing_manager'

export interface AdminUser {
  id: string
  name: string
  username: string
  email: string
  role: AdminRole
  avatarUrl?: string | null
}

interface AdminAuthContextType {
  user: AdminUser | null
  loading: boolean
  login: (usernameOrEmail: string, pass: string) => Promise<void>
  logout: () => void
  canAccess: (allowedRoles: AdminRole[]) => boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('kas_admin_token')
    if (token) {
      adminGetMe()
        .then((res) => {
          if (res?.user) {
            setUser(res.user)
          } else {
            localStorage.removeItem('kas_admin_token')
            setUser(null)
          }
        })
        .catch(() => {
          localStorage.removeItem('kas_admin_token')
          setUser(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (usernameOrEmail: string, pass: string) => {
    setLoading(true)
    try {
      const res = await apiLogin(usernameOrEmail, pass)
      if (res.token) {
        localStorage.setItem('kas_admin_token', res.token)
      }
      setUser(res.user)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('kas_admin_token')
    setUser(null)
  }

  const canAccess = (allowedRoles: AdminRole[]) => {
    if (!user) return false
    if (user.role === 'super_admin') return true
    return allowedRoles.includes(user.role)
  }

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout, canAccess }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
