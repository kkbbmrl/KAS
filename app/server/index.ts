import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import wilayasRouter from './routes/wilayas.js'
import catalogRouter from './routes/catalog.js'
import offersRouter from './routes/offers.js'
import ordersRouter from './routes/orders.js'
import contactRouter from './routes/contact.js'
import settingsRouter from './routes/settings.js'
import adminAuthRouter from './routes/admin/auth.js'
import adminAnalyticsRouter from './routes/admin/analytics.js'
import adminOrdersRouter from './routes/admin/orders.js'
import adminProductsRouter from './routes/admin/products.js'
import adminBrandsRouter from './routes/admin/brands.js'
import adminCategoriesRouter from './routes/admin/categories.js'
import adminInventoryRouter from './routes/admin/inventory.js'
import adminCustomersRouter from './routes/admin/customers.js'
import adminMarketingRouter from './routes/admin/marketing.js'
import adminLegacyImportRouter from './routes/admin/legacyImport.js'
import adminMiscRouter from './routes/admin/misc.js'
import { initDatabase } from './db/init.js'
import { seedDatabase } from './db/seed.js'
import { query } from './db/db.js'
import { ensureAdminAccounts } from './db/ensureAdmins.js'
import { requireAdmin, requireRoles } from './middleware/adminAuth.js'
import { apiGlobalRateLimiter } from './middleware/rateLimiter.js'

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
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https:;"
  )
  next()
})

// Strict CORS Configuration
const rawOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []),
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
  'https://khaledauto.live',
  'https://www.khaledauto.live',
  'https://kas-git-main-kkbbmrls-projects.vercel.app',
  'https://kas-gamma-woad.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]
const configuredOrigins = Array.from(new Set(rawOrigins.map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)))

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true)

      const cleanOrigin = origin.replace(/\/$/, '')
      if (
        configuredOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.endsWith('.railway.app') ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('127.0.0.1')
      ) {
        return callback(null, true)
      }

      return callback(new Error('CORS policy: Not allowed by origin allowlist'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    maxAge: 86400, // 24 hours preflight cache
  })
)

// Scoped Body Parsers with conservative default limits (Prevents memory exhaustion DoS)
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Static uploads folder with hardened headers (Prevent script execution from uploads)
const uploadsDir = path.resolve(process.cwd(), 'server', 'data', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Disposition', 'inline')
    next()
  },
  express.static(uploadsDir)
)

// Static /img folder for product parts, assets, and branding
const publicImgDir = path.resolve(process.cwd(), 'public', 'img')
if (fs.existsSync(publicImgDir)) {
  app.use(
    '/img',
    (req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      next()
    },
    express.static(publicImgDir)
  )
}
const distImgDir = path.resolve(process.cwd(), 'dist', 'img')
if (fs.existsSync(distImgDir)) {
  app.use('/img', express.static(distImgDir))
}

// Request logger
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
  })
}

// Health check endpoints (handles /healthz, /health, /api/health)
const healthHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'KAS Auto Parts API',
    version: '2026-08-26.1',
    uptime: Math.floor(process.uptime()),
    time: new Date().toISOString(),
  })
}
app.get('/healthz', healthHandler)
app.get('/health', healthHandler)
app.get('/api/health', healthHandler)

// Apply Global Rate Limiter to API endpoints
app.use('/api', apiGlobalRateLimiter)

// Public API Routes
app.use('/api/v1/settings', settingsRouter)
app.use('/api/v1/wilayas', wilayasRouter)
app.use('/api/v1/offers', offersRouter)
app.use('/api/v1/orders', ordersRouter)
app.use('/api/v1/contact', contactRouter)
app.use('/api/v1', catalogRouter)

// Admin API Routes — login is public with dedicated brute-force protection; everything else requires admin session with appropriate role checks
app.use('/api/v1/admin/auth', adminAuthRouter)
app.use('/api/v1/admin/analytics', requireAdmin, requireRoles(['admin', 'super_admin']), adminAnalyticsRouter)
app.use('/api/v1/admin/orders', requireAdmin, requireRoles(['admin', 'super_admin', 'order_manager']), adminOrdersRouter)
app.use('/api/v1/admin/products', requireAdmin, requireRoles(['admin', 'super_admin']), adminProductsRouter)
app.use('/api/v1/admin/brands', requireAdmin, requireRoles(['admin', 'super_admin']), adminBrandsRouter)
app.use('/api/v1/admin/categories', requireAdmin, requireRoles(['admin', 'super_admin']), adminCategoriesRouter)
app.use('/api/v1/admin/inventory', requireAdmin, requireRoles(['admin', 'super_admin', 'inventory_manager']), adminInventoryRouter)
app.use('/api/v1/admin/import', requireAdmin, requireRoles(['admin', 'super_admin', 'inventory_manager']), express.json({ limit: '60mb' }), adminLegacyImportRouter)
app.use('/api/v1/admin/customers', requireAdmin, requireRoles(['admin', 'super_admin']), adminCustomersRouter)
app.use('/api/v1/admin/marketing', requireAdmin, requireRoles(['admin', 'super_admin', 'marketing_manager']), adminMarketingRouter)
// Admin misc route gets dedicated 10mb body parser for safe image base64 uploads
app.use('/api/v1/admin', requireAdmin, express.json({ limit: '10mb' }), adminMiscRouter)

// 404 handler for unmatched API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' })
  }
  next()
})

// Centralized API Error Handling Middleware (Prevents stack trace / SQL detail leakage)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Application Error:', err)
  if (res.headersSent) return

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'حجم البيانات المرسلة يتجاوز الحد المسموح به' })
  }

  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({ error: 'غير مصرح بالوصول عبر هذا النطاق (CORS policy violation)' })
  }

  res.status(500).json({ error: 'حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً.' })
})

// Serve the built React frontend whenever dist folder exists
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distPath, 'index.html'))
    }
    next()
  })
}

// Global Process Error Handlers (Prevents silent container exits)
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION at:', promise, 'reason:', reason)
})

// Start server listening
const listenPort = Number(process.env.PORT) || 5000

const server = app.listen(listenPort, '0.0.0.0', () => {
  console.log(`🚀 KAS Auto Parts API Server listening on http://0.0.0.0:${listenPort}`)
  console.log(`💚 Healthcheck live at http://0.0.0.0:${listenPort}/healthz`)

  // Initialize database in background after server is listening
  initDatabase()
    .then(async () => {
      const hasWilayas = await query(`SELECT COUNT(*) AS count FROM algeria_wilayas`)
      if (Number(hasWilayas.rows[0]?.count || 0) === 0) {
        console.log('🌱 No reference data found. Seeding reference data and catalog...')
        await seedDatabase()
      }

      const checkCompat = await query(`SELECT COUNT(*) AS count FROM part_compatibility`)
      if (Number(checkCompat.rows[0]?.count || 0) < 50) {
        console.log('🚗 Seeding vehicle compatibility links for catalog...')
        const { seedPartCompatibility } = await import('./db/seed.js')
        await seedPartCompatibility()
      }

      const checkProds = await query(`SELECT COUNT(*) AS count FROM products`)
      console.log(`✅ Database ready with ${Number(checkProds.rows[0]?.count || 0)} products.`)

      await ensureAdminAccounts()
      console.log('🛡️ Admin accounts verified.')
    })
    .catch((err) => {
      console.error('⚠️ Warning: Database initialization error:', err.message)
    })
})

// Graceful shutdown handling for Railway/Docker container termination
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`)
  server.close(() => {
    console.log('HTTP server closed.')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('Forcing shutdown after 10s timeout.')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export { app }
export default server