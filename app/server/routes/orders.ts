import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query, withTransaction } from '../db/db.js'
import { orderPlacementRateLimiter, orderTrackingRateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

const MAX_LINE_QUANTITY = 10
const MAX_ORDER_UNITS = 30

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

// POST /api/v1/orders (Place COD Order with Authoritative Stock, Pricing, Idempotency & Concurrency Locks)
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
      idempotencyKey: bodyIdempotencyKey,
    } = req.body

    // 0. Idempotency Check: Prevent duplicate order placement and double stock decrements
    const idempotencyKey = String(req.headers['idempotency-key'] || bodyIdempotencyKey || '').trim().slice(0, 120) || null
    if (idempotencyKey) {
      const existingOrder = await query(
        `SELECT id, order_reference AS "orderReference", customer_first_name AS "firstName", customer_last_name AS "lastName",
                customer_phone AS phone, delivery_address AS address, commune, wilaya_code AS "wilayaCode",
                subtotal, shipping_fee AS "shippingFee", total_amount AS "totalAmount", created_at AS "createdAt"
         FROM orders WHERE idempotency_key = $1 LIMIT 1`,
        [idempotencyKey]
      )
      if (existingOrder.rows.length > 0) {
        const o = existingOrder.rows[0]
        const itemsRes = await query(
          `SELECT id, product_name_snapshot AS name, part_number_snapshot AS "partNumber", unit_price AS price, quantity AS qty, line_total AS "lineTotal"
           FROM order_items WHERE order_id = $1`,
          [o.id]
        )
        return res.status(200).json({
          success: true,
          orderId: o.id,
          orderReference: o.orderReference,
          firstName: o.firstName,
          lastName: o.lastName,
          phone: o.phone,
          address: o.address,
          commune: o.commune,
          wilayaCode: o.wilayaCode,
          subtotal: Number(o.subtotal),
          shippingFee: Number(o.shippingFee),
          totalAmount: Number(o.totalAmount),
          items: itemsRes.rows.map((it: any) => ({
            id: it.id,
            name: it.name,
            partNumber: it.partNumber,
            price: Number(it.price),
            qty: Number(it.qty),
            lineTotal: Number(it.lineTotal),
          })),
          createdAt: o.createdAt,
          idempotentReplay: true,
        })
      }
    }

    // 1. Strict Delivery Fields Validation
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
      finalWilayaCode = '16'
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

    // 4. Validate and resolve line items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'السلة فارغة — لا يمكن إنشاء طلب بدون قطع' })
    }

    if (items.length > 30) {
      return res.status(400).json({ error: 'عدد بنود السلة يتجاوز الحد الأقصى المسموح به' })
    }

    let subtotal = 0
    const itemsToInsert: any[] = []
    const totalQtyByVariant: Record<string, { qty: number; name: string }> = {}

    for (const item of items) {
      // Strict Quantity Validation: Must be a positive integer <= MAX_LINE_QUANTITY
      const rawQty = item.quantity ?? item.qty
      const numQty = Number(rawQty)
      if (!Number.isInteger(numQty) || numQty < 1 || numQty > MAX_LINE_QUANTITY || isNaN(numQty) || !isFinite(numQty)) {
        return res.status(400).json({ error: `الكمية المطلوبة لكل صنف يجب أن تكون رقماً صحيحاً بين 1 و ${MAX_LINE_QUANTITY} قطع.` })
      }
      const qty = numQty

      const requestedVariantId = item.variantId ? String(item.variantId).trim() : null
      const requestedProductId = item.productId ? String(item.productId).trim() : null
      const requestedId = requestedVariantId || requestedProductId || String(item.id || '').trim()

      if (!requestedId) {
        return res.status(400).json({ error: 'معرف المنتج أو الصنف غير صالح' })
      }

      let prodId: string
      let varId: string
      let prodName = 'قطعة غيار'
      let partNum = 'PART-AUTO'
      let authoritativeUnitPrice = 0
      let stockQty = 0

      // Case A: Explicit variantId provided -> Validate relationship with productId if provided
      if (requestedVariantId) {
        const vRes = await query(
          `SELECT v.id AS "variantId", v.product_id AS "productId", v.price, v.part_number AS "partNumber",
                  p.name_ar AS name, v.stock_quantity AS "stockQuantity",
                  (v.is_active = 1 OR v.is_active = TRUE) AS "isVariantActive",
                  (p.is_active = 1 OR p.is_active = TRUE) AS "isProductActive"
           FROM product_variants v
           JOIN products p ON p.id = v.product_id
           WHERE v.id = $1`,
          [requestedVariantId]
        )

        if (vRes.rows.length === 0) {
          return res.status(400).json({ error: 'الصنف أو المتغير المطلوب غير موجود' })
        }

        const v = vRes.rows[0]
        const returnedProdId = String(v.productId || v.product_id || '').trim()
        const returnedVarId = String(v.variantId || v.variant_id || v.id || '').trim()
        const isVarActive = Boolean(v.isVariantActive ?? v.isvariantactive ?? v.is_active ?? true)
        const isProdActive = Boolean(v.isProductActive ?? v.isproductactive ?? true)

        if (!isVarActive || !isProdActive) {
          return res.status(400).json({ error: `عذراً، القطعة "${v.name}" غير متوفرة للشراء حالياً.` })
        }

        // Mismatched Product/Variant Validation
        if (requestedProductId && requestedProductId !== returnedProdId) {
          return res.status(400).json({ error: 'بيانات المنتج والمتغير غير متطابقة' })
        }

        prodId = returnedProdId
        varId = returnedVarId
        prodName = v.name || 'قطعة غيار'
        partNum = v.partNumber || v.partnumber || v.part_number || 'PART-AUTO'
        authoritativeUnitPrice = offerCustomPrice !== null && source === 'landing_offer' ? offerCustomPrice : Number(v.price) || 0
        stockQty = Math.max(0, Number(v.stockQuantity ?? v.stockquantity ?? v.stock_quantity) || 0)
      } else {
        // Case B: Lookup by productId or SKU
        const pRes = await query(
          `SELECT v.id AS "variantId", v.product_id AS "productId", v.price, v.part_number AS "partNumber",
                  p.name_ar AS name, v.stock_quantity AS "stockQuantity",
                  (v.is_active = 1 OR v.is_active = TRUE) AS "isVariantActive",
                  (p.is_active = 1 OR p.is_active = TRUE) AS "isProductActive"
           FROM product_variants v
           JOIN products p ON p.id = v.product_id
           WHERE p.id = $1 OR p.sku = $1 OR p.base_part_number = $1
           ORDER BY v.created_at ASC
           LIMIT 1`,
          [requestedId]
        )

        if (pRes.rows.length === 0) {
          return res.status(400).json({ error: 'المنتج المطلوب غير موجود' })
        }

        const v = pRes.rows[0]
        const returnedProdId = String(v.productId || v.product_id || '').trim()
        const returnedVarId = String(v.variantId || v.variant_id || v.id || '').trim()
        const isVarActive = Boolean(v.isVariantActive ?? v.isvariantactive ?? v.is_active ?? true)
        const isProdActive = Boolean(v.isProductActive ?? v.isproductactive ?? true)

        if (!isVarActive || !isProdActive) {
          return res.status(400).json({ error: `عذراً، القطعة "${v.name}" غير متوفرة للشراء حالياً.` })
        }

        prodId = returnedProdId
        varId = returnedVarId
        prodName = v.name || 'قطعة غيار'
        partNum = v.partNumber || v.partnumber || v.part_number || 'PART-AUTO'
        authoritativeUnitPrice = offerCustomPrice !== null && source === 'landing_offer' ? offerCustomPrice : Number(v.price) || 0
        stockQty = Math.max(0, Number(v.stockQuantity ?? v.stockquantity ?? v.stock_quantity) || 0)
      }

      // Track aggregated total quantity per variant for multi-line / split cart normalization
      if (!totalQtyByVariant[varId]) {
        totalQtyByVariant[varId] = { qty: 0, name: prodName }
      }
      totalQtyByVariant[varId].qty += qty

      // Authoritative Price Security: Never trust client price or totals
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

    // Total Order Quantity Cap
    const totalOrderUnits = Object.values(totalQtyByVariant).reduce((s, v) => s + v.qty, 0)
    if (totalOrderUnits > MAX_ORDER_UNITS) {
      return res.status(400).json({ error: `إجمالي عدد القطع في الطلب الواحد يتجاوز الحد الأقصى المسموح به (${MAX_ORDER_UNITS} قطعة)` })
    }

    // 5. Pre-Check Aggregated Stock vs Warehouse Stock
    for (const [vId, info] of Object.entries(totalQtyByVariant)) {
      const stockCheck = await query(`SELECT stock_quantity FROM product_variants WHERE id = $1`, [vId])
      const available = stockCheck.rows.length > 0 ? Math.max(0, Number(stockCheck.rows[0].stock_quantity) || 0) : 0

      if (available <= 0) {
        return res.status(409).json({
          error: `عذراً، القطعة "${info.name}" غير متوفرة في المخزون حالياً.`
        })
      }

      if (info.qty > available) {
        return res.status(409).json({
          error: `الكمية المطلوبة من القطعة "${info.name}" غير متوفرة بالكامل في المخزون حالياً. يرجى تقليل الكمية أو التواصل معنا.`
        })
      }
    }

    const totalAmount = subtotal + shippingFee
    const orderRef = `KAS-${Math.floor(100000 + Math.random() * 900000)}`
    const orderId = randomUUID()
    let customerId = randomUUID()

    // 6. Atomic Transaction: Customer Upsert + Order Insertion + Atomic Conditional Stock Decrement + Ledger Logging
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

      // Insert Order Header with Idempotency Key & Stock Reservation Status
      await query(
        `INSERT INTO orders (
          id, order_reference, order_source, offer_id, customer_id,
          customer_first_name, customer_last_name, customer_phone,
          wilaya_code, commune, delivery_address, customer_notes,
          subtotal, shipping_fee, total_amount, status, payment_status, payment_method, courier_company,
          idempotency_key, is_stock_restored
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending_confirmation', 'unpaid', 'COD', 'Yalidine', $16, 0)`,
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
          idempotencyKey,
        ]
      )

      // Insert Order Timeline Event
      await query(
        `INSERT INTO order_timeline (id, order_id, status, title_ar, note)
         VALUES ($1, $2, 'pending_confirmation', 'تم إنشاء الطلب', $3)`,
        [randomUUID(), orderId, `طلب جديد عبر ${source === 'landing_offer' ? 'صفحة الهبوط' : 'المتجر'}`]
      )

      // Atomic Inventory Decrement with Strict WHERE Condition
      for (const [vId, info] of Object.entries(totalQtyByVariant)) {
        const curRes = await query(`SELECT stock_quantity FROM product_variants WHERE id = $1`, [vId])
        const qtyBefore = Number(curRes.rows[0]?.stock_quantity ?? 0)

        const updateRes = await query(
          `UPDATE product_variants
           SET stock_quantity = stock_quantity - $1,
               stock_status = CASE 
                 WHEN (stock_quantity - $1) <= 0 THEN 'out_of_stock' 
                 WHEN (stock_quantity - $1) <= 5 THEN 'limited_stock' 
                 ELSE 'in_stock' 
               END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND stock_quantity >= $1`,
          [info.qty, vId]
        )

        // If rowCount === 0, stock was insufficient or modified concurrently!
        if (updateRes.rowCount === 0) {
          const err = new Error('INSUFFICIENT_STOCK_LOCK')
          ;(err as any).productName = info.name
          throw err
        }

        const afterRes = await query(`SELECT stock_quantity FROM product_variants WHERE id = $1`, [vId])
        const qtyAfter = Number(afterRes.rows[0]?.stock_quantity ?? 0)

        try {
          await query(
            `INSERT INTO inventory_transactions (id, variant_id, delta_type, order_id, quantity_delta, quantity_before, quantity_after, reason, created_by)
             VALUES ($1, $2, 'order_reservation', $3, $4, $5, $6, $7, 'STORE_CHECKOUT')`,
            [randomUUID(), vId, orderId, -info.qty, qtyBefore, qtyAfter, `Order placement ${orderRef}`]
          )
        } catch {
          // Non-fatal logging
        }
      }

      // Insert Line Items
      for (const it of itemsToInsert) {
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

    // Log order creation in audit trail
    try {
      const { logAuditAction } = await import('../lib/audit.js')
      await logAuditAction({
        tableName: 'orders',
        recordId: orderId,
        actionType: 'CREATE',
        newData: {
          orderRef,
          total: totalAmount,
          customer: `${cleanFirstName} ${cleanLastName}`.trim(),
          phone: cleanPhone,
          wilayaCode: finalWilayaCode,
          itemsCount: itemsToInsert.length,
        },
        performedBy: `${cleanFirstName} ${cleanLastName}`.trim() || 'عميل المتجر',
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      })
    } catch {}
  } catch (err: any) {
    if (err.message === 'INSUFFICIENT_STOCK_LOCK') {
      const pName = err.productName || 'إحدى القطع المطلوبة'
      return res.status(409).json({
        error: `الكمية المطلوبة من "${pName}" غير متوفرة بالكامل في المخزون حالياً. يرجى تقليل الكمية والمحاولة مرة أخرى.`
      })
    }
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
