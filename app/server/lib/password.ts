import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  if (!stored) return false

  if (stored.startsWith('scrypt:')) {
    const parts = stored.split(':')
    if (parts.length !== 3) return false
    const [, salt, hash] = parts
    const check = scryptSync(password, salt, 64)
    const storedBuf = Buffer.from(hash, 'hex')
    if (storedBuf.length !== check.length) return false
    return timingSafeEqual(storedBuf, check)
  }

  // Legacy plaintext from the old seed — still accepted once, then rehashed on login.
  return stored === password
}

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'كلمة المرور مطلوبة' }
  }
  if (password.length < 8) {
    return { valid: false, error: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل' }
  }
  if (password.length > 128) {
    return { valid: false, error: 'كلمة المرور طويلة جداً' }
  }
  return { valid: true }
}

export function isHashedPassword(stored: string) {
  return typeof stored === 'string' && stored.startsWith('scrypt:')
}

