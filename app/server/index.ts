import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import wilayasRouter from './routes/wilayas.js'
import catalogRouter from './routes/catalog.js'
import offersRouter from './routes/offers.js'
import ordersRouter from './routes/orders.js'
import contactRouter from './routes/contact.js'
import adminAuthRouter from './routes/admin/auth.js'
import adminAnalyticsRouter from './routes/admin/analytics.js'
import adminOrdersRouter from './routes/admin/orders.js'
import adminProductsRouter from './routes/admin/products.js'
import adminBrandsRouter from './routes/admin/brands.js'
import adminCategoriesRouter from './routes/admin/categories.js'
import adminInventoryRouter from './routes/admin/inventory.js'
import adminCustomersRouter from './routes/admin/customers.js'
import adminMarketingRouter from './routes/admin/marketing.js'
import adminMiscRouter from './routes/admin/misc.js'
import { initDatabase } from './db/init.js'
import { seedDatabase } from './db/seed.js'
import { query } from './db/db.js'
import { ensureAdminAccounts } from './db/ensureAdmins.js'
import { requireAdmin } from './middleware/adminAuth.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 5000

// Security: Disable X-Powered-By
app.disable('x-powered-by')

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['https://kas-gamma-woad.vercel.app', 'http://localhost:3000', 'http://localhost:5173']

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, same-origin)
      if (!origin) return callback(null, true)

      // Match explicit configured origins or wildcard
      if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
        return callback(null, true)
      }

      // Allow Vercel preview and production deployments for KAS
      if (
        /^https:\/\/kas-[a-z0-9-]+\.vercel\.app$/i.test(origin) ||
        /^https:\/\/kas-gamma-woad\.vercel\.app$/i.test(origin) ||
        /^http:\/\/localhost:\d+$/i.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/i.test(origin)
      ) {
        return callback(null, true)
      }

      // If in dev, be lenient
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true)
      }

      return callback(null, false)
    },
    credentials: true,
  })
)

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Static uploads folder
const uploadsDir = path.resolve(process.cwd(), 'server', 'data', 'uploads')
app.use('/uploads', express.static(uploadsDir))

// Request logger (in production only logs errors/warns, in dev logs request lines)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
  })
}

// Health checks
app.get('/healthz', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'KAS Auto Parts API' }))

// Public API Routes
app.use('/api/v1/wilayas', wilayasRouter)
app.use('/api/v1/offers', offersRouter)
app.use('/api/v1/orders', ordersRouter)
app.use('/api/v1/contact', contactRouter)
app.use('/api/v1', catalogRouter)

// Admin API Routes — login is public; everything else requires an admin session
app.use('/api/v1/admin/auth', adminAuthRouter)
app.use('/api/v1/admin/analytics', requireAdmin, adminAnalyticsRouter)
app.use('/api/v1/admin/orders', requireAdmin, adminOrdersRouter)
app.use('/api/v1/admin/products', requireAdmin, adminProductsRouter)
app.use('/api/v1/admin/brands', requireAdmin, adminBrandsRouter)
app.use('/api/v1/admin/categories', requireAdmin, adminCategoriesRouter)
app.use('/api/v1/admin/inventory', requireAdmin, adminInventoryRouter)
app.use('/api/v1/admin/customers', requireAdmin, adminCustomersRouter)
app.use('/api/v1/admin/marketing', requireAdmin, adminMarketingRouter)
app.use('/api/v1/admin', requireAdmin, adminMiscRouter)

// Serve the built React frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// Auto-initialize and start server
async function startServer() {
  try {
    await initDatabase()

    // Reference data (wilayas, categories, vehicle taxonomy, settings) is safe to
    // ensure on every boot. Products are NOT seeded — an empty catalogue is a
    // valid state and the owner's stock is managed via the Admin Dashboard.
    const hasWilayas = await query(`SELECT COUNT(*) AS count FROM algeria_wilayas`)
    if (Number(hasWilayas.rows[0]?.count || 0) === 0) {
      console.log('🌱 No reference data found. Seeding wilayas/categories/vehicles...')
      await seedDatabase()
    }

    const checkProds = await query(`SELECT COUNT(*) AS count FROM products`)
    console.log(`✅ Database ready with ${Number(checkProds.rows[0]?.count || 0)} products.`)

    await ensureAdminAccounts()

    app.listen(PORT, () => {
      console.log(`🚀 KAS Auto Parts API Server listening on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('❌ Failed to start API server:', err)
    process.exit(1)
  }
}

startServer()