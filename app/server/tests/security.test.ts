import http from 'node:http'
import { app } from '../index.js'
import { query } from '../db/db.js'
import { hashPassword } from '../lib/password.js'
import { randomUUID } from 'node:crypto'

let server: http.Server
let port: number
let baseUrl: string

interface TestResult {
  name: string
  passed: boolean
  error?: string
  durationMs: number
}

const results: TestResult[] = []

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now()
  try {
    await fn()
    const duration = Date.now() - start
    results.push({ name, passed: true, durationMs: duration })
    console.log(`  ✅ PASS: ${name} (${duration}ms)`)
  } catch (err: any) {
    const duration = Date.now() - start
    results.push({ name, passed: false, error: err.message || String(err), durationMs: duration })
    console.error(`  ❌ FAIL: ${name} (${duration}ms)`)
    console.error(`     Error: ${err.message || err}`)
  }
}

let ipCounter = 100

async function request(path: string, options: { method?: string; headers?: Record<string, string>; body?: any; ip?: string } = {}) {
  const url = `${baseUrl}${path}`
  const clientIp = options.ip || `10.200.50.${ipCounter++}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Forwarded-For': clientIp,
    ...(options.headers || {}),
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  let json: any = null
  try {
    json = await res.json()
  } catch {
    json = null
  }

  return { status: res.status, headers: res.headers, body: json }
}

async function runAllSecurityTests() {
  console.log('\n======================================================')
  console.log('🛡️  KAS AUTOMATED SECURITY REGRESSION TEST SUITE')
  console.log('======================================================\n')

  // Setup ephemeral test server on random free port
  await new Promise<void>((resolve) => {
    server = http.createServer(app)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any
      port = addr.port
      baseUrl = `http://127.0.0.1:${port}`
      console.log(`🌐 Test server listening on ${baseUrl}\n`)
      resolve()
    })
  })

  try {
    // 1. BACKDOOR ELIMINATION TEST
    await runTest('1. Authentication: Hardcoded Master Password Backdoor Elimination', async () => {
      // Ensure a known test admin with unique password exists
      const testAdminUser = 'sectest_admin'
      const realPassword = 'RealSecretPassword_2026!#'
      const hashed = hashPassword(realPassword)

      await query(`DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM admin_users WHERE username = $1)`, [testAdminUser])
      await query(`DELETE FROM admin_users WHERE username = $1`, [testAdminUser])
      await query(
        `INSERT INTO admin_users (id, name, username, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5, 'super_admin', 1)`,
        [randomUUID(), 'Security Test Admin', testAdminUser, `${testAdminUser}@kas.dz`, hashed]
      )

      // Test 1a: Attempting login with the old backdoors ('adminpassword123', 'admin', 'admin123456') MUST FAIL
      const backdoorPasswords = ['adminpassword123', 'admin', 'admin123456']
      for (const pass of backdoorPasswords) {
        const res = await request('/api/v1/admin/auth/login', {
          method: 'POST',
          body: { username: testAdminUser, password: pass },
        })
        if (res.status === 200) {
          throw new Error(`Backdoor password '${pass}' successfully logged in! Vulnerability STILL PRESENT.`)
        }
        if (res.status !== 401 && res.status !== 429) {
          throw new Error(`Expected 401 or 429 for wrong backdoor password, got status ${res.status}`)
        }
      }

      // Test 1b: Correct password succeeds
      const goodRes = await request('/api/v1/admin/auth/login', {
        method: 'POST',
        body: { username: testAdminUser, password: realPassword },
      })
      if (goodRes.status !== 200 || !goodRes.body?.token) {
        throw new Error(`Legitimate login failed with status ${goodRes.status}: ${JSON.stringify(goodRes.body)}`)
      }
    })

    // 2. BUSINESS LOGIC & PRICE TAMPERING DEFENSE TEST
    await runTest('2. Business Logic: Client-Side Price Tampering Defense in Order Placement', async () => {
      // Find an existing variant to test against
      const varRes = await query(
        `SELECT v.id AS "variantId", v.price, v.product_id AS "productId"
         FROM product_variants v
         WHERE v.price > 100
         LIMIT 1`
      )
      if (varRes.rows.length === 0) throw new Error('No product variants available in database for test')

      const variant = varRes.rows[0]
      const actualDbPrice = Number(variant.price)

      // Malicious payload: Attacker claims unit price is 1 DZD instead of actual DB price
      const manipulatedPrice = 1
      const orderPayload = {
        source: 'cart_checkout',
        firstName: 'Security',
        lastName: 'Tester',
        phone: '0555998877',
        wilayaCode: '16',
        commune: 'Alger Centre',
        address: '123 Security Blvd',
        items: [
          {
            variantId: variant.variantId,
            productId: variant.productId,
            name: 'Tampered Part',
            price: manipulatedPrice, // TAMPERED VALUE
            quantity: 2,
          },
        ],
      }

      const res = await request('/api/v1/orders', {
        method: 'POST',
        body: orderPayload,
      })

      if (res.status !== 201 || !res.body?.orderId) {
        throw new Error(`Order placement failed with status ${res.status}: ${JSON.stringify(res.body)}`)
      }

      const returnedSubtotal = Number(res.body.subtotal)
      const expectedSubtotal = actualDbPrice * 2

      if (returnedSubtotal === manipulatedPrice * 2) {
        throw new Error(`Price tampering SUCCEEDED! Server accepted manipulated price (${returnedSubtotal} DZD instead of ${expectedSubtotal} DZD).`)
      }

      if (returnedSubtotal !== expectedSubtotal) {
        throw new Error(`Expected server to compute subtotal ${expectedSubtotal} DZD, but got ${returnedSubtotal} DZD.`)
      }
    })

    // 3. IDOR & PII PRIVACY TEST IN ORDER TRACKING
    await runTest('3. Privacy & IDOR: Customer PII Masking in Public Order Tracking', async () => {
      // Find a valid variant
      const varRes = await query(`SELECT id AS "variantId", product_id AS "productId" FROM product_variants LIMIT 1`)
      if (varRes.rows.length === 0) throw new Error('No variants available for tracking test')
      const testVar = varRes.rows[0]

      // Create an order with sensitive information
      const secretPhone = '0661234567'
      const secretName = 'SensitiveCustomer'
      const secretAddress = 'Secret Villa #42 Hidden Street'

      const orderPayload = {
        source: 'cart_checkout',
        firstName: secretName,
        lastName: 'Confidential',
        phone: secretPhone,
        wilayaCode: '31',
        commune: 'Oran',
        address: secretAddress,
        items: [{ variantId: testVar.variantId, productId: testVar.productId, qty: 1 }],
      }

      const createRes = await request('/api/v1/orders', {
        method: 'POST',
        body: orderPayload,
      })

      if (createRes.status !== 201 || !createRes.body?.orderReference) {
        throw new Error(`Could not create test order for tracking PII test: status ${createRes.status} body: ${JSON.stringify(createRes.body)}`)
      }

      const ref = createRes.body.orderReference

      // Public lookup via tracking endpoint
      const trackRes = await request(`/api/v1/orders/${ref}`)
      if (trackRes.status !== 200) {
        throw new Error(`Order tracking returned status ${trackRes.status}`)
      }

      const trackData = trackRes.body

      // Verify PII is masked
      if (trackData.phone === secretPhone) {
        throw new Error(`Customer phone number leaked in plaintext (${trackData.phone})!`)
      }
      if (!trackData.phone.includes('*')) {
        throw new Error(`Customer phone number not masked: ${trackData.phone}`)
      }
      if (trackData.address) {
        throw new Error(`Customer street address leaked in public tracking response: ${trackData.address}`)
      }
    })

    // 4. MALICIOUS FILE UPLOAD DEFENSE TEST
    await runTest('4. File Upload: Rejection of Executables, HTML, SVG, and Fake MIME Types', async () => {
      // Login as admin first
      const testAdminUser = 'sectest_admin'
      const realPassword = 'RealSecretPassword_2026!#'
      const authRes = await request('/api/v1/admin/auth/login', {
        method: 'POST',
        body: { username: testAdminUser, password: realPassword },
      })
      const token = authRes.body?.token
      if (!token) throw new Error('Could not authenticate for upload test')

      const authHeaders = { Authorization: `Bearer ${token}` }

      // 4a. Malicious HTML / Stored XSS payload
      const htmlPayload = {
        image: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      }
      const htmlRes = await request('/api/v1/admin/upload', {
        method: 'POST',
        headers: authHeaders,
        body: htmlPayload,
      })
      if (htmlRes.status === 201) {
        throw new Error('Server accepted text/html upload! Stored XSS vulnerability detected.')
      }

      // 4b. Fake JPEG with text content (Invalid Magic Bytes)
      const fakeJpegPayload = {
        image: 'data:image/jpeg;base64,VGhpcyBpcyBub3QgYSByZWFsIEpQRUcgaW1hZ2U=', // "This is not a real JPEG image"
      }
      const fakeRes = await request('/api/v1/admin/upload', {
        method: 'POST',
        headers: authHeaders,
        body: fakeJpegPayload,
      })
      if (fakeRes.status === 201) {
        throw new Error('Server accepted image with invalid magic bytes!')
      }

      // 4c. Valid 1x1 PNG image with real magic bytes
      const validPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const validRes = await request('/api/v1/admin/upload', {
        method: 'POST',
        headers: authHeaders,
        body: { image: validPngBase64 },
      })
      if (validRes.status !== 201 || !validRes.body?.url) {
        throw new Error(`Valid PNG upload was rejected! Status ${validRes.status}: ${JSON.stringify(validRes.body)}`)
      }
    })

    // 5. RBAC & UNAUTHORIZED ACCESS PROTECTION TEST
    await runTest('5. Authorization: Rejection of Unauthenticated Requests to Admin Endpoints', async () => {
      const endpoints = [
        { path: '/api/v1/admin/orders', method: 'GET' },
        { path: '/api/v1/admin/analytics/overview', method: 'GET' },
        { path: '/api/v1/admin/products', method: 'GET' },
        { path: '/api/v1/admin/inventory', method: 'GET' },
        { path: '/api/v1/admin/customers', method: 'GET' },
        { path: '/api/v1/admin/users', method: 'GET' },
      ]

      for (const ep of endpoints) {
        // Without token
        const resNoToken = await request(ep.path, { method: ep.method })
        if (resNoToken.status !== 401) {
          throw new Error(`Endpoint ${ep.path} allowed unauthenticated access with status ${resNoToken.status}`)
        }

        // With invalid token
        const resInvalidToken = await request(ep.path, {
          method: ep.method,
          headers: { Authorization: 'Bearer forged_or_invalid_session_token_12345' },
        })
        if (resInvalidToken.status !== 401) {
          throw new Error(`Endpoint ${ep.path} accepted invalid token with status ${resInvalidToken.status}`)
        }
      }
    })

    // 6. PUBLIC MUTATING ROUTE REMOVAL TEST
    await runTest('6. Attack Surface: Removal of Unauthenticated /sync-compat Route', async () => {
      const res = await request('/api/v1/sync-compat')
      if (res.status !== 404) {
        throw new Error(`Public /sync-compat route still reachable with status ${res.status}! Expected 404.`)
      }
    })

    // 7. SQL INJECTION & PARAMETER POLLUTION RESILIENCE TEST
    await runTest('7. Injection: Parameterized Query Defense Against SQL Injection Payloads', async () => {
      const sqlPayloads = [
        `' OR '1'='1`,
        `1; DROP TABLE products; --`,
        `' UNION SELECT null, username, password_hash FROM admin_users --`,
      ]

      for (const payload of sqlPayloads) {
        const res = await request(`/api/v1/products?q=${encodeURIComponent(payload)}`)
        if (res.status === 500) {
          throw new Error(`SQL payload caused 500 Internal Server Error: ${payload}`)
        }
        if (res.status !== 200) {
          throw new Error(`Unexpected status ${res.status} for query: ${payload}`)
        }
      }
    })

    // 8. SECURITY HEADERS VERIFICATION TEST
    await runTest('8. Production Configuration: Security Headers Enforcement', async () => {
      const res = await request('/healthz')
      const headers = res.headers

      const xContentType = headers.get('x-content-type-options')
      const xFrame = headers.get('x-frame-options')
      const csp = headers.get('content-security-policy')
      const xPoweredBy = headers.get('x-powered-by')

      if (xContentType !== 'nosniff') {
        throw new Error(`Missing or incorrect X-Content-Type-Options header: ${xContentType}`)
      }
      if (xFrame !== 'SAMEORIGIN') {
        throw new Error(`Missing or incorrect X-Frame-Options header: ${xFrame}`)
      }
      if (!csp || !csp.includes("default-src 'self'")) {
        throw new Error(`Missing or invalid Content-Security-Policy header: ${csp}`)
      }
    })

    // 9. SESSION REVOCATION TEST
    await runTest('9. Session Security: Invalidation of Active Sessions on Password Change & Deactivation', async () => {
      const userToRevoke = 'sectest_revoke'
      const initialPass = 'InitialPassword123!#'
      const newPass = 'UpdatedPassword456!#'
      const hashed = hashPassword(initialPass)
      const testUserId = randomUUID()

      await query(`DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM admin_users WHERE username = $1)`, [userToRevoke])
      await query(`DELETE FROM admin_users WHERE username = $1`, [userToRevoke])
      await query(
        `INSERT INTO admin_users (id, name, username, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5, 'admin', 1)`,
        [testUserId, 'Revoke Test Admin', userToRevoke, `${userToRevoke}@kas.dz`, hashed]
      )

      // Login to obtain active session token
      const authRes = await request('/api/v1/admin/auth/login', {
        method: 'POST',
        body: { username: userToRevoke, password: initialPass },
      })
      const initialToken = authRes.body?.token
      if (!initialToken) throw new Error('Failed to obtain token for session revocation test')

      // Verify token works on protected endpoint
      const checkRes1 = await request('/api/v1/admin/orders', {
        headers: { Authorization: `Bearer ${initialToken}` },
      })
      if (checkRes1.status !== 200) throw new Error('Initial session token failed to access orders endpoint')

      // Create super admin and active session
      const superUserId = randomUUID()
      const superToken = `super_test_token_${randomUUID()}`
      const superExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      await query(
        `INSERT INTO admin_users (id, name, username, email, password_hash, role, is_active)
         VALUES ($1, 'Super Admin Tester', 'sectest_super', 'super@kas.dz', $2, 'super_admin', 1)`,
        [superUserId, hashPassword('SuperSecret123!')]
      )
      await query(
        `INSERT INTO admin_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
        [superToken, superUserId, superExpiry]
      )

      const updateRes = await request(`/api/v1/admin/users/${testUserId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${superToken}` },
        body: { password: newPass },
      })
      if (updateRes.status !== 200) throw new Error(`Super admin failed to update user password: ${JSON.stringify(updateRes.body)}`)

      // Old session token MUST now be rejected with 401
      const checkRes2 = await request('/api/v1/admin/orders', {
        headers: { Authorization: `Bearer ${initialToken}` },
      })
      if (checkRes2.status !== 401) {
        throw new Error(`Old session token remained valid after password change! (Status ${checkRes2.status})`)
      }

      // Cleanup
      await query(`DELETE FROM admin_sessions WHERE user_id IN ($1, $2)`, [testUserId, superUserId])
      await query(`DELETE FROM admin_users WHERE id IN ($1, $2)`, [testUserId, superUserId])
    })

    // 10. RATE LIMITING BURST & LOCKOUT VERIFICATION TEST
    await runTest('10. Abuse Prevention: Rate Limiter Burst Protection & Retry-After Headers', async () => {
      // Rapidly fire orders from single IP
      let got429 = false
      for (let i = 0; i < 15; i++) {
        const res = await request('/api/v1/contact', {
          method: 'POST',
          ip: '10.99.99.1',
          body: { name: 'RateTester', phone: '0555000000', message: 'Test rate limit message' },
        })
        if (res.status === 429) {
          got429 = true
          const retryAfter = res.headers.get('retry-after')
          if (!retryAfter) {
            throw new Error('429 response missing Retry-After header')
          }
          break
        }
      }
      if (!got429) {
        throw new Error('Rapid requests failed to trigger HTTP 429 Rate Limiter!')
      }
    })

    // 11. INVENTORY STOCK BOUNDARY & RECONNAISSANCE PROTECTION TEST
    await runTest('11. Data Integrity: Rejection of Over-Ordering & Stock Count Masking', async () => {
      // Find a variant with known stock
      const varRes = await query(`SELECT id, stock_quantity, product_id FROM product_variants WHERE stock_quantity > 0 LIMIT 1`)
      if (varRes.rows.length === 0) throw new Error('No variants found for stock boundary test')

      const variant = varRes.rows[0]
      const currentStock = Number(variant.stock_quantity)

      // 11a: Attempt to order more than current stock (currentStock + 50)
      const overStockQty = currentStock + 50
      const overRes = await request('/api/v1/orders', {
        method: 'POST',
        body: {
          source: 'cart_checkout',
          firstName: 'Stock',
          lastName: 'Tester',
          phone: '0551122334',
          wilayaCode: '16',
          address: 'Stock Street 123',
          items: [{ variantId: variant.id, productId: variant.product_id, qty: overStockQty }],
        },
      })

      if (overRes.status === 201) {
        throw new Error(`Server accepted order of ${overStockQty} items when stock is only ${currentStock}!`)
      }
      if (overRes.status !== 400) {
        throw new Error(`Expected HTTP 400 for over-stock order, got ${overRes.status}: ${JSON.stringify(overRes.body)}`)
      }

      // Security check: Must NOT leak exact internal warehouse count (e.g., "3 remaining") to client
      if (overRes.body?.error && overRes.body.error.includes(String(currentStock))) {
        throw new Error(`Information Leakage: Order error leaked exact internal stock quantity (${currentStock}) in response message!`)
      }

      // 11b: Public catalog endpoints must NOT leak numeric stockQuantity
      const catRes = await request('/api/v1/products')
      if (catRes.status === 200 && Array.isArray(catRes.body) && catRes.body.length > 0) {
        if ('stockQuantity' in catRes.body[0]) {
          throw new Error('Information Leakage: GET /api/v1/products leaks numeric stockQuantity to public clients!')
        }
      }

      // 11c: Split items attack (sending two items for same variant that together exceed stock)
      const halfQty = Math.ceil(currentStock / 2) + 2
      const splitRes = await request('/api/v1/orders', {
        method: 'POST',
        body: {
          source: 'cart_checkout',
          firstName: 'Split',
          lastName: 'Tester',
          phone: '0551122334',
          wilayaCode: '16',
          address: 'Stock Street 123',
          items: [
            { variantId: variant.id, productId: variant.product_id, qty: halfQty },
            { variantId: variant.id, productId: variant.product_id, qty: halfQty },
          ],
        },
      })

      if (splitRes.status === 201) {
        throw new Error(`Split item attack succeeded: Order accepted ${halfQty * 2} items when stock is only ${currentStock}!`)
      }
      if (splitRes.status !== 400 && splitRes.status !== 409) {
        throw new Error(`Expected 400/409 for split item over-ordering, got ${splitRes.status}: ${JSON.stringify(splitRes.body)}`)
      }
    })

    // 12. ATOMIC STOCK DECREMENT & ZERO BOUNDARY TEST
    await runTest('12. Data Integrity: Accurate Decrement (10 - 3 = 7) & Zero-Stock Transition (7 - 7 = 0)', async () => {
      // Create isolated test product & variant with exactly 10 stock
      const pId = randomUUID()
      const vId = randomUUID()
      const sku = `SKU-DEC-${randomUUID().slice(0, 8)}`
      await query(
        `INSERT INTO products (id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, description_ar, is_active)
         VALUES ($1, $2, 'PART-DEC', 'قطعة اختبار الجرد', 'Piece Test Dec', (SELECT id FROM categories LIMIT 1), (SELECT id FROM brands LIMIT 1), 'Desc', 1)`,
        [pId, sku]
      )
      await query(
        `INSERT INTO product_variants (id, product_id, variant_sku, part_number, label_ar, label_fr, price, stock_quantity, stock_status, is_active)
         VALUES ($1, $2, $3, 'PART-DEC', 'فئة تجريبية', 'Var Test', 1500, 10, 'in_stock', 1)`,
        [vId, pId, `${sku}-VAR`]
      )

      // Buy 3 -> Expected 7
      const order1 = await request('/api/v1/orders', {
        method: 'POST',
        body: {
          firstName: 'Dec',
          lastName: 'Tester',
          phone: '0551122334',
          wilayaCode: '16',
          address: 'Test Street',
          items: [{ variantId: vId, productId: pId, qty: 3 }],
        },
      })
      if (order1.status !== 201) throw new Error(`Buy 3 failed: ${JSON.stringify(order1.body)}`)

      const s1 = await query(`SELECT stock_quantity, stock_status FROM product_variants WHERE id = $1`, [vId])
      if (Number(s1.rows[0].stock_quantity) !== 7) {
        throw new Error(`Expected 7 stock remaining after buying 3 from 10, found: ${s1.rows[0].stock_quantity}`)
      }

      // Buy 7 -> Expected 0 and status 'out_of_stock'
      const order2 = await request('/api/v1/orders', {
        method: 'POST',
        body: {
          firstName: 'Dec',
          lastName: 'Tester',
          phone: '0551122334',
          wilayaCode: '16',
          address: 'Test Street',
          items: [{ variantId: vId, productId: pId, qty: 7 }],
        },
      })
      if (order2.status !== 201) throw new Error(`Buy remaining 7 failed: ${JSON.stringify(order2.body)}`)

      const s2 = await query(`SELECT stock_quantity, stock_status FROM product_variants WHERE id = $1`, [vId])
      if (Number(s2.rows[0].stock_quantity) !== 0) {
        throw new Error(`Expected 0 stock remaining after buying remaining 7, found: ${s2.rows[0].stock_quantity}`)
      }
      if (s2.rows[0].stock_status !== 'out_of_stock') {
        throw new Error(`Expected stock_status 'out_of_stock' when quantity is 0, got: ${s2.rows[0].stock_status}`)
      }

      // Cleanup
      const order1Id = order1.body?.orderId
      const order2Id = order2.body?.orderId
      if (order1Id) await query(`DELETE FROM order_timeline WHERE order_id = $1`, [order1Id])
      if (order1Id) await query(`DELETE FROM inventory_transactions WHERE order_id = $1`, [order1Id])
      if (order1Id) await query(`DELETE FROM order_items WHERE order_id = $1`, [order1Id])
      if (order1Id) await query(`DELETE FROM orders WHERE id = $1`, [order1Id])

      if (order2Id) await query(`DELETE FROM order_timeline WHERE order_id = $1`, [order2Id])
      if (order2Id) await query(`DELETE FROM inventory_transactions WHERE order_id = $1`, [order2Id])
      if (order2Id) await query(`DELETE FROM order_items WHERE order_id = $1`, [order2Id])
      if (order2Id) await query(`DELETE FROM orders WHERE id = $1`, [order2Id])

      await query(`DELETE FROM inventory_transactions WHERE variant_id = $1`, [vId])
      await query(`DELETE FROM product_variants WHERE id = $1`, [vId])
      await query(`DELETE FROM products WHERE id = $1`, [pId])
    })

    // 13. STRICT QUANTITY VALIDATION (NEGATIVE, ZERO, OVERFLOW, NON-INTEGER)
    await runTest('13. Input Validation: Rejection of Negative (-1), Zero (0), Overflow (999999), and Decimal Quantities', async () => {
      const vRes = await query(`SELECT id, product_id FROM product_variants WHERE stock_quantity > 0 LIMIT 1`)
      const v = vRes.rows[0]

      const badQuantities = [-1, 0, 999999, 1.5, 'abc', null]
      for (const badQty of badQuantities) {
        const res = await request('/api/v1/orders', {
          method: 'POST',
          body: {
            firstName: 'Bad',
            lastName: 'Qty',
            phone: '0551122334',
            wilayaCode: '16',
            address: 'Test Address',
            items: [{ variantId: v.id, productId: v.product_id, qty: badQty }],
          },
        })

        if (res.status === 201) {
          throw new Error(`Server dangerously accepted invalid quantity (${badQty}) in order placement!`)
        }
        if (res.status !== 400 && res.status !== 409) {
          throw new Error(`Expected 400/409 for bad quantity ${badQty}, got ${res.status}`)
        }
      }
    })

    // 14. CLIENT PRICE & STOCK TAMPERING ISOLATION
    await runTest('14. Financial Integrity: Client-Supplied Fake Prices & Stock Counts are Ignored', async () => {
      const vRes = await query(`SELECT id, product_id, price FROM product_variants WHERE price > 1000 LIMIT 1`)
      const v = vRes.rows[0]
      const realPrice = Number(v.price)

      // Attacker attempts to buy with price = 1 DZD and fake stock = 99999
      const tamperRes = await request('/api/v1/orders', {
        method: 'POST',
        body: {
          firstName: 'Tamper',
          lastName: 'Tester',
          phone: '0551122334',
          wilayaCode: '16',
          address: 'Test Address',
          items: [{
            variantId: v.id,
            productId: v.product_id,
            qty: 1,
            price: 1,
            unitPrice: 1,
            stockQuantity: 99999,
            subtotal: 1,
            total: 1,
          }],
        },
      })

      if (tamperRes.status !== 201) throw new Error(`Order placement failed: ${JSON.stringify(tamperRes.body)}`)
      if (Number(tamperRes.body.subtotal) !== realPrice) {
        throw new Error(`Price Tampering succeeded: Server charged client price ${tamperRes.body.subtotal} instead of authoritative DB price ${realPrice}!`)
      }

      // Cleanup
      if (tamperRes.body?.orderId) {
        await query(`DELETE FROM order_timeline WHERE order_id = $1`, [tamperRes.body.orderId])
        await query(`DELETE FROM inventory_transactions WHERE order_id = $1`, [tamperRes.body.orderId])
        await query(`DELETE FROM order_items WHERE order_id = $1`, [tamperRes.body.orderId])
        await query(`DELETE FROM orders WHERE id = $1`, [tamperRes.body.orderId])
      }
    })

    // 15. MISMATCHED PRODUCT / VARIANT RELATIONSHIP VALIDATION
    await runTest('15. Relational Integrity: Rejection of Inactive Products & Mismatched Product/Variant IDs', async () => {
      const vRes = await query(`SELECT id, product_id FROM product_variants LIMIT 1`)
      if (vRes.rows.length === 0) return
      const v1 = vRes.rows[0]
      const fakeProductId = randomUUID()

      // Attempt to order variant 1 with completely different product ID
      const mismatchRes = await request('/api/v1/orders', {
        method: 'POST',
        body: {
          firstName: 'Mismatch',
          lastName: 'Tester',
          phone: '0551122334',
          wilayaCode: '16',
          address: 'Mismatch Street',
          items: [{ variantId: v1.id, productId: fakeProductId, qty: 1 }],
        },
      })

      if (mismatchRes.status === 201) {
        throw new Error('Server accepted order with mismatched productId and variantId!')
      }
      if (mismatchRes.status !== 400) {
        throw new Error(`Expected 400 for mismatched product/variant, got ${mismatchRes.status}`)
      }
    })

    // 16. ORDER IDEMPOTENCY PROTECTION
    await runTest('16. Concurrency & Replay: Idempotency-Key Prevents Duplicate Orders and Double Stock Deduction', async () => {
      const vRes = await query(`SELECT id, product_id, stock_quantity FROM product_variants WHERE stock_quantity > 5 LIMIT 1`)
      const v = vRes.rows[0]
      const stockBefore = Number(v.stock_quantity)
      const idempotencyKey = `idemp-test-${randomUUID()}`

      const payload = {
        firstName: 'Idemp',
        lastName: 'Tester',
        phone: '0551122334',
        wilayaCode: '16',
        address: 'Idempotency Ave',
        items: [{ variantId: v.id, productId: v.product_id, qty: 2 }],
      }

      // First submission
      const res1 = await request('/api/v1/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: payload,
      })
      if (res1.status !== 201) throw new Error(`First order failed: ${JSON.stringify(res1.body)}`)
      const order1Id = res1.body.orderId

      // Second submission (replayed request with same idempotency key)
      const res2 = await request('/api/v1/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: payload,
      })
      if (res2.status !== 200 && res2.status !== 201) {
        throw new Error(`Idempotent replayed request failed with status ${res2.status}`)
      }
      if (res2.body.orderId !== order1Id) {
        throw new Error(`Idempotency failure: Created new order (${res2.body.orderId}) instead of returning original (${order1Id})!`)
      }

      // Verify stock was decremented ONCE (by 2, not by 4)
      const stockCheck = await query(`SELECT stock_quantity FROM product_variants WHERE id = $1`, [v.id])
      const stockAfter = Number(stockCheck.rows[0].stock_quantity)
      if (stockAfter !== stockBefore - 2) {
        throw new Error(`Idempotency double-spending: Expected stock ${stockBefore - 2}, but found ${stockAfter}!`)
      }

      // Cleanup
      await query(`DELETE FROM order_timeline WHERE order_id = $1`, [order1Id])
      await query(`DELETE FROM inventory_transactions WHERE order_id = $1`, [order1Id])
      await query(`DELETE FROM order_items WHERE order_id = $1`, [order1Id])
      await query(`DELETE FROM orders WHERE id = $1`, [order1Id])
      await query(`UPDATE product_variants SET stock_quantity = $1 WHERE id = $2`, [stockBefore, v.id])
    })

    // 17. CONCURRENT RACE-CONDITION SIMULATION
    await runTest('17. Race-Condition Resilience: Concurrent Orders Competing for Last Stock Do Not Oversell', async () => {
      // Create test variant with exactly 2 stock
      const pId = randomUUID()
      const vId = randomUUID()
      const sku = `SKU-RACE-${randomUUID().slice(0, 8)}`
      await query(
        `INSERT INTO products (id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, description_ar, is_active)
         VALUES ($1, $2, 'PART-RACE', 'قطعة اختبار التسابق', 'Piece Race', (SELECT id FROM categories LIMIT 1), (SELECT id FROM brands LIMIT 1), 'Desc', 1)`,
        [pId, sku]
      )
      await query(
        `INSERT INTO product_variants (id, product_id, variant_sku, part_number, label_ar, label_fr, price, stock_quantity, stock_status, is_active)
         VALUES ($1, $2, $3, 'PART-RACE', 'فئة تسابق', 'Var Race', 1000, 2, 'in_stock', 1)`,
        [vId, pId, `${sku}-VAR`]
      )

      // Fire 5 simultaneous requests, each attempting to buy 2 units (Total requested = 10 units, available = 2)
      const promises = Array.from({ length: 5 }).map((_, idx) =>
        request('/api/v1/orders', {
          method: 'POST',
          body: {
            firstName: `Race${idx}`,
            lastName: 'Tester',
            phone: `055112233${idx}`,
            wilayaCode: '16',
            address: 'Race Street',
            items: [{ variantId: vId, productId: pId, qty: 2 }],
          },
        })
      )

      const results = await Promise.all(promises)
      const successful = results.filter((r) => r.status === 201)
      const rejected = results.filter((r) => r.status === 409 || r.status === 400)

      if (successful.length !== 1) {
        throw new Error(`Race condition oversell! Expected exactly 1 successful order, but got ${successful.length} successful orders!`)
      }
      if (rejected.length !== 4) {
        throw new Error(`Expected exactly 4 rejected orders under stock exhaustion, got ${rejected.length}`)
      }

      // Check final stock is exactly 0, NEVER negative
      const finalRes = await query(`SELECT stock_quantity FROM product_variants WHERE id = $1`, [vId])
      const finalStock = Number(finalRes.rows[0].stock_quantity)
      if (finalStock !== 0) {
        throw new Error(`Expected final stock to be exactly 0, found: ${finalStock}`)
      }

      // Cleanup
      for (const r of successful) {
        if (r.body?.orderId) {
          await query(`DELETE FROM order_timeline WHERE order_id = $1`, [r.body.orderId])
          await query(`DELETE FROM inventory_transactions WHERE order_id = $1`, [r.body.orderId])
          await query(`DELETE FROM order_items WHERE order_id = $1`, [r.body.orderId])
          await query(`DELETE FROM orders WHERE id = $1`, [r.body.orderId])
        }
      }
      await query(`DELETE FROM inventory_transactions WHERE variant_id = $1`, [vId])
      await query(`DELETE FROM product_variants WHERE id = $1`, [vId])
      await query(`DELETE FROM products WHERE id = $1`, [pId])
    })

    // 18. IDEMPOTENT ORDER CANCELLATION RESTOCKING
    await runTest('18. Order State Machine: Double Cancellation Restores Stock Exactly Once', async () => {
      // Login admin
      const loginRes = await request('/api/v1/admin/auth/login', {
        method: 'POST',
        body: { username: 'admin', password: 'adminpassword123' },
      })
      const adminToken = loginRes.body.token

      // Create test variant with 5 stock
      const pId = randomUUID()
      const vId = randomUUID()
      const sku = `SKU-CANCEL-${randomUUID().slice(0, 8)}`
      await query(
        `INSERT INTO products (id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, description_ar, is_active)
         VALUES ($1, $2, 'PART-CANCEL', 'قطعة اختبار الإلغاء', 'Piece Cancel', (SELECT id FROM categories LIMIT 1), (SELECT id FROM brands LIMIT 1), 'Desc', 1)`,
        [pId, sku]
      )
      await query(
        `INSERT INTO product_variants (id, product_id, variant_sku, part_number, label_ar, label_fr, price, stock_quantity, stock_status, is_active)
         VALUES ($1, $2, $3, 'PART-CANCEL', 'فئة إلغاء', 'Var Cancel', 2000, 5, 'in_stock', 1)`,
        [vId, pId, `${sku}-VAR`]
      )

      // Place order for 2 units (Stock becomes 3)
      const orderRes = await request('/api/v1/orders', {
        method: 'POST',
        body: {
          firstName: 'Cancel',
          lastName: 'Tester',
          phone: '0551122334',
          wilayaCode: '16',
          address: 'Cancel Street',
          items: [{ variantId: vId, productId: pId, qty: 2 }],
        },
      })
      const orderId = orderRes.body.orderId

      const afterOrderStock = await query(`SELECT stock_quantity FROM product_variants WHERE id = $1`, [vId])
      if (Number(afterOrderStock.rows[0].stock_quantity) !== 3) {
        throw new Error(`Expected 3 stock after ordering 2, got ${afterOrderStock.rows[0].stock_quantity}`)
      }

      // Cancel order 1st time (Stock should be restored to 5)
      const cancel1 = await request(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { status: 'cancelled', note: 'Customer cancelled' },
      })
      if (cancel1.status !== 200) throw new Error(`First cancellation failed: ${JSON.stringify(cancel1.body)}`)

      const stockAfterCancel1 = await query(`SELECT stock_quantity FROM product_variants WHERE id = $1`, [vId])
      if (Number(stockAfterCancel1.rows[0].stock_quantity) !== 5) {
        throw new Error(`Expected stock restored to 5, got ${stockAfterCancel1.rows[0].stock_quantity}`)
      }

      // Cancel order 2nd time (Duplicate cancellation MUST NOT add stock again!)
      const cancel2 = await request(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { status: 'cancelled', note: 'Duplicate cancel click' },
      })
      if (cancel2.status !== 200) throw new Error(`Second cancellation failed: ${JSON.stringify(cancel2.body)}`)

      const stockAfterCancel2 = await query(`SELECT stock_quantity FROM product_variants WHERE id = $1`, [vId])
      if (Number(stockAfterCancel2.rows[0].stock_quantity) !== 5) {
        throw new Error(`Ghost Stock Bug! Second cancellation increased stock to ${stockAfterCancel2.rows[0].stock_quantity} instead of staying 5!`)
      }

      // Cleanup
      await query(`DELETE FROM order_timeline WHERE order_id = $1`, [orderId])
      await query(`DELETE FROM inventory_transactions WHERE order_id = $1`, [orderId])
      await query(`DELETE FROM order_items WHERE order_id = $1`, [orderId])
      await query(`DELETE FROM orders WHERE id = $1`, [orderId])
      await query(`DELETE FROM product_variants WHERE id = $1`, [vId])
      await query(`DELETE FROM products WHERE id = $1`, [pId])
    })

    // 19. PROTECTED ADMIN INVENTORY API AUTHORIZATION
    await runTest('19. Admin Endpoint Security: Direct Unauthenticated Inventory Mutation Rejected (401/403)', async () => {
      const vRes = await query(`SELECT id, product_id FROM product_variants LIMIT 1`)
      const v = vRes.rows[0]

      // Attempt direct unauthenticated stock adjustment
      const unauthAdjust = await request('/api/v1/admin/inventory/adjust', {
        method: 'POST',
        body: { variantId: v.id, newQuantity: 9999 },
      })
      if (unauthAdjust.status !== 401 && unauthAdjust.status !== 403) {
        throw new Error(`Unauthenticated customer accessed /api/v1/admin/inventory/adjust! Got ${unauthAdjust.status}`)
      }

      // Attempt direct unauthenticated product stock PATCH
      const unauthPatch = await request(`/api/v1/admin/products/${v.product_id}/stock`, {
        method: 'PATCH',
        body: { stockQuantity: 9999 },
      })
      if (unauthPatch.status !== 401 && unauthPatch.status !== 403) {
        throw new Error(`Unauthenticated customer accessed /api/v1/admin/products/:id/stock! Got ${unauthPatch.status}`)
      }
    })

  } finally {
    try {
      await query(`DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM admin_users WHERE username IN ('sectest_admin', 'sectest_revoke'))`)
      await query(`DELETE FROM admin_users WHERE username IN ('sectest_admin', 'sectest_revoke')`)
    } catch { }

    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('\n🛑 Test server closed.')
        resolve()
      })
    })
  }

  // Summary Report
  console.log('\n======================================================')
  console.log('📊 SECURITY REGRESSION TEST RESULTS SUMMARY')
  console.log('======================================================')
  const total = results.length
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  console.log(`Total Tests:  ${total}`)
  console.log(`Passed:       ${passed}`)
  console.log(`Failed:       ${failed}`)

  if (failed > 0) {
    console.error(`\n🚨 ${failed} SECURITY TEST(S) FAILED!`)
    process.exit(1)
  } else {
    console.log(`\n🎉 ALL ${passed} SECURITY REGRESSION TESTS PASSED CLEANLY!`)
    process.exit(0)
  }
}

runAllSecurityTests().catch((err) => {
  console.error('Fatal error running security tests:', err)
  process.exit(1)
})
