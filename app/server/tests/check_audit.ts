import { query } from '../db/db.js'

async function check() {
  const tableCheck = await query("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'")
  console.log('Table audit_logs exists?', tableCheck.rows)
  const count = await query("SELECT COUNT(id) AS count FROM audit_logs")
  console.log('audit_logs count:', count.rows)
  const rows = await query("SELECT * FROM audit_logs LIMIT 5")
  console.log('audit_logs sample:', rows.rows)

  // Also check inventory transactions
  const tx = await query("SELECT * FROM inventory_transactions LIMIT 5")
  console.log('inventory_transactions sample:', tx.rows)
}

check()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
