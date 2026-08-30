import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query, withTransaction } from '../../db/db.js'

const router = Router()

/**
 * Helper to resolve or auto-create a brand by UUID, slug, or name.
 */
async function resolveOrCreateBrand(brandIdentifier?: string): Promise<string> {
  if (brandIdentifier && String(brandIdentifier).trim()) {
    const raw = String(brandIdentifier).trim()
    const cleanName = raw.replace(/^brand[-_]/i, '').trim() || raw
    const candidateSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // 1. Try finding by raw string, cleanName, or candidateSlug (id, slug, or name case-insensitive)
    const existing = await query(
      `SELECT id FROM brands 
       WHERE id = $1 
          OR slug = $1 
          OR slug = $2 
          OR LOWER(name) = LOWER($1) 
          OR LOWER(name) = LOWER($3) 
       LIMIT 1`,
      [raw, candidateSlug, cleanName]
    )
    if (existing.rows.length > 0) {
      return existing.rows[0].id
    }

    // 2. Check name uniqueness before insert
    const nameCheck = await query(`SELECT id FROM brands WHERE LOWER(name) = LOWER($1)`, [cleanName.toUpperCase()])
    if (nameCheck.rows.length > 0) {
      return nameCheck.rows[0].id
    }

    // 3. Auto-create brand if it doesn't exist
    const newId = randomUUID()
    const newSlug = candidateSlug || `brand-${randomUUID().slice(0, 8)}`

    // Check slug uniqueness
    const slugCheck = await query(`SELECT id FROM brands WHERE slug = $1`, [newSlug])
    const finalSlug = slugCheck.rows.length > 0 ? `${newSlug}-${Math.floor(100 + Math.random() * 900)}` : newSlug

    await query(
      `INSERT INTO brands (id, slug, name, is_featured, display_order)
       VALUES ($1, $2, $3, 1, 0)`,
      [newId, finalSlug, cleanName.toUpperCase()]
    )
    return newId
  }

  // Fallback to first available brand or create generic brand
  const anyBrand = await query(`SELECT id FROM brands ORDER BY display_order ASC LIMIT 1`)
  if (anyBrand.rows.length > 0) {
    return anyBrand.rows[0].id
  }

  const defaultId = randomUUID()
  await query(
    `INSERT INTO brands (id, slug, name, is_featured, display_order) VALUES ($1, 'general', 'GENUINE / OEM', 1, 0)`,
    [defaultId]
  )
  return defaultId
}

/**
 * Helper to resolve category by UUID, slug, or Arabic/French name.
 */
async function resolveCategory(categoryIdentifier?: string): Promise<string> {
  if (categoryIdentifier && String(categoryIdentifier).trim()) {
    const raw = String(categoryIdentifier).trim()
    const existing = await query(
      `SELECT id FROM categories WHERE id = $1 OR slug = $1 OR name_ar = $1 OR name_fr = $1 LIMIT 1`,
      [raw]
    )
    if (existing.rows.length > 0) {
      return existing.rows[0].id
    }
  }

  // Fallback to first category
  const firstCat = await query(`SELECT id FROM categories ORDER BY display_order ASC LIMIT 1`)
  if (firstCat.rows.length > 0) {
    return firstCat.rows[0].id
  }

  throw new Error('لا توجد أقسام مسجلة في المتجر. يرجى إنشاء قسم أولاً.')
}

/**
 * Helper to resolve and link vehicle compatibility records.
 */
async function linkVehicleCompatibility(productId: string, compatItems: (string | { make?: string; model?: string })[]) {
  if (!Array.isArray(compatItems) || compatItems.length === 0) return

  const makes = await query(`SELECT id, slug, name_ar AS "nameAr" FROM vehicle_makes`)
  const models = await query(`SELECT id, make_id AS "makeId", slug, name_ar AS "nameAr" FROM vehicle_models`)

  for (const item of compatItems) {
    let makeName = ''
    let modelName = ''

    if (typeof item === 'string') {
      const clean = item.trim()
      if (!clean) continue
      const matchedMake = makes.rows.find((m: any) => clean.startsWith(m.nameAr))
      if (matchedMake) {
        makeName = matchedMake.nameAr
        modelName = clean.replace(matchedMake.nameAr, '').trim()
      } else {
        const parts = clean.split(/\s+/)
        makeName = parts[0]
        modelName = parts.slice(1).join(' ') || parts[0]
      }
    } else if (item && typeof item === 'object') {
      makeName = item.make || ''
      modelName = item.model || ''
    }

    if (!makeName || !modelName) continue

    let makeId = makes.rows.find((m: any) => m.nameAr === makeName || m.slug === makeName.toLowerCase())?.id
    if (!makeId) {
      makeId = randomUUID()
      const slug = makeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `make-${randomUUID().slice(0, 6)}`
      await query(`INSERT INTO vehicle_makes (id, slug, name_ar, name_fr, display_order) VALUES ($1, $2, $3, $4, 99)`, [makeId, slug, makeName, makeName])
      makes.rows.push({ id: makeId, slug, nameAr: makeName })
    }

    let modelId = models.rows.find((m: any) => (m.makeId === makeId || !m.makeId) && (m.nameAr === modelName || m.slug.endsWith(modelName.toLowerCase())))?.id
    if (!modelId) {
      modelId = randomUUID()
      const slug = `${makeName}-${modelName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `model-${randomUUID().slice(0, 6)}`
      await query(`INSERT INTO vehicle_models (id, make_id, slug, name_ar, name_fr, display_order) VALUES ($1, $2, $3, $4, $5, 99)`, [modelId, makeId, slug, modelName, modelName])
      models.rows.push({ id: modelId, makeId, slug, nameAr: modelName })
    }

    const exists = await query(`SELECT id FROM part_compatibility WHERE product_id = $1 AND model_id = $2`, [productId, modelId])
    if (exists.rows.length === 0) {
      await query(
        `INSERT INTO part_compatibility (id, product_id, make_id, model_id) VALUES ($1, $2, $3, $4)`,
        [randomUUID(), productId, makeId, modelId]
      )
    }
  }
}

// GET /api/v1/admin/products
router.get('/', async (req, res) => {
  try {
    const { q, category, brand, status, featured, sortBy, sortOrder, page = '1', limit = '25' } = req.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25))
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
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE 1=1
    `
    const params: any[] = []

    if (category && category !== 'all') {
      params.push(category)
      sql += ` AND (c.name_ar = $${params.length} OR c.id = $${params.length} OR c.slug = $${params.length})`
    }

    if (brand && brand !== 'all') {
      params.push(brand)
      sql += ` AND (b.name = $${params.length} OR b.id = $${params.length} OR b.slug = $${params.length})`
    }

    if (featured === 'true' || featured === '1') {
      sql += ` AND (p.featured_home = 1 OR p.featured_home = TRUE)`
    } else if (featured === 'false' || featured === '0') {
      sql += ` AND (p.featured_home = 0 OR p.featured_home = FALSE OR p.featured_home IS NULL)`
    }

    if (status === 'active') {
      sql += ` AND (p.is_active = 1 OR p.is_active = TRUE)`
    } else if (status === 'archived') {
      sql += ` AND (p.is_active = 0 OR p.is_active = FALSE)`
    } else if (status === 'out_of_stock') {
      sql += ` AND (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) = 0`
    } else if (status === 'low_stock') {
      sql += ` AND (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) BETWEEN 1 AND 5`
    } else if (status === 'in_stock') {
      sql += ` AND (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) > 5`
    }

    if (q && q.trim()) {
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

    // Count query
    const countSql = `SELECT COUNT(*) AS count FROM (${sql}) AS sub`
    const countRes = await query(countSql, params)
    const totalCount = Number(countRes.rows[0]?.count || 0)

    // Dynamic sorting
    const orderDirection = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    let orderClause = 'p.featured_home DESC, p.created_at DESC, p.id ASC'

    if (sortBy === 'name') {
      orderClause = `p.name_ar ${orderDirection}`
    } else if (sortBy === 'category') {
      orderClause = `c.name_ar ${orderDirection}`
    } else if (sortBy === 'partNumber' || sortBy === 'sku') {
      orderClause = `p.base_part_number ${orderDirection}`
    } else if (sortBy === 'price') {
      orderClause = `(SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id) ${orderDirection}`
    } else if (sortBy === 'stock') {
      orderClause = `(SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) ${orderDirection}`
    } else if (sortBy === 'variants') {
      orderClause = `(SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) ${orderDirection}`
    } else if (sortBy === 'featured') {
      orderClause = `p.featured_home ${orderDirection}`
    } else if (sortBy === 'status') {
      orderClause = `p.is_active ${orderDirection}`
    }

    sql += ` ORDER BY ${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pageLimit, offset)

    const result = await query(sql, params)

    res.json({
      products: result.rows,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageLimit,
        pages: Math.ceil(totalCount / pageLimit) || 1,
      },
    })
  } catch (err: any) {
    console.error('Error querying admin products:', err)
    res.status(500).json({ error: 'فشل جلب المنتجات' })
  }
})

// GET /api/v1/admin/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const prodRes = await query(
      `SELECT 
        p.id, p.sku, p.base_part_number AS "partNumber", p.name_ar AS "nameAr", p.name_fr AS "nameFr",
        p.category_id AS "categoryId", c.name_ar AS category,
        p.brand_id AS "brandId", b.name AS brand,
        p.badge, p.rating,
        p.description_ar AS "descriptionAr", p.description_fr AS "descriptionFr",
        (p.featured_home = 1 OR p.featured_home = TRUE) AS "featuredHome",
        (p.is_active = 1 OR p.is_active = TRUE) AS "isActive"
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.id = $1 OR p.sku = $1`,
      [id]
    )

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'المنتج غير موجود' })
    }

    const prod = prodRes.rows[0]
    const variants = await query(
      `SELECT id, variant_sku AS sku, part_number AS "partNumber", label_ar AS label, price, old_price AS "oldPrice", stock_quantity AS "stockQuantity", stock_status AS "stockStatus", extra_specs AS "extraSpecs"
       FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC`,
      [prod.id]
    )
    const specs = await query(
      `SELECT id, label_ar AS label, value_ar AS value FROM product_specs WHERE product_id = $1 ORDER BY display_order ASC`,
      [prod.id]
    )
    const images = await query(
      `SELECT id, image_url AS url, is_primary AS "isPrimary", display_order AS "displayOrder" FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, display_order ASC`,
      [prod.id]
    )
    const compat = await query(
      `SELECT pc.id, vm.name_ar AS make, vmo.name_ar AS model, pc.notes
       FROM part_compatibility pc
       LEFT JOIN vehicle_makes vm ON vm.id = pc.make_id
       LEFT JOIN vehicle_models vmo ON vmo.id = pc.model_id
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
    res.status(500).json({ error: 'فشل جلب تفاصيل المنتج' })
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
      images = [],
      specs = [],
      variants = [],
      compat = [],
    } = req.body

    // Validation
    if (!nameAr || !String(nameAr).trim()) {
      return res.status(400).json({ error: 'يرجى إدخال اسم القطعة بالعربية' })
    }
    if (!partNumber || !String(partNumber).trim()) {
      return res.status(400).json({ error: 'يرجى إدخال رقم القطعة (Part Number)' })
    }
    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'يرجى إدخال سعر صحيح للمنتج' })
    }

    const cleanPartNumber = String(partNumber).trim()
    const cleanNameAr = String(nameAr).trim()
    const cleanNameFr = nameFr ? String(nameFr).trim() : cleanNameAr

    // Resolve Foreign Keys
    const finalCategoryId = await resolveCategory(categoryId)
    const finalBrandId = await resolveOrCreateBrand(brandId)

    const productId = randomUUID()
    const safePartSku = cleanPartNumber.replace(/[^A-Za-z0-9_-]/g, '') || 'PART'
    const sku = `SKU-${safePartSku}-${Math.floor(1000 + Math.random() * 9000)}`

    await withTransaction(async () => {
      // 1. Insert Product
      await query(
        `INSERT INTO products (
          id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, badge, description_ar, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
        [
          productId,
          sku,
          cleanPartNumber,
          cleanNameAr,
          cleanNameFr,
          finalCategoryId,
          finalBrandId,
          badge ? String(badge).trim() : null,
          descriptionAr ? String(descriptionAr).trim() : '',
        ]
      )

      // 2. Insert Images (from images array or primary imageUrl)
      const allImages: { url: string; isPrimary: boolean; order: number }[] = []
      if (Array.isArray(images) && images.length > 0) {
        images.forEach((img: any, idx: number) => {
          const url = typeof img === 'string' ? img : img.url
          if (url && String(url).trim()) {
            allImages.push({
              url: String(url).trim(),
              isPrimary: idx === 0 || Boolean(img.isPrimary),
              order: idx,
            })
          }
        })
      } else if (imageUrl && String(imageUrl).trim()) {
        allImages.push({
          url: String(imageUrl).trim(),
          isPrimary: true,
          order: 0,
        })
      }

      for (const img of allImages) {
        await query(
          `INSERT INTO product_images (id, product_id, image_url, is_primary, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), productId, img.url, img.isPrimary ? 1 : 0, img.order]
        )
      }

      // 3. Insert Primary Variant
      const stockNum = Math.max(0, Number(stockQuantity) || 0)
      const stockStatus = stockNum === 0 ? 'out_of_stock' : stockNum <= 5 ? 'limited_stock' : 'in_stock'
      const numOldPrice = oldPrice ? Number(oldPrice) : null

      const variantId = randomUUID()
      await query(
        `INSERT INTO product_variants (
          id, product_id, variant_sku, part_number, label_ar, label_fr, price, old_price, stock_quantity, stock_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          variantId,
          productId,
          `${sku}-VAR-1`,
          cleanPartNumber,
          cleanNameAr,
          cleanNameFr,
          numPrice,
          numOldPrice && numOldPrice > 0 ? numOldPrice : null,
          stockNum,
          stockStatus,
        ]
      )

      // 4. Insert Additional Variants if provided
      if (Array.isArray(variants) && variants.length > 0) {
        for (let idx = 0; idx < variants.length; idx++) {
          const v = variants[idx]
          if (!v) continue
          const vId = randomUUID()
          const vStock = Math.max(0, Number(v.stockQuantity ?? 10))
          const vStatus = vStock === 0 ? 'out_of_stock' : vStock <= 5 ? 'limited_stock' : 'in_stock'
          const vPrice = Number(v.price || numPrice)
          const vOldPrice = v.oldPrice ? Number(v.oldPrice) : null

          await query(
            `INSERT INTO product_variants (
              id, product_id, variant_sku, part_number, label_ar, label_fr, price, old_price, stock_quantity, stock_status, extra_specs
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              vId,
              productId,
              `${sku}-VAR-${idx + 2}`,
              v.partNumber || cleanPartNumber,
              v.label || cleanNameAr,
              v.labelFr || cleanNameFr,
              vPrice,
              vOldPrice && vOldPrice > 0 ? vOldPrice : null,
              vStock,
              vStatus,
              JSON.stringify(v.extraSpecs || []),
            ]
          )
        }
      }

      // 5. Insert Specifications
      if (Array.isArray(specs)) {
        for (let sIdx = 0; sIdx < specs.length; sIdx++) {
          const s = specs[sIdx]
          if (s && s.label && s.value && String(s.label).trim() && String(s.value).trim()) {
            await query(
              `INSERT INTO product_specs (id, product_id, label_ar, value_ar, display_order)
               VALUES ($1, $2, $3, $4, $5)`,
              [randomUUID(), productId, String(s.label).trim(), String(s.value).trim(), sIdx]
            )
          }
        }
      }

      // 6. Insert Vehicle Compatibility
      if (Array.isArray(compat) && compat.length > 0) {
        await linkVehicleCompatibility(productId, compat)
      } else if (Array.isArray(variants) && variants.length > 0) {
        const variantNames = variants.map((v: any) => v?.label).filter(Boolean)
        await linkVehicleCompatibility(productId, variantNames)
      }
    })

    try {
      const { logAuditAction } = await import('../../lib/audit.js')
      await logAuditAction({
        tableName: 'products',
        recordId: productId,
        actionType: 'CREATE',
        newData: { name: cleanNameAr, sku, partNumber: cleanPartNumber, price: numPrice },
        performedBy: req.adminUser?.name || 'مدير عام',
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      })
    } catch {}

    res.status(201).json({
      success: true,
      id: productId,
      sku,
      message: 'تمت إضافة المنتج وحفظ جميع بياناته بنجاح',
    })
  } catch (err: any) {
    console.error('Error creating product:', err)
    res.status(500).json({ error: err.message || 'فشل إنشاء المنتج' })
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
      descriptionFr,
      price,
      oldPrice,
      stockQuantity,
      imageUrl,
      images,
      specs,
      variants,
      compat,
    } = req.body

    const existing = await query(`SELECT id FROM products WHERE id = $1`, [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'المنتج غير موجود' })
    }

    // Resolve Foreign Keys if changed
    const resolvedCatId = categoryId ? await resolveCategory(categoryId) : undefined
    const resolvedBrandId = brandId ? await resolveOrCreateBrand(brandId) : undefined

    await withTransaction(async () => {
      // 1. Update Product Core Table
      await query(
        `UPDATE products SET
          name_ar = COALESCE($1, name_ar),
          name_fr = COALESCE($2, name_fr),
          base_part_number = COALESCE($3, base_part_number),
          category_id = COALESCE($4, category_id),
          brand_id = COALESCE($5, brand_id),
          badge = $6,
          description_ar = COALESCE($7, description_ar),
          description_fr = COALESCE($8, description_fr),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $9`,
        [
          nameAr ? String(nameAr).trim() : null,
          nameFr ? String(nameFr).trim() : null,
          partNumber ? String(partNumber).trim() : null,
          resolvedCatId || null,
          resolvedBrandId || null,
          badge !== undefined ? (badge ? String(badge).trim() : null) : null,
          descriptionAr !== undefined ? String(descriptionAr).trim() : null,
          descriptionFr !== undefined ? String(descriptionFr).trim() : null,
          id,
        ]
      )

      // 2. Update Primary Variant Price / Stock
      if (price !== undefined || stockQuantity !== undefined || oldPrice !== undefined) {
        const numStock = stockQuantity !== undefined ? Math.max(0, Number(stockQuantity)) : null
        const stockStatus = numStock !== null ? (numStock === 0 ? 'out_of_stock' : numStock <= 5 ? 'limited_stock' : 'in_stock') : null
        const numPrice = price !== undefined ? Number(price) : null
        const numOldPrice = oldPrice !== undefined ? (Number(oldPrice) > 0 ? Number(oldPrice) : null) : undefined

        const primaryRes = await query(`SELECT id FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1`, [id])
        if (primaryRes.rows.length > 0) {
          const primaryId = primaryRes.rows[0].id
          await query(
            `UPDATE product_variants SET
              price = COALESCE($1, price),
              old_price = COALESCE($2, old_price),
              stock_quantity = COALESCE($3, stock_quantity),
              stock_status = COALESCE($4, stock_status),
              updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [numPrice, numOldPrice, numStock, stockStatus, primaryId]
          )
        } else {
          // If no variant existed, insert one
          const pData = await query(`SELECT sku, base_part_number, name_ar, name_fr FROM products WHERE id = $1`, [id])
          const p = pData.rows[0]
          if (p) {
            await query(
              `INSERT INTO product_variants (
                id, product_id, variant_sku, part_number, label_ar, label_fr, price, old_price, stock_quantity, stock_status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                randomUUID(),
                id,
                `${p.sku || 'SKU'}-VAR-1`,
                p.base_part_number || 'PART',
                p.name_ar || 'قطعة غيار',
                p.name_fr || p.name_ar || '',
                numPrice ?? 0,
                numOldPrice && numOldPrice > 0 ? numOldPrice : null,
                numStock ?? 10,
                stockStatus ?? 'in_stock',
              ]
            )
          }
        }
      }

      // 3. Update Images
      if (Array.isArray(images) && images.length > 0) {
        await query(`DELETE FROM product_images WHERE product_id = $1`, [id])
        for (let idx = 0; idx < images.length; idx++) {
          const img = images[idx]
          const url = typeof img === 'string' ? img : img.url
          if (url && String(url).trim()) {
            await query(
              `INSERT INTO product_images (id, product_id, image_url, is_primary, display_order)
               VALUES ($1, $2, $3, $4, $5)`,
              [randomUUID(), id, String(url).trim(), idx === 0 || Boolean(img.isPrimary) ? 1 : 0, idx]
            )
          }
        }
      } else if (imageUrl !== undefined) {
        if (imageUrl && String(imageUrl).trim()) {
          const imgRes = await query(`SELECT id FROM product_images WHERE product_id = $1 AND is_primary = 1`, [id])
          if (imgRes.rows.length > 0) {
            await query(`UPDATE product_images SET image_url = $1 WHERE id = $2`, [String(imageUrl).trim(), imgRes.rows[0].id])
          } else {
            await query(
              `INSERT INTO product_images (id, product_id, image_url, is_primary, display_order) VALUES ($1, $2, $3, 1, 0)`,
              [randomUUID(), id, String(imageUrl).trim()]
            )
          }
        }
      }

      // 4. Update Specifications if provided
      if (Array.isArray(specs)) {
        await query(`DELETE FROM product_specs WHERE product_id = $1`, [id])
        for (let sIdx = 0; sIdx < specs.length; sIdx++) {
          const s = specs[sIdx]
          if (s && s.label && s.value && String(s.label).trim() && String(s.value).trim()) {
            await query(
              `INSERT INTO product_specs (id, product_id, label_ar, value_ar, display_order)
               VALUES ($1, $2, $3, $4, $5)`,
              [randomUUID(), id, String(s.label).trim(), String(s.value).trim(), sIdx]
            )
          }
        }
      }

      // 5. Update Car Brand / Model Variants if provided
      if (Array.isArray(variants)) {
        // Keep primary variant updated and recreate additional variants
        const primaryRes = await query(`SELECT id FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1`, [id])
        const primaryId = primaryRes.rows[0]?.id

        if (primaryId) {
          await query(`DELETE FROM product_variants WHERE product_id = $1 AND id != $2`, [id, primaryId])
        }

        const basePartNum = partNumber ? String(partNumber).trim() : 'PART'
        const baseNameAr = nameAr ? String(nameAr).trim() : 'القطعة'

        for (let idx = 0; idx < variants.length; idx++) {
          const v = variants[idx]
          if (!v) continue
          const vStock = Math.max(0, Number(v.stockQuantity ?? 10))
          const vStatus = vStock === 0 ? 'out_of_stock' : vStock <= 5 ? 'limited_stock' : 'in_stock'
          const vPrice = Number(v.price || price || 0)
          const vOldPrice = v.oldPrice ? Number(v.oldPrice) : null

          await query(
            `INSERT INTO product_variants (
              id, product_id, variant_sku, part_number, label_ar, label_fr, price, old_price, stock_quantity, stock_status, extra_specs
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              randomUUID(),
              id,
              `${basePartNum}-VAR-${idx + 2}`,
              v.partNumber || basePartNum,
              v.label || `${baseNameAr} (موديل ${idx + 2})`,
              v.labelFr || v.label || '',
              vPrice,
              vOldPrice && vOldPrice > 0 ? vOldPrice : null,
              vStock,
              vStatus,
              JSON.stringify(v.extraSpecs || []),
            ]
          )
        }
      }

      // 6. Update Vehicle Compatibility if provided
      if (Array.isArray(compat)) {
        await query(`DELETE FROM part_compatibility WHERE product_id = $1`, [id])
        if (compat.length > 0) {
          await linkVehicleCompatibility(id, compat)
        } else if (Array.isArray(variants) && variants.length > 0) {
          const variantNames = variants.map((v: any) => v?.label).filter(Boolean)
          await linkVehicleCompatibility(id, variantNames)
        }
      }
    })

    try {
      const { logAuditAction } = await import('../../lib/audit.js')
      await logAuditAction({
        tableName: 'products',
        recordId: id,
        actionType: 'UPDATE',
        newData: { name: nameAr ? String(nameAr).trim() : id, partNumber, price },
        performedBy: req.adminUser?.name || 'مدير عام',
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      })
    } catch {}

    res.json({ success: true, message: 'تم تحديث بيانات المنتج والسيارات المتوافقة والأسعار بنجاح' })
  } catch (err: any) {
    console.error('Error updating product:', err)
    res.status(500).json({ error: err.message || 'فشل تحديث المنتج' })
  }
})

// POST /api/v1/admin/products/:id/duplicate
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params
    const origRes = await query(`SELECT * FROM products WHERE id = $1`, [id])
    if (origRes.rows.length === 0) return res.status(404).json({ error: 'المنتج الأصلي غير موجود' })

    const orig = origRes.rows[0]
    const newId = randomUUID()
    const newSku = `${orig.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`

    await withTransaction(async () => {
      await query(
        `INSERT INTO products (id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, badge, description_ar, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
        [newId, newSku, orig.base_part_number, `${orig.name_ar} (نسخة)`, orig.name_fr, orig.category_id, orig.brand_id, orig.badge, orig.description_ar]
      )

      // Copy variants
      const origVars = await query(`SELECT * FROM product_variants WHERE product_id = $1`, [id])
      for (let idx = 0; idx < origVars.rows.length; idx++) {
        const v = origVars.rows[idx]
        await query(
          `INSERT INTO product_variants (id, product_id, variant_sku, part_number, label_ar, price, old_price, stock_quantity, stock_status, extra_specs)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [randomUUID(), newId, `${newSku}-VAR-${idx + 1}`, v.part_number, v.label_ar, v.price, v.old_price, v.stock_quantity, v.stock_status, v.extra_specs || '[]']
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

      // Copy specs
      const origSpecs = await query(`SELECT * FROM product_specs WHERE product_id = $1`, [id])
      for (const s of origSpecs.rows) {
        await query(
          `INSERT INTO product_specs (id, product_id, label_ar, value_ar, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), newId, s.label_ar, s.value_ar, s.display_order]
        )
      }
    })

    res.json({ success: true, id: newId, message: 'تم تكرار المنتج بنجاح' })
  } catch (err: any) {
    console.error('Error duplicating product:', err)
    res.status(500).json({ error: 'فشل تكرار المنتج' })
  }
})

// DELETE /api/v1/admin/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const check = await query(`SELECT id, name_ar, sku FROM products WHERE id = $1`, [id])
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'المنتج غير موجود' })
    }

    const prodName = check.rows[0]?.name_ar || id

    await withTransaction(async () => {
      await query(`DELETE FROM part_compatibility WHERE product_id = $1`, [id])
      await query(`DELETE FROM product_specs WHERE product_id = $1`, [id])
      await query(`DELETE FROM product_aliases WHERE product_id = $1`, [id])
      await query(`DELETE FROM product_images WHERE product_id = $1`, [id])
      await query(`DELETE FROM product_variants WHERE product_id = $1`, [id])
      await query(`DELETE FROM products WHERE id = $1`, [id])
    })

    try {
      const { logAuditAction } = await import('../../lib/audit.js')
      await logAuditAction({
        tableName: 'products',
        recordId: id,
        actionType: 'DELETE',
        newData: { name: prodName, id },
        performedBy: req.adminUser?.name || 'مدير عام',
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
      })
    } catch {}

    res.json({ success: true, message: 'تم حذف المنتج نهائياً من قاعدة البيانات' })
  } catch (err: any) {
    console.error('Error deleting product:', err)
    res.status(500).json({ error: 'فشل حذف المنتج' })
  }
})

// PUT /api/v1/admin/products/:id/toggle-active
router.put('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params
    const cur = await query(`SELECT is_active FROM products WHERE id = $1`, [id])
    if (cur.rows.length === 0) return res.status(404).json({ error: 'المنتج غير موجود' })

    const newStatus = cur.rows[0]?.is_active ? 0 : 1
    await query(`UPDATE products SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newStatus, id])
    res.json({ success: true, isActive: Boolean(newStatus), message: newStatus ? 'تم تفعيل المنتج' : 'تم أرشفة المنتج' })
  } catch (err: any) {
    res.status(500).json({ error: 'فشل تعديل حالة المنتج' })
  }
})

// PUT /api/v1/admin/products/:id/toggle-featured
router.put('/:id/toggle-featured', async (req, res) => {
  try {
    const { id } = req.params
    const cur = await query(`SELECT featured_home FROM products WHERE id = $1`, [id])
    if (cur.rows.length === 0) return res.status(404).json({ error: 'المنتج غير موجود' })

    const newStatus = cur.rows[0]?.featured_home ? 0 : 1
    await query(`UPDATE products SET featured_home = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newStatus, id])
    res.json({ success: true, featuredHome: Boolean(newStatus), message: 'تم تحديث حالة العرض في الرئيسية' })
  } catch (err: any) {
    res.status(500).json({ error: 'فشل تعديل العرض في الرئيسية' })
  }
})

// POST /api/v1/admin/products/reseed-compatibility
router.post('/reseed-compatibility', async (req, res) => {
  try {
    const { seedPartCompatibility } = await import('../../db/seed.js')
    await seedPartCompatibility(true)
    res.json({ success: true, message: 'تم إعادة ضبط ومزامنة توافق السيارات بنجاح' })
  } catch (err: any) {
    res.status(500).json({ error: 'فشل مزامنة التوافق: ' + err.message })
  }
})

// PATCH /api/v1/admin/products/:id/stock (Quick stock update)
router.patch('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params
    const { stockQuantity, stockStatus: customStatus } = req.body
    const adminName = req.adminUser?.name || 'مسؤول النظام'

    const numStock = Math.max(0, Number(stockQuantity) || 0)
    const stockStatus = customStatus || (numStock === 0 ? 'out_of_stock' : numStock <= 5 ? 'limited_stock' : 'in_stock')

    const varCheck = await query(`SELECT id, stock_quantity FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1`, [id])
    let targetVarId: string
    let qtyBefore = 0

    if (varCheck.rows.length > 0) {
      targetVarId = varCheck.rows[0].id
      qtyBefore = Number(varCheck.rows[0].stock_quantity || 0)
      await query(
        `UPDATE product_variants SET stock_quantity = $1, stock_status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [numStock, stockStatus, targetVarId]
      )
    } else {
      const prodRes = await query(`SELECT sku, base_part_number, name_ar, name_fr FROM products WHERE id = $1`, [id])
      if (prodRes.rows.length === 0) return res.status(404).json({ error: 'المنتج غير موجود' })
      const p = prodRes.rows[0]
      targetVarId = randomUUID()
      await query(
        `INSERT INTO product_variants (id, product_id, variant_sku, part_number, label_ar, label_fr, price, stock_quantity, stock_status)
         VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)`,
        [targetVarId, id, `${p.sku}-VAR-1`, p.base_part_number, p.name_ar, p.name_fr, numStock, stockStatus]
      )
    }

    const delta = numStock - qtyBefore
    try {
      await query(
        `INSERT INTO inventory_transactions (id, variant_id, delta_type, quantity_delta, quantity_before, quantity_after, reason, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [randomUUID(), targetVarId, delta >= 0 ? 'manual_correction_surplus' : 'manual_correction_loss', delta, qtyBefore, numStock, 'تعديل سريع للمخزون عبر لوحة المنتجات', adminName]
      )
    } catch {}

    res.json({ success: true, stockQuantity: numStock, stockStatus, message: `تم تحديث المخزون إلى ${numStock} بنجاح` })
  } catch (err: any) {
    console.error('Error updating product stock:', err)
    res.status(500).json({ error: 'فشل تحديث المخزون' })
  }
})

export default router

