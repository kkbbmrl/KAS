import { randomUUID } from 'node:crypto'
import { query } from './db.js'
import { initDatabase } from './init.js'
import { ALGERIA_WILAYAS } from '../../src/data/wilayas.js'
import { CATEGORIES, CAR_BRANDS } from '../../src/data/products.js'

export async function seedDatabase() {
  await initDatabase()
  console.log('🌱 Seeding reference and catalog data...')

  // 1. Wilayas — real Algerian delivery zones and shipping fees
  console.log(`🇩🇿 Seeding ${ALGERIA_WILAYAS.length} Wilayas of Algeria...`)
  for (const w of ALGERIA_WILAYAS) {
    await query(
      `INSERT INTO algeria_wilayas (code, name_ar, name_fr, delivery_time_text, shipping_fee)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code) DO UPDATE SET
         name_ar = EXCLUDED.name_ar,
         name_fr = EXCLUDED.name_fr,
         delivery_time_text = EXCLUDED.delivery_time_text,
         shipping_fee = EXCLUDED.shipping_fee`,
      [w.code, w.nameAr, w.nameFr, w.deliveryTime, w.shippingFee]
    )
  }

  // 2. Categories
  console.log(`📂 Seeding ${CATEGORIES.length} Categories...`)
  const categoryIdMap: Record<string, string> = {}
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]
    const slug = c.fr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${i}`
    const catId = c.id || `cat-${slug}`

    const existing = await query(`SELECT id FROM categories WHERE id = $1 OR slug = $2`, [catId, slug])
    if (existing.rows.length > 0) {
      await query(
        `UPDATE categories SET slug = $1, name_ar = $2, name_fr = $3, icon_name = $4, is_available = $5, display_order = $6 WHERE id = $7`,
        [slug, c.name, c.fr, c.icon, c.available ? 1 : 0, i + 1, existing.rows[0].id]
      )
    } else {
      await query(
        `INSERT INTO categories (id, slug, name_ar, name_fr, icon_name, is_available, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [catId, slug, c.name, c.fr, c.icon, c.available ? 1 : 0, i + 1]
      )
    }
    categoryIdMap[c.name] = catId
    categoryIdMap[c.fr] = catId
  }

  // 3. Brands
  console.log('🏷️ Seeding Auto Parts Brands...')
  const BRANDS_LIST = [
    { name: 'VALEO', origin: 'France', featured: 1 },
    { name: 'BOSCH', origin: 'Germany', featured: 1 },
    { name: 'HELLA', origin: 'Germany', featured: 1 },
    { name: 'DENSO', origin: 'Japan', featured: 1 },
    { name: 'MAHLE', origin: 'Germany', featured: 1 },
    { name: 'BREMBO', origin: 'Italy', featured: 1 },
    { name: 'FERODO', origin: 'UK', featured: 1 },
    { name: 'SKF', origin: 'Sweden', featured: 1 },
    { name: 'SNR', origin: 'France', featured: 1 },
    { name: 'INA', origin: 'Germany', featured: 1 },
    { name: 'GATES', origin: 'USA', featured: 1 },
    { name: 'CONTITECH', origin: 'Germany', featured: 1 },
    { name: 'NGK', origin: 'Japan', featured: 1 },
    { name: 'MANN-FILTER', origin: 'Germany', featured: 1 },
    { name: 'MAGNETI MARELLI', origin: 'Italy', featured: 1 },
  ]

  const brandIdMap: Record<string, string> = {}
  for (let i = 0; i < BRANDS_LIST.length; i++) {
    const b = BRANDS_LIST[i]
    const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const existing = await query(`SELECT id FROM brands WHERE slug = $1`, [slug])
    let bId = existing.rows[0]?.id
    if (!bId) {
      bId = randomUUID()
      await query(
        `INSERT INTO brands (id, slug, name, origin_country, is_featured, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [bId, slug, b.name, b.origin, b.featured, i + 1]
      )
    }
    brandIdMap[b.name] = bId
  }

  // 4. Vehicle taxonomy — makes & models
  console.log('🚗 Seeding Vehicle Taxonomy...')
  const MAKE_METADATA: Record<string, { slug: string; fr: string; displayOrder: number }> = {
    'تويوتا': { slug: 'toyota', fr: 'Toyota', displayOrder: 1 },
    'رينو': { slug: 'renault', fr: 'Renault', displayOrder: 2 },
    'بيجو': { slug: 'peugeot', fr: 'Peugeot', displayOrder: 3 },
    'فولكسفاغن': { slug: 'volkswagen', fr: 'Volkswagen', displayOrder: 4 },
    'داسيا': { slug: 'dacia', fr: 'Dacia', displayOrder: 5 },
    'هيونداي': { slug: 'hyundai', fr: 'Hyundai', displayOrder: 6 },
    'كيا': { slug: 'kia', fr: 'Kia', displayOrder: 7 },
    'مرسيدس': { slug: 'mercedes', fr: 'Mercedes-Benz', displayOrder: 8 },
    'BMW': { slug: 'bmw', fr: 'BMW', displayOrder: 9 },
    'نيسان': { slug: 'nissan', fr: 'Nissan', displayOrder: 10 },
    'سيات': { slug: 'seat', fr: 'Seat', displayOrder: 11 },
    'سكودا': { slug: 'skoda', fr: 'Skoda', displayOrder: 12 },
    'فورد': { slug: 'ford', fr: 'Ford', displayOrder: 13 },
    'سيتروين': { slug: 'citroen', fr: 'Citroën', displayOrder: 14 },
  }

  const MODEL_SLUGS: Record<string, string> = {
    'كورولا': 'corolla', 'ياريس': 'yaris', 'كامري': 'camry', 'هيلوكس': 'hilux', 'راف 4': 'rav4',
    'كليو 4': 'clio-4', 'كليو 5': 'clio-5', 'سيمبول': 'symbol', 'ميغان 4': 'megane-4', 'داستر': 'duster', 'كابتور': 'captur',
    '208': '208', '301': '301', '2008': '2008', '308': '308', '3008': '3008', '508': '508',
    'غولف 7': 'golf-7', 'غولف 8': 'golf-8', 'بولو': 'polo', 'باسات': 'passat', 'تيجوان': 'tiguan', 'كادي': 'caddy',
    'لوغان': 'logan', 'سانديرو': 'sandero', 'ستيبواي': 'stepway',
    'أكسنت': 'accent', 'إلنترا': 'elantra', 'i20': 'i20', 'i30': 'i30', 'توسان': 'tucson', 'كريتا': 'creta',
    'ريو': 'rio', 'سيراتو': 'cerato', 'بيكانتو': 'picanto', 'سبورتاج': 'sportage', 'سيلتوس': 'seltos',
    'Class A': 'class-a', 'Class C': 'class-c', 'Class E': 'class-e', 'GLA': 'gla', 'GLC': 'glc',
    'الفئة 1': 'serie-1', 'الفئة 3': 'serie-3', 'الفئة 5': 'serie-5', 'X1': 'x1', 'X3': 'x3',
    'صني': 'sunny', 'ميكرا': 'micra', 'قشقاي': 'qashqai', 'جوك': 'juke', 'باترول': 'patrol',
    'ليون': 'leon', 'إبيزا': 'ibiza', 'أرونا': 'arona', 'أتيكا': 'ateca',
    'أوكتافيا': 'octavia', 'فابيا': 'fabia', 'سوبرب': 'superb',
    'فييستا': 'fiesta', 'فوكس': 'focus', 'إيكوسبورت': 'ecosport', 'رينجر': 'ranger',
    'C3': 'c3', 'C-Elysée': 'c-elysee', 'C4': 'c4', 'برلينغو': 'berlingo',
  }

  for (const [makeName, models] of Object.entries(CAR_BRANDS)) {
    const meta = MAKE_METADATA[makeName] || { slug: `make-${randomUUID().slice(0, 6)}`, fr: makeName, displayOrder: 99 }
    const existingMake = await query(`SELECT id FROM vehicle_makes WHERE slug = $1`, [meta.slug])
    let makeId = existingMake.rows[0]?.id
    if (!makeId) {
      makeId = randomUUID()
      await query(
        `INSERT INTO vehicle_makes (id, slug, name_ar, name_fr, display_order) VALUES ($1, $2, $3, $4, $5)`,
        [makeId, meta.slug, makeName, meta.fr, meta.displayOrder]
      )
    }

    for (let i = 0; i < models.length; i++) {
      const modelName = models[i]
      const modelClean = MODEL_SLUGS[modelName] || modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `m-${i + 1}`
      const modelSlug = `${meta.slug}-${modelClean}`
      const existingModel = await query(
        `SELECT id FROM vehicle_models WHERE make_id = $1 AND slug = $2`,
        [makeId, modelSlug]
      )
      if (existingModel.rows.length === 0) {
        await query(
          `INSERT INTO vehicle_models (id, make_id, slug, name_ar, name_fr, display_order) VALUES ($1, $2, $3, $4, $5, $6)`,
          [randomUUID(), makeId, modelSlug, modelName, modelName, i + 1]
        )
      }
    }
  }

  // 5. Products — Complete 2,237 Catalog from Enriched CSV
  console.log('📦 Seeding Products Catalogue from Enriched CSV...')
  const checkProds = await query(`SELECT COUNT(*) AS count FROM products`)
  if (Number(checkProds.rows[0]?.count || 0) < 500) {
    const { importFromEnrichedCsv } = await import('../scripts/import_from_enriched_csv.js')
    await importFromEnrichedCsv()
  }

  // 6. Populate vehicle compatibility links
  await seedPartCompatibility()

  // 7. System settings
  console.log('⚙️ Seeding System Settings...')
  const defaultSettings = [
    { key: 'store_name', value: 'Khaled Auto Parts', cat: 'general' },
    { key: 'store_phone', value: '0550 72 96 01', cat: 'general' },
    { key: 'store_email', value: 'medbouhmoussa@yahoo.fr', cat: 'general' },
    { key: 'store_address', value: 'شارع مجانة، عمارة زواوي، برج بوعريريج، 34000', cat: 'general' },
    { key: 'store_currency', value: 'DA', cat: 'general' },
    { key: 'default_courier', value: 'Yalidine Fast Logistics', cat: 'shipping' },
    { key: 'free_shipping_threshold', value: '15000', cat: 'shipping' },
    { key: 'low_stock_threshold', value: '5', cat: 'inventory' },
    { key: 'auto_reserve_stock', value: 'true', cat: 'orders' },
  ]

  for (const s of defaultSettings) {
    const existing = await query(`SELECT setting_key FROM system_settings WHERE setting_key = $1`, [s.key])
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category)
         VALUES ($1, $2, $3)`,
        [s.key, s.value, s.cat]
      )
    }
  }

  const { ensureAdminAccounts } = await import('./ensureAdmins.js')
  await ensureAdminAccounts()

  console.log('✅ All reference data, products, categories, vehicle compatibility, and admin accounts seeded.')
}

const PART_COMPATIBILITY_MAP: Record<string, { makes: string[]; models?: string[] }> = {
  'مشعاع تبريد المحرك (Radiateur)': {
    makes: ['رينو', 'داسيا'],
    models: ['كليو 4', 'كليو 5', 'سيمبول', 'ميغان 4', 'كابتور', 'لوغان', 'سانديرو', 'ستيبواي'],
  },
  'مصباح أمامي LED كامل (Phare)': {
    makes: ['بيجو', 'سيتروين'],
    models: ['208', '301', '2008', '308', 'C3', 'C-Elysée'],
  },
  'غطاء المحرك الأمامي (Capot)': {
    makes: ['فولكسفاغن', 'سيات', 'سكودا'],
    models: ['غولف 7', 'غولف 8', 'بولو', 'كادي', 'ليون', 'إبيزا', 'أوكتافيا'],
  },
  'ترافرس أمامي سفلي (Traverse)': {
    makes: ['رينو', 'داسيا'],
    models: ['كليو 4', 'سيمبول', 'داستر', 'سانديرو', 'ستيبواي'],
  },
  'صدام أمامي مع فتحات شبك (Pare-chocs)': {
    makes: ['بيجو', 'سيتروين'],
    models: ['208', '301', '2008', 'C3'],
  },
  'مروحة تبريد المشعاع (Ventilateur)': {
    makes: ['تويوتا', 'هيونداي', 'كيا'],
    models: ['ياريس', 'كورولا', 'راف 4', 'أكسنت', 'i20', 'إلنترا', 'ريو', 'بيكانتو'],
  },
  'زجاج المصباح الأمامي (Verre de phare)': {
    makes: ['فولكسفاغن', 'سكودا', 'سيات'],
    models: ['غولف 7', 'بولو', 'أوكتافيا', 'فابيا', 'إبيزا'],
  },
  'غطاء غبار ممتص الصدمات (Cache poussière)': {
    makes: ['تويوتا', 'نيسان'],
    models: ['ياريس', 'كورولا', 'هيلوكس', 'كامري', 'راف 4', 'صني', 'ميكرا', 'قشقاي'],
  },
  'مقبض باب خارجي (Poignée de porte)': {
    makes: ['هيونداي', 'كيا'],
    models: ['أكسنت', 'إلنترا', 'i20', 'توسان', 'ريو', 'سيراتو', 'بيكانتو'],
  },
  'ماسحات الزجاج الأمامي Silencio (Essuie-glace)': {
    makes: ['بيجو', 'رينو', 'سيتروين'],
    models: ['208', '301', '2008', '308', 'كليو 4', 'كليو 5', 'ميغان 4', 'C3', 'C4', 'برلينغو'],
  },
  'ضوء خلفي LED كامل (Feu arrière)': {
    makes: ['مرسيدس', 'BMW'],
    models: ['Class A', 'Class C', 'GLA', 'الفئة 1', 'الفئة 3', 'X1'],
  },
  'بيرسو الهيكل الأمامي (Berceau)': {
    makes: ['رينو', 'داسيا'],
    models: ['كليو 4', 'كليو 5', 'سيمبول', 'لوغان', 'سانديرو', 'ستيبواي'],
  },
  'سيرسو عجلة القيادة ونظام التعليق (Cerceau)': {
    makes: ['فورد'],
    models: ['فييستا', 'فوكس', 'إيكوسبورت', 'رينجر'],
  },
  'حامل الصدام الأمامي (Support pare-chocs)': {
    makes: ['فولكسفاغن', 'سيات', 'سكودا'],
    models: ['غولف 7', 'غولف 8', 'بولو', 'كادي', 'ليون', 'إبيزا', 'فابيا'],
  },
  'الآرماتور وهيكل التثبيت (Armature)': {
    makes: ['تويوتا', 'نيسان'],
    models: ['كورولا', 'ياريس', 'هيلوكس', 'كامري', 'صني', 'ميكرا', 'قشقاي', 'جوك'],
  },
  'فلتر زيت أصلي عالي الكفاءة (Filtre à huile)': {
    makes: ['تويوتا', 'هيونداي', 'كيا'],
    models: ['كورولا', 'ياريس', 'هيلوكس', 'كامري', 'راف 4', 'أكسنت', 'إلنترا', 'i20', 'i30', 'توسان', 'ريو', 'سيراتو', 'بيكانتو', 'سبورتاج'],
  },
  'فلتر هواء المحرك الرياضي (Filtre à air)': {
    makes: ['فولكسفاغن', 'سيات', 'سكودا'],
    models: ['غولف 7', 'غولف 8', 'بولو', 'باسات', 'تيجوان', 'كادي', 'ليون', 'إبيزا', 'أوكتافيا'],
  },
  'أقراص فرامل مهواة (Disques de frein)': {
    makes: ['مرسيدس', 'BMW'],
    models: ['Class A', 'Class C', 'Class E', 'GLA', 'GLC', 'الفئة 1', 'الفئة 3', 'الفئة 5', 'X1', 'X3'],
  },
  'بطانات فرامل سيراميك (Plaquettes de frein)': {
    makes: ['رينو', 'بيجو', 'داسيا', 'تويوتا'],
    models: ['كليو 4', 'كليو 5', 'ميغان 4', '208', '308', '3008', 'داستر', 'ستيبواي', 'كورولا', 'ياريس'],
  },
}

export async function seedPartCompatibility(forceClean = false) {
  console.log('🚗 Linking products with vehicle make and model compatibility...')
  
  const makes = await query(`SELECT id, slug, name_ar AS "nameAr" FROM vehicle_makes`)
  const models = await query(`SELECT id, make_id AS "makeId", slug, name_ar AS "nameAr" FROM vehicle_models`)
  const prods = await query(`SELECT id, name_ar AS name, category_id AS "categoryId" FROM products`)
  
  if (prods.rows.length === 0 || models.rows.length === 0) return

  // If forceClean is requested, clear previous links
  if (forceClean) {
    await query(`DELETE FROM part_compatibility`)
  }

  const makeMap: Record<string, string> = {}
  makes.rows.forEach((m: any) => {
    makeMap[m.nameAr] = m.id
    makeMap[m.slug] = m.id
  })

  const modelMap: Record<string, { id: string; makeId: string }> = {}
  models.rows.forEach((m: any) => {
    modelMap[m.nameAr] = { id: m.id, makeId: m.makeId }
    modelMap[m.slug] = { id: m.id, makeId: m.makeId }
  })

  for (const prod of prods.rows) {
    const config = PART_COMPATIBILITY_MAP[prod.name]
    if (config) {
      // Link specific configured models
      for (const mName of config.models || []) {
        const mObj = modelMap[mName]
        if (mObj) {
          const exists = await query(
            `SELECT id FROM part_compatibility WHERE product_id = $1 AND model_id = $2`,
            [prod.id, mObj.id]
          )
          if (exists.rows.length === 0) {
            await query(
              `INSERT INTO part_compatibility (id, product_id, make_id, model_id) VALUES ($1, $2, $3, $4)`,
              [randomUUID(), prod.id, mObj.makeId, mObj.id]
            )
          }
        }
      }
    } else {
      // Default: Link to popular Renault, Peugeot, Toyota models
      const defaultModels = ['كليو 4', '208', 'ياريس', 'غولف 7']
      for (const dName of defaultModels) {
        const mObj = modelMap[dName]
        if (mObj) {
          await query(
            `INSERT INTO part_compatibility (id, product_id, make_id, model_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
            [randomUUID(), prod.id, mObj.makeId, mObj.id]
          )
        }
      }
    }
  }

  const countRes = await query(`SELECT COUNT(*) AS count FROM part_compatibility`)
  console.log(`✅ Total vehicle compatibility links: ${countRes.rows[0]?.count || 0}`)
}
