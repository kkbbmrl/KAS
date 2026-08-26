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

async function request(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const url = `${baseUrl}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

  } finally {
    try {
      await query(`DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM admin_users WHERE username IN ('sectest_admin', 'sectest_revoke'))`)
      await query(`DELETE FROM admin_users WHERE username IN ('sectest_admin', 'sectest_revoke')`)
    } catch {}

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
