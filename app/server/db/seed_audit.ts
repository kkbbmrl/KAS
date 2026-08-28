import { query } from '../db/db.js'

export async function seedInitialAuditLogs() {
  console.log('🔄 Checking and populating initial audit logs...')

  // 1. Audit logs from orders
  const orders = await query(`
    SELECT id, order_reference, customer_first_name, customer_last_name, total_amount, status, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 30
  `)

  for (const o of orders.rows) {
    const customerName = `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim() || 'العميل'
    await query(
      `INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by, ip_address, created_at)
       VALUES ('orders', $1, 'CREATE', NULL, $2, $3, '127.0.0.1', $4)`,
      [
        o.id,
        JSON.stringify({ orderRef: o.order_reference, total: o.total_amount, status: o.status, customer: customerName }),
        customerName,
        o.created_at,
      ]
    )

    if (o.status && o.status !== 'pending_confirmation') {
      await query(
        `INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by, ip_address, created_at)
         VALUES ('orders', $1, 'STATUS_CHANGE', $2, $3, 'مسؤول المبيعات', '127.0.0.1', $4)`,
        [
          o.id,
          JSON.stringify({ status: 'pending_confirmation' }),
          JSON.stringify({ status: o.status, orderRef: o.order_reference }),
          o.created_at,
        ]
      )
    }
  }

  // 2. Audit logs from inventory transactions
  const invTxs = await query(`
    SELECT id, variant_id, delta_type, quantity_delta, quantity_after, reason, created_by, created_at
    FROM inventory_transactions
    ORDER BY created_at DESC
    LIMIT 20
  `)

  for (const tx of invTxs.rows) {
    await query(
      `INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by, ip_address, created_at)
       VALUES ('product_variants', $1, 'ADJUST', NULL, $2, $3, '127.0.0.1', $4)`,
      [
        tx.variant_id,
        JSON.stringify({ qty: tx.quantity_after, delta: tx.quantity_delta, reason: tx.reason }),
        tx.created_by || 'مسؤول المستودع',
        tx.created_at,
      ]
    )
  }

  // 3. Audit log for settings update
  await query(
    `INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by, ip_address, created_at)
     VALUES ('system_settings', '1', 'UPDATE', NULL, $1, 'KAS Administrator', '127.0.0.1', CURRENT_TIMESTAMP)`,
    [JSON.stringify({ storeName: 'Khaled Auto Parts', phone: '0550 72 96 01' })]
  )

  // 4. Audit log for admin login
  const admins = await query(`SELECT id, name, username, last_login_at FROM admin_users`)
  for (const a of admins.rows) {
    await query(
      `INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by, ip_address, created_at)
       VALUES ('admin_sessions', $1, 'LOGIN', NULL, $2, $3, '127.0.0.1', $4)`,
      [
        a.id,
        JSON.stringify({ username: a.username, role: 'super_admin' }),
        a.name || a.username,
        a.last_login_at || new Date().toISOString(),
      ]
    )
  }

  console.log('✅ Initial audit logs populated successfully!')
}

if (process.argv[1]?.endsWith('seed_audit.ts')) {
  seedInitialAuditLogs()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
