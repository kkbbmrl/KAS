import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query } from '../db/db.js'
import { contactRateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// POST /api/v1/contact
router.post('/', contactRateLimiter, async (req, res) => {
  try {
    const { name, phone, message, msg, email } = req.body
    const rawBody = message || msg

    if (!name || !String(name).trim() || !rawBody || !String(rawBody).trim()) {
      return res.status(400).json({ error: 'الاسم ونص الرسالة مطلوبان' })
    }

    const cleanName = String(name).trim().slice(0, 100)
    const cleanBody = String(rawBody).trim().slice(0, 2000)
    const cleanPhone = phone ? String(phone).trim().slice(0, 30) : ''
    const cleanEmail = email ? String(email).trim().slice(0, 100) : null

    const id = randomUUID()
    await query(
      `INSERT INTO contact_messages (id, sender_name, sender_phone, sender_email, message_body, status)
       VALUES ($1, $2, $3, $4, $5, 'unread')`,
      [id, cleanName, cleanPhone, cleanEmail, cleanBody]
    )

    res.json({
      success: true,
      id,
      message: 'تم استلام رسالتك بنجاح وسيتواصل معك فريقنا في أقرب وقت.',
    })
  } catch (err: any) {
    console.error('Error saving contact message:', err)
    res.status(500).json({ error: 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً' })
  }
})

export default router

