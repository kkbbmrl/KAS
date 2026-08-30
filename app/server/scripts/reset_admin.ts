import { query } from '../db/db.js'
import { initDatabase } from '../db/init.js'
import { hashPassword } from '../lib/password.js'
import { randomUUID } from 'node:crypto'

async function resetAdmin() {
  await initDatabase()

  const newUsername = 'admin'
  const newEmail = 'admin@kas.dz'
  const newPassword = 'adminpassword123'
  const hashedPassword = hashPassword(newPassword)

  // Check if admin exists
  const existing = await query(
    `SELECT id, username, email FROM admin_users WHERE LOWER(username) = $1 OR LOWER(email) = $2`,
    [newUsername, newEmail]
  )

  if (existing.rows.length > 0) {
    const adminId = existing.rows[0].id
    await query(
      `UPDATE admin_users 
       SET username = $1, email = $2, password_hash = $3, role = 'super_admin', is_active = 1 
       WHERE id = $4`,
      [newUsername, newEmail, hashedPassword, adminId]
    )
    console.log('\n============================================================')
    console.log('✅ Admin credentials successfully reset in database:')
    console.log(`   Username : ${newUsername}`)
    console.log(`   Email    : ${newEmail}`)
    console.log(`   Password : ${newPassword}`)
    console.log('============================================================\n')
  } else {
    const adminId = randomUUID()
    await query(
      `INSERT INTO admin_users (id, name, username, email, password_hash, role, is_active)
       VALUES ($1, 'KAS Administrator', $2, $3, $4, 'super_admin', 1)`,
      [adminId, newUsername, newEmail, hashedPassword]
    )
    console.log('\n============================================================')
    console.log('✅ Created fresh Super Admin account in database:')
    console.log(`   Username : ${newUsername}`)
    console.log(`   Email    : ${newEmail}`)
    console.log(`   Password : ${newPassword}`)
    console.log('============================================================\n')
  }

  // Also print all admin accounts in DB
  const allAdmins = await query(`SELECT id, username, email, role, is_active FROM admin_users`)
  console.log('All Active Admins in DB:', allAdmins.rows)
}

resetAdmin().catch((err) => {
  console.error('Error resetting admin:', err)
  process.exit(1)
})
