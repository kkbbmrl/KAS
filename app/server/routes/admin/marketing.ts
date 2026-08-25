import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query } from '../../db/db.js'

const router = Router()

// GET /api/v1/admin/marketing/campaigns
router.get('/campaigns', async (_req, res) => {
  try {
    const result = await query(
      `SELECT 
        c.id, c.name, c.platform, c.utm_source AS "utmSource", c.utm_medium AS "utmMedium",
        c.utm_campaign AS "utmCampaign", c.budget, (c.is_active = 1 OR c.is_active = TRUE) AS "isActive",
        c.created_at AS "createdAt",
        (SELECT COUNT(*) FROM campaign_visits v WHERE v.campaign_id = c.id OR (c.utm_source IS NOT NULL AND v.utm_source = c.utm_source)) AS visits,
        (SELECT COUNT(*) FROM orders o WHERE (o.order_source = c.platform OR o.order_source = 'landing_offer')) AS orders,
        (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE (o.order_source = c.platform OR o.order_source = 'landing_offer')) AS revenue
       FROM marketing_campaigns c
       ORDER BY c.created_at DESC`
    )

    const campaigns = result.rows.map((c: any) => {
      const visits = Number(c.visits || 0)
      const orders = Number(c.orders || 0)
      const revenue = Number(c.revenue || 0)
      const cr = visits > 0 ? Number(((orders / visits) * 100).toFixed(1)) : 0
      const aov = orders > 0 ? Math.round(revenue / orders) : 0

      return {
        ...c,
        visits,
        orders,
        revenue,
        conversionRate: cr,
        aov,
      }
    })

    res.json(campaigns)
  } catch (err: any) {
    console.error('Error fetching marketing campaigns:', err)
    res.status(500).json({ error: 'Failed to fetch campaigns' })
  }
})

// POST /api/v1/admin/marketing/campaigns
router.post('/campaigns', async (req, res) => {
  try {
    const { name, platform = 'facebook', utmSource, utmMedium, utmCampaign, budget = 0 } = req.body
    if (!name) return res.status(400).json({ error: 'اسم الحملة مطلوب' })

    const id = randomUUID()
    await query(
      `INSERT INTO marketing_campaigns (id, name, platform, utm_source, utm_medium, utm_campaign, budget)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name, platform, utmSource || platform, utmMedium || 'cpc', utmCampaign || name.toLowerCase().replace(/\s+/g, '-'), budget]
    )

    res.status(201).json({ success: true, id, message: 'تم إنشاء الحملة بنجاح' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create campaign' })
  }
})

async function ensureMarketingColumns() {
  try {
    await query(`ALTER TABLE landing_offers ADD COLUMN IF NOT EXISTS theme_id TEXT DEFAULT 'oem-factory'`)
    await query(`ALTER TABLE landing_offers ADD COLUMN IF NOT EXISTS fb_pixel_id TEXT`)
    await query(`ALTER TABLE landing_offers ADD COLUMN IF NOT EXISTS tiktok_pixel_id TEXT`)
    await query(`ALTER TABLE landing_offers ADD COLUMN IF NOT EXISTS google_tag_id TEXT`)
    await query(`ALTER TABLE landing_offers ADD COLUMN IF NOT EXISTS snap_pixel_id TEXT`)
  } catch (e) {
    // Ignore if not supported / already added
  }
}
ensureMarketingColumns()

// GET /api/v1/admin/marketing/landing-pages
router.get('/landing-pages', async (_req, res) => {
  try {
    const result = await query(
      `SELECT 
        l.id, l.slug, l.product_id AS "productId", l.title_ar AS title, l.title_ar AS "titleAr",
        l.subtitle_ar AS subtitle, l.subtitle_ar AS "subtitleAr",
        l.title_fr AS "nameFr", l.badge_text AS badge, l.badge_text AS "badgeText",
        l.urgency_text AS "urgencyText", l.delivery_note AS "deliveryNote",
        l.custom_price AS price, l.custom_price AS "customPrice",
        l.custom_old_price AS "oldPrice", l.custom_old_price AS "customOldPrice",
        l.hero_image_url AS image, l.hero_image_url AS "heroImageUrl",
        COALESCE(l.theme_id, 'oem-factory') AS "themeId", COALESCE(l.theme_id, 'oem-factory') AS theme,
        l.fb_pixel_id AS "fbPixelId", l.tiktok_pixel_id AS "tiktokPixelId",
        l.google_tag_id AS "googleTagId", l.snap_pixel_id AS "snapPixelId",
        (l.is_active = 1 OR l.is_active = TRUE) AS "isActive",
        l.created_at AS "createdAt",
        p.name_ar AS "productName", p.base_part_number AS "partNumber", b.name AS brand,
        (SELECT COUNT(*) FROM orders o WHERE o.offer_id = l.id OR o.offer_id = l.slug) AS "ordersCount",
        (SELECT COUNT(*) FROM campaign_visits v WHERE v.landing_slug = l.slug) AS "viewsCount"
       FROM landing_offers l
       JOIN products p ON p.id = l.product_id
       LEFT JOIN brands b ON b.id = p.brand_id
       ORDER BY l.created_at DESC`
    )

    const landingPages = await Promise.all(
      result.rows.map(async (row: any) => {
        const featRes = await query(
          `SELECT icon_name AS icon, text_ar AS text FROM offer_features WHERE offer_id = $1 ORDER BY display_order ASC`,
          [row.id]
        )
        const orders = Number(row.ordersCount || 0)
        const views = Number(row.viewsCount || 0)
        const conversionRate = views > 0 ? Number(((orders / views) * 100).toFixed(1)) : 0

        return {
          ...row,
          conversionRate,
          features: featRes.rows,
        }
      })
    )

    res.json(landingPages)
  } catch (err: any) {
    console.error('Error fetching landing pages:', err)
    res.status(500).json({ error: 'Failed to fetch landing pages' })
  }
})

// GET /api/v1/admin/marketing/landing-pages/:id
router.get('/landing-pages/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query(
      `SELECT 
        l.id, l.slug, l.product_id AS "productId", l.title_ar AS "titleAr", l.subtitle_ar AS "subtitleAr",
        l.title_fr AS "titleFr", l.badge_text AS "badgeText", l.urgency_text AS "urgencyText",
        l.delivery_note AS "deliveryNote", l.custom_price AS "customPrice", l.custom_old_price AS "customOldPrice",
        l.hero_image_url AS "heroImageUrl",
        COALESCE(l.theme_id, 'oem-factory') AS "themeId", COALESCE(l.theme_id, 'oem-factory') AS theme,
        l.fb_pixel_id AS "fbPixelId", l.tiktok_pixel_id AS "tiktokPixelId",
        l.google_tag_id AS "googleTagId", l.snap_pixel_id AS "snapPixelId",
        (l.is_active = 1 OR l.is_active = TRUE) AS "isActive",
        p.name_ar AS "productName", p.base_part_number AS "partNumber", b.name AS brand
       FROM landing_offers l
       JOIN products p ON p.id = l.product_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE l.id = $1 OR l.slug = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Landing page not found' })
    }

    const offer = result.rows[0]
    const featRes = await query(
      `SELECT icon_name AS icon, text_ar AS text FROM offer_features WHERE offer_id = $1 ORDER BY display_order ASC`,
      [offer.id]
    )

    res.json({
      ...offer,
      features: featRes.rows,
    })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch landing page details' })
  }
})

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let clean = String(baseSlug || 'offer')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-|-$)/g, '') || `offer-${Date.now().toString().slice(-5)}`

  let candidate = clean
  let counter = 1

  while (true) {
    let check
    if (excludeId) {
      check = await query(`SELECT id FROM landing_offers WHERE slug = $1 AND id != $2`, [candidate, excludeId])
    } else {
      check = await query(`SELECT id FROM landing_offers WHERE slug = $1`, [candidate])
    }

    if (check.rows.length === 0) {
      return candidate
    }

    counter++
    candidate = `${clean}-${counter}`
  }
}

// POST /api/v1/admin/marketing/landing-pages
router.post('/landing-pages', async (req, res) => {
  try {
    const {
      slug,
      productId,
      titleAr,
      subtitleAr,
      titleFr,
      badgeText,
      urgencyText,
      deliveryNote,
      customPrice,
      customOldPrice,
      heroImageUrl,
      themeId,
      theme,
      fbPixelId,
      tiktokPixelId,
      googleTagId,
      snapPixelId,
      features = [],
    } = req.body

    if (!productId || !titleAr || !customPrice) {
      return res.status(400).json({ error: 'يرجى ملء الحقول الإلزامية لصفحة الهبوط (المنتج، العنوان، والسعر)' })
    }

    const cleanSlug = await ensureUniqueSlug(slug || titleAr || 'offer')
    const offerId = randomUUID()
    const chosenTheme = themeId || theme || 'oem-factory'

    try {
      await query(
        `INSERT INTO landing_offers (
          id, slug, product_id, title_ar, subtitle_ar, title_fr,
          badge_text, urgency_text, delivery_note, custom_price, custom_old_price, hero_image_url,
          theme_id, fb_pixel_id, tiktok_pixel_id, google_tag_id, snap_pixel_id, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 1)`,
        [
          offerId,
          cleanSlug,
          productId,
          titleAr,
          subtitleAr || '',
          titleFr || '',
          badgeText || 'أصلي ومضمون 100%',
          urgencyText || 'الكمية محدودة — اطلب الآن!',
          deliveryNote || 'توصيل سريع لـ 58 ولاية — الدفع بعد المعاينة',
          Number(customPrice),
          customOldPrice ? Number(customOldPrice) : null,
          heroImageUrl || '',
          chosenTheme,
          fbPixelId || null,
          tiktokPixelId || null,
          googleTagId || null,
          snapPixelId || null,
        ]
      )
    } catch (insertErr) {
      // Fallback if optional columns not yet added
      await query(
        `INSERT INTO landing_offers (
          id, slug, product_id, title_ar, subtitle_ar, title_fr,
          badge_text, urgency_text, delivery_note, custom_price, custom_old_price, hero_image_url, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)`,
        [
          offerId,
          cleanSlug,
          productId,
          titleAr,
          subtitleAr || '',
          titleFr || '',
          badgeText || 'أصلي ومضمون 100%',
          urgencyText || 'الكمية محدودة — اطلب الآن!',
          deliveryNote || 'توصيل سريع لـ 58 ولاية — الدفع بعد المعاينة',
          Number(customPrice),
          customOldPrice ? Number(customOldPrice) : null,
          heroImageUrl || '',
        ]
      )
    }

    if (Array.isArray(features)) {
      for (let idx = 0; idx < features.length; idx++) {
        const f = features[idx]
        if (f && f.text) {
          await query(
            `INSERT INTO offer_features (id, offer_id, icon_name, text_ar, display_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [randomUUID(), offerId, f.icon || 'ShieldCheck', f.text, idx]
          )
        }
      }
    }

    res.status(201).json({ success: true, id: offerId, slug: cleanSlug, message: 'تم إنشاء صفحة الهبوط الإعلانية بنجاح' })
  } catch (err: any) {
    console.error('Error creating landing page:', err)
    res.status(500).json({ error: err.message || 'فشل إنشاء صفحة الهبوط' })
  }
})

// PUT /api/v1/admin/marketing/landing-pages/:id
router.put('/landing-pages/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      slug,
      productId,
      titleAr,
      subtitleAr,
      titleFr,
      badgeText,
      urgencyText,
      deliveryNote,
      customPrice,
      customOldPrice,
      heroImageUrl,
      themeId,
      theme,
      fbPixelId,
      tiktokPixelId,
      googleTagId,
      snapPixelId,
      features = [],
    } = req.body

    const cleanSlug = await ensureUniqueSlug(slug || titleAr || 'offer', id)
    const chosenTheme = themeId || theme || 'oem-factory'

    try {
      await query(
        `UPDATE landing_offers SET
          slug = $1, product_id = $2, title_ar = $3, subtitle_ar = $4, title_fr = $5,
          badge_text = $6, urgency_text = $7, delivery_note = $8, custom_price = $9,
          custom_old_price = $10, hero_image_url = $11, theme_id = $12,
          fb_pixel_id = $13, tiktok_pixel_id = $14, google_tag_id = $15, snap_pixel_id = $16,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $17`,
        [
          cleanSlug,
          productId,
          titleAr,
          subtitleAr || '',
          titleFr || '',
          badgeText || null,
          urgencyText || null,
          deliveryNote || null,
          Number(customPrice),
          customOldPrice ? Number(customOldPrice) : null,
          heroImageUrl || '',
          chosenTheme,
          fbPixelId || null,
          tiktokPixelId || null,
          googleTagId || null,
          snapPixelId || null,
          id,
        ]
      )
    } catch (updateErr) {
      // Fallback
      await query(
        `UPDATE landing_offers SET
          slug = $1, product_id = $2, title_ar = $3, subtitle_ar = $4, title_fr = $5,
          badge_text = $6, urgency_text = $7, delivery_note = $8, custom_price = $9,
          custom_old_price = $10, hero_image_url = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12`,
        [
          cleanSlug,
          productId,
          titleAr,
          subtitleAr || '',
          titleFr || '',
          badgeText || null,
          urgencyText || null,
          deliveryNote || null,
          Number(customPrice),
          customOldPrice ? Number(customOldPrice) : null,
          heroImageUrl || '',
          id,
        ]
      )
    }

    // Re-sync features
    await query(`DELETE FROM offer_features WHERE offer_id = $1`, [id])
    if (Array.isArray(features)) {
      for (let idx = 0; idx < features.length; idx++) {
        const f = features[idx]
        if (f && f.text) {
          await query(
            `INSERT INTO offer_features (id, offer_id, icon_name, text_ar, display_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [randomUUID(), id, f.icon || 'ShieldCheck', f.text, idx]
          )
        }
      }
    }

    res.json({ success: true, slug: cleanSlug, message: 'تم تحديث صفحة الهبوط بنجاح' })
  } catch (err: any) {
    console.error('Error updating landing page:', err)
    res.status(500).json({ error: err.message || 'فشل تحديث صفحة الهبوط' })
  }
})

// DELETE /api/v1/admin/marketing/landing-pages/:id
router.delete('/landing-pages/:id', async (req, res) => {
  try {
    const { id } = req.params
    await query(`DELETE FROM offer_features WHERE offer_id = $1`, [id])
    await query(`DELETE FROM landing_offers WHERE id = $1`, [id])
    res.json({ success: true, message: 'تم حذف صفحة الهبوط بنجاح' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete landing page' })
  }
})

// POST /api/v1/admin/marketing/landing-pages/:id/duplicate
router.post('/landing-pages/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params
    const orig = await query(`SELECT * FROM landing_offers WHERE id = $1`, [id])
    if (orig.rows.length === 0) {
      return res.status(404).json({ error: 'Original offer not found' })
    }

    const row = orig.rows[0]
    const newId = randomUUID()
    const newSlug = await ensureUniqueSlug(`${row.slug}-copy`)

    await query(
      `INSERT INTO landing_offers (
        id, slug, product_id, title_ar, subtitle_ar, title_fr,
        badge_text, urgency_text, delivery_note, custom_price, custom_old_price, hero_image_url, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)`,
      [
        newId,
        newSlug,
        row.product_id,
        `${row.title_ar} (نسخة جديدة)`,
        row.subtitle_ar,
        row.title_fr,
        row.badge_text,
        row.urgency_text,
        row.delivery_note,
        row.custom_price,
        row.custom_old_price,
        row.hero_image_url,
      ]
    )

    const features = await query(`SELECT icon_name, text_ar, text_fr, display_order FROM offer_features WHERE offer_id = $1`, [id])
    for (const f of features.rows) {
      await query(
        `INSERT INTO offer_features (id, offer_id, icon_name, text_ar, text_fr, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), newId, f.icon_name, f.text_ar, f.text_fr, f.display_order]
      )
    }

    res.status(201).json({ success: true, id: newId, slug: newSlug, message: 'تم تكرار صفحة الهبوط كنسخة جديدة' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to duplicate landing page' })
  }
})

// PUT /api/v1/admin/marketing/landing-pages/:id/toggle
router.put('/landing-pages/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params
    const cur = await query(`SELECT is_active FROM landing_offers WHERE id = $1`, [id])
    const newStatus = cur.rows[0]?.is_active ? 0 : 1
    await query(`UPDATE landing_offers SET is_active = $1 WHERE id = $2`, [newStatus, id])
    res.json({ success: true, isActive: Boolean(newStatus), message: 'تم تحديث حالة الصفحة' })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle landing page' })
  }
})

export default router

