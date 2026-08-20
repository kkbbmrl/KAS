import { randomUUID } from 'node:crypto'
import { query } from './db.js'
import { hashPassword } from '../lib/password.js'

const MASTER_ADMIN = {
  username: (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim(),
  name: process.env.ADMIN_NAME || 'KAS Super Admin',
  email: (process.env.ADMIN_EMAIL || 'admin@kas.dz').toLowerCase().trim(),
  password: process.env.ADMIN_PASSWORD || 'KasAdmin2026!',
  role: 'super_admin',
}

export async function ensureAdminAccounts() {
  const cleanUsername = MASTER_ADMIN.username
  const cleanEmail = MASTER_ADMIN.email
  const hashedPassword = hashPassword(MASTER_ADMIN.password)

  // Remove any legacy demo accounts
  const demoUsernames = ['khaled', 'manager', 'orders', 'inventory', 'marketing']
  for (const demoUser of demoUsernames) {
    if (demoUser !== cleanUsername) {
      await query(`DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM admin_users WHERE LOWER(username) = $1)`, [demoUser])
      await query(`DELETE FROM admin_users WHERE LOWER(username) = $1`, [demoUser])
    }
  }

  const byUsername = await query(`SELECT id FROM admin_users WHERE LOWER(username) = $1`, [cleanUsername])
  if (byUsername.rows.length > 0) {
    await query(
      `UPDATE admin_users SET name = $1, role = $2, password_hash = $3, is_active = 1 WHERE id = $4`,
      [MASTER_ADMIN.name, MASTER_ADMIN.role, hashedPassword, byUsername.rows[0].id]
    )
    return
  }

  const byEmail = await query(`SELECT id FROM admin_users WHERE LOWER(email) = $1`, [cleanEmail])
  if (byEmail.rows.length > 0) {
    await query(
      `UPDATE admin_users SET name = $1, username = $2, role = $3, password_hash = $4, is_active = 1 WHERE id = $5`,
      [MASTER_ADMIN.name, cleanUsername, MASTER_ADMIN.role, hashedPassword, byEmail.rows[0].id]
    )
    return
  }

  await query(
    `INSERT INTO admin_users (id, name, username, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, 1)`,
    [randomUUID(), MASTER_ADMIN.name, cleanUsername, cleanEmail, hashedPassword, MASTER_ADMIN.role]
  )
}
