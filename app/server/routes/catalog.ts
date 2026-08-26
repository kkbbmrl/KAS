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

// GET /api/v1/vehicles (Structured makes + models + tree)
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

// GET /api/v1/vehicle-makes
router.get('/vehicle-makes', async (_req, res) => {
  try {
    const makes = await query(`SELECT id, slug, name_ar AS "nameAr", name_fr AS "nameFr" FROM vehicle_makes ORDER BY display_order ASC`)
    res.json(makes.rows)
  } catch (err: any) {
    console.error('Error fetching vehicle makes:', err)
    res.status(500).json({ error: 'Failed to fetch vehicle makes' })
  }
})

// GET /api/v1/vehicle-models
router.get('/vehicle-models', async (req, res) => {
  try {
    const { make_id } = req.query
    let sql = `SELECT id, make_id AS "makeId", slug, name_ar AS "nameAr", name_fr AS "nameFr" FROM vehicle_models`
    const params: any[] = []
    if (make_id) {
      sql += ` WHERE make_id = $1`
      params.push(make_id)
    }
    sql += ` ORDER BY display_order ASC`
    const models = await query(sql, params)
    res.json(models.rows)
  } catch (err: any) {
    console.error('Error fetching vehicle models:', err)
    res.status(500).json({ error: 'Failed to fetch vehicle models' })
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

    const BRAND_ALIASES_MAP: Record<string, string[]> = {
      'تويوتا': ['تويوتا', 'toyota'],
      'رينو': ['رينو', 'renault'],
      'بيجو': ['بيجو', 'peugeot'],
      'فولكسفاغن': ['فولكسفاغن', 'volkswagen', 'vw'],
      'داسيا': ['داسيا', 'dacia'],
      'هيونداي': ['هيونداي', 'hyundai'],
      'كيا': ['كيا', 'kia'],
      'مرسيدس': ['مرسيدس', 'mercedes'],
      'BMW': ['bmw', 'بي أم دبليو', 'بي ام دبليو'],
      'نيسان': ['نيسان', 'nissan'],
      'سيات': ['سيات', 'seat'],
      'سكودا': ['سكودا', 'skoda'],
      'فورد': ['فورد', 'ford'],
      'سيتروين': ['سيتروين', 'citroen'],
    }

    const MODEL_ALIASES_MAP: Record<string, string[]> = {
      'كورولا': ['كورولا', 'corolla'],
      'ياريس': ['ياريس', 'yaris'],
      'كامري': ['كامري', 'camry'],
      'هيلوكس': ['هيلوكس', 'هايلوكس', 'hilux'],
      'راف 4': ['راف 4', 'راف4', 'rav4'],
      'كليو 4': ['كليو 4', 'clio 4', 'clio4'],
      'كليو 5': ['كليو 5', 'clio 5', 'clio5'],
      'سيمبول': ['سيمبول', 'symbol'],
      'ميغان 4': ['ميغان 4', 'megane 4', 'megane'],
      'داستر': ['داستر', 'duster'],
      'كابتور': ['كابتور', 'captur'],
      '208': ['208'],
      '301': ['301'],
      '2008': ['2008'],
      '308': ['308'],
      '3008': ['3008'],
      '508': ['508'],
      'غولف 7': ['غولف 7', 'golf 7', 'golf7'],
      'غولف 8': ['غولف 8', 'golf 8', 'golf8'],
      'بولو': ['بولو', 'polo'],
      'باسات': ['باسات', 'passat'],
      'تيجوان': ['تيجوان', 'tiguan'],
      'كادي': ['كادي', 'caddy'],
      'لوغان': ['لوغان', 'logan'],
      'سانديرو': ['سانديرو', 'sandero'],
      'ستيبواي': ['ستيبواي', 'stepway'],
      'أكسنت': ['أكسنت', 'accent'],
      'إلنترا': ['إلنترا', 'elantra'],
      'i20': ['i20'],
      'i30': ['i30'],
      'توسان': ['توسان', 'tucson'],
      'كريتا': ['كريتا', 'creta'],
      'ريو': ['ريو', 'rio'],
      'سيراتو': ['سيراتو', 'cerato'],
      'بيكانتو': ['بيكانتو', 'picanto'],
      'سبورتاج': ['سبورتاج', 'sportage'],
      'سيلتوس': ['سيلتوس', 'seltos'],
      'Class A': ['class a', 'classe a'],
      'Class C': ['class c', 'classe c'],
      'Class E': ['class e', 'classe e'],
      'GLA': ['gla'],
      'GLC': ['glc'],
      'الفئة 1': ['الفئة 1', 'serie 1'],
      'الفئة 3': ['الفئة 3', 'serie 3'],
      'الفئة 5': ['الفئة 5', 'serie 5'],
      'X1': ['x1'],
      'X3': ['x3'],
      'صني': ['صني', 'sunny'],
      'ميكرا': ['ميكرا', 'micra'],
      'قشقاي': ['قشقاي', 'qashqai'],
      'جوك': ['جوك', 'juke'],
      'باترول': ['باترول', 'patrol'],
      'ليون': ['ليون', 'leon'],
      'إبيزا': ['إبيزا', 'ibiza'],
      'أرونا': ['أرونا', 'arona'],
      'أتيكا': ['أتيكا', 'ateca'],
      'أوكتافيا': ['أوكتافيا', 'octavia'],
      'فابيا': ['فابيا', 'fabia'],
      'سوبرب': ['سوبرب', 'superb'],
      'فييستا': ['فييستا', 'fiesta'],
      'فوكس': ['فوكس', 'focus'],
      'إيكوسبورت': ['إيكوسبورت', 'ecosport'],
      'رينجر': ['رينجر', 'ranger'],
      'C3': ['c3'],
      'C-Elysée': ['c-elysee', 'c elysee', 'c-elysée', 'elysee', 'إليزيه'],
      'C4': ['c4'],
      'برلينغو': ['برلينغو', 'berlingo'],
    }

    if (brand) {
      const brandTerms = BRAND_ALIASES_MAP[brand] || [brand.trim()]
      const brandClauses: string[] = []
      for (const bTerm of brandTerms) {
        params.push(`%${bTerm}%`)
        const idx = params.length
        let bSql = `(p.name_ar ILIKE $${idx} OR p.name_fr ILIKE $${idx}`
        bSql += ` OR EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND (pv.label_ar ILIKE $${idx} OR pv.label_fr ILIKE $${idx}))`
        bSql += ` OR EXISTS (
          SELECT 1 FROM part_compatibility pc 
          JOIN vehicle_makes mk ON mk.id = pc.make_id 
          WHERE pc.product_id = p.id AND (mk.name_ar ILIKE $${idx} OR mk.name_fr ILIKE $${idx} OR mk.slug ILIKE $${idx})
        ))`
        brandClauses.push(bSql)
      }
      if (brandClauses.length > 0) {
        sql += ` AND (${brandClauses.join(' OR ')})`
      }
    }

    if (model) {
      const modelTerms = MODEL_ALIASES_MAP[model] || [model.trim()]
      const modelClauses: string[] = []
      for (const mTerm of modelTerms) {
        params.push(`%${mTerm}%`)
        const idx = params.length
        let mSql = `(p.name_ar ILIKE $${idx} OR p.name_fr ILIKE $${idx}`
        mSql += ` OR EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND (pv.label_ar ILIKE $${idx} OR pv.label_fr ILIKE $${idx}))`
        mSql += ` OR EXISTS (
          SELECT 1 FROM part_compatibility pc 
          JOIN vehicle_models md ON md.id = pc.model_id 
          WHERE pc.product_id = p.id AND (md.name_ar ILIKE $${idx} OR md.name_fr ILIKE $${idx} OR md.slug ILIKE $${idx})
        ))`
        modelClauses.push(mSql)
      }
      if (modelClauses.length > 0) {
        sql += ` AND (${modelClauses.join(' OR ')})`
      }
    }

    if (q) {
      const tokens = String(q).trim().slice(0, 100).split(/\s+/).filter(Boolean).slice(0, 6)
      for (const token of tokens) {
        params.push(`%${token}%`)
        const idx = params.length
        sql += ` AND (
          p.name_ar ILIKE $${idx} OR 
          p.name_fr ILIKE $${idx} OR 
          p.sku ILIKE $${idx} OR 
          p.base_part_number ILIKE $${idx} OR 
          p.description_ar ILIKE $${idx} OR
          p.badge ILIKE $${idx} OR
          b.name ILIKE $${idx} OR
          c.name_ar ILIKE $${idx} OR
          c.name_fr ILIKE $${idx} OR
          EXISTS (SELECT 1 FROM product_aliases pa WHERE pa.product_id = p.id AND pa.alias_term ILIKE $${idx}) OR
          EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND (pv.variant_sku ILIKE $${idx} OR pv.part_number ILIKE $${idx} OR pv.label_ar ILIKE $${idx} OR pv.label_fr ILIKE $${idx} OR pv.extra_specs ILIKE $${idx})) OR
          EXISTS (
            SELECT 1 FROM part_compatibility pc 
            JOIN vehicle_makes mk ON mk.id = pc.make_id 
            JOIN vehicle_models md ON md.id = pc.model_id
            WHERE pc.product_id = p.id AND (mk.name_ar ILIKE $${idx} OR mk.name_fr ILIKE $${idx} OR mk.slug ILIKE $${idx} OR md.name_ar ILIKE $${idx} OR md.name_fr ILIKE $${idx} OR md.slug ILIKE $${idx})
          )
        )`
      }
    }

    sql += ` ORDER BY p.featured_home DESC, p.created_at DESC LIMIT 120`

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

        // compat: vehicle names the UI renders directly (ProductCard/ProductModal
        // call .slice()/.map() on this, so it must always be an array).
        const compat = await query(
          `SELECT DISTINCT mk.name_ar AS make, md.name_ar AS model
           FROM part_compatibility pc
           JOIN vehicle_makes mk ON mk.id = pc.make_id
           JOIN vehicle_models md ON md.id = pc.model_id
           WHERE pc.product_id = $1`,
          [prod.id]
        )

        const aliases = await query(
          `SELECT alias_term AS term FROM product_aliases WHERE product_id = $1`,
          [prod.id]
        )

        const primaryVariant = variants.rows[0]
        const stockStatusArabic = primaryVariant?.stock === 'out_of_stock' ? 'غير متوفر' : primaryVariant?.stock === 'limited_stock' ? 'كمية محدودة' : 'متوفر'

        let compatList = compat.rows.map((c: any) => `${c.make} ${c.model}`.trim()).filter(Boolean)
        if (compatList.length === 0) {
          const fallbackSet = new Set<string>()
          for (const v of variants.rows) {
            if (v.label && typeof v.label === 'string') {
              const cleaned = v.label.split('—')[0].split('(')[0].trim()
              if (cleaned && cleaned.length > 2) {
                fallbackSet.add(cleaned)
              }
            }
          }
          compatList = Array.from(fallbackSet)
        }

        return {
          ...prod,
          rating: Number(prod.rating ?? 0),
          // NUMERIC(12,2) comes back as a string from pg — coerce or the cart
          // computes NaN and formatPrice() renders garbage.
          price: Number(primaryVariant?.price ?? 0),
          oldPrice: primaryVariant?.oldPrice != null ? Number(primaryVariant.oldPrice) : undefined,
          stock: stockStatusArabic,
          stockQuantity: Number(primaryVariant?.stockQuantity ?? 0),
          compat: compatList,
          aliases: aliases.rows.map((a: any) => a.term),
          specs: specs.rows,
          variants: variants.rows.map((v: any) => ({
            ...v,
            price: Number(v.price ?? 0),
            oldPrice: v.oldPrice != null ? Number(v.oldPrice) : undefined,
            stockQuantity: Number(v.stockQuantity ?? 0),
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

    const compat = await query(
      `SELECT DISTINCT mk.name_ar AS make, md.name_ar AS model
       FROM part_compatibility pc
       JOIN vehicle_makes mk ON mk.id = pc.make_id
       JOIN vehicle_models md ON md.id = pc.model_id
       WHERE pc.product_id = $1`,
      [prod.id]
    )
    const aliases = await query(`SELECT alias_term AS term FROM product_aliases WHERE product_id = $1`, [prod.id])

    const primary = variants.rows[0]

    res.json({
      ...prod,
      rating: Number(prod.rating ?? 0),
      image: images.rows[0]?.url || '',
      images: images.rows.map((i: any) => i.url),
      price: Number(primary?.price ?? 0),
      oldPrice: primary?.oldPrice != null ? Number(primary.oldPrice) : undefined,
      stock: primary?.stock === 'out_of_stock' ? 'غير متوفر' : primary?.stock === 'limited_stock' ? 'كمية محدودة' : 'متوفر',
      stockQuantity: Number(primary?.stockQuantity ?? 0),
      compat: compat.rows.map((c: any) => `${c.make} ${c.model}`.trim()),
      aliases: aliases.rows.map((a: any) => a.term),
      specs: specs.rows,
      variants: variants.rows.map((v: any) => ({
        ...v,
        price: Number(v.price ?? 0),
        oldPrice: v.oldPrice != null ? Number(v.oldPrice) : undefined,
        stockQuantity: Number(v.stockQuantity ?? 0),
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
