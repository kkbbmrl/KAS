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

    // 2. Fetch Wilaya fee & ensure foreign key exists
    let finalWilayaCode = wilayaCode
    if (!finalWilayaCode && commune) {
      const match = commune.match(/^(\d{2})/)
      if (match) finalWilayaCode = match[1]
    }
    if (!finalWilayaCode) finalWilayaCode = '16'

    // Clean padding e.g. "1" -> "01"
    if (finalWilayaCode.length === 1) finalWilayaCode = `0${finalWilayaCode}`

    const wilayaRes = await query(`SELECT code, shipping_fee AS "shippingFee" FROM algeria_wilayas WHERE code = $1`, [finalWilayaCode])
    let shippingFee = 500
    if (wilayaRes.rows.length > 0) {
      shippingFee = Number(wilayaRes.rows[0].shippingFee) ?? 500
    } else {
      finalWilayaCode = '16' // Alger fallback
      const algerRes = await query(`SELECT shipping_fee AS "shippingFee" FROM algeria_wilayas WHERE code = '16'`)
      shippingFee = Number(algerRes.rows[0]?.shippingFee) ?? 500
    }

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

    // 4. Resolve Offer ID to real UUID if valid, or null to prevent foreign key errors
    let finalOfferId: string | null = null
    if (offerId) {
      const offerCheck = await query(`SELECT id FROM landing_offers WHERE id = $1 OR slug = $1 LIMIT 1`, [String(offerId)])
      if (offerCheck.rows.length > 0) {
        finalOfferId = offerCheck.rows[0].id
      }
    }

    // 5. Generate Order Reference: KAS-XXXXXX
    const orderRef = `KAS-${Math.floor(100000 + Math.random() * 900000)}`
    const orderId = randomUUID()

    // 6. Pre-calculate line items & subtotal
    let subtotal = 0
    const itemsToInsert: any[] = []

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'السلة فارغة — لا يمكن إنشاء طلب بدون قطع' })
    }

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity || item.qty || 1))
      const requestedId = item.variantId || item.productId || item.id

      // Try resolving against product_variants + products
      let varRes = await query(
        `SELECT v.id AS "variantId", v.product_id AS "productId", v.price, v.part_number AS "partNumber",
                p.name_ar AS name, v.stock_quantity AS "stockQuantity"
         FROM product_variants v
         JOIN products p ON p.id = v.product_id
         WHERE v.id = $1 OR v.product_id = $1 OR p.id = $1 OR p.sku = $1 OR p.slug = $1
         ORDER BY (v.id = $1) DESC, (v.product_id = $1) DESC
         LIMIT 1`,
        [String(requestedId || '')]
      )

      let prodId: string
      let varId: string | null = null
      let prodName = item.name || 'قطعة غيار'
      let partNum = item.partNumber || 'PART-AUTO'
      let unitPrice = item.price ? Number(item.price) : 0
      let stockQty = 10

      if (varRes.rows.length > 0) {
        const v = varRes.rows[0]
        prodId = v.productId
        varId = v.variantId
        prodName = item.name || v.name
        partNum = item.partNumber || v.partNumber || 'PART-AUTO'
        unitPrice = item.price ? Number(item.price) : Number(v.price) || 0
        stockQty = Number(v.stockQuantity) || 0
      } else {
        const prodCheck = await query(
          `SELECT id, name_ar, base_part_number, price FROM products WHERE id = $1 OR sku = $1 OR slug = $1 LIMIT 1`,
          [String(requestedId || '')]
        )
        if (prodCheck.rows.length > 0) {
          const p = prodCheck.rows[0]
          prodId = p.id
          prodName = item.name || p.name_ar
          partNum = item.partNumber || p.base_part_number || 'PART-AUTO'
          unitPrice = item.price ? Number(item.price) : Number(p.price) || 0
        } else {
          // Fallback to first existing product to satisfy Foreign Key constraint
          const firstProd = await query(`SELECT id, name_ar, base_part_number, price FROM products LIMIT 1`)
          if (firstProd.rows.length > 0) {
            const p = firstProd.rows[0]
            prodId = p.id
            prodName = item.name || p.name_ar
            partNum = item.partNumber || p.base_part_number || 'PART-AUTO'
            unitPrice = item.price ? Number(item.price) : Number(p.price) || 0
          } else {
            prodId = String(requestedId || randomUUID())
          }
        }
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

    const totalAmount = subtotal + shippingFee

    // 7. Insert Order Header FIRST (Satisfies Foreign Key constraints)
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
        finalOfferId,
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

    // 8. Insert timeline event
    try {
      await query(
        `INSERT INTO order_timeline (id, order_id, status, title_ar, notes)
         VALUES ($1, $2, 'pending_confirmation', 'تم إنشاء الطلب', $3)`,
        [randomUUID(), orderId, `طلب جديد عبر ${source === 'landing_offer' ? 'صفحة الهبوط' : 'المتجر'}`]
      )
    } catch {}

    // 7. Insert Line Items and update inventory
    const processedItems: any[] = []
    for (const it of itemsToInsert) {
      if (it.varId) {
        await query(
          `UPDATE product_variants SET stock_quantity = CASE WHEN stock_quantity > $1 THEN stock_quantity - $1 ELSE 0 END WHERE id = $2`,
          [it.qty, it.varId]
        )
        try {
          await query(
            `INSERT INTO inventory_transactions (id, variant_id, delta_type, order_id, quantity_delta, quantity_after, reason)
             VALUES ($1, $2, 'order_reservation', $3, $4, $5, $6)`,
            [randomUUID(), it.varId, orderId, -it.qty, Math.max(0, it.stockQty - it.qty), `Order placement ${orderRef}`]
          )
        } catch (err: any) {
          console.warn('Inventory log notice:', err.message)
        }
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
    res.status(500).json({ error: err.message || 'Failed to place order' })
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
