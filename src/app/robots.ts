import type { MetadataRoute } from 'next'

/**
 * On n'autorise l'indexation QUE sur le domaine canonique de production
 * (open.pf), signalé par `SITE_INDEXABLE=true`. Tant que le site est servi sur
 * un domaine *.vercel.app (préversions ET production avant la bascule), on
 * noindexe tout : les `canonical` pointent vers open.pf, donc laisser indexer
 * créerait du contenu dupliqué (REC-027). À la bascule sur open.pf, poser
 * `SITE_INDEXABLE=true` dans l'env de production Vercel.
 * En indexation autorisée, on exclut l'admin et les espaces privés (REC-032 / BO-002).
 */
export default function robots(): MetadataRoute.Robots {
  const isIndexable =
    process.env.VERCEL_ENV === 'production' && process.env.SITE_INDEXABLE === 'true'

  if (!isIndexable) {
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
