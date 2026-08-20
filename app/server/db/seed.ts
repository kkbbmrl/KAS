import { randomUUID } from 'node:crypto'
import { query } from './db.js'
import { initDatabase } from './init.js'
import { ALGERIA_WILAYAS } from '../../src/data/wilayas.js'
import { CATEGORIES, PRODUCTS, CAR_BRANDS } from '../../src/data/products.js'
import { OFFERS } from '../../src/data/offers.js'

export async function seedDatabase() {
  await initDatabase()
  console.log('🌱 Seeding database from frontend mock datasets...')

  // 1. Wilayas
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
  const categoryMap = new Map<string, string>() // Name -> UUID
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]
    const slug = c.fr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${i}`
    const id = randomUUID()

    const existing = await query(`SELECT id FROM categories WHERE slug = $1`, [slug])
    let categoryId = existing.rows[0]?.id

    if (!categoryId) {
      categoryId = id
      await query(
        `INSERT INTO categories (id, slug, name_ar, name_fr, icon_name, is_available, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [categoryId, slug, c.name, c.fr, c.icon, c.available ? 1 : 0, i]
      )
    } else {
      await query(
        `UPDATE categories SET name_ar = $1, name_fr = $2, icon_name = $3, is_available = $4, display_order = $5 WHERE id = $6`,
        [c.name, c.fr, c.icon, c.available ? 1 : 0, i, categoryId]
      )
    }
    categoryMap.set(c.name, categoryId)
  }

  // 3. Brands (from products)
  console.log('🏷️ Seeding Brands...')
  const brandNames = Array.from(new Set(PRODUCTS.map((p) => p.brand)))
  const brandMap = new Map<string, string>() // Name -> UUID
  for (let i = 0; i < brandNames.length; i++) {
    const b = brandNames[i]
    const slug = b.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `brand-${i}`
    const id = randomUUID()

    const existing = await query(`SELECT id FROM brands WHERE slug = $1`, [slug])
    let brandId = existing.rows[0]?.id

    if (!brandId) {
      brandId = id
      await query(
        `INSERT INTO brands (id, slug, name, is_featured, display_order)
         VALUES ($1, $2, $3, 1, $4)`,
        [brandId, slug, b, i]
      )
    }
    brandMap.set(b, brandId)
  }

  // 4. Vehicle Taxonomy (Makes & Models)
  console.log('🚗 Seeding Vehicle Taxonomy...')
  const makeMap = new Map<string, string>()
  const modelMap = new Map<string, string>() // "make:model" -> UUID

  for (const [makeName, models] of Object.entries(CAR_BRANDS)) {
    const makeSlug = makeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `make-${randomUUID().slice(0, 6)}`
    const existingMake = await query(`SELECT id FROM vehicle_makes WHERE slug = $1`, [makeSlug])
    let makeId = existingMake.rows[0]?.id
    if (!makeId) {
      makeId = randomUUID()
      await query(
        `INSERT INTO vehicle_makes (id, slug, name_ar, name_fr) VALUES ($1, $2, $3, $4)`,
        [makeId, makeSlug, makeName, makeName]
      )
    }
    makeMap.set(makeName, makeId)

    for (const modelName of models) {
      const modelSlug = modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `model-${randomUUID().slice(0, 6)}`
      const key = `${makeName}:${modelName}`
      const existingModel = await query(
        `SELECT id FROM vehicle_models WHERE make_id = $1 AND slug = $2`,
        [makeId, modelSlug]
      )
      let modelId = existingModel.rows[0]?.id
      if (!modelId) {
        modelId = randomUUID()
        await query(
          `INSERT INTO vehicle_models (id, make_id, slug, name_ar, name_fr) VALUES ($1, $2, $3, $4, $5)`,
          [modelId, makeId, modelSlug, modelName, modelName]
        )
      }
      modelMap.set(key, modelId)
    }
  }

  // 5. Products, Variants, Specs, Aliases, Images
  console.log(`⚙️ Seeding ${PRODUCTS.length} Master Products and Variants...`)
  const productDbMap = new Map<number, string>() // frontend ID -> DB UUID

  for (const p of PRODUCTS) {
    const categoryId = categoryMap.get(p.category) || Array.from(categoryMap.values())[0]
    const brandId = brandMap.get(p.brand) || Array.from(brandMap.values())[0]
    const sku = `SKU-PRD-${p.id}`

    const existingProduct = await query(`SELECT id FROM products WHERE sku = $1`, [sku])
    let productId = existingProduct.rows[0]?.id

    if (!productId) {
      productId = randomUUID()
      await query(
        `INSERT INTO products (
          id, sku, base_part_number, name_ar, name_fr, category_id, brand_id,
          badge, rating, description_ar, featured_home, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1)`,
        [
          productId,
          sku,
          p.partNumber,
          p.name,
          p.nameFr || p.name,
          categoryId,
          brandId,
          p.badge || null,
          p.rating || 5.0,
          p.description,
          p.featuredHome ? 1 : 0,
        ]
      )
    } else {
      await query(
        `UPDATE products SET
          name_ar = $1, name_fr = $2, rating = $3, description_ar = $4, featured_home = $5
         WHERE id = $6`,
        [p.name, p.nameFr || p.name, p.rating || 5.0, p.description, p.featuredHome ? 1 : 0, productId]
      )
    }
    productDbMap.set(p.id, productId)

    // Image
    if (p.image) {
      const existingImg = await query(`SELECT id FROM product_images WHERE product_id = $1 AND image_url = $2`, [productId, p.image])
      if (existingImg.rows.length === 0) {
        await query(
          `INSERT INTO product_images (id, product_id, image_url, is_primary, display_order)
           VALUES ($1, $2, $3, 1, 0)`,
          [randomUUID(), productId, p.image]
        )
      }
    }

    // Specs
    if (p.specs && p.specs.length > 0) {
      await query(`DELETE FROM product_specs WHERE product_id = $1`, [productId])
      for (let sIdx = 0; sIdx < p.specs.length; sIdx++) {
        const spec = p.specs[sIdx]
        await query(
          `INSERT INTO product_specs (id, product_id, label_ar, value_ar, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), productId, spec.label, spec.value, sIdx]
        )
      }
    }

    // Aliases
    if (p.aliases && p.aliases.length > 0) {
      for (const alias of p.aliases) {
        const existAlias = await query(
          `SELECT id FROM product_aliases WHERE product_id = $1 AND alias_term = $2`,
          [productId, alias]
        )
        if (existAlias.rows.length === 0) {
          await query(
            `INSERT INTO product_aliases (id, product_id, alias_term)
             VALUES ($1, $2, $3)`,
            [randomUUID(), productId, alias]
          )
        }
      }
    }

    // Variants
    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        const variantSku = `VAR-${v.id}`
        const stockQty = v.stock === 'متوفر' ? 15 : v.stock === 'كمية محدودة' ? 3 : 0
        const stockStatus = v.stock === 'متوفر' ? 'in_stock' : v.stock === 'كمية محدودة' ? 'limited_stock' : 'out_of_stock'
        const existingVar = await query(`SELECT id FROM product_variants WHERE variant_sku = $1`, [variantSku])

        if (existingVar.rows.length === 0) {
          await query(
            `INSERT INTO product_variants (
              id, product_id, variant_sku, part_number, label_ar, price, old_price, stock_quantity, stock_status, extra_specs
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              randomUUID(),
              productId,
              variantSku,
              v.partNumber || p.partNumber,
              v.label,
              v.price || p.price,
              v.oldPrice || p.oldPrice || null,
              stockQty,
              stockStatus,
              JSON.stringify(v.extraSpecs || []),
            ]
          )
        }
      }
    } else {
      // Default Variant
      const defaultVarSku = `VAR-DEF-${p.id}`
      const stockQty = p.stock === 'متوفر' ? 20 : p.stock === 'كمية محدودة' ? 3 : 0
      const stockStatus = p.stock === 'متوفر' ? 'in_stock' : p.stock === 'كمية محدودة' ? 'limited_stock' : 'out_of_stock'
      const existingVar = await query(`SELECT id FROM product_variants WHERE variant_sku = $1`, [defaultVarSku])

      if (existingVar.rows.length === 0) {
        await query(
          `INSERT INTO product_variants (
            id, product_id, variant_sku, part_number, label_ar, price, old_price, stock_quantity, stock_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            randomUUID(),
            productId,
            defaultVarSku,
            p.partNumber,
            p.name,
            p.price,
            p.oldPrice || null,
            stockQty,
            stockStatus,
          ]
        )
      }
    }
  }

  // 6. Landing Offers
  console.log(`🎯 Seeding ${OFFERS.length} Marketing Offers...`)
  for (const o of OFFERS) {
    const dbProdId = productDbMap.get(o.productId)
    if (!dbProdId) continue

    const existingOffer = await query(`SELECT id FROM landing_offers WHERE slug = $1`, [o.slug])
    let offerId = existingOffer.rows[0]?.id

    if (!offerId) {
      offerId = randomUUID()
      await query(
        `INSERT INTO landing_offers (
          id, slug, product_id, title_ar, subtitle_ar, title_fr,
          badge_text, urgency_text, delivery_note, custom_price, custom_old_price, hero_image_url, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)`,
        [
          offerId,
          o.slug,
          dbProdId,
          o.title,
          o.subtitle,
          o.nameFr,
          o.badge || null,
          o.urgencyText || null,
          o.deliveryNote || null,
          o.price,
          o.oldPrice || null,
          o.image,
        ]
      )
    }

    if (o.features && o.features.length > 0) {
      await query(`DELETE FROM offer_features WHERE offer_id = $1`, [offerId])
      for (let fIdx = 0; fIdx < o.features.length; fIdx++) {
        const f = o.features[fIdx]
        await query(
          `INSERT INTO offer_features (id, offer_id, icon_name, text_ar, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), offerId, f.icon, f.text, fIdx]
        )
      }
    }
  }

  const { ensureAdminAccounts } = await import('./ensureAdmins.js')
  await ensureAdminAccounts()

  // 8. Marketing Campaigns
  console.log('📈 Seeding Marketing Campaigns & Tracking...')
  const defaultCampaigns = [
    {
      id: randomUUID(),
      name: 'Radiateur Peugeot 208 — Facebook Ads',
      platform: 'facebook',
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'rad-peugeot-summer',
      budget: 45000,
    },
    {
      id: randomUUID(),
      name: 'Phare Clio 4 — Instagram Influencers',
      platform: 'instagram',
      utm_source: 'instagram',
      utm_medium: 'reels',
      utm_campaign: 'phare-clio4-promo',
      budget: 28000,
    },
    {
      id: randomUUID(),
      name: 'Brake Pads & Discs — TikTok Ads',
      platform: 'tiktok',
      utm_source: 'tiktok',
      utm_medium: 'video',
      utm_campaign: 'brembo-tiktok-surge',
      budget: 35000,
    },
    {
      id: randomUUID(),
      name: 'Auto Parts Search — Google Ads',
      platform: 'google',
      utm_source: 'google',
      utm_medium: 'search',
      utm_campaign: 'kas-google-brand',
      budget: 50000,
    },
  ]

  for (const c of defaultCampaigns) {
    const existing = await query(`SELECT id FROM marketing_campaigns WHERE name = $1`, [c.name])
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO marketing_campaigns (id, name, platform, utm_source, utm_medium, utm_campaign, budget)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [c.id, c.name, c.platform, c.utm_source, c.utm_medium, c.utm_campaign, c.budget]
      )
    }
  }

  // 9. Initial System Settings
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
    { key: 'facebook_pixel_id', value: 'FB-9847120938', cat: 'tracking' },
    { key: 'tiktok_pixel_id', value: 'TT-7489230192', cat: 'tracking' },
    { key: 'google_analytics_id', value: 'G-KAS9847291', cat: 'tracking' },
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

  // 10. Sample Notifications
  console.log('🔔 Seeding Initial Admin Notifications...')
  const initialNotifs = [
    {
      id: randomUUID(),
      title: 'طلب جديد #KAS-849201',
      message: 'طلب جديد من ولاية وهران بقيمة 16,500 دج بانتظار التأكيد',
      type: 'order',
      link: '/admin/orders',
    },
    {
      id: randomUUID(),
      title: 'تنبيه مخزون منخفض: مشعاع رينو كليو 4',
      message: 'المخزون الحالي 2 قطع فقط، يرجى إعادة الطلب من المورّد',
      type: 'stock',
      link: '/admin/inventory',
    },
    {
      id: randomUUID(),
      title: 'حملة تيك توك تحقق 18 طلباً اليوم',
      message: 'معدل التحويل لحملة تيك توك ارتفع بنسبة +4.2%',
      type: 'marketing',
      link: '/admin/marketing',
    },
  ]

  for (const n of initialNotifs) {
    const existing = await query(`SELECT id FROM notifications WHERE title = $1`, [n.title])
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO notifications (id, title, message, type, link)
         VALUES ($1, $2, $3, $4, $5)`,
        [n.id, n.title, n.message, n.type, n.link]
      )
    }
  }

  console.log('✨ All seed data successfully loaded into database!')
}

// Auto-run if executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => {
      console.log('🚀 Database setup & seed complete!')
      process.exit(0)
    })
    .catch((err) => {
      console.error('❌ Database seed error:', err)
      process.exit(1)
    })
}

