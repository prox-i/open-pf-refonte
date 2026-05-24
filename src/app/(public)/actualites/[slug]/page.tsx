import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/public/cta-band'
import { getNewsBySlug } from '@/lib/db/queries/news'
import { buildBreadcrumbJsonLd, buildArticleJsonLd } from '@/lib/seo'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getNewsBySlug(slug)
  if (!article) return {}

  const description = article.metaDescription ?? article.excerpt?.slice(0, 160) ?? ''
  const ogImage = article.imageUrl ?? '/logo-open.png'

  return {
    title: { absolute: `${article.title} – OPEN PF` },
    description,
    alternates: { canonical: `/actualites/${slug}` },
    openGraph: {
      title: `${article.title} – OPEN PF`,
      description,
      type: 'article',
      url: `/actualites/${slug}`,
      images: [{ url: ogImage, alt: article.title }],
      ...(article.publishedAt && {
        publishedTime: new Date(article.publishedAt).toISOString(),
      }),
    },
    twitter: { card: 'summary_large_image', images: [ogImage] },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getNewsBySlug(slug)
  if (!article) notFound()

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Accueil', href: '/' },
    { name: 'Actualités', href: '/actualites' },
    { name: article.title, href: `/actualites/${slug}` },
  ])
  const articleJsonLd = buildArticleJsonLd(article)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <section className="hero hero-simple">
        <div className="hero-inner container">
          <div>
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link> ›{' '}
              <Link href="/actualites">Actualités</Link> ›{' '}
              <span>{article.categoryLabel ?? 'Article'}</span>
            </nav>
            {article.categoryLabel && (
              <span className="tag" style={{ marginTop: '16px', display: 'inline-block' }}>
                {article.categoryLabel}
              </span>
            )}
            <h1 style={{ marginTop: '12px' }}>{article.title}</h1>
            {article.publishedAt && (
              <p className="meta" style={{ marginTop: '12px' }}>
                {formatDate(article.publishedAt)}
                {article.authorName ? ` · ${article.authorName}` : ''}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '0' }}>
        <div className="container article-layout">
          {article.imageUrl && (
            <div className="article-cover">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                sizes="(max-width: 860px) 100vw, 820px"
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
          )}

          {article.excerpt && !article.content && (
            <p className="article-excerpt">{article.excerpt}</p>
          )}

          {article.content && (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          )}

          {!article.content && !article.excerpt && (
            <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
              Contenu non disponible.
            </p>
          )}

          <div className="article-back">
            <Link href="/actualites" className="btn btn-secondary">
              ← Toutes les actualités
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
