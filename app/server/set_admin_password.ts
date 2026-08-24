import Database from 'better-sqlite3'
import path from 'node:path'
import { hashPassword } from './lib/password.js'

const newPassword = process.argv[2] || 'admin123'
const username = process.argv[3] || 'admin'

const dbPath = path.resolve(process.cwd(), 'server', 'data', 'kas_autoparts.sqlite')
const db = new Database(dbPath)

const passwordHash = hashPassword(newPassword)

// Ensure admin user exists or update password
const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(username) as { id: string } | undefined

if (existing) {
  db.prepare(`
    UPDATE admin_users 
    SET password_hash = ?, is_active = 1, role = 'super_admin' 
    WHERE username = ?
  `).run(passwordHash, username)
  console.log(`\n✅ Successfully updated admin account!`)
} else {
  const { randomUUID } = await import('node:crypto')
  db.prepare(`
    INSERT INTO admin_users (id, name, username, email, password_hash, role, is_active)
    VALUES (?, ?, ?, ?, ?, 'super_admin', 1)
  `).run(randomUUID(), 'KAS Administrator', username, `${username}@kas.dz`, passwordHash)
  console.log(`\n✅ Successfully created admin account!`)
}

console.log(`===========================================`)
console.log(`🔑 Username: ${username}`)
console.log(`🔑 Password: ${newPassword}`)
console.log(`===========================================\n`)
