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

export function isHashedPassword(stored: string) {
  return stored.startsWith('scrypt:')
}
