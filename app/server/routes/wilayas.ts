import { Router } from 'express'
import { query } from '../db/db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `SELECT code, name_ar AS "nameAr", name_fr AS "nameFr", delivery_time_text AS "deliveryTime", shipping_fee AS "shippingFee"
       FROM algeria_wilayas
       WHERE is_active = 1 OR is_active = TRUE
       ORDER BY code ASC`
    )
    res.json(result.rows)
  } catch (err: any) {
    console.error('Error fetching wilayas:', err)
    res.status(500).json({ error: 'Failed to fetch wilayas' })
  }
})

export default router
