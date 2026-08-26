import type { Request, Response, NextFunction } from 'express'

interface RateLimitRecord {
  count: number
  resetTime: number
  blockedUntil?: number
}

interface RateLimitOptions {
  windowMs: number
  max: number
  message: string
  keyGenerator?: (req: Request) => string
  lockoutMs?: number
}

export function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, RateLimitRecord>()
  const { windowMs, max, message, keyGenerator, lockoutMs } = options

  // Periodically clean up expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime && (!record.blockedUntil || now > record.blockedUntil)) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000).unref()

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    const rawIp = req.headers['x-forwarded-for']
    const ip = (typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown'
    const key = keyGenerator ? keyGenerator(req) : `${ip}:${req.baseUrl || ''}${req.path || ''}`

    let record = store.get(key)

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      }
      store.set(key, record)
      return next()
    }

    if (record.blockedUntil && now < record.blockedUntil) {
      const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000)
      res.setHeader('Retry-After', String(waitSeconds))
      return res.status(429).json({
        error: message || 'تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة لاحقاً.',
        retryAfterSeconds: waitSeconds,
      })
    }

    record.count += 1

    if (record.count > max) {
      if (lockoutMs) {
        record.blockedUntil = now + lockoutMs
      }
      const waitSeconds = Math.ceil(((record.blockedUntil || record.resetTime) - now) / 1000)
      res.setHeader('Retry-After', String(waitSeconds))
      return res.status(429).json({
        error: message || 'تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة لاحقاً.',
        retryAfterSeconds: waitSeconds,
      })
    }

    next()
  }
}

// Pre-configured rate limiters
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5,
  lockoutMs: 15 * 60 * 1000, // 15 mins lockout
  message: 'تم قفل محاولات الدخول مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى الانتظار 15 دقيقة.',
  keyGenerator: (req) => {
    const rawIp = req.headers['x-forwarded-for']
    const ip = (typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown'
    const username = String(req.body?.username || req.body?.email || '').trim().toLowerCase()
    return `login:${ip}:${username}`
  },
})

export const orderPlacementRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 10,
  lockoutMs: 10 * 60 * 1000,
  message: 'تم تجاوز الحد الأقصى المسموح به لإنشاء الطلبات مؤقتاً. يرجى الانتظار بضع دقائق.',
})

export const orderTrackingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  message: 'تم تجاوز عدد محاولات تتبع الطلب. يرجى الانتظار دقيقة واحدة.',
})

export const contactRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 5,
  message: 'تم استلام رسائلك السابقة، يرجى الانتظار قبل إرسال رسالة جديدة.',
})

export const apiGlobalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 min
  max: 150,
  message: 'تم تجاوز حد الطلبات للواجهة البرمجية.',
})
