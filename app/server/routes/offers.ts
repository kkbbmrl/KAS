import { Router } from 'express'
import { query } from '../db/db.js'

const router = Router()

// GET /api/v1/offers
router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `SELECT 
        o.id, o.slug, o.product_id AS "productId", o.title_ar AS title, o.subtitle_ar AS subtitle,
        o.title_fr AS "nameFr", o.badge_text AS badge, o.urgency_text AS "urgencyText",
        o.delivery_note AS "deliveryNote", o.custom_price AS price, o.custom_old_price AS "oldPrice",
        o.hero_image_url AS image, p.base_part_number AS "partNumber", b.name AS brand
       FROM landing_offers o
       JOIN products p ON p.id = o.product_id
       JOIN brands b ON b.id = p.brand_id
       WHERE (o.is_active = 1 OR o.is_active = TRUE)`
    )

    const offers = await Promise.all(
      result.rows.map(async (offer: any) => {
        const features = await query(
          `SELECT icon_name AS icon, text_ar AS text
           FROM offer_features
           WHERE offer_id = $1
           ORDER BY display_order ASC`,
          [offer.id]
        )
        return {
          ...offer,
          stock: 'متوفر',
          features: features.rows,
        }
      })
    )

    res.json(offers)
  } catch (err: any) {
    console.error('Error fetching offers:', err)
    res.status(500).json({ error: 'Failed to fetch offers' })
  }
})

// GET /api/v1/offers/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const result = await query(
      `SELECT 
        o.id, o.slug, o.product_id AS "productId", o.title_ar AS title, o.subtitle_ar AS subtitle,
        o.title_fr AS "nameFr", o.badge_text AS badge, o.urgency_text AS "urgencyText",
        o.delivery_note AS "deliveryNote", o.custom_price AS price, o.custom_old_price AS "oldPrice",
        o.hero_image_url AS image, p.base_part_number AS "partNumber", b.name AS brand
       FROM landing_offers o
       JOIN products p ON p.id = o.product_id
       JOIN brands b ON b.id = p.brand_id
       WHERE o.slug = $1 AND (o.is_active = 1 OR o.is_active = TRUE)`,
      [slug]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found' })
    }

    const offer = result.rows[0]
    const features = await query(
      `SELECT icon_name AS icon, text_ar AS text
       FROM offer_features
       WHERE offer_id = $1
       ORDER BY display_order ASC`,
      [offer.id]
    )

    res.json({
      ...offer,
      stock: 'متوفر',
      features: features.rows,
    })
  } catch (err: any) {
    console.error('Error fetching offer by slug:', err)
    res.status(500).json({ error: 'Failed to fetch offer' })
  }
})

export default router
