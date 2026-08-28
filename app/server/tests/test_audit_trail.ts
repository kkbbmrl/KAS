import { query } from '../db/db.js'
import { initDatabase } from '../db/init.js'
import { logAuditAction } from '../lib/audit.js'

async function runAuditTests() {
  console.log('🧪 Starting Audit Trail Verification Tests...')
  
  await initDatabase()

  // 1. Check table existence
  const countRes = await query(`SELECT COUNT(*) AS count FROM audit_logs`)
  const initialCount = Number(countRes.rows[0]?.count || 0)
  console.log(`✅ audit_logs table verified with ${initialCount} records`)

  // 2. Test logging an admin action
  await logAuditAction({
    tableName: 'admin_sessions',
    recordId: 'test-admin-id',
    actionType: 'LOGIN',
    newData: { username: 'admin', role: 'super_admin' },
    performedBy: 'Test Admin',
    ipAddress: '127.0.0.1',
  })
  console.log('✅ Logged LOGIN action')

  // 3. Test logging an inventory adjust action
  await logAuditAction({
    tableName: 'product_variants',
    recordId: 'test-variant-id',
    actionType: 'ADJUST',
    oldData: { stockQuantity: 10 },
    newData: { qty: 25, delta: 15, reason: 'توريد دفعة جديدة' },
    performedBy: 'مسؤول المخزون',
    ipAddress: '192.168.1.50',
  })
  console.log('✅ Logged ADJUST action')

  // 4. Test logging an order status change
  await logAuditAction({
    tableName: 'orders',
    recordId: 'test-order-id',
    actionType: 'STATUS_CHANGE',
    oldData: { status: 'pending_confirmation' },
    newData: { status: 'confirmed', orderRef: 'CMD-TEST-123' },
    performedBy: 'مسؤول المبيعات',
  })
  console.log('✅ Logged STATUS_CHANGE action')

  // 5. Test reading logs back from DB
  const recentLogs = await query(
    `SELECT id, table_name AS "tableName", action_type AS "actionType", performed_by AS "performedBy", new_data AS "newData", created_at AS "createdAt"
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT 5`
  )
  console.log(`✅ Successfully queried ${recentLogs.rows.length} recent audit logs:`)
  recentLogs.rows.forEach((r: any, idx: number) => {
    console.log(`   [${idx + 1}] [${r.actionType}] on ${r.tableName} by ${r.performedBy}`)
  })

  console.log('\n🎉 ALL AUDIT TRAIL VERIFICATIONS PASSED!')
}

runAuditTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Audit Trail Test Failed:', err)
    process.exit(1)
  })
