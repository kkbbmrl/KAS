import { query } from '../db/db.js'
import { hashPassword } from '../lib/password.js'
import { randomUUID } from 'node:crypto'

async function testInventoryRole() {
  console.log('🧪 Starting Inventory Manager Role Verification Tests...')

  const baseUrl = 'http://localhost:5000/api/v1/admin'
  const testUsername = 'test_inv_manager'
  const testPassword = 'InvSecretPassword2026!#'
  const testEmail = 'inv_test@kas.dz'

  try {
    // 1. Cleanup any previous test user
    await query(`DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM admin_users WHERE username = $1)`, [testUsername])
    await query(`DELETE FROM admin_users WHERE username = $1`, [testUsername])

    // 2. Create test admin with 'inventory_manager' role
    const userId = randomUUID()
    await query(
      `INSERT INTO admin_users (id, name, username, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, 'inventory_manager', 1)`,
      [userId, 'Inventory Manager Test', testUsername, testEmail, hashPassword(testPassword)]
    )
    console.log('✅ Created test inventory_manager user in database')

    // 3. Authenticate with the user
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUsername, password: testPassword }),
    })
    const loginData = await loginRes.json()
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginData)}`)
    }
    const token = loginData.token
    console.log(`✅ Logged in successfully as inventory_manager (Role: ${loginData.user?.role})`)

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    // 4. Verify /auth/me returns the correct role
    const meRes = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders })
    const meData = await meRes.json()
    if (meRes.status !== 200 || meData.user?.role !== 'inventory_manager') {
      throw new Error(`GET /auth/me failed: ${JSON.stringify(meData)}`)
    }
    console.log('✅ /auth/me correctly identifies inventory_manager')

    // 5. Test ALLOWED endpoints: Inventory listing, adjust, and ledger
    const invRes = await fetch(`${baseUrl}/inventory?limit=5`, { headers: authHeaders })
    if (invRes.status !== 200) {
      throw new Error(`GET /inventory should be allowed (200), got status ${invRes.status}`)
    }
    const invData = await invRes.json()
    console.log(`✅ GET /inventory allowed (found ${invData.items?.length || 0} items)`)

    if (invData.items && invData.items.length > 0) {
      const targetVariant = invData.items[0]
      const currentQty = targetVariant.stockQuantity
      const newQty = currentQty + 1

      const adjustRes = await fetch(`${baseUrl}/inventory/adjust`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          variantId: targetVariant.variantId,
          newQuantity: newQty,
          reason: 'Test Inventory Manager Adjust Verification',
        }),
      })
      if (adjustRes.status !== 200) {
        throw new Error(`POST /inventory/adjust should be allowed (200), got ${adjustRes.status}`)
      }
      console.log('✅ POST /inventory/adjust allowed and executed successfully')

      // Revert adjustment
      await fetch(`${baseUrl}/inventory/adjust`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          variantId: targetVariant.variantId,
          newQuantity: currentQty,
          reason: 'Revert test adjust',
        }),
      })
    }

    const txRes = await fetch(`${baseUrl}/inventory/transactions`, { headers: authHeaders })
    if (txRes.status !== 200) {
      throw new Error(`GET /inventory/transactions should be allowed (200), got ${txRes.status}`)
    }
    console.log('✅ GET /inventory/transactions allowed')

    // 6. Test RESTRICTED endpoints: MUST return 403 Forbidden
    const restrictedEndpoints = [
      { path: '/analytics/overview', method: 'GET', name: 'Analytics Dashboard' },
      { path: '/orders', method: 'GET', name: 'Orders' },
      { path: '/products', method: 'GET', name: 'Products Catalogue' },
      { path: '/categories', method: 'GET', name: 'Categories' },
      { path: '/customers', method: 'GET', name: 'CRM Customers' },
      { path: '/marketing', method: 'GET', name: 'Marketing & UTM' },
      { path: '/activity', method: 'GET', name: 'Audit Activity Logs' },
      { path: '/users', method: 'GET', name: 'Team Users Management' },
      { path: '/settings', method: 'GET', name: 'System Settings' },
    ]

    for (const ep of restrictedEndpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: authHeaders,
      })
      if (res.status !== 403) {
        throw new Error(`Endpoint ${ep.name} (${ep.path}) should return 403 for inventory_manager, got ${res.status}`)
      }
      console.log(`🔒 Endpoint ${ep.name} (${ep.path}) correctly blocked with 403 Forbidden`)
    }

    console.log('\n🎉 ALL INVENTORY MANAGER ROLE TESTS PASSED SUCCESSFULLY!')
  } finally {
    // Cleanup test user
    await query(`DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM admin_users WHERE username = $1)`, [testUsername])
    await query(`DELETE FROM admin_users WHERE username = $1`, [testUsername])
    console.log('🧹 Cleaned up test user and sessions')
  }
}

testInventoryRole().catch((err) => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
