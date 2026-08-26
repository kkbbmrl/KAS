import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query, withTransaction } from '../db/db.js'
import { orderPlacementRateLimiter, orderTrackingRateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '05*****000'
  return `${phone.slice(0, 2)}*****${phone.slice(-3)}`
}

function maskName(name: string): string {
  if (!name) return '***'
  const trimmed = name.trim()
  if (trimmed.length <= 2) return `${trimmed.charAt(0)}*`
  return `${trimmed.charAt(0)}***`
}

// POST /api/v1/orders (Place COD Order)
router.post('/', orderPlacementRateLimiter, async (req, res) => {
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
      items,
    } = req.body

    // 1. Strict Validation
    if (!firstName || !String(firstName).trim() || !lastName || !String(lastName).trim() || !phone || !address) {
      return res.status(400).json({ error: 'يرجى ملء جميع بيانات التوصيل المطلوبة (الاسم، اللقب، رقم الهاتف، العنوان)' })
    }

    const cleanFirstName = String(firstName).trim().slice(0, 80)
    const cleanLastName = String(lastName).trim().slice(0, 80)
    const cleanAddress = String(address).trim().slice(0, 255)
    const cleanCommune = commune ? String(commune).trim().slice(0, 100) : ''
    const cleanNotes = notes ? String(notes).trim().slice(0, 500) : null

    const cleanPhone = String(phone).replace(/\s+/g, '')
    if (!/^(0[5-7]\d{8}|\+?213[5-7]\d{8}|0[2-4]\d{7})$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'يرجى إدخال رقم هاتف جزائري صحيح (مثال: 0550123456)' })
    }

    // 2. Fetch Wilaya fee & ensure valid wilaya code
    let finalWilayaCode = wilayaCode ? String(wilayaCode).trim() : ''
    if (!finalWilayaCode && cleanCommune) {
      const match = cleanCommune.match(/^(\d{2})/)
      if (match) finalWilayaCode = match[1]
    }
    if (!finalWilayaCode) finalWilayaCode = '16'
    if (finalWilayaCode.length === 1) finalWilayaCode = `0${finalWilayaCode}`

    const wilayaRes = await query(`SELECT code, shipping_fee AS "shippingFee" FROM algeria_wilayas WHERE code = $1`, [finalWilayaCode])
    let shippingFee = 500
    if (wilayaRes.rows.length > 0) {
      shippingFee = Math.max(0, Number(wilayaRes.rows[0].shippingFee) || 500)
    } else {
      finalWilayaCode = '16' // Alger fallback
      const algerRes = await query(`SELECT shipping_fee AS "shippingFee" FROM algeria_wilayas WHERE code = '16'`)
      shippingFee = Math.max(0, Number(algerRes.rows[0]?.shippingFee) || 500)
    }

    // 3. Resolve Offer ID to real UUID if valid
    let finalOfferId: string | null = null
    let offerCustomPrice: number | null = null
    if (offerId) {
      const offerCheck = await query(`SELECT id, custom_price AS "customPrice" FROM landing_offers WHERE id = $1 OR slug = $1 LIMIT 1`, [String(offerId)])
      if (offerCheck.rows.length > 0) {
        finalOfferId = offerCheck.rows[0].id
        if (offerCheck.rows[0].customPrice != null) {
          offerCustomPrice = Number(offerCheck.rows[0].customPrice)
        }
      }
    }

    // 4. Validate and resolve line items with AUTHORITATIVE SERVER PRICING
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'السلة فارغة — لا يمكن إنشاء طلب بدون قطع' })
    }

    if (items.length > 30) {
      return res.status(400).json({ error: 'عدد القطع في الطلب الواحد يتجاوز الحد الأقصى المسموح به' })
    }

    let subtotal = 0
    const itemsToInsert: any[] = []

    for (const item of items) {
      const qty = Math.max(1, Math.min(50, Math.floor(Number(item.quantity || item.qty || 1))))
      const requestedId = String(item.variantId || item.productId || item.id || '').trim()

      if (!requestedId) continue

      // Authoritative DB lookup
      const varRes = await query(
        `SELECT v.id AS "variantId", v.product_id AS "productId", v.price, v.part_number AS "partNumber",
                p.name_ar AS name, v.stock_quantity AS "stockQuantity"
         FROM product_variants v
         JOIN products p ON p.id = v.product_id
         WHERE v.id = $1 OR v.product_id = $1 OR p.id = $1 OR p.sku = $1 OR p.base_part_number = $1
         ORDER BY (v.id = $1) DESC, (v.product_id = $1) DESC
         LIMIT 1`,
        [requestedId]
      )

      let prodId: string
      let varId: string | null = null
      let prodName = 'قطعة غيار'
      let partNum = 'PART-AUTO'
      let authoritativeUnitPrice = 0
      let stockQty = 10

      if (varRes.rows.length > 0) {
        const v = varRes.rows[0]
        prodId = v.productId
        varId = v.variantId
        prodName = v.name || 'قطعة غيار'
        partNum = v.partNumber || 'PART-AUTO'
        // If an offer is applied with a valid custom price, use offer price; otherwise database variant price
        authoritativeUnitPrice = offerCustomPrice !== null && source === 'landing_offer' ? offerCustomPrice : Number(v.price) || 0
        stockQty = Math.max(0, Number(v.stockQuantity) || 0)
      } else {
        const prodCheck = await query(
          `SELECT p.id, p.name_ar, p.base_part_number, COALESCE(v.price, 0) AS price, v.id AS "variantId"
           FROM products p
           LEFT JOIN product_variants v ON v.product_id = p.id
           WHERE p.id = $1 OR p.sku = $1 OR p.base_part_number = $1
           LIMIT 1`,
          [requestedId]
        )
        if (prodCheck.rows.length > 0) {
          const p = prodCheck.rows[0]
          prodId = p.id
          varId = p.variantId || null
          prodName = p.name_ar || 'قطعة غيار'
          partNum = p.base_part_number || 'PART-AUTO'
          authoritativeUnitPrice = offerCustomPrice !== null && source === 'landing_offer' ? offerCustomPrice : Number(p.price) || 0
        } else {
          // Fallback to first available product
          const firstProd = await query(
            `SELECT p.id, p.name_ar, p.base_part_number, COALESCE(v.price, 0) AS price, v.id AS "variantId"
             FROM products p
             LEFT JOIN product_variants v ON v.product_id = p.id
             LIMIT 1`
          )
          if (firstProd.rows.length > 0) {
            const p = firstProd.rows[0]
            prodId = p.id
            varId = p.variantId || null
            prodName = p.name_ar || 'قطعة غيار'
            partNum = p.base_part_number || 'PART-AUTO'
            authoritativeUnitPrice = offerCustomPrice !== null && source === 'landing_offer' ? offerCustomPrice : Number(p.price) || 0
          } else {
            return res.status(400).json({ error: 'المنتج المطلوب غير متوفر حالياً' })
          }
        }
      }

      // Security check: Unit price cannot be negative
      authoritativeUnitPrice = Math.max(0, authoritativeUnitPrice)
      const lineTotal = authoritativeUnitPrice * qty
      subtotal += lineTotal

      itemsToInsert.push({
        itemId: randomUUID(),
        prodId,
        varId,
        prodName,
        partNum,
        unitPrice: authoritativeUnitPrice,
        qty,
        lineTotal,
        stockQty,
      })
    }

    if (itemsToInsert.length === 0) {
      return res.status(400).json({ error: 'لم يتم العثور على قطع صالحة لإتمام الطلب' })
    }

    const totalAmount = subtotal + shippingFee
    const orderRef = `KAS-${Math.floor(100000 + Math.random() * 900000)}`
    const orderId = randomUUID()
    let customerId = randomUUID()

    // 5. Atomic Execution inside Transaction
    await withTransaction(async () => {
      // Upsert customer
      const existingCust = await query(`SELECT id FROM customers WHERE phone = $1`, [cleanPhone])
      if (existingCust.rows.length > 0) {
        customerId = existingCust.rows[0].id
        await query(
          `UPDATE customers SET
            first_name = $1, last_name = $2, wilaya_code = $3, commune = $4, address = $5,
            total_orders_count = total_orders_count + 1
           WHERE id = $6`,
          [cleanFirstName, cleanLastName, finalWilayaCode, cleanCommune, cleanAddress, customerId]
        )
      } else {
        await query(
          `INSERT INTO customers (id, phone, first_name, last_name, wilaya_code, commune, address, total_orders_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
          [customerId, cleanPhone, cleanFirstName, cleanLastName, finalWilayaCode, cleanCommune, cleanAddress]
        )
      }

      // Insert Order Header
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
          cleanFirstName,
          cleanLastName,
          cleanPhone,
          finalWilayaCode,
          cleanCommune,
          cleanAddress,
          cleanNotes,
          subtotal,
          shippingFee,
          totalAmount,
        ]
      )

      // Insert timeline event
      await query(
        `INSERT INTO order_timeline (id, order_id, status, title_ar, note)
         VALUES ($1, $2, 'pending_confirmation', 'تم إنشاء الطلب', $3)`,
        [randomUUID(), orderId, `طلب جديد عبر ${source === 'landing_offer' ? 'صفحة الهبوط' : 'المتجر'}`]
      )

      // Insert Line items & reserve inventory
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
          } catch {
            // Inventory transaction log notice non-fatal
          }
        }

        await query(
          `INSERT INTO order_items (id, order_id, product_id, variant_id, product_name_snapshot, part_number_snapshot, unit_price, quantity, line_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [it.itemId, orderId, it.prodId, it.varId || null, it.prodName, it.partNum, it.unitPrice, it.qty, it.lineTotal]
        )
      }
    })

    res.status(201).json({
      success: true,
      orderId,
      orderReference: orderRef,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phone: cleanPhone,
      address: cleanAddress,
      commune: cleanCommune,
      wilayaCode: finalWilayaCode,
      subtotal,
      shippingFee,
      totalAmount,
      items: itemsToInsert.map((it) => ({
        id: it.itemId,
        name: it.prodName,
        partNumber: it.partNum,
        price: it.unitPrice,
        qty: it.qty,
        lineTotal: it.lineTotal,
      })),
      createdAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('Error placing order:', err)
    res.status(500).json({ error: 'فشل إتمام الطلب، يرجى المحاولة لاحقاً' })
  }
})

// GET /api/v1/orders/:orderReference (Public Tracking with PII Protection)
router.get('/:orderReference', orderTrackingRateLimiter, async (req, res) => {
  try {
    const { orderReference } = req.params
    const cleanRef = String(orderReference || '').trim()

    if (!cleanRef || cleanRef.length > 50) {
      return res.status(400).json({ error: 'رقم تتبع غير صالح' })
    }

    const orderRes = await query(
      `SELECT 
        o.id, o.order_reference AS "orderReference", o.status, o.created_at AS "createdAt",
        o.customer_first_name AS "firstName", o.customer_last_name AS "lastName",
        o.customer_phone AS phone, o.wilaya_code AS "wilayaCode", o.commune,
        o.subtotal, o.shipping_fee AS "shippingFee", o.total_amount AS "totalAmount",
        o.courier_company AS courier, o.tracking_number AS "trackingNumber",
        w.name_ar AS "wilayaNameAr", w.name_fr AS "wilayaNameFr"
       FROM orders o
       LEFT JOIN algeria_wilayas w ON w.code = o.wilaya_code
       WHERE o.order_reference = $1 OR o.id = $1`,
      [cleanRef]
    )

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على طلب بهذا الرقم' })
    }

    const order = orderRes.rows[0]
    const itemsRes = await query(
      `SELECT id, product_name_snapshot AS name, part_number_snapshot AS "partNumber", unit_price AS price, quantity AS qty, line_total AS "lineTotal"
       FROM order_items
       WHERE order_id = $1`,
      [order.id]
    )

    // Mask sensitive customer PII for public tracking
    res.json({
      id: order.id,
      orderReference: order.orderReference,
      status: order.status,
      createdAt: order.createdAt,
      firstName: maskName(order.firstName),
      lastName: maskName(order.lastName),
      phone: maskPhone(order.phone),
      wilayaCode: order.wilayaCode,
      wilayaNameAr: order.wilayaNameAr,
      wilayaNameFr: order.wilayaNameFr,
      commune: order.commune,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      totalAmount: Number(order.totalAmount),
      courier: order.courier,
      trackingNumber: order.trackingNumber,
      items: itemsRes.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        partNumber: r.partNumber,
        price: Number(r.price),
        qty: Number(r.qty),
        lineTotal: Number(r.lineTotal),
      })),
    })
  } catch (err: any) {
    console.error('Error tracking order:', err)
    res.status(500).json({ error: 'تعذر جلب تفاصيل تتبع الطلب' })
  }
})

export default router
