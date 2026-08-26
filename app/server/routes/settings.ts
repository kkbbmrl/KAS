import { Router } from 'express'
import { query } from '../db/db.js'

const router = Router()

/**
 * GET /api/v1/settings
 * Public endpoint to fetch active store settings (phone, email, address, pixels, SEO, etc.)
 */
router.get('/', async (_req, res) => {
  try {
    const result = await query(`SELECT setting_key AS "key", setting_value AS "value" FROM system_settings`)
    const settingsMap: Record<string, string> = {}
    for (const r of result.rows) {
      settingsMap[r.key] = r.value
    }
    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=30')
    res.json(settingsMap)
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch public store settings' })
  }
})

export default router
