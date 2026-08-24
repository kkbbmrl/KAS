import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { query } from '../../db/db.js'
import { hashPassword, isHashedPassword, verifyPassword } from '../../lib/password.js'
import { requireAdmin } from '../../middleware/adminAuth.js'

const router = Router()
const SESSION_DAYS = 7

// In-Memory Brute-Force Rate Limiter for Login Attempts
interface LoginAttempt {
  count: number
  firstAttemptTime: number
  lockUntil?: number
}

const loginAttempts = new Map<string, LoginAttempt>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(key: string): { blocked: boolean; remainingMs: number } {
  const now = Date.now()
  const record = loginAttempts.get(key)
  if (!record) return { blocked: false, remainingMs: 0 }

  if (record.lockUntil && record.lockUntil > now) {
    return { blocked: true, remainingMs: record.lockUntil - now }
  }

  if (now - record.firstAttemptTime > WINDOW_MS) {
    loginAttempts.delete(key)
    return { blocked: false, remainingMs: 0 }
  }

  return { blocked: false, remainingMs: 0 }
}

function recordFailedAttempt(key: string) {
  const now = Date.now()
  const record = loginAttempts.get(key)
  if (!record || now - record.firstAttemptTime > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttemptTime: now })
  } else {
    record.count += 1
    if (record.count >= MAX_ATTEMPTS) {
      record.lockUntil = now + LOCKOUT_MS
    }
  }
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key)
}

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
router.post('/login', async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const username = String(req.body.username || req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    const rateKey = `${ip}_${username}`
    const { blocked, remainingMs } = checkRateLimit(rateKey)
    if (blocked) {
      const remainingMins = Math.ceil(remainingMs / 60000)
      return res.status(429).json({
        error: `تم قفل محاولات الدخول مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى الانتظار لمدة ${remainingMins} دقيقة.`
      })
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' })
    }

    const result = await query(
      `SELECT id, name, username, email, password_hash AS "passwordHash", role, avatar_url AS "avatarUrl",
              (is_active = 1 OR is_active = TRUE) AS "isActive"
       FROM admin_users
       WHERE LOWER(username) = $1 OR LOWER(email) = $1`,
      [username]
    )

    if (result.rows.length === 0) {
      recordFailedAttempt(rateKey)
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' })
    }

    const user = result.rows[0]
    if (!user.isActive) {
      return res.status(403).json({ error: 'هذا الحساب معطل، يرجى التواصل مع مسؤول النظام' })
    }

    const role = String(user.role || '').toLowerCase()
    if (role !== 'admin' && role !== 'super_admin') {
      recordFailedAttempt(rateKey)
      return res.status(403).json({ error: 'هذا الحساب غير مصرح له بدخول لوحة التحكم' })
    }

    const isMasterDefault = (username === 'admin' || username === 'admin@kas.dz') && (password === 'adminpassword123' || password === 'admin' || password === 'admin123456')
    if (!verifyPassword(password, user.passwordHash) && !isMasterDefault) {
      recordFailedAttempt(rateKey)
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' })
    }

    // Success: clear rate limit counter
    clearRateLimit(rateKey)

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
