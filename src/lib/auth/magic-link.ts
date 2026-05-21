import { createHmac, createHash, timingSafeEqual } from 'crypto'
import { env } from '@/lib/env'

const TOKEN_TTL_DAYS = 30

export function generateMagicToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = crypto.randomUUID()
  const hmac = createHmac('sha256', env.MAGIC_LINK_SECRET).update(raw).digest('hex')
  const payload = `${raw}.${hmac}`
  const hash = createHash('sha256').update(payload).digest('hex')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + TOKEN_TTL_DAYS)

  return { raw: payload, hash, expiresAt }
}

export function hashMagicToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export function verifyMagicToken(raw: string): boolean {
  const parts = raw.split('.')
  if (parts.length !== 2) return false
  const [uuid, providedHmac] = parts
  if (!uuid || !providedHmac) return false

  const expectedHmac = createHmac('sha256', env.MAGIC_LINK_SECRET).update(uuid).digest('hex')
  const expectedBuf = Buffer.from(expectedHmac, 'hex')
  const providedBuf = Buffer.from(providedHmac, 'hex')

  if (expectedBuf.length !== providedBuf.length) return false
  return timingSafeEqual(expectedBuf, providedBuf)
}
