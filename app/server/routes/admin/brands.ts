import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query } from '../../db/db.js'

const router = Router()

// GET /api/v1/admin/brands
router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `SELECT 
        b.id, b.slug, b.name, b.logo_url AS "logoUrl", b.origin_country AS "originCountry",
        (b.is_featured = 1 OR b.is_featured = TRUE) AS "isFeatured", b.display_order AS "displayOrder",
        (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) AS "productsCount"
       FROM brands b
       ORDER BY b.display_order ASC, b.name ASC`
    )
    res.json(result.rows)
  } catch (err: any) {
    console.error('Error fetching admin brands:', err)
    res.status(500).json({ error: 'فشل جلب قائمة الماركات' })
  }
})

// POST /api/v1/admin/brands
router.post('/', async (req, res) => {
  try {
    const { name, slug, logoUrl, originCountry, isFeatured = false, displayOrder = 0 } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'اسم الماركة مطلوب' })
    }

    const cleanName = String(name).trim()
    const finalSlug = slug
      ? String(slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `brand-${Date.now()}`

    // Check if brand already exists by name or slug
    const existing = await query(`SELECT id FROM brands WHERE LOWER(name) = LOWER($1) OR slug = $2`, [cleanName, finalSlug])
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'هذه الماركة مسجلة بالفعل', id: existing.rows[0].id })
    }

    const id = randomUUID()
    await query(
      `INSERT INTO brands (id, slug, name, logo_url, origin_country, is_featured, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, finalSlug, cleanName, logoUrl || null, originCountry || null, isFeatured ? 1 : 0, Number(displayOrder) || 0]
    )

    res.status(201).json({ success: true, id, message: 'تمت إضافة الماركة بنجاح' })
  } catch (err: any) {
    console.error('Error creating brand:', err)
    res.status(500).json({ error: 'فشل إضافة الماركة' })
  }
})

// PUT /api/v1/admin/brands/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, slug, logoUrl, originCountry, isFeatured, displayOrder } = req.body

    const existing = await query(`SELECT id FROM brands WHERE id = $1`, [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'الماركة غير موجودة' })
    }

    await query(
      `UPDATE brands SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        logo_url = COALESCE($3, logo_url),
        origin_country = COALESCE($4, origin_country),
        is_featured = COALESCE($5, is_featured),
        display_order = COALESCE($6, display_order),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [
        name ? String(name).trim() : null,
        slug ? String(slug).trim().toLowerCase() : null,
        logoUrl !== undefined ? logoUrl : null,
        originCountry !== undefined ? originCountry : null,
        isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
        displayOrder !== undefined ? Number(displayOrder) : null,
        id,
      ]
    )

    res.json({ success: true, message: 'تم تحديث بيانات الماركة بنجاح' })
  } catch (err: any) {
    console.error('Error updating brand:', err)
    res.status(500).json({ error: 'فشل تحديث الماركة' })
  }
})

// DELETE /api/v1/admin/brands/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const prodsCount = await query(`SELECT COUNT(*) AS count FROM products WHERE brand_id = $1`, [id])
    if (Number(prodsCount.rows[0]?.count || 0) > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف الماركة لأنها مرتبطة بمنتجات موجودة في الكتالوج' })
    }

    await query(`DELETE FROM brands WHERE id = $1`, [id])
    res.json({ success: true, message: 'تم حذف الماركة بنجاح' })
  } catch (err: any) {
    console.error('Error deleting brand:', err)
    res.status(500).json({ error: 'فشل حذف الماركة' })
  }
})

export default router
