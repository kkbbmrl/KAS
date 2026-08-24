import { randomUUID } from 'node:crypto'
import { query } from './db.js'
import { initDatabase } from './init.js'
import { ALGERIA_WILAYAS } from '../../src/data/wilayas.js'
import { CATEGORIES, CAR_BRANDS } from '../../src/data/products.js'

/**
 * Seeds REFERENCE data only: wilayas, category taxonomy, vehicle makes/models,
 * system settings and admin accounts.
 *
 * Products, variants, images and offers are NOT seeded — the catalogue belongs to
 * the store owner and is managed through the Admin Dashboard. An empty catalogue
 * is a valid state; injecting sample products would put stock the owner never
 * added in front of real customers.
 */
export async function seedDatabase() {
  await initDatabase()
  console.log('🌱 Seeding reference data (no sample products)...')

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

  // 2. Categories — taxonomy the Admin product editor depends on
  console.log(`📂 Seeding ${CATEGORIES.length} Categories...`)
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]
    const slug = c.fr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${i}`

    const existing = await query(`SELECT id FROM categories WHERE slug = $1`, [slug])
    if (existing.rows[0]?.id) {
      await query(
        `UPDATE categories SET name_ar = $1, name_fr = $2, icon_name = $3, is_available = $4, display_order = $5 WHERE id = $6`,
        [c.name, c.fr, c.icon, c.available ? 1 : 0, i, existing.rows[0].id]
      )
    } else {
      await query(
        `INSERT INTO categories (id, slug, name_ar, name_fr, icon_name, is_available, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [randomUUID(), slug, c.name, c.fr, c.icon, c.available ? 1 : 0, i]
      )
    }
  }

  // 3. Vehicle taxonomy — makes & models used by the compatibility picker
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

  const makeIdMap: Record<string, string> = {}
  const modelIdMap: Record<string, string> = {}

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
    } else {
      await query(
        `UPDATE vehicle_makes SET name_ar = $1, name_fr = $2, display_order = $3 WHERE id = $4`,
        [makeName, meta.fr, meta.displayOrder, makeId]
      )
    }
    makeIdMap[makeName] = makeId

    for (let i = 0; i < models.length; i++) {
      const modelName = models[i]
      const modelClean = MODEL_SLUGS[modelName] || modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `m-${i + 1}`
      const modelSlug = `${meta.slug}-${modelClean}`
      const existingModel = await query(
        `SELECT id FROM vehicle_models WHERE make_id = $1 AND slug = $2`,
        [makeId, modelSlug]
      )
      let modelId = existingModel.rows[0]?.id
      if (!modelId) {
        modelId = randomUUID()
        await query(
          `INSERT INTO vehicle_models (id, make_id, slug, name_ar, name_fr, display_order) VALUES ($1, $2, $3, $4, $5, $6)`,
          [modelId, makeId, modelSlug, modelName, modelName, i + 1]
        )
      }
      modelIdMap[`${makeName}::${modelName}`] = modelId
    }
  }

  // Link product variants to vehicle compatibility
  try {
    const variants = await query(`SELECT id, product_id, label_ar, label_fr, extra_specs AS "extraSpecs" FROM product_variants`)
    for (const v of variants.rows) {
      const text = `${v.label_ar || ''} ${v.label_fr || ''} ${typeof v.extraSpecs === 'string' ? v.extraSpecs : JSON.stringify(v.extraSpecs || '')}`.toLowerCase()
      for (const [makeName, models] of Object.entries(CAR_BRANDS)) {
        const meta = MAKE_METADATA[makeName]
        const makeKeywords = [makeName, meta.fr.toLowerCase(), meta.slug]
        const makeMatches = makeKeywords.some((k) => text.includes(k.toLowerCase()))
        for (const modelName of models) {
          const modelKeywords = [modelName.toLowerCase()]
          if (modelName === 'كليو 4' || modelName === 'كليو 5') modelKeywords.push('كليو', 'clio')
          if (modelName === 'غولف 7' || modelName === 'غولف 8') modelKeywords.push('غولف', 'golf')
          if (modelName === 'سيمبول') modelKeywords.push('symbol', 'symbole')
          if (modelName === 'أكسنت') modelKeywords.push('accent')
          if (modelName === 'إلنترا') modelKeywords.push('elantra')
          if (modelName === 'كورولا') modelKeywords.push('corolla')
          if (modelName === 'ياريس') modelKeywords.push('yaris')
          if (modelName === 'ريو') modelKeywords.push('rio')
          if (modelName === 'سيراتو') modelKeywords.push('cerato')
          if (modelName === '208') modelKeywords.push('208')
          if (modelName === '301') modelKeywords.push('301')
          if (modelName === 'C3') modelKeywords.push('c3')
          if (modelName === 'C-Elysée') modelKeywords.push('c-elysée', 'c-elysee', 'elysee')
          if (modelName === 'ليون') modelKeywords.push('leon')
          if (modelName === 'إبيزا') modelKeywords.push('ibiza')
          if (modelName === 'بولو') modelKeywords.push('polo')

          const modelMatches = modelKeywords.some((k) => text.includes(k))
          if (makeMatches && modelMatches) {
            const makeId = makeIdMap[makeName]
            const modelId = modelIdMap[`${makeName}::${modelName}`]
            if (makeId && modelId) {
              const existingCompat = await query(
                `SELECT id FROM part_compatibility WHERE product_id = $1 AND make_id = $2 AND model_id = $3`,
                [v.product_id, makeId, modelId]
              )
              if (existingCompat.rows.length === 0) {
                await query(
                  `INSERT INTO part_compatibility (id, product_id, variant_id, make_id, model_id) VALUES ($1, $2, $3, $4, $5)`,
                  [randomUUID(), v.product_id, v.id, makeId, modelId]
                )
              }
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('Notice seeding compatibility:', err.message)
  }

  const { ensureAdminAccounts } = await import('./ensureAdmins.js')
  await ensureAdminAccounts()

  // 4. System settings — store identity and operational defaults
  console.log('⚙️ Seeding System Settings...')
  const defaultSettings = [
    { key: 'store_name', value: 'Khaled Auto Spart', cat: 'general' },
    { key: 'store_phone', value: '0555 12 34 56', cat: 'general' },
    { key: 'store_email', value: 'contact@khaledautospart.dz', cat: 'general' },
    { key: 'store_address', value: 'شارع الاستقلال رقم 42، الجزائر العاصمة', cat: 'general' },
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

  console.log('✅ Reference data seeded. Add products via the Admin Dashboard.')
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed failed:', err)
      process.exit(1)
    })
}
