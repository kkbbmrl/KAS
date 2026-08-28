import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query } from '../../db/db.js'

const router = Router()

// GET /api/v1/admin/inventory
router.get('/', async (req, res) => {
  try {
    const { status, q, page = '1', limit = '30' } = req.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page, 10))
    const pageLimit = Math.max(1, parseInt(limit, 10))
    const offset = (pageNum - 1) * pageLimit

    let sql = `
      SELECT 
        v.id AS "variantId",
        v.product_id AS "productId",
        v.variant_sku AS sku,
        v.part_number AS "partNumber",
        v.label_ar AS "variantLabel",
        v.price,
        v.stock_quantity AS "stockQuantity",
        v.stock_status AS "stockStatus",
        v.updated_at AS "updatedAt",
        p.name_ar AS "productName",
        p.name_fr AS "productNameFr",
        c.name_ar AS category,
        b.name AS brand,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC LIMIT 1) AS image
      FROM product_variants v
      JOIN products p ON p.id = v.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      WHERE (v.is_active = 1 OR v.is_active = TRUE)
    `
    const params: any[] = []

    if (status === 'out_of_stock') {
      sql += ` AND (v.stock_quantity = 0 OR v.stock_status = 'out_of_stock')`
    } else if (status === 'low_stock') {
      sql += ` AND (v.stock_quantity BETWEEN 1 AND 5)`
    } else if (status === 'in_stock') {
      sql += ` AND (v.stock_quantity > 5)`
    }

    if (q) {
      params.push(`%${q.trim()}%`)
      const idx = params.length
      sql += ` AND (
        p.name_ar ILIKE $${idx} OR
        p.name_fr ILIKE $${idx} OR
        v.part_number ILIKE $${idx} OR
        v.variant_sku ILIKE $${idx}
      )`
    }

    const countSql = `SELECT COUNT(*) AS count FROM (${sql}) AS sub`
    const countRes = await query(countSql, params)
    const total = Number(countRes.rows[0]?.count || 0)

    sql += ` ORDER BY v.stock_quantity ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pageLimit, offset)

    const result = await query(sql, params)

    res.json({
      items: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    })
  } catch (err: any) {
    console.error('Error fetching inventory:', err)
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
})

// POST /api/v1/admin/inventory/adjust
router.post('/adjust', async (req, res) => {
  try {
    const { variantId, productId, quantityDelta, newQuantity, reason } = req.body
    const adminName = req.adminUser?.name || 'مسؤول النظام'

    let targetVariantId = variantId
    if (!targetVariantId && productId) {
      const vRes = await query(`SELECT id FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1`, [productId])
      if (vRes.rows.length > 0) {
        targetVariantId = vRes.rows[0].id
      }
    }

    if (!targetVariantId) {
      return res.status(400).json({ error: 'معرف المتغير أو المنتج مطلوب' })
    }

    const cur = await query(`SELECT id, product_id, stock_quantity FROM product_variants WHERE id = $1`, [targetVariantId])
    if (cur.rows.length === 0) return res.status(404).json({ error: 'لم يتم العثور على سجل المخزون المطلوب' })

    const curStock = Number(cur.rows[0].stock_quantity || 0)
    let finalStock = curStock

    if (newQuantity !== undefined) {
      finalStock = Math.max(0, Number(newQuantity))
    } else if (quantityDelta !== undefined) {
      finalStock = Math.max(0, curStock + Number(quantityDelta))
    }

    const delta = finalStock - curStock
    const stockStatus = finalStock === 0 ? 'out_of_stock' : finalStock <= 5 ? 'limited_stock' : 'in_stock'

    // Update variant
    await query(
      `UPDATE product_variants SET stock_quantity = $1, stock_status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [finalStock, stockStatus, targetVariantId]
    )

    // Log transaction
    const deltaType = delta >= 0 ? 'manual_correction_surplus' : 'manual_correction_loss'
    try {
      await query(
        `INSERT INTO inventory_transactions (id, variant_id, delta_type, quantity_delta, quantity_before, quantity_after, reason, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [randomUUID(), targetVariantId, deltaType, delta, curStock, finalStock, reason || 'تعديل يدوي للمخزون', adminName]
      )
    } catch (txErr) {
      console.warn('Could not write inventory transaction log:', txErr)
    }

    // Log audit action
    try {
      const { logAuditAction } = await import('../../lib/audit.js')
      await logAuditAction({
        tableName: 'product_variants',
        recordId: targetVariantId,
        actionType: 'ADJUST',
        oldData: { stockQuantity: curStock },
        newData: { qty: finalStock, delta, reason: reason || 'تعديل يدوي للمخزون' },
        performedBy: adminName,
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      })
    } catch {}

    res.json({
      success: true,
      stockQuantity: finalStock,
      stockStatus,
      message: `تم تحديث المخزون إلى ${finalStock} قطعة بنجاح`,
    })
  } catch (err: any) {
    console.error('Error adjusting inventory:', err)
    res.status(500).json({ error: 'فشل تعديل المخزون' })
  }
})

// GET /api/v1/admin/inventory/transactions
router.get('/transactions', async (_req, res) => {
  try {
    const result = await query(
      `SELECT 
        t.id, t.variant_id AS "variantId", t.delta_type AS "deltaType", t.quantity_delta AS "quantityDelta",
        t.quantity_after AS "quantityAfter", t.reason, t.created_by AS "createdBy", t.created_at AS "createdAt",
        v.part_number AS "partNumber", v.label_ar AS "variantLabel", p.name_ar AS "productName"
       FROM inventory_transactions t
       JOIN product_variants v ON v.id = t.variant_id
       JOIN products p ON p.id = v.product_id
       ORDER BY t.created_at DESC
       LIMIT 50`
    )
    res.json(result.rows)
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch inventory ledger' })
  }
})

export default router
