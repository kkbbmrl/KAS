import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query } from '../db/db.js'

const router = Router()

// POST /api/v1/contact
router.post('/', async (req, res) => {
  try {
    const { name, phone, message, msg, email } = req.body
    const body = message || msg

    if (!name || !name.trim() || !body || !body.trim()) {
      return res.status(400).json({ error: 'الاسم ونص الرسالة مطلوبان' })
    }

    const id = randomUUID()
    await query(
      `INSERT INTO contact_messages (id, sender_name, sender_phone, sender_email, message_body, status)
       VALUES ($1, $2, $3, $4, $5, 'unread')`,
      [id, name.trim(), phone || '', email || null, body.trim()]
    )

    res.json({
      success: true,
      id,
      message: 'تم استلام رسالتك بنجاح وسيتواصل معك فريقنا في أقرب وقت.',
    })
  } catch (err: any) {
    console.error('Error saving contact message:', err)
    res.status(500).json({ error: 'Failed to submit contact message' })
  }
})

export default router
