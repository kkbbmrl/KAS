import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query } from '../../db/db.js'

const router = Router()

// GET /api/v1/admin/products
router.get('/', async (req, res) => {
  try {
    const {
      q,
      category,
      brand,
      status,
      page = '1',
      limit = '25',
    } = req.query as Record<string, string>

    const pageNum = Math.max(1, parseInt(page, 10))
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10)))
    const offset = (pageNum - 1) * pageLimit

    let sql = `
      SELECT 
        p.id,
        p.sku,
        p.base_part_number AS "partNumber",
        p.name_ar AS name,
        p.name_fr AS "nameFr",
        c.name_ar AS category,
        c.id AS "categoryId",
        b.name AS brand,
        b.id AS "brandId",
        p.badge,
        p.rating,
        p.description_ar AS description,
        (p.featured_home = 1 OR p.featured_home = TRUE) AS "featuredHome",
        (p.is_active = 1 OR p.is_active = TRUE) AS "isActive",
        p.created_at AS "createdAt",
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1) AS image,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) AS "variantCount",
        (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) AS "totalStock",
        (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id) AS price,
        (SELECT MIN(pv.old_price) FROM product_variants pv WHERE pv.product_id = p.id) AS "oldPrice"
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      WHERE 1=1
    `
    const params: any[] = []

    if (category && category !== 'all') {
      params.push(category)
      sql += ` AND (c.name_ar = $${params.length} OR c.id = $${params.length})`
    }

    if (brand && brand !== 'all') {
      params.push(brand)
      sql += ` AND (b.name = $${params.length} OR b.id = $${params.length})`
    }

    if (status === 'active') {
      sql += ` AND (p.is_active = 1 OR p.is_active = TRUE)`
    } else if (status === 'archived') {
      sql += ` AND (p.is_active = 0 OR p.is_active = FALSE)`
    } else if (status === 'out_of_stock') {
      sql += ` AND (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) = 0`
    } else if (status === 'low_stock') {
      sql += ` AND (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) BETWEEN 1 AND 5`
    }

    if (q) {
      params.push(`%${q.trim()}%`)
      const idx = params.length
      sql += ` AND (
        p.name_ar ILIKE $${idx} OR
        p.name_fr ILIKE $${idx} OR
        p.sku ILIKE $${idx} OR
        p.base_part_number ILIKE $${idx} OR
        b.name ILIKE $${idx}
      )`
    }

    // Count
    const countSql = `SELECT COUNT(*) AS count FROM (${sql}) AS sub`
    const countRes = await query(countSql, params)
    const totalCount = Number(countRes.rows[0]?.count || 0)

    sql += ` ORDER BY p.featured_home DESC, p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pageLimit, offset)

    const result = await query(sql, params)

    res.json({
      products: result.rows,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageLimit,
        pages: Math.ceil(totalCount / pageLimit),
      },
    })
  } catch (err: any) {
    console.error('Error querying admin products:', err)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// GET /api/v1/admin/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const prodRes = await query(
      `SELECT 
        p.id, p.sku, p.base_part_number AS "partNumber", p.name_ar AS "nameAr", p.name_fr AS "nameFr",
        p.category_id AS "categoryId", p.brand_id AS "brandId", p.badge, p.rating,
        p.description_ar AS "descriptionAr", p.description_fr AS "descriptionFr",
        (p.featured_home = 1 OR p.featured_home = TRUE) AS "featuredHome",
        (p.is_active = 1 OR p.is_active = TRUE) AS "isActive"
       FROM products p
       WHERE p.id = $1 OR p.sku = $1`,
      [id]
    )

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const prod = prodRes.rows[0]
    const variants = await query(
      `SELECT id, variant_sku AS sku, part_number AS "partNumber", label_ar AS label, price, old_price AS "oldPrice", stock_quantity AS "stockQuantity", stock_status AS "stockStatus", extra_specs AS "extraSpecs"
       FROM product_variants WHERE product_id = $1`,
      [prod.id]
    )
    const specs = await query(
      `SELECT id, label_ar AS label, value_ar AS value FROM product_specs WHERE product_id = $1 ORDER BY display_order ASC`,
      [prod.id]
    )
    const images = await query(
      `SELECT id, image_url AS url, is_primary AS "isPrimary" FROM product_images WHERE product_id = $1 ORDER BY display_order ASC`,
      [prod.id]
    )
    const compat = await query(
      `SELECT pc.id, vm.name_ar AS make, vmo.name_ar AS model, pc.notes
       FROM part_compatibility pc
       JOIN vehicle_makes vm ON vm.id = pc.make_id
       JOIN vehicle_models vmo ON vmo.id = pc.model_id
       WHERE pc.product_id = $1`,
      [prod.id]
    )

    res.json({
      ...prod,
      variants: variants.rows.map((v: any) => ({
        ...v,
        extraSpecs: typeof v.extraSpecs === 'string' ? JSON.parse(v.extraSpecs || '[]') : v.extraSpecs,
      })),
      specs: specs.rows,
      images: images.rows,
      compat: compat.rows,
    })
  } catch (err: any) {
    console.error('Error fetching admin product details:', err)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

// POST /api/v1/admin/products (Create)
router.post('/', async (req, res) => {
  try {
    const {
      nameAr,
      nameFr,
      partNumber,
      categoryId,
      brandId,
      badge,
      descriptionAr,
      price,
      oldPrice,
      stockQuantity = 10,
      imageUrl,
      specs = [],
      variants = [],
    } = req.body

    if (!nameAr || !partNumber || !categoryId || !brandId || !price) {
      return res.status(400).json({ error: 'يرجى ملء جميع الحقول الإلزامية للمنتج' })
    }

    const productId = randomUUID()
    const sku = `SKU-${partNumber}-${Math.floor(1000 + Math.random() * 9000)}`

    // Insert Product
    await query(
      `INSERT INTO products (id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, badge, description_ar, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
      [productId, sku, partNumber, nameAr, nameFr || nameAr, categoryId, brandId, badge || null, descriptionAr || '']
    )

    // Insert Primary Image
    if (imageUrl) {
      await query(
        `INSERT INTO product_images (id, product_id, image_url, is_primary, display_order)
         VALUES ($1, $2, $3, 1, 0)`,
        [randomUUID(), productId, imageUrl]
      )
    }

    // Insert Primary Variant
    const variantId = randomUUID()
    const stockStatus = Number(stockQuantity) === 0 ? 'out_of_stock' : Number(stockQuantity) <= 5 ? 'limited_stock' : 'in_stock'

    await query(
      `INSERT INTO product_variants (id, product_id, variant_sku, part_number, label_ar, price, old_price, stock_quantity, stock_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [variantId, productId, `${sku}-VAR-1`, partNumber, nameAr, price, oldPrice || null, stockQuantity, stockStatus]
    )

    // Insert additional variants if provided
    if (Array.isArray(variants) && variants.length > 0) {
      for (let idx = 0; idx < variants.length; idx++) {
        const v = variants[idx]
        const vId = randomUUID()
        const vStock = Number(v.stockQuantity || 10)
        const vStatus = vStock === 0 ? 'out_of_stock' : vStock <= 5 ? 'limited_stock' : 'in_stock'
        await query(
          `INSERT INTO product_variants (id, product_id, variant_sku, part_number, label_ar, price, old_price, stock_quantity, stock_status, extra_specs)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [vId, productId, `${sku}-VAR-${idx + 2}`, v.partNumber || partNumber, v.label || nameAr, v.price || price, v.oldPrice || null, vStock, vStatus, JSON.stringify(v.extraSpecs || [])]
        )
      }
    }

    // Insert Specs
    if (Array.isArray(specs)) {
      for (let sIdx = 0; sIdx < specs.length; sIdx++) {
        const s = specs[sIdx]
        if (s.label && s.value) {
          await query(
            `INSERT INTO product_specs (id, product_id, label_ar, value_ar, display_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [randomUUID(), productId, s.label, s.value, sIdx]
          )
        }
      }
    }

    res.status(201).json({ success: true, id: productId, message: 'تمت إضافة المنتج بنجاح' })
  } catch (err: any) {
    console.error('Error creating product:', err)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// PUT /api/v1/admin/products/:id (Update)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      nameAr,
      nameFr,
      partNumber,
      categoryId,
      brandId,
      badge,
      descriptionAr,
      price,
      oldPrice,
      stockQuantity,
      imageUrl,
    } = req.body

    await query(
      `UPDATE products SET
        name_ar = COALESCE($1, name_ar),
        name_fr = COALESCE($2, name_fr),
        base_part_number = COALESCE($3, base_part_number),
        category_id = COALESCE($4, category_id),
        brand_id = COALESCE($5, brand_id),
        badge = $6,
        description_ar = COALESCE($7, description_ar),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [nameAr, nameFr, partNumber, categoryId, brandId, badge, descriptionAr, id]
    )

    // Update primary variant price & stock
    if (price !== undefined || stockQuantity !== undefined) {
      const stockNum = Number(stockQuantity)
      const stockStatus = stockNum === 0 ? 'out_of_stock' : stockNum <= 5 ? 'limited_stock' : 'in_stock'
      await query(
        `UPDATE product_variants SET
          price = COALESCE($1, price),
          old_price = $2,
          stock_quantity = COALESCE($3, stock_quantity),
          stock_status = $4,
          updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $5`,
        [price, oldPrice, stockQuantity, stockStatus, id]
      )
    }

    // Update primary image if passed
    if (imageUrl) {
      const imgRes = await query(`SELECT id FROM product_images WHERE product_id = $1 AND is_primary = 1`, [id])
      if (imgRes.rows.length > 0) {
        await query(`UPDATE product_images SET image_url = $1 WHERE id = $2`, [imageUrl, imgRes.rows[0].id])
      } else {
        await query(`INSERT INTO product_images (id, product_id, image_url, is_primary) VALUES ($1, $2, $3, 1)`, [randomUUID(), id, imageUrl])
      }
    }

    res.json({ success: true, message: 'تم تحديث بيانات المنتج بنجاح' })
  } catch (err: any) {
    console.error('Error updating product:', err)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// POST /api/v1/admin/products/:id/duplicate
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params
    const origRes = await query(`SELECT * FROM products WHERE id = $1`, [id])
    if (origRes.rows.length === 0) return res.status(404).json({ error: 'Original product not found' })

    const orig = origRes.rows[0]
    const newId = randomUUID()
    const newSku = `${orig.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`

    await query(
      `INSERT INTO products (id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, badge, description_ar, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
      [newId, newSku, orig.base_part_number, `${orig.name_ar} (نسخة)`, orig.name_fr, orig.category_id, orig.brand_id, orig.badge, orig.description_ar]
    )

    // Copy variants
    const origVars = await query(`SELECT * FROM product_variants WHERE product_id = $1`, [id])
    for (const v of origVars.rows) {
      await query(
        `INSERT INTO product_variants (id, product_id, variant_sku, part_number, label_ar, price, old_price, stock_quantity, stock_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [randomUUID(), newId, `${newSku}-VAR`, v.part_number, v.label_ar, v.price, v.old_price, v.stock_quantity, v.stock_status]
      )
    }

    // Copy images
    const origImgs = await query(`SELECT * FROM product_images WHERE product_id = $1`, [id])
    for (const img of origImgs.rows) {
      await query(
        `INSERT INTO product_images (id, product_id, image_url, is_primary, display_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), newId, img.image_url, img.is_primary, img.display_order]
      )
    }

    res.json({ success: true, id: newId, message: 'تم تكرار المنتج بنجاح' })
  } catch (err: any) {
    console.error('Error duplicating product:', err)
    res.status(500).json({ error: 'Failed to duplicate product' })
  }
})

// DELETE /api/v1/admin/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await query(`DELETE FROM product_variants WHERE product_id = $1`, [id])
    await query(`DELETE FROM product_images WHERE product_id = $1`, [id])
    await query(`DELETE FROM product_specs WHERE product_id = $1`, [id])
    await query(`DELETE FROM part_compatibility WHERE product_id = $1`, [id])
    await query(`DELETE FROM products WHERE id = $1`, [id])
    res.json({ success: true, message: 'تم حذف المنتج نهائياً' })
  } catch (err: any) {
    console.error('Error deleting product:', err)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

// PUT /api/v1/admin/products/:id/toggle-active
router.put('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params
    const cur = await query(`SELECT is_active FROM products WHERE id = $1`, [id])
    const newStatus = cur.rows[0]?.is_active ? 0 : 1
    await query(`UPDATE products SET is_active = $1 WHERE id = $2`, [newStatus, id])
    res.json({ success: true, isActive: Boolean(newStatus), message: newStatus ? 'تم تفعيل المنتج' : 'تم أرشفة المنتج' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle active' })
  }
})

// PUT /api/v1/admin/products/:id/toggle-featured
router.put('/:id/toggle-featured', async (req, res) => {
  try {
    const { id } = req.params
    const cur = await query(`SELECT featured_home FROM products WHERE id = $1`, [id])
    const newStatus = cur.rows[0]?.featured_home ? 0 : 1
    await query(`UPDATE products SET featured_home = $1 WHERE id = $2`, [newStatus, id])
    res.json({ success: true, featuredHome: Boolean(newStatus), message: 'تم تحديث حالة العرض في الرئيسية' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle featured' })
  }
})

export default router
