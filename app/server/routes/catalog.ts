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
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
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
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
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

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
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
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    res.json(makes.rows)
  } catch (err: any) {
    console.error('Error fetching vehicle makes:', err.message)
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
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    res.json(models.rows)
  } catch (err: any) {
    console.error('Error fetching vehicle models:', err.message)
    res.status(500).json({ error: 'Failed to fetch vehicle models' })
  }
})

const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Brands
  'سيتروان': ['citroen', 'citroën', 'c3', 'c4'],
  'سيتروين': ['citroen', 'citroën'],
  'رونو': ['renault', 'clio', 'symbol', 'megane', 'kangoo'],
  'رينو': ['renault', 'clio', 'symbol'],
  'بيجو': ['peugeot', '206', '207', '208', '301', '307', '308'],
  'فولكسفاغن': ['volkswagen', 'vw', 'golf', 'polo', 'caddy'],
  'فولكس': ['volkswagen', 'vw'],
  'سيات': ['seat', 'ibiza', 'leon'],
  'هيونداي': ['hyundai', 'accent', 'atos', 'i10', 'i20'],
  'كيا': ['kia', 'picanto', 'rio'],
  'تويوتا': ['toyota', 'corolla', 'yaris', 'hilux'],
  'شفروليه': ['chevrolet', 'aveo', 'sail', 'spark'],
  'شيفروليه': ['chevrolet', 'aveo', 'sail', 'spark'],
  'فورد': ['ford', 'fiesta', 'focus'],
  'داسيا': ['dacia', 'logan', 'sandero', 'duster', 'stepway'],

  // Models
  'كليو': ['clio'],
  'سيمبول': ['symbol'],
  'سامبول': ['symbol'],
  'قولف': ['golf'],
  'غولف': ['golf'],
  'بولو': ['polo'],
  'كادي': ['caddy'],
  'اكسنت': ['accent'],
  'أكسنت': ['accent'],
  'اتوس': ['atos'],
  'أتوس': ['atos'],
  'بيكانتو': ['picanto'],
  'بكانتو': ['picanto'],
  'افيو': ['aveo'],
  'أفيو': ['aveo'],
  'سبارك': ['spark'],
  'ايبيزا': ['ibiza'],
  'إبيزا': ['ibiza'],
  'كورولا': ['corolla'],

  // Parts (Algerian Dialect / French / Arabic)
  'باربو': ['cache', 'roue', 'pare-boue', 'poussiere'],
  'باربوات': ['cache', 'roue', 'pare-boue'],
  'كاش': ['cache'],
  'فار': ['phare', 'optique'],
  'فارات': ['phare', 'optique'],
  'ستوب': ['feu', 'arriere'],
  'ستوبات': ['feu', 'arriere'],
  'ريتروفيزور': ['retro', 'glace'],
  'ريترو': ['retro', 'glace'],
  'مروحة': ['ventilateur'],
  'رادياتور': ['radiateur'],
  'كابو': ['capot'],
  'بارشوك': ['parchoc', 'pare-chocs'],
  'كالوندر': ['calandre', 'grille'],
  'آيل': ['aile'],
  'ايال': ['aile'],
  'لال': ['aile'],
  'بواني': ['poignee'],
  'كومودو': ['comodo'],
}

// GET /api/v1/products (Search & Filtering with Pagination & Caching)
router.get('/products', async (req, res) => {
  try {
    const { q, brand, model, cat, in_stock, featured, page = '1', limit = '24' } = req.query as Record<string, string>

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const pageLimit = Math.min(60, Math.max(1, parseInt(limit, 10) || 24))
    const offset = (pageNum - 1) * pageLimit

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
        (p.featured_home = 1 OR p.featured_home = TRUE) AS "featuredHome",
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1) AS image
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      WHERE (p.is_active = 1 OR p.is_active = TRUE)
    `
    const params: any[] = []

    if (featured === 'true' || featured === '1') {
      sql += ` AND (p.featured_home = 1 OR p.featured_home = TRUE)`
    }

    if (in_stock === 'true') {
      sql += ` AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock_quantity > 0 AND pv.stock_status != 'out_of_stock')`
    }

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
      const tokens = String(q).trim().slice(0, 80).split(/\s+/).filter(Boolean).slice(0, 4)
      for (const token of tokens) {
        const cleanTok = token.toLowerCase().trim()
        const variants = [token, ...(SEARCH_SYNONYMS[cleanTok] || [])]
        const tokenClauses: string[] = []

        for (const v of variants) {
          params.push(`%${v}%`)
          const idx = params.length
          tokenClauses.push(`
            p.name_ar ILIKE $${idx} OR 
            p.name_fr ILIKE $${idx} OR 
            p.sku ILIKE $${idx} OR 
            p.base_part_number ILIKE $${idx} OR 
            b.name ILIKE $${idx} OR
            c.name_ar ILIKE $${idx} OR
            c.name_fr ILIKE $${idx} OR
            EXISTS (SELECT 1 FROM product_aliases pa WHERE pa.product_id = p.id AND pa.alias_term ILIKE $${idx}) OR
            EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND (pv.variant_sku ILIKE $${idx} OR pv.part_number ILIKE $${idx} OR pv.label_ar ILIKE $${idx}))
          `)
        }

        sql += ` AND (${tokenClauses.join(' OR ')})`
      }
    }

    sql += ` ORDER BY p.featured_home DESC, p.id ASC LIMIT ${pageLimit} OFFSET ${offset}`

    const result = await query(sql, params)
    const rawProducts = result.rows
    if (rawProducts.length === 0) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
      return res.json([])
    }

    const productIds = rawProducts.map((p: any) => p.id)
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',')

    // Fast batch queries for variants and compatibilities (heavy specs/extraSpecs excluded from list responses)
    const [variantsRes, compatRes] = await Promise.all([
      query(
        `SELECT product_id, id, variant_sku AS sku, part_number AS "partNumber", label_ar AS label, price, old_price AS "oldPrice", stock_quantity AS "stockQuantity", stock_status AS stock
         FROM product_variants
         WHERE product_id IN (${placeholders}) AND (is_active = 1 OR is_active = TRUE)
         ORDER BY price ASC`,
        productIds
      ),
      query(
        `SELECT DISTINCT pc.product_id, mk.name_ar AS make, md.name_ar AS model
         FROM part_compatibility pc
         JOIN vehicle_makes mk ON mk.id = pc.make_id
         JOIN vehicle_models md ON md.id = pc.model_id
         WHERE pc.product_id IN (${placeholders})`,
        productIds
      ),
    ])

    const variantsByProduct: Record<string, any[]> = {}
    for (const v of variantsRes.rows) {
      if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = []
      variantsByProduct[v.product_id].push(v)
    }

    const compatByProduct: Record<string, string[]> = {}
    for (const c of compatRes.rows) {
      if (!compatByProduct[c.product_id]) compatByProduct[c.product_id] = []
      const pair = `${c.make} ${c.model}`.trim()
      if (pair && !compatByProduct[c.product_id].includes(pair)) {
        compatByProduct[c.product_id].push(pair)
      }
    }

    // Build lean product objects for catalog/search view
    const products = rawProducts.map((prod: any) => {
      const prodVariants = variantsByProduct[prod.id] || []
      let compatList = compatByProduct[prod.id] || []

      if (compatList.length === 0) {
        const fallbackSet = new Set<string>()
        for (const v of prodVariants) {
          if (v.label && typeof v.label === 'string') {
            const cleaned = v.label.split('—')[0].split('(')[0].trim()
            if (cleaned && cleaned.length > 2) {
              fallbackSet.add(cleaned)
            }
          }
        }
        compatList = Array.from(fallbackSet)
      }

      const primaryVariant = prodVariants[0]
      const totalStock = prodVariants.reduce((sum: number, v: any) => sum + Math.max(0, Number(v.stockQuantity ?? 0)), 0)
      const isOutOfStock = totalStock === 0 || (prodVariants.length > 0 && prodVariants.every((v: any) => Number(v.stockQuantity ?? 0) === 0 || v.stock === 'out_of_stock'))
      const isLimited = !isOutOfStock && totalStock <= 5
      const overallStockArabic = isOutOfStock ? 'غير متوفر' : isLimited ? 'كمية محدودة' : 'متوفر'

      return {
        ...prod,
        rating: Number(prod.rating ?? 0),
        price: Number(primaryVariant?.price ?? 0),
        oldPrice: primaryVariant?.oldPrice != null ? Number(primaryVariant.oldPrice) : undefined,
        stock: overallStockArabic,
        compat: compatList,
        specs: [],
        variants: prodVariants.map((v: any) => ({
          id: v.id,
          sku: v.sku,
          partNumber: v.partNumber,
          label: v.label,
          price: Number(v.price ?? 0),
          oldPrice: v.oldPrice != null ? Number(v.oldPrice) : undefined,
          stock: (Math.max(0, Number(v.stockQuantity ?? 0)) === 0 || v.stock === 'out_of_stock')
            ? 'غير متوفر'
            : (Number(v.stockQuantity ?? 0) <= 5 || v.stock === 'limited_stock')
            ? 'كمية محدودة'
            : 'متوفر',
        })),
      }
    })

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    res.json(products)
  } catch (err: any) {
    console.error('Error querying products:', err.message)
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
    const variants = await query(`SELECT id, variant_sku AS sku, part_number AS "partNumber", label_ar AS label, price, old_price AS "oldPrice", stock_quantity AS "stockQuantity", stock_status AS stock, extra_specs AS "extraSpecs" FROM product_variants WHERE product_id = $1`, [prod.id])
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
    const totalStock = variants.rows.reduce((sum, v) => sum + Math.max(0, Number(v.stockQuantity ?? 0)), 0)
    const isOutOfStock = totalStock === 0 || (variants.rows.length > 0 && variants.rows.every(v => Number(v.stockQuantity ?? 0) === 0 || v.stock === 'out_of_stock'))
    const isLimited = !isOutOfStock && totalStock <= 5
    const overallStockArabic = isOutOfStock ? 'غير متوفر' : isLimited ? 'كمية محدودة' : 'متوفر'

    const publicSpecs = specs.rows.filter((s: any) => 
      !/achat|pri\.achat|d\.gros|gros\b|شراء|جملة|نصف\s*الجملة/i.test(s.label || '')
    )

    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
    res.json({
      ...prod,
      rating: Number(prod.rating ?? 0),
      image: images.rows[0]?.url || '',
      images: images.rows.map((i: any) => i.url),
      price: Number(primary?.price ?? 0),
      oldPrice: primary?.oldPrice != null ? Number(primary.oldPrice) : undefined,
      stock: overallStockArabic,
      compat: compat.rows.map((c: any) => `${c.make} ${c.model}`.trim()),
      aliases: aliases.rows.map((a: any) => a.term),
      specs: publicSpecs,
      variants: variants.rows.map((v: any) => {
        const vQty = Math.max(0, Number(v.stockQuantity ?? 0))
        const vStockArabic = vQty === 0 || v.stock === 'out_of_stock'
          ? 'غير متوفر'
          : vQty <= 5 || v.stock === 'limited_stock'
          ? 'كمية محدودة'
          : 'متوفر'

        const parsedExtra = typeof v.extraSpecs === 'string' ? JSON.parse(v.extraSpecs || '[]') : v.extraSpecs || []
        const publicExtraSpecs = Array.isArray(parsedExtra)
          ? parsedExtra.filter((s: any) => !/achat|pri\.achat|d\.gros|gros\b|شراء|جملة|نصف\s*الجملة/i.test(s.label || ''))
          : []

        return {
          id: v.id,
          sku: v.sku,
          partNumber: v.partNumber,
          label: v.label,
          price: Number(v.price ?? 0),
          oldPrice: v.oldPrice != null ? Number(v.oldPrice) : undefined,
          stock: vStockArabic,
          extraSpecs: publicExtraSpecs,
        }
      }),
    })
  } catch (err: any) {
    console.error('Error fetching product details:', err.message)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

export default router
