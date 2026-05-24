import type { Metadata } from 'next'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { news, newsCategories } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { CtaBand } from '@/components/public/cta-band'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { formatDate } from '@/lib/utils'
import { buildBreadcrumbJsonLd } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Actualités',
  description:
    "Toute l'actualité du numérique en Polynésie française : événements, publications et initiatives du cluster OPEN PF.",
  alternates: { canonical: '/actualites' },
  openGraph: {
    title: 'Actualités – OPEN PF',
    description: "Toute l'actualité du numérique en Polynésie française.",
    type: 'website',
    url: '/actualites',
    images: [{ url: '/logo-open.png', width: 1169, height: 533, alt: 'OPEN PF' }],
  },
  twitter: { card: 'summary_large_image', images: ['/logo-open.png'] },
}

export default async function ActualitesPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Accueil', href: '/' },
    { name: 'Actualités', href: '/actualites' },
  ])
  const db = getDb()
  const articles = await db
    .select({
      id: news.id,
      slug: news.slug,
      title: news.title,
      excerpt: news.excerpt,
      publishedAt: news.publishedAt,
      imageUrl: news.imageUrl,
      categoryLabel: newsCategories.label,
    })
    .from(news)
    .leftJoin(newsCategories, eq(news.categoryId, newsCategories.id))
    .where(eq(news.status, 'published'))
    .orderBy(desc(news.publishedAt))

  const [featured, ...rest] = articles

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="hero hero-simple">
        <div className="hero-inner container">
          <div>
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link> › Actualités
            </nav>
            <h1>Actualités.</h1>
            <p className="lead" style={{ marginTop: '20px' }}>
              Toute l&apos;actualité du numérique en Polynésie française.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {featured && (
            <Link
              href={`/actualites/${featured.slug}`}
              className="card news-card--link"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr',
                gap: '28px',
                alignItems: 'center',
                marginBottom: '36px',
              }}
            >
              {featured.imageUrl ? (
                <div style={{ height: '260px', borderRadius: '18px', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={featured.imageUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="news-image event" style={{ height: '260px', borderRadius: '18px' }} />
              )}
              <div>
                {featured.categoryLabel && (
                  <span className="tag">{featured.categoryLabel}</span>
                )}
                {featured.publishedAt && (
                  <p className="meta" style={{ marginTop: '8px' }}>
                    {formatDate(featured.publishedAt)}
                  </p>
                )}
                <h2 style={{ marginTop: '8px' }}>{featured.title}</h2>
                {featured.excerpt && (
                  <p style={{ marginTop: '14px' }}>{featured.excerpt}</p>
                )}
                <span className="card-link" aria-hidden="true" style={{ marginTop: '16px' }}>
                  Lire l&apos;article <ArrowIcon />
                </span>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="grid-3">
              {rest.map((article) => (
                <Link key={article.slug} href={`/actualites/${article.slug}`} className="card news-card news-card--link">
                  {article.imageUrl ? (
                    <div className="news-image news-image--photo">
                      <img src={article.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="news-image lagoon" />
                  )}
                  <div className="news-body">
                    {article.categoryLabel && (
                      <span className="tag">{article.categoryLabel}</span>
                    )}
                    <h3 style={{ marginTop: '8px' }}>{article.title}</h3>
                    {article.publishedAt && (
                      <p className="meta" style={{ marginTop: '8px' }}>
                        {formatDate(article.publishedAt)}
                      </p>
                    )}
                    <span className="card-link" aria-hidden="true">
                      Lire l&apos;article <ArrowIcon />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {articles.length === 0 && (
            <div className="empty-state">
              <svg className="empty-state__icon" viewBox="0 0 48 48" aria-hidden="true" fill="none">
                <rect x="10" y="8" width="28" height="32" rx="4" stroke="currentColor" strokeWidth="3" />
                <path d="M16 17h16M16 23h16M16 29h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="empty-state__title">Aucune actualité</p>
              <p className="empty-state__text">Les actualités de la filière seront publiées ici.</p>
            </div>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  )
}
