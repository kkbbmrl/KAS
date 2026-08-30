import { Router } from 'express'
import { query } from '../../db/db.js'

const router = Router()

// GET /api/v1/admin/customers
router.get('/', async (req, res) => {
  try {
    const { q, wilaya, isBlacklisted, page = '1', limit = '25' } = req.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page, 10))
    const pageLimit = Math.max(1, parseInt(limit, 10))
    const offset = (pageNum - 1) * pageLimit

    let sql = `
      SELECT 
        c.id,
        c.phone,
        c.first_name AS "firstName",
        c.last_name AS "lastName",
        c.wilaya_code AS "wilayaCode",
        w.name_ar AS "wilayaNameAr",
        c.commune,
        c.address,
        c.total_orders_count AS "totalOrdersCount",
        c.delivered_orders_count AS "deliveredOrdersCount",
        c.refused_orders_count AS "refusedOrdersCount",
        (c.is_blacklisted = 1 OR c.is_blacklisted = TRUE) AS "isBlacklisted",
        c.internal_notes AS "internalNotes",
        c.created_at AS "createdAt",
        (SELECT COALESCE(SUM(o.subtotal), 0) FROM orders o WHERE o.customer_id = c.id OR o.customer_phone = c.phone) AS "totalSpent",
        (SELECT MAX(o.created_at) FROM orders o WHERE o.customer_id = c.id OR o.customer_phone = c.phone) AS "lastOrderAt"
      FROM customers c
      LEFT JOIN algeria_wilayas w ON w.code = c.wilaya_code
      WHERE 1=1
    `
    const params: any[] = []

    if (wilaya && wilaya !== 'all') {
      params.push(wilaya)
      sql += ` AND c.wilaya_code = $${params.length}`
    }

    if (isBlacklisted === 'true') {
      sql += ` AND (c.is_blacklisted = 1 OR c.is_blacklisted = TRUE)`
    }

    if (q) {
      params.push(`%${q.trim()}%`)
      const idx = params.length
      sql += ` AND (
        c.first_name ILIKE $${idx} OR
        c.last_name ILIKE $${idx} OR
        c.phone ILIKE $${idx} OR
        c.commune ILIKE $${idx}
      )`
    }

    const countSql = `SELECT COUNT(*) AS count FROM (${sql}) AS sub`
    const countRes = await query(countSql, params)
    const total = Number(countRes.rows[0]?.count || 0)

    sql += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pageLimit, offset)

    const result = await query(sql, params)

    res.json({
      customers: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    })
  } catch (err: any) {
    console.error('Error fetching customers:', err)
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

// GET /api/v1/admin/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const custRes = await query(
      `SELECT 
        c.id, c.phone, c.first_name AS "firstName", c.last_name AS "lastName",
        c.wilaya_code AS "wilayaCode", w.name_ar AS "wilayaNameAr", c.commune, c.address,
        c.total_orders_count AS "totalOrdersCount", (c.is_blacklisted = 1 OR c.is_blacklisted = TRUE) AS "isBlacklisted",
        c.internal_notes AS "internalNotes", c.created_at AS "createdAt"
       FROM customers c
       LEFT JOIN algeria_wilayas w ON w.code = c.wilaya_code
       WHERE c.id = $1 OR c.phone = $1`,
      [id]
    )

    if (custRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    const customer = custRes.rows[0]
    const ordersRes = await query(
      `SELECT id, order_reference AS "orderReference", status, total_amount AS "totalAmount", created_at AS "createdAt"
       FROM orders
       WHERE customer_id = $1 OR customer_phone = $2
       ORDER BY created_at DESC`,
      [customer.id, customer.phone]
    )

    res.json({
      ...customer,
      orders: ordersRes.rows,
    })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch customer profile' })
  }
})

// PUT /api/v1/admin/customers/:id/blacklist
router.put('/:id/blacklist', async (req, res) => {
  try {
    const { id } = req.params
    const cur = await query(`SELECT is_blacklisted FROM customers WHERE id = $1`, [id])
    const newStatus = cur.rows[0]?.is_blacklisted ? 0 : 1
    await query(`UPDATE customers SET is_blacklisted = $1 WHERE id = $2`, [newStatus, id])
    res.json({ success: true, isBlacklisted: Boolean(newStatus), message: newStatus ? 'تمت إضافة العميل إلى القائمة السوداء' : 'تم رفع الحظر عن العميل' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle blacklist' })
  }
})

// PUT /api/v1/admin/customers/:id/notes
router.put('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params
    const { internalNotes } = req.body
    await query(`UPDATE customers SET internal_notes = $1 WHERE id = $2`, [internalNotes, id])
    res.json({ success: true, message: 'تم حفظ ملاحظات العميل بنجاح' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update customer notes' })
  }
})

export default router
