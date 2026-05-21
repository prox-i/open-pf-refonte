'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error: string } | null> {
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/admin',
    })
    return null
  } catch (err) {
    // NEXT_REDIRECT must be rethrown — it's how Next.js handles server-side redirects
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err
    if (err instanceof AuthError) {
      return { error: 'Email ou mot de passe incorrect.' }
    }
    return { error: 'Une erreur est survenue. Réessayez.' }
  }
}
