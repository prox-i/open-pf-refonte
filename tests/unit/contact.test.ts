import { describe, it, expect } from 'vitest'
import { contactSchema } from '@/lib/validations/contact'

const valid = {
  name: 'Jean Tester',
  email: 'jean@example.pf',
  subject: 'Partenariat' as const,
  message: 'Bonjour, je souhaite discuter d’un partenariat avec OPEN.',
  rgpdConsent: true,
  company: '',
}

describe('contactSchema', () => {
  it('accepts valid input', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a name shorter than 2 chars', () => {
    expect(contactSchema.safeParse({ ...valid, name: 'J' }).success).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects an unknown subject', () => {
    expect(contactSchema.safeParse({ ...valid, subject: 'Spam' }).success).toBe(false)
  })

  it('rejects a message shorter than 10 chars', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'court' }).success).toBe(false)
  })

  it('rejects a message over 5000 chars', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'a'.repeat(5001) }).success).toBe(false)
  })

  it('accepts an empty honeypot', () => {
    expect(contactSchema.safeParse({ ...valid, company: '' }).success).toBe(true)
  })

  it('rejects a filled honeypot (bot signal)', () => {
    expect(contactSchema.safeParse({ ...valid, company: 'Acme Bots Inc' }).success).toBe(false)
  })

  it('rejects a missing RGPD consent', () => {
    expect(contactSchema.safeParse({ ...valid, rgpdConsent: false }).success).toBe(false)
  })

  it('trims surrounding whitespace on name and email', () => {
    const parsed = contactSchema.safeParse({ ...valid, name: '  Jean Tester  ', email: ' jean@example.pf ' })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.name).toBe('Jean Tester')
      expect(parsed.data.email).toBe('jean@example.pf')
    }
  })
})
