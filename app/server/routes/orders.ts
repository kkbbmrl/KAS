import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query } from '../db/db.js'

const router = Router()

// POST /api/v1/orders (Place COD Order)
router.post('/', async (req, res) => {
  try {
    const {
      source = 'cart_checkout',
      offerId,
      firstName,
      lastName,
      phone,
      wilayaCode,
      commune,
      address,
      notes,
      items, // Array: [{ variantId?: string, productId?: string, quantity: number, price?: number, name?: string }]
    } = req.body

    // 1. Basic validation
    if (!firstName || !lastName || !phone || !address || (!wilayaCode && !commune)) {
      return res.status(400).json({ error: 'يرجى ملء جميع بيانات التوصيل المطلوبة' })
    }

    const cleanPhone = phone.replace(/\s+/g, '')
    if (!/^(0[5-7]\d{8}|\+?213[5-7]\d{8}|0[2-4]\d{7})$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'يرجى إدخال رقم هاتف جزائري صحيح' })
    }

    // 2. Fetch Wilaya fee
    let finalWilayaCode = wilayaCode
    if (!finalWilayaCode && commune) {
      // Extract from formatted string e.g. "16 - الجزائر"
      const match = commune.match(/^(\d{2})/)
      if (match) finalWilayaCode = match[1]
    }
    if (!finalWilayaCode) finalWilayaCode = '16'

    const wilayaRes = await query(`SELECT shipping_fee AS "shippingFee" FROM algeria_wilayas WHERE code = $1`, [finalWilayaCode])
    const shippingFee = wilayaRes.rows[0]?.shippingFee ?? 500

    // 3. Upsert Customer
    let customerId = randomUUID()
    const existingCust = await query(`SELECT id FROM customers WHERE phone = $1`, [cleanPhone])
    if (existingCust.rows.length > 0) {
      customerId = existingCust.rows[0].id
      await query(
        `UPDATE customers SET
          first_name = $1, last_name = $2, wilaya_code = $3, commune = $4, address = $5,
          total_orders_count = total_orders_count + 1
         WHERE id = $6`,
        [firstName, lastName, finalWilayaCode, commune || '', address, customerId]
      )
    } else {
      await query(
        `INSERT INTO customers (id, phone, first_name, last_name, wilaya_code, commune, address, total_orders_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
        [customerId, cleanPhone, firstName, lastName, finalWilayaCode, commune || '', address]
      )
    }

    // 4. Generate Order Reference: KAS-XXXXXX
    const orderRef = `KAS-${Math.floor(100000 + Math.random() * 900000)}`
    const orderId = randomUUID()

    // 5. Pre-calculate line items & subtotal
    let subtotal = 0
    const itemsToInsert: any[] = []

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const qty = Math.max(1, Number(item.quantity || item.qty || 1))
        let unitPrice = Number(item.price || 0)
        let prodId = item.productId || item.id
        let varId = item.variantId
        let prodName = item.name || 'قطعة غيار'
        let partNum = item.partNumber || 'PART-AUTO'
        let stockQty = 10

        // Look up db product/variant if available
        if (prodId || varId) {
          const varRes = await query(
            `SELECT v.id AS "variantId", v.product_id AS "productId", v.price, v.part_number AS "partNumber", p.name_ar AS name, v.stock_quantity
             FROM product_variants v
             JOIN products p ON p.id = v.product_id
             WHERE v.id = $1 OR v.product_id = $1 OR p.id = $1 OR p.sku = $2
             LIMIT 1`,
            [varId || prodId, `SKU-PRD-${prodId}`]
          )
          if (varRes.rows.length > 0) {
            const v = varRes.rows[0]
            unitPrice = v.price
            prodId = v.productId
            varId = v.variantId
            prodName = v.name
            partNum = v.partNumber
            stockQty = v.stock_quantity || 0
          }
        }

        // If prodId is still not a UUID, grab any default product
        if (!prodId || typeof prodId === 'number' || String(prodId).length < 20) {
          const fallbackProd = await query(`SELECT id FROM products LIMIT 1`)
          prodId = fallbackProd.rows[0]?.id
        }

        const lineTotal = unitPrice * qty
        subtotal += lineTotal

        itemsToInsert.push({
          itemId: randomUUID(),
          prodId,
          varId,
          prodName,
          partNum,
          unitPrice,
          qty,
          lineTotal,
          stockQty,
        })
      }
    }

    const totalAmount = subtotal + shippingFee

    // 6. Insert Order Header FIRST (Satisfies Foreign Key constraints)
    await query(
      `INSERT INTO orders (
        id, order_reference, order_source, offer_id, customer_id,
        customer_first_name, customer_last_name, customer_phone,
        wilaya_code, commune, delivery_address, customer_notes,
        subtotal, shipping_fee, total_amount, status, payment_status, payment_method, courier_company
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending_confirmation', 'unpaid', 'COD', 'Yalidine')`,
      [
        orderId,
        orderRef,
        source,
        offerId || null,
        customerId,
        firstName,
        lastName,
        cleanPhone,
        finalWilayaCode,
        commune || '',
        address,
        notes || null,
        subtotal,
        shippingFee,
        totalAmount,
      ]
    )

    // 7. Insert Line Items and update inventory
    const processedItems: any[] = []
    for (const it of itemsToInsert) {
      if (it.varId) {
        await query(
          `UPDATE product_variants SET stock_quantity = MAX(0, stock_quantity - $1) WHERE id = $2`,
          [it.qty, it.varId]
        )
        await query(
          `INSERT INTO inventory_transactions (id, variant_id, delta_type, order_id, quantity_delta, quantity_after, reason)
           VALUES ($1, $2, 'order_reservation', $3, $4, $5, $6)`,
          [randomUUID(), it.varId, orderId, -it.qty, Math.max(0, it.stockQty - it.qty), `Order placement ${orderRef}`]
        )
      }

      await query(
        `INSERT INTO order_items (id, order_id, product_id, variant_id, product_name_snapshot, part_number_snapshot, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [it.itemId, orderId, it.prodId, it.varId || null, it.prodName, it.partNum, it.unitPrice, it.qty, it.lineTotal]
      )

      processedItems.push({
        id: it.itemId,
        name: it.prodName,
        partNumber: it.partNum,
        price: it.unitPrice,
        qty: it.qty,
        lineTotal: it.lineTotal,
      })
    }

    res.status(201).json({
      success: true,
      orderId,
      orderReference: orderRef,
      firstName,
      lastName,
      phone: cleanPhone,
      address,
      commune,
      wilayaCode: finalWilayaCode,
      subtotal,
      shippingFee,
      totalAmount,
      items: processedItems,
      createdAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('Error placing order:', err)
    res.status(500).json({ error: 'Failed to place order' })
  }
})

// GET /api/v1/orders/:orderReference (Tracking)
router.get('/:orderReference', async (req, res) => {
  try {
    const { orderReference } = req.params
    const orderRes = await query(
      `SELECT 
        o.id, o.order_reference AS "orderReference", o.status, o.created_at AS "createdAt",
        o.customer_first_name AS "firstName", o.customer_last_name AS "lastName",
        o.customer_phone AS phone, o.wilaya_code AS "wilayaCode", o.commune, o.delivery_address AS address,
        o.subtotal, o.shipping_fee AS "shippingFee", o.total_amount AS "totalAmount",
        o.courier_company AS courier, o.tracking_number AS "trackingNumber",
        w.name_ar AS "wilayaNameAr", w.name_fr AS "wilayaNameFr"
       FROM orders o
       LEFT JOIN algeria_wilayas w ON w.code = o.wilaya_code
       WHERE o.order_reference = $1 OR o.id = $1`,
      [orderReference]
    )

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const order = orderRes.rows[0]
    const itemsRes = await query(
      `SELECT id, product_name_snapshot AS name, part_number_snapshot AS "partNumber", unit_price AS price, quantity AS qty, line_total AS "lineTotal"
       FROM order_items
       WHERE order_id = $1`,
      [order.id]
    )

    res.json({
      ...order,
      items: itemsRes.rows,
    })
  } catch (err: any) {
    console.error('Error tracking order:', err)
    res.status(500).json({ error: 'Failed to fetch order tracking' })
  }
})

export default router
