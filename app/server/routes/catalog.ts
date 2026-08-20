import { Router } from 'express'
import { query } from '../db/db.js'

const router = Router()

// GET /api/v1/categories
router.get('/categories', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, slug, name_ar AS name, name_fr AS fr, icon_name AS icon, (is_available = 1 OR is_available = TRUE) AS available
       FROM categories
       ORDER BY display_order ASC`
    )
    res.json(result.rows)
  } catch (err: any) {
    console.error('Error fetching categories:', err)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// GET /api/v1/brands
router.get('/brands', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, slug, name, logo_url AS "logoUrl", (is_featured = 1 OR is_featured = TRUE) AS "isFeatured"
       FROM brands
       ORDER BY display_order ASC`
    )
    res.json(result.rows)
  } catch (err: any) {
    console.error('Error fetching brands:', err)
    res.status(500).json({ error: 'Failed to fetch brands' })
  }
})

// GET /api/v1/vehicles
router.get('/vehicles', async (_req, res) => {
  try {
    const makes = await query(`SELECT id, slug, name_ar AS "nameAr", name_fr AS "nameFr" FROM vehicle_makes ORDER BY display_order ASC`)
    const models = await query(`SELECT id, make_id AS "makeId", slug, name_ar AS "nameAr", name_fr AS "nameFr" FROM vehicle_models ORDER BY display_order ASC`)

    const tree: Record<string, string[]> = {}
    for (const make of makes.rows) {
      const makeModels = models.rows
        .filter((m: any) => m.makeId === make.id)
        .map((m: any) => m.nameAr)
      tree[make.nameAr] = makeModels
    }

    res.json({ makes: makes.rows, models: models.rows, tree })
  } catch (err: any) {
    console.error('Error fetching vehicle taxonomy:', err)
    res.status(500).json({ error: 'Failed to fetch vehicles' })
  }
})

// GET /api/v1/products (Search & Filtering)
router.get('/products', async (req, res) => {
  try {
    const { q, brand, model, cat, in_stock } = req.query as Record<string, string>

    let sql = `
      SELECT 
        p.id,
        p.sku,
        p.base_part_number AS "partNumber",
        p.name_ar AS name,
        p.name_fr AS "nameFr",
        c.name_ar AS category,
        b.name AS brand,
        p.badge,
        p.rating,
        p.description_ar AS description,
        (p.featured_home = 1 OR p.featured_home = TRUE) AS "featuredHome",
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1) AS image
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      WHERE (p.is_active = 1 OR p.is_active = TRUE)
    `
    const params: any[] = []

    if (cat && cat !== 'الكل') {
      params.push(cat)
      sql += ` AND (c.name_ar = $${params.length} OR c.name_fr = $${params.length} OR c.slug = $${params.length})`
    }

    if (brand) {
      params.push(`%${brand}%`)
      sql += ` AND (b.name ILIKE $${params.length} OR p.name_ar ILIKE $${params.length} OR p.name_fr ILIKE $${params.length})`
    }

    if (q) {
      params.push(`%${q.trim()}%`)
      const idx = params.length
      sql += ` AND (
        p.name_ar ILIKE $${idx} OR 
        p.name_fr ILIKE $${idx} OR 
        p.base_part_number ILIKE $${idx} OR 
        p.description_ar ILIKE $${idx} OR
        EXISTS (SELECT 1 FROM product_aliases pa WHERE pa.product_id = p.id AND pa.alias_term ILIKE $${idx}) OR
        EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.part_number ILIKE $${idx})
      )`
    }

    sql += ` ORDER BY p.featured_home DESC, p.created_at DESC`

    const result = await query(sql, params)

    // Enrich products with primary variant price & specs
    const products = await Promise.all(
      result.rows.map(async (prod: any) => {
        const variants = await query(
          `SELECT id, variant_sku AS sku, part_number AS "partNumber", label_ar AS label, price, old_price AS "oldPrice", stock_quantity AS "stockQuantity", stock_status AS stock, extra_specs AS "extraSpecs"
           FROM product_variants
           WHERE product_id = $1 AND (is_active = 1 OR is_active = TRUE)`,
          [prod.id]
        )

        const specs = await query(
          `SELECT label_ar AS label, value_ar AS value
           FROM product_specs
           WHERE product_id = $1
           ORDER BY display_order ASC`,
          [prod.id]
        )

        const primaryVariant = variants.rows[0]
        const stockStatusArabic = primaryVariant?.stock === 'out_of_stock' ? 'غير متوفر' : primaryVariant?.stock === 'limited_stock' ? 'كمية محدودة' : 'متوفر'

        return {
          ...prod,
          price: primaryVariant?.price ?? 0,
          oldPrice: primaryVariant?.oldPrice ?? undefined,
          stock: stockStatusArabic,
          stockQuantity: primaryVariant?.stockQuantity ?? 0,
          specs: specs.rows,
          variants: variants.rows.map((v: any) => ({
            ...v,
            stock: v.stock === 'out_of_stock' ? 'غير متوفر' : v.stock === 'limited_stock' ? 'كمية محدودة' : 'متوفر',
            extraSpecs: typeof v.extraSpecs === 'string' ? JSON.parse(v.extraSpecs || '[]') : v.extraSpecs,
          })),
        }
      })
    )

    if (in_stock === 'true') {
      return res.json(products.filter((p) => p.stock !== 'غير متوفر'))
    }

    res.json(products)
  } catch (err: any) {
    console.error('Error querying products:', err)
    res.status(500).json({ error: 'Failed to search products' })
  }
})

// GET /api/v1/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const prodRes = await query(
      `SELECT 
        p.id, p.sku, p.base_part_number AS "partNumber", p.name_ar AS name, p.name_fr AS "nameFr",
        c.name_ar AS category, b.name AS brand, p.badge, p.rating, p.description_ar AS description,
        (p.featured_home = 1 OR p.featured_home = TRUE) AS "featuredHome"
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN brands b ON b.id = p.brand_id
       WHERE p.id = $1 OR p.sku = $1`,
      [id]
    )

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const prod = prodRes.rows[0]
    const images = await query(`SELECT image_url AS url, is_primary FROM product_images WHERE product_id = $1 ORDER BY display_order ASC`, [prod.id])
    const variants = await query(`SELECT id, variant_sku, part_number AS "partNumber", label_ar AS label, price, old_price AS "oldPrice", stock_quantity AS "stockQuantity", stock_status AS stock, extra_specs AS "extraSpecs" FROM product_variants WHERE product_id = $1`, [prod.id])
    const specs = await query(`SELECT label_ar AS label, value_ar AS value FROM product_specs WHERE product_id = $1 ORDER BY display_order ASC`, [prod.id])

    res.json({
      ...prod,
      image: images.rows[0]?.url || '',
      images: images.rows.map((i: any) => i.url),
      price: variants.rows[0]?.price || 0,
      oldPrice: variants.rows[0]?.oldPrice || undefined,
      stock: variants.rows[0]?.stock === 'out_of_stock' ? 'غير متوفر' : variants.rows[0]?.stock === 'limited_stock' ? 'كمية محدودة' : 'متوفر',
      specs: specs.rows,
      variants: variants.rows.map((v: any) => ({
        ...v,
        stock: v.stock === 'out_of_stock' ? 'غير متوفر' : v.stock === 'limited_stock' ? 'كمية محدودة' : 'متوفر',
        extraSpecs: typeof v.extraSpecs === 'string' ? JSON.parse(v.extraSpecs || '[]') : v.extraSpecs,
      })),
    })
  } catch (err: any) {
    console.error('Error fetching product details:', err)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

export default router
