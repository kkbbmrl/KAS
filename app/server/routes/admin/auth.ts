import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { query } from '../../db/db.js'
import { ensureAdminAccounts } from '../../db/ensureAdmins.js'
import { hashPassword, isHashedPassword, verifyPassword } from '../../lib/password.js'
import { requireAdmin } from '../../middleware/adminAuth.js'
import { loginRateLimiter } from '../../middleware/rateLimiter.js'

const router = Router()
const SESSION_DAYS = 7

function sessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

function publicUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  }
}

// POST /api/v1/admin/auth/login
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const username = String(req.body.username || req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' })
    }

    let result = await query(
      `SELECT id, name, username, email, password_hash AS "passwordHash", role, avatar_url AS "avatarUrl",
              (is_active = 1 OR is_active = TRUE) AS "isActive"
       FROM admin_users
       WHERE LOWER(username) = $1 OR LOWER(email) = $2`,
      [username, username]
    )

    if (result.rows.length === 0) {
      await ensureAdminAccounts()
      result = await query(
        `SELECT id, name, username, email, password_hash AS "passwordHash", role, avatar_url AS "avatarUrl",
                (is_active = 1 OR is_active = TRUE) AS "isActive"
         FROM admin_users
         WHERE LOWER(username) = $1 OR LOWER(email) = $2`,
        [username, username]
      )
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' })
    }

    const user = result.rows[0]
    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'هذا الحساب معطل، يرجى التواصل مع مسؤول النظام' })
    }

    const role = String(user.role || '').toLowerCase()
    const validRoles = ['admin', 'super_admin', 'inventory_manager', 'order_manager', 'marketing_manager']
    if (!validRoles.includes(role)) {
      return res.status(403).json({ error: 'هذا الحساب غير مصرح له بدخول لوحة التحكم' })
    }

    if (!isHashedPassword(user.passwordHash)) {
      await query(`UPDATE admin_users SET password_hash = $1 WHERE id = $2`, [hashPassword(password), user.id])
    }

    await query(`UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [user.id])

    const token = randomBytes(32).toString('hex')
    await query(
      `INSERT INTO admin_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
      [token, user.id, sessionExpiry()]
    )

    res.json({
      success: true,
      token,
      user: publicUser(user),
    })
  } catch (err) {
    console.error('Admin login error:', err)
    res.status(500).json({ error: 'فشل تسجيل الدخول' })
  }
})

router.post('/logout', requireAdmin, async (req, res) => {
  try {
    const header = req.headers.authorization || ''
    const token = header.replace(/^Bearer\s+/i, '').trim()
    if (token) {
      await query(`DELETE FROM admin_sessions WHERE token = $1`, [token])
    }
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'فشل تسجيل الخروج' })
  }
})

router.get('/me', requireAdmin, async (req, res) => {
  res.json({ user: req.adminUser })
})

export default router
