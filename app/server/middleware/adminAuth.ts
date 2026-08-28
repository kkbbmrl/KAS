import type { Request, Response, NextFunction } from 'express'
import { query } from '../db/db.js'

export interface AdminRequestUser {
  id: string
  name: string
  username: string
  email: string
  role: string
  avatarUrl?: string | null
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminRequestUser
    }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || ''
    const token = header.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للوصول إلى لوحة التحكم' })
    }

    const result = await query(
      `SELECT u.id, u.name, u.username, u.email, u.role, u.avatar_url AS "avatarUrl",
              (u.is_active = 1 OR u.is_active = TRUE) AS "isActive",
              s.expires_at AS "expiresAt"
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.token = $1`,
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'جلسة غير صالحة، يرجى تسجيل الدخول' })
    }

    const user = result.rows[0]
    if (new Date(user.expiresAt).getTime() < Date.now()) {
      await query(`DELETE FROM admin_sessions WHERE token = $1`, [token])
      return res.status(401).json({ error: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'هذا الحساب معطل' })
    }

    const role = String(user.role || '').toLowerCase()
    const validRoles = ['admin', 'super_admin', 'inventory_manager', 'order_manager', 'marketing_manager']
    if (!validRoles.includes(role)) {
      return res.status(403).json({ error: 'غير مصرح لك بالوصول إلى لوحة التحكم' })
    }

    req.adminUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    }
    next()
  } catch (err) {
    console.error('Admin auth middleware error:', err)
    res.status(500).json({ error: 'فشل التحقق من الصلاحيات' })
  }
}

export function requireRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للوصول إلى هذه الخاصية' })
    }
    const role = String(req.adminUser.role || '').toLowerCase()
    if (role === 'super_admin' || allowedRoles.includes(role)) {
      return next()
    }
    return res.status(403).json({ error: 'غير مصرح: ليس لديك الصلاحية الكافية للوصول إلى هذا القسم أو تنفيذ هذا الإجراء' })
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.adminUser) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول للوصول إلى هذه الخاصية' })
  }
  const role = String(req.adminUser.role || '').toLowerCase()
  if (role !== 'super_admin') {
    return res.status(403).json({ error: 'غير مصرح: هذا الإجراء مخصص للمسؤول الرئيسي (Super Admin) فقط' })
  }
  next()
}

