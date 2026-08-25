import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query } from '../../db/db.js'

const router = Router()

// GET /api/v1/admin/categories
router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `SELECT 
        c.id, c.slug, c.name_ar AS "nameAr", c.name_fr AS "nameFr", c.icon_name AS "iconName",
        (c.is_available = 1 OR c.is_available = TRUE) AS "isAvailable", c.display_order AS "displayOrder",
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS "productsCount"
       FROM categories c
       ORDER BY c.display_order ASC`
    )
    res.json(result.rows)
  } catch (err: any) {
    console.error('Error fetching admin categories:', err)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// POST /api/v1/admin/categories
router.post('/', async (req, res) => {
  try {
    const { nameAr, nameFr, iconName = 'Layers', isAvailable = true, slug } = req.body
    if (!nameAr || !nameFr) {
      return res.status(400).json({ error: 'الاسم بالعربية والفرنسية مطلوبان' })
    }

    const finalSlug = slug || nameFr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`
    const id = randomUUID()

    await query(
      `INSERT INTO categories (id, slug, name_ar, name_fr, icon_name, is_available)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, finalSlug, nameAr, nameFr, iconName, isAvailable ? 1 : 0]
    )

    res.status(201).json({ success: true, id, message: 'تم إنشاء الفئة بنجاح' })
  } catch (err: any) {
    console.error('Error creating category:', err)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// PUT /api/v1/admin/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nameAr, nameFr, iconName, isAvailable, displayOrder } = req.body

    await query(
      `UPDATE categories SET
        name_ar = COALESCE($1, name_ar),
        name_fr = COALESCE($2, name_fr),
        icon_name = COALESCE($3, icon_name),
        is_available = COALESCE($4, is_available),
        display_order = COALESCE($5, display_order),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [nameAr, nameFr, iconName, isAvailable !== undefined ? (isAvailable ? 1 : 0) : null, displayOrder, id]
    )

    res.json({ success: true, message: 'تم تحديث الفئة بنجاح' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update category' })
  }
})

// PUT /api/v1/admin/categories/:id/toggle-available
router.put('/:id/toggle-available', async (req, res) => {
  try {
    const { id } = req.params
    const cat = await query(`SELECT is_available FROM categories WHERE id = $1`, [id])
    if (cat.rows.length === 0) return res.status(404).json({ error: 'القسم غير موجود' })

    const cur = cat.rows[0].is_available
    const newStatus = cur === 1 || cur === true ? 0 : 1
    await query(`UPDATE categories SET is_available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newStatus, id])
    res.json({ success: true, isAvailable: Boolean(newStatus), message: newStatus ? 'تم تفعيل القسم' : 'تم تعطيل القسم' })
  } catch (err: any) {
    console.error('Error toggling category availability:', err)
    res.status(500).json({ error: 'فشل تغيير حالة القسم' })
  }
})

// POST /api/v1/admin/categories/sync-defaults
router.post('/sync-defaults', async (_req, res) => {
  try {
    const { CATEGORIES } = await import('../../src/data/products.js')
    let synced = 0
    for (let i = 0; i < CATEGORIES.length; i++) {
      const c = CATEGORIES[i]
      const slug = c.fr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${i}`
      const existing = await query(`SELECT id FROM categories WHERE slug = $1 OR name_ar = $2 OR name_fr = $3 LIMIT 1`, [slug, c.name, c.fr])
      if (existing.rows.length > 0) {
        await query(
          `UPDATE categories SET name_ar = $1, name_fr = $2, icon_name = $3, is_available = $4, display_order = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
          [c.name, c.fr, c.icon, c.available ? 1 : 0, i, existing.rows[0].id]
        )
      } else {
        await query(
          `INSERT INTO categories (id, slug, name_ar, name_fr, icon_name, is_available, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [randomUUID(), slug, c.name, c.fr, c.icon, c.available ? 1 : 0, i]
        )
      }
      synced++
    }
    res.json({ success: true, message: `تمت مزامنة واستعادة ${synced} قسم قياسي بنجاح` })
  } catch (err: any) {
    console.error('Error syncing categories:', err)
    res.status(500).json({ error: 'فشل مزامنة الأقسام القياسية' })
  }
})

// DELETE /api/v1/admin/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { reassignTo, force } = req.query as { reassignTo?: string; force?: string }

    const prodsCountRes = await query(`SELECT COUNT(*) AS count FROM products WHERE category_id = $1`, [id])
    const count = Number(prodsCountRes.rows[0]?.count || 0)

    if (count > 0) {
      if (reassignTo) {
        await query(`UPDATE products SET category_id = $1 WHERE category_id = $2`, [reassignTo, id])
      } else if (force === 'true') {
        const fallback = await query(`SELECT id FROM categories WHERE id != $1 ORDER BY display_order ASC LIMIT 1`, [id])
        if (fallback.rows.length > 0) {
          await query(`UPDATE products SET category_id = $1 WHERE category_id = $2`, [fallback.rows[0].id, id])
        } else {
          await query(`UPDATE products SET category_id = NULL WHERE category_id = $1`, [id])
        }
      } else {
        return res.status(400).json({
          error: `لا يمكن حذف هذا القسم مباشرة لأنه يحتوي على ${count} منتج مرتبط.`,
          hasProducts: true,
          productsCount: count,
        })
      }
    }

    await query(`DELETE FROM categories WHERE id = $1`, [id])
    res.json({ success: true, message: 'تم حذف القسم بنجاح' })
  } catch (err: any) {
    console.error('Error deleting category:', err)
    res.status(500).json({ error: 'فشل حذف القسم' })
  }
})

export default router
