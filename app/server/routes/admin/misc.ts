import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { query } from '../../db/db.js'
import { requireSuperAdmin } from '../../middleware/adminAuth.js'

const router = Router()

// Magic bytes validator for safe image formats
function validateImageMagicBytes(buffer: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buffer.length < 12) return null

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg'
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png'
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp'
  }

  return null
}

// POST /api/v1/admin/upload (Hardened Image Upload handler)
router.post('/upload', async (req, res) => {
  try {
    const { image, data } = req.body
    const rawData = image || data
    if (!rawData) {
      return res.status(400).json({ error: 'لم يتم إرسال أي صورة' })
    }

    // If it's already an existing HTTP/HTTPS URL, return it safely
    if (/^https?:\/\//i.test(String(rawData))) {
      return res.json({ success: true, url: rawData })
    }

    const matches = String(rawData).match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i)
    if (!matches || matches.length < 4) {
      return res.status(400).json({ error: 'نوع الملف غير مدعوم. يسمح فقط بصور من نوع JPG, PNG, WebP' })
    }

    const base64Data = matches[3]
    const buffer = Buffer.from(base64Data, 'base64')

    // Enforce 5MB size limit
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024
    if (buffer.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: 'حجم الصورة يتجاوز الحد المسموح به (5 ميجابايت كحد أقصى)' })
    }

    // Verify magic bytes
    const detectedExt = validateImageMagicBytes(buffer)
    if (!detectedExt) {
      return res.status(400).json({ error: 'محتوى الصورة غير صالح أو تالف' })
    }

    // Ensure uploads directory exists
    const uploadsDir = path.resolve(process.cwd(), 'server', 'data', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Cryptographically random filename with verified extension
    const finalFilename = `img_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 16)}.${detectedExt}`
    const filePath = path.join(uploadsDir, finalFilename)

    fs.writeFileSync(filePath, buffer)

    const publicUrl = `/uploads/${finalFilename}`
    res.status(201).json({ success: true, url: publicUrl, message: 'تم رفع الصورة بنجاح' })
  } catch (err: any) {
    console.error('Image upload error:', err)
    res.status(500).json({ error: 'فشل حفظ الصورة' })
  }
})

// GET /api/v1/admin/activity (Audit logs)
router.get('/activity', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, table_name AS "tableName", action_type AS "actionType", performed_by AS "performedBy", old_data AS "oldData", new_data AS "newData", created_at AS "createdAt"
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT 50`
    )

    res.json(result.rows)
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch activity logs' })
  }
})

// GET /api/v1/admin/users (RBAC Team)
router.get('/users', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, name, username, email, role, avatar_url AS "avatarUrl", (is_active = 1 OR is_active = TRUE) AS "isActive", last_login_at AS "lastLoginAt", created_at AS "createdAt"
       FROM admin_users
       ORDER BY created_at ASC`
    )
    res.json(result.rows)
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin users' })
  }
})

// POST /api/v1/admin/users (Super Admin Only)
router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const { name, username, email, password, role = 'admin', avatarUrl } = req.body
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'الاسم واسم المستخدم وكلمة المرور مطلوبة' })
    }

    const { validatePasswordStrength, hashPassword } = await import('../../lib/password.js')
    const passValidation = validatePasswordStrength(password)
    if (!passValidation.valid) {
      return res.status(400).json({ error: passValidation.error })
    }

    const cleanUsername = String(username).trim().toLowerCase().slice(0, 50)
    const cleanEmail = email ? String(email).toLowerCase().trim().slice(0, 100) : `${cleanUsername}@kas.dz`
    const allowedRoles = ['admin', 'super_admin']
    const cleanRole = allowedRoles.includes(role) ? role : 'admin'

    const existingUser = await query(
      `SELECT id FROM admin_users WHERE LOWER(username) = $1 OR LOWER(email) = $2`,
      [cleanUsername, cleanEmail]
    )
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' })
    }

    const id = randomUUID()
    await query(
      `INSERT INTO admin_users (id, name, username, email, password_hash, role, avatar_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
      [id, String(name).trim().slice(0, 100), cleanUsername, cleanEmail, hashPassword(password), cleanRole, avatarUrl || null]
    )

    res.status(201).json({ success: true, id, message: 'تمت إضافة المسؤول بنجاح' })
  } catch (err: any) {
    console.error('Error creating admin user:', err)
    res.status(500).json({ error: 'فشل إنشاء المستخدم' })
  }
})

// PUT /api/v1/admin/users/:id (Super Admin Only)
router.put('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, username, email, password, role, avatarUrl } = req.body

    const existing = await query(`SELECT id, password_hash FROM admin_users WHERE id = $1`, [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' })
    }

    const cleanUsername = username ? String(username).trim().toLowerCase().slice(0, 50) : undefined
    const cleanEmail = email ? String(email).trim().toLowerCase().slice(0, 100) : undefined
    const cleanRole = role && ['admin', 'super_admin'].includes(role) ? role : undefined

    let passwordChanged = false
    let passwordHash = existing.rows[0].password_hash
    if (password && String(password).trim().length > 0) {
      const { validatePasswordStrength, hashPassword } = await import('../../lib/password.js')
      const passValidation = validatePasswordStrength(String(password))
      if (!passValidation.valid) {
        return res.status(400).json({ error: passValidation.error })
      }
      passwordHash = hashPassword(String(password))
      passwordChanged = true
    }

    await query(
      `UPDATE admin_users
       SET name = COALESCE($1, name),
           username = COALESCE($2, username),
           email = COALESCE($3, email),
           role = COALESCE($4, role),
           avatar_url = COALESCE($5, avatar_url),
           password_hash = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [name ? String(name).trim().slice(0, 100) : null, cleanUsername || null, cleanEmail || null, cleanRole || null, avatarUrl || null, passwordHash, id]
    )

    // Invalidate existing sessions if password or role changed
    if (passwordChanged || cleanRole) {
      await query(`DELETE FROM admin_sessions WHERE user_id = $1`, [id])
    }

    res.json({ success: true, message: 'تم تحديث بيانات المسؤول بنجاح' })
  } catch (err: any) {
    console.error('Error updating admin user:', err)
    res.status(500).json({ error: 'فشل تحديث بيانات المستخدم' })
  }
})

// PUT /api/v1/admin/users/:id/toggle-active (Super Admin Only)
router.put('/users/:id/toggle-active', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const currentAdmin = req.adminUser

    if (currentAdmin && currentAdmin.id === id) {
      return res.status(400).json({ error: 'لا يمكنك تعطيل حسابك الحالي' })
    }

    const cur = await query(`SELECT is_active FROM admin_users WHERE id = $1`, [id])
    if (cur.rows.length === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' })
    }

    const currentActive = cur.rows[0].is_active === 1 || cur.rows[0].is_active === true
    const newActive = currentActive ? 0 : 1

    await query(`UPDATE admin_users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newActive, id])

    // Invalidate active sessions immediately if account is deactivated
    if (!newActive) {
      await query(`DELETE FROM admin_sessions WHERE user_id = $1`, [id])
    }

    res.json({ success: true, isActive: Boolean(newActive), message: 'تم تحديث حالة الحساب بنجاح' })
  } catch (err: any) {
    console.error('Error toggling admin user active:', err)
    res.status(500).json({ error: 'فشل تعديل حالة الحساب' })
  }
})

// DELETE /api/v1/admin/users/:id (Super Admin Only)
router.delete('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const currentAdmin = req.adminUser

    if (currentAdmin && currentAdmin.id === id) {
      return res.status(400).json({ error: 'لا يمكنك حذف حسابك الحالي' })
    }

    const adminsCountRes = await query(`SELECT COUNT(*) AS count FROM admin_users WHERE is_active = 1 OR is_active = TRUE`)
    if (Number(adminsCountRes.rows[0]?.count || 0) <= 1) {
      return res.status(400).json({ error: 'لا يمكن حذف المسؤول الوحيد المتبقي' })
    }

    await query(`DELETE FROM admin_sessions WHERE user_id = $1`, [id])
    await query(`DELETE FROM admin_users WHERE id = $1`, [id])

    res.json({ success: true, message: 'تم حذف حساب المسؤول بنجاح' })
  } catch (err: any) {
    console.error('Error deleting admin user:', err)
    res.status(500).json({ error: 'فشل حذف المسؤول' })
  }
})

// GET /api/v1/admin/settings
router.get('/settings', async (_req, res) => {
  try {
    const result = await query(`SELECT setting_key AS "key", setting_value AS "value", category FROM system_settings`)
    const settingsMap: Record<string, string> = {}
    for (const r of result.rows) {
      settingsMap[r.key] = r.value
    }
    res.json(settingsMap)
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// PUT /api/v1/admin/settings
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body
    for (const [k, v] of Object.entries(settings)) {
      const existing = await query(`SELECT setting_key FROM system_settings WHERE setting_key = $1`, [k])
      if (existing.rows.length > 0) {
        await query(`UPDATE system_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2`, [String(v), k])
      } else {
        await query(`INSERT INTO system_settings (setting_key, setting_value) VALUES ($1, $2)`, [k, String(v)])
      }
    }
    res.json({ success: true, message: 'تم حفظ الإعدادات بنجاح' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// GET /api/v1/admin/notifications
router.get('/notifications', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, title, message, type, (is_read = 1 OR is_read = TRUE) AS "isRead", link, created_at AS "createdAt"
       FROM notifications
       ORDER BY created_at DESC
       LIMIT 20`
    )
    res.json(result.rows)
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// PUT /api/v1/admin/notifications/mark-read
router.put('/notifications/mark-read', async (_req, res) => {
  try {
    await query(`UPDATE notifications SET is_read = 1`)
    res.json({ success: true, message: 'تم تعيين جميع الإشعارات كمقروءة' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to mark read' })
  }
})

// GET /api/v1/admin/search (Global Instant Search across all entities)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query as Record<string, string>
    if (!q || q.trim().length < 2) {
      return res.json({ orders: [], customers: [], products: [] })
    }

    const term = `%${q.trim()}%`

    const orders = await query(
      `SELECT id, order_reference AS "orderReference", customer_first_name AS "firstName", customer_last_name AS "lastName",
              customer_phone AS phone, total_amount AS "totalAmount", status, created_at AS "createdAt"
       FROM orders
       WHERE order_reference ILIKE $1 OR customer_phone ILIKE $1 OR customer_first_name ILIKE $1 OR customer_last_name ILIKE $1
       ORDER BY created_at DESC LIMIT 5`,
      [term]
    )

    const customers = await query(
      `SELECT id, phone, first_name AS "firstName", last_name AS "lastName", commune, total_orders_count AS "totalOrdersCount"
       FROM customers
       WHERE phone ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1
       LIMIT 5`,
      [term]
    )

    const products = await query(
      `SELECT p.id, p.name_ar AS name, p.base_part_number AS "partNumber", p.sku,
              (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id) AS price,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC LIMIT 1) AS image
       FROM products p
       WHERE p.name_ar ILIKE $1 OR p.name_fr ILIKE $1 OR p.base_part_number ILIKE $1 OR p.sku ILIKE $1
       LIMIT 5`,
      [term]
    )

    res.json({
      orders: orders.rows,
      customers: customers.rows,
      products: products.rows,
    })
  } catch (err: any) {
    res.status(500).json({ error: 'Global search failed' })
  }
})

export default router
