import type { MetadataRoute } from 'next'

/**
 * Sur les déploiements de préversion Vercel (VERCEL_ENV !== 'production'),
 * on interdit toute indexation : les `canonical` pointent vers open.pf, donc
 * laisser indexer la préversion créerait du contenu dupliqué (REC-027).
 * En production, on autorise l'indexation publique sauf l'admin et les espaces
 * privés (REC-032 / BO-002).
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production'

  if (!isProduction) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/fiche/'],
    },
    sitemap: 'https://open.pf/sitemap.xml',
  }
}
