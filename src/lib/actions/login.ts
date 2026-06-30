'use server'

import { headers } from 'next/headers'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { getLockoutMinutes, recordFailure, resetRateLimit } from '@/lib/rate-limit'

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error: string } | null> {
  // Clé de limitation : email + IP (best-effort). Cf. BO-003.
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const key = `${email.trim().toLowerCase()}|${ip}`

  const lockedMinutes = getLockoutMinutes(key)
  if (lockedMinutes !== null) {
    return {
      error: `Trop de tentatives. Réessayez dans ${lockedMinutes} minute${lockedMinutes > 1 ? 's' : ''}.`,
    }
  }

  try {
    await signIn('credentials', { email, password, redirectTo: '/admin' })
    resetRateLimit(key)
    return null
  } catch (err) {
    // Next.js redirect() throws an error with a digest starting with NEXT_REDIRECT
    // We MUST re-throw it so the framework can handle the navigation
    const digest = (err as { digest?: string }).digest ?? ''
    if (digest.startsWith('NEXT_REDIRECT')) {
      resetRateLimit(key) // connexion réussie
      throw err
    }

    if (err instanceof AuthError) {
      recordFailure(key)
      return { error: 'Email ou mot de passe incorrect.' }
    }

    // Log unexpected errors server-side
    console.error('[loginAction] unexpected error:', err)
    return { error: 'Une erreur est survenue. Réessayez.' }
  }
}
