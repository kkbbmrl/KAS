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

// GET /api/v1/admin/marketing/landing-pages
router.get('/landing-pages', async (_req, res) => {
  try {
    const result = await query(
      `SELECT 
        l.id, l.slug, l.product_id AS "productId", l.title_ar AS title, l.subtitle_ar AS subtitle,
        l.title_fr AS "nameFr", l.badge_text AS badge, l.urgency_text AS "urgencyText",
        l.delivery_note AS "deliveryNote", l.custom_price AS price, l.custom_old_price AS "oldPrice",
        l.hero_image_url AS image, (l.is_active = 1 OR l.is_active = TRUE) AS "isActive",
        p.name_ar AS "productName", p.base_part_number AS "partNumber",
        (SELECT COUNT(*) FROM orders o WHERE o.offer_id = l.id) AS "ordersCount"
       FROM landing_offers l
       JOIN products p ON p.id = l.product_id
       ORDER BY l.created_at DESC`
    )
    res.json(result.rows)
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch landing pages' })
  }
})

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
      features = [],
    } = req.body

    if (!slug || !productId || !titleAr || !customPrice) {
      return res.status(400).json({ error: 'يرجى ملء الحقول الإلزامية لصفحة الهبوط' })
    }

    const offerId = randomUUID()
    await query(
      `INSERT INTO landing_offers (
        id, slug, product_id, title_ar, subtitle_ar, title_fr,
        badge_text, urgency_text, delivery_note, custom_price, custom_old_price, hero_image_url, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)`,
      [offerId, slug, productId, titleAr, subtitleAr || '', titleFr || '', badgeText || null, urgencyText || null, deliveryNote || null, customPrice, customOldPrice || null, heroImageUrl || '']
    )

    if (Array.isArray(features)) {
      for (let idx = 0; idx < features.length; idx++) {
        const f = features[idx]
        await query(
          `INSERT INTO offer_features (id, offer_id, icon_name, text_ar, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), offerId, f.icon || 'ShieldCheck', f.text, idx]
        )
      }
    }

    res.status(201).json({ success: true, id: offerId, message: 'تم إنشاء صفحة الهبوط الإعلانية بنجاح' })
  } catch (err: any) {
    console.error('Error creating landing page:', err)
    res.status(500).json({ error: 'Failed to create landing page' })
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
