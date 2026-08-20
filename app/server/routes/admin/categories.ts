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

// DELETE /api/v1/admin/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const prodsCount = await query(`SELECT COUNT(*) AS count FROM products WHERE category_id = $1`, [id])
    if (Number(prodsCount.rows[0]?.count || 0) > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف الفئة لأنها تحتوي على منتجات مرتبطة' })
    }

    await query(`DELETE FROM categories WHERE id = $1`, [id])
    res.json({ success: true, message: 'تم حذف الفئة بنجاح' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

export default router
