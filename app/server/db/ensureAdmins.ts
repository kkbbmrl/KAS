import { randomUUID, randomBytes } from 'node:crypto'
import { query } from './db.js'
import { hashPassword } from '../lib/password.js'

export async function ensureAdminAccounts() {
  const cleanUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim()
  const cleanEmail = (process.env.ADMIN_EMAIL || 'admin@kas.dz').toLowerCase().trim()
  const adminName = process.env.ADMIN_NAME || 'KAS Administrator'
  const envPassword = process.env.ADMIN_PASSWORD ? String(process.env.ADMIN_PASSWORD).trim() : null

  // Remove any legacy demo accounts
  const demoUsernames = ['khaled', 'manager', 'orders', 'inventory', 'marketing']
  for (const demoUser of demoUsernames) {
    if (demoUser !== cleanUsername) {
      await query(`DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM admin_users WHERE LOWER(username) = $1)`, [demoUser])
      await query(`DELETE FROM admin_users WHERE LOWER(username) = $1`, [demoUser])
    }
  }

  // Check if admin already exists
  const existing = await query(
    `SELECT id, username, email, password_hash FROM admin_users WHERE LOWER(username) = $1 OR LOWER(email) = $2`,
    [cleanUsername, cleanEmail]
  )

  if (existing.rows.length > 0) {
    const adminUser = existing.rows[0]
    // If an explicit ADMIN_PASSWORD is provided in private .env, sync the hash
    if (envPassword) {
      const hashedPassword = hashPassword(envPassword)
      await query(
        `UPDATE admin_users SET name = $1, username = $2, email = $3, role = 'super_admin', password_hash = $4, is_active = 1 WHERE id = $5`,
        [adminName, cleanUsername, cleanEmail, hashedPassword, adminUser.id]
      )
    }
    return
  }

  // If no admin exists at all in the DB, create one:
  let finalPassword = envPassword
  let isGenerated = false

  if (!finalPassword) {
    // Generate a secure random password if none was configured in .env
    finalPassword = randomBytes(10).toString('hex')
    isGenerated = true
  }

  const hashedPassword = hashPassword(finalPassword)
  await query(
    `INSERT INTO admin_users (id, name, username, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5, 'super_admin', 1)`,
    [randomUUID(), adminName, cleanUsername, cleanEmail, hashedPassword]
  )

  if (isGenerated) {
    console.log(`\n======================================================`)
    console.log(`🔒 [SECURITY NOTICE] Master Super Admin initialized:`)
    console.log(`   Username: ${cleanUsername}`)
    console.log(`   One-Time Password: ${finalPassword}`)
    console.log(`   (Set ADMIN_PASSWORD in your private .env file to customize)`)
    console.log(`======================================================\n`)
  }
}
