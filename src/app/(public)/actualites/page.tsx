import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CtaBand } from '@/components/public/cta-band'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { formatDate } from '@/lib/utils'
import { buildBreadcrumbJsonLd } from '@/lib/seo'
import { getNewsPaginated } from '@/lib/db/queries/news'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 9

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

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function ActualitesPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Accueil', href: '/' },
    { name: 'Actualités', href: '/actualites' },
  ])

  const { articles, total } = await getNewsPaginated(page, PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const featured = page === 1 ? (articles[0] ?? null) : null
  const grid = page === 1 ? articles.slice(1) : articles

  function pageHref(n: number) {
    return n === 1 ? '/actualites' : `/actualites?page=${n}`
  }

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
                <div style={{ position: 'relative', height: '260px', borderRadius: '18px', overflow: 'hidden', flexShrink: 0 }}>
                  <Image
                    src={featured.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 980px) 100vw, 45vw"
                    style={{ objectFit: 'cover' }}
                    priority
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

          {grid.length > 0 && (
            <div className="grid-3">
              {grid.map((article) => (
                <Link
                  key={article.slug}
                  href={`/actualites/${article.slug}`}
                  className="card news-card news-card--link"
                >
                  {article.imageUrl ? (
                    <div className="news-image news-image--photo">
                      <Image
                        src={article.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 580px) 100vw, (max-width: 980px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
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

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <Link
                href={pageHref(page - 1)}
                className="pagination-btn"
                aria-label="Page précédente"
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                ← Précédent
              </Link>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={pageHref(n)}
                  className="pagination-btn"
                  aria-current={n === page ? 'page' : undefined}
                >
                  {n}
                </Link>
              ))}

              <Link
                href={pageHref(page + 1)}
                className="pagination-btn"
                aria-label="Page suivante"
                aria-disabled={page >= totalPages}
                tabIndex={page >= totalPages ? -1 : undefined}
              >
                Suivant →
              </Link>
            </nav>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  )
}
