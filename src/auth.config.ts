import type { NextAuthConfig } from 'next-auth'

// Edge-safe config: no bcryptjs, no DB imports — only JWT/session callbacks.
// Used by middleware. The full config (with Credentials provider) is in src/auth.ts.
export const authConfig = {
  pages: { signIn: '/admin/login' },
  trustHost: true,
  // Session admin expirante : 8 h (au lieu des 30 j par défaut de NextAuth). BO-003.
  session: { strategy: 'jwt' as const, maxAge: 60 * 60 * 8 },
  callbacks: {
    jwt({ token, user }) {
      if (user) token['adminId'] = user.id
      return token
    },
    session({ session, token }) {
      if (token['adminId']) {
        session.user.id = token['adminId'] as string
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
