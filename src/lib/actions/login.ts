'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error: string } | null> {
  try {
    await signIn('credentials', { email, password, redirectTo: '/admin' })
    return null
  } catch (err) {
    // Next.js redirect() throws an error with a digest starting with NEXT_REDIRECT
    // We MUST re-throw it so the framework can handle the navigation
    const digest = (err as { digest?: string }).digest ?? ''
    if (digest.startsWith('NEXT_REDIRECT')) throw err

    if (err instanceof AuthError) {
      return { error: 'Email ou mot de passe incorrect.' }
    }

    // Log unexpected errors server-side
    console.error('[loginAction] unexpected error:', err)
    return { error: 'Une erreur est survenue. Réessayez.' }
  }
}
