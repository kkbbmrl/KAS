import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query } from '../../db/db.js'

const router = Router()

// GET /api/v1/admin/orders (List with advanced filtering & search)
router.get('/', async (req, res) => {
  try {
    const {
      q,
      status,
      wilaya,
      source,
      page = '1',
      limit = '25',
    } = req.query as Record<string, string>

    const pageNum = Math.max(1, parseInt(page, 10))
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10)))
    const offset = (pageNum - 1) * pageLimit

    let sql = `
      SELECT 
        o.id,
        o.order_reference AS "orderReference",
        o.order_source AS source,
        o.customer_first_name AS "firstName",
        o.customer_last_name AS "lastName",
        o.customer_phone AS phone,
        o.wilaya_code AS "wilayaCode",
        w.name_ar AS "wilayaNameAr",
        w.name_fr AS "wilayaNameFr",
        o.commune,
        o.delivery_address AS address,
        o.subtotal,
        o.shipping_fee AS "shippingFee",
        o.total_amount AS "totalAmount",
        o.status,
        o.payment_status AS "paymentStatus",
        o.payment_method AS "paymentMethod",
        o.courier_company AS courier,
        o.tracking_number AS "trackingNumber",
        o.created_at AS "createdAt",
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS "itemsCount",
        (SELECT product_name_snapshot FROM order_items oi WHERE oi.order_id = o.id LIMIT 1) AS "mainProduct"
      FROM orders o
      LEFT JOIN algeria_wilayas w ON w.code = o.wilaya_code
      WHERE 1=1
    `
    const params: any[] = []

    if (status && status !== 'all') {
      params.push(status)
      sql += ` AND o.status = $${params.length}`
    }

    if (wilaya && wilaya !== 'all') {
      params.push(wilaya)
      sql += ` AND o.wilaya_code = $${params.length}`
    }

    if (source && source !== 'all') {
      params.push(source)
      sql += ` AND o.order_source = $${params.length}`
    }

    if (q) {
      params.push(`%${q.trim()}%`)
      const idx = params.length
      sql += ` AND (
        o.order_reference ILIKE $${idx} OR
        o.customer_first_name ILIKE $${idx} OR
        o.customer_last_name ILIKE $${idx} OR
        o.customer_phone ILIKE $${idx} OR
        o.delivery_address ILIKE $${idx} OR
        o.commune ILIKE $${idx} OR
        EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_name_snapshot ILIKE $${idx})
      )`
    }

    // Count query
    const countSql = `SELECT COUNT(*) AS count FROM (${sql}) AS sub`
    const countRes = await query(countSql, params)
    const totalCount = Number(countRes.rows[0]?.count || 0)

    sql += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pageLimit, offset)

    const result = await query(sql, params)

    res.json({
      orders: result.rows,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageLimit,
        pages: Math.ceil(totalCount / pageLimit),
      },
    })
  } catch (err: any) {
    console.error('Admin orders query error:', err)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// GET /api/v1/admin/orders/:id (Full Details)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const orderRes = await query(
      `SELECT 
        o.id,
        o.order_reference AS "orderReference",
        o.order_source AS source,
        o.offer_id AS "offerId",
        o.customer_id AS "customerId",
        o.customer_first_name AS "firstName",
        o.customer_last_name AS "lastName",
        o.customer_phone AS phone,
        o.wilaya_code AS "wilayaCode",
        w.name_ar AS "wilayaNameAr",
        w.name_fr AS "wilayaNameFr",
        o.commune,
        o.delivery_address AS address,
        o.customer_notes AS "customerNotes",
        o.call_center_notes AS "callCenterNotes",
        o.subtotal,
        o.shipping_fee AS "shippingFee",
        o.total_amount AS "totalAmount",
        o.status,
        o.payment_status AS "paymentStatus",
        o.payment_method AS "paymentMethod",
        o.courier_company AS courier,
        o.tracking_number AS "trackingNumber",
        o.created_at AS "createdAt",
        o.confirmed_at AS "confirmedAt",
        o.dispatched_at AS "dispatchedAt",
        o.delivered_at AS "deliveredAt",
        o.cancelled_at AS "cancelledAt"
       FROM orders o
       LEFT JOIN algeria_wilayas w ON w.code = o.wilaya_code
       WHERE o.id = $1 OR o.order_reference = $1`,
      [id]
    )

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const order = orderRes.rows[0]

    // Items
    const itemsRes = await query(
      `SELECT 
        oi.id,
        oi.product_id AS "productId",
        oi.variant_id AS "variantId",
        oi.product_name_snapshot AS name,
        oi.part_number_snapshot AS "partNumber",
        oi.unit_price AS price,
        oi.quantity AS qty,
        oi.line_total AS "lineTotal"
       FROM order_items oi
       WHERE oi.order_id = $1`,
      [order.id]
    )

    // Timeline events
    const timelineRes = await query(
      `SELECT id, status, title_ar AS title, note, created_by AS "createdBy", created_at AS "createdAt"
       FROM order_timeline
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [order.id]
    )

    res.json({
      ...order,
      items: itemsRes.rows,
      timeline: timelineRes.rows,
    })
  } catch (err: any) {
    console.error('Error fetching admin order details:', err)
    res.status(500).json({ error: 'Failed to fetch order details' })
  }
})

// PUT /api/v1/admin/orders/:id/status (Update status + timeline event)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, note } = req.body
    const adminName = req.adminUser?.name || 'مسؤول النظام'

    const statusTitles: Record<string, string> = {
      pending_confirmation: 'طلب قيد المراجعة',
      confirmed: 'تم تأكيد الطلب هاتفياً',
      processing: 'جاري تجهيز وتغليف الطلبية',
      dispatched: 'تم تسليم الطلبية لشركة التوصيل (ياليدين)',
      out_for_delivery: 'الطلبية في الطريق للعميل',
      delivered: 'تم تسليم الطلب واستلام المبلغ',
      refused_returned: 'تم رفض الطلب / إرجاع الطرد',
      cancelled: 'تم إلغاء الطلب',
    }

    const title = statusTitles[status] || `تغيير الحالة إلى ${status}`

    // Update order
    await query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR order_reference = $2`,
      [status, id]
    )

    // Grab actual order ID
    const orderRes = await query(`SELECT id FROM orders WHERE id = $1 OR order_reference = $1`, [id])
    const orderId = orderRes.rows[0]?.id

    if (orderId) {
      // Add timeline event
      await query(
        `INSERT INTO order_timeline (id, order_id, status, title_ar, note, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), orderId, status, title, note || null, adminName]
      )

      // If cancelled or returned, optionally restock
      if (status === 'cancelled' || status === 'refused_returned') {
        const items = await query(`SELECT variant_id, quantity FROM order_items WHERE order_id = $1 AND variant_id IS NOT NULL`, [orderId])
        for (const it of items.rows) {
          await query(`UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2`, [it.quantity, it.variant_id])
        }
      }
    }

    res.json({ success: true, status, message: 'تم تحديث حالة الطلب بنجاح' })
  } catch (err: any) {
    console.error('Error updating order status:', err)
    res.status(500).json({ error: 'Failed to update order status' })
  }
})

// PUT /api/v1/admin/orders/:id/notes (Update call notes & tracking)
router.put('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params
    const { callCenterNotes, trackingNumber, courier } = req.body

    await query(
      `UPDATE orders SET
        call_center_notes = COALESCE($1, call_center_notes),
        tracking_number = COALESCE($2, tracking_number),
        courier_company = COALESCE($3, courier_company),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 OR order_reference = $4`,
      [callCenterNotes, trackingNumber, courier, id]
    )

    res.json({ success: true, message: 'تم حفظ الملاحظات بنجاح' })
  } catch (err: any) {
    console.error('Error updating order notes:', err)
    res.status(500).json({ error: 'Failed to update notes' })
  }
})

// POST /api/v1/admin/orders/bulk-status (Bulk update)
router.post('/bulk-status', async (req, res) => {
  try {
    const { orderIds, status } = req.body
    const adminName = req.adminUser?.name || 'مسؤول النظام'
    if (!Array.isArray(orderIds) || orderIds.length === 0 || !status) {
      return res.status(400).json({ error: 'الطلبات والحالة مطلوبان' })
    }

    for (const id of orderIds) {
      await query(`UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [status, id])
      await query(
        `INSERT INTO order_timeline (id, order_id, status, title_ar, note, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), id, status, `تحديث جماعي للحالة: ${status}`, 'تحديث متعدد', adminName]
      )
    }

    res.json({ success: true, count: orderIds.length, message: `تم تحديث ${orderIds.length} طلب بنجاح` })
  } catch (err: any) {
    console.error('Error bulk updating orders:', err)
    res.status(500).json({ error: 'Failed to bulk update orders' })
  }
})

export default router
