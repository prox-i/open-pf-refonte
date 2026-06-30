import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/public/cta-band'
import { getJobBySlug } from '@/lib/db/queries/jobs'
import { buildBreadcrumbJsonLd, buildJobPostingJsonLd } from '@/lib/seo'
import { formatDate } from '@/lib/utils'
import { renderMarkdown } from '@/lib/markdown'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await getJobBySlug(slug)
  if (!job) return {}

  const description =
    job.metaDescription ??
    job.description?.replace(/\s+/g, ' ').slice(0, 160) ??
    `Offre d'emploi ${job.title} en Polynésie française.`

  return {
    title: job.title,
    description,
    alternates: { canonical: `/offres-emploi/${slug}` },
    openGraph: {
      title: `${job.title} – OPEN PF`,
      description,
      type: 'website',
      url: `/offres-emploi/${slug}`,
      images: [{ url: '/logo-open.png', width: 1169, height: 533, alt: 'OPEN PF' }],
    },
    twitter: { card: 'summary_large_image', images: ['/logo-open.png'] },
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params
  const job = await getJobBySlug(slug)
  if (!job) notFound()

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Accueil', href: '/' },
    { name: "Offres d'emploi", href: '/offres-emploi' },
    { name: job.title, href: `/offres-emploi/${slug}` },
  ])
  const jobJsonLd = buildJobPostingJsonLd(job)

  // BO-020 : proposer les deux voies de candidature quand elles existent.
  const mailtoHref = job.applicationEmail
    ? `mailto:${job.applicationEmail}?subject=${encodeURIComponent(`Candidature : ${job.title}`)}`
    : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobJsonLd) }}
      />

      <section className="hero hero-simple">
        <div className="hero-inner container">
          <div>
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link> ›{' '}
              <Link href="/offres-emploi">Offres d&apos;emploi</Link> › <span>{job.title}</span>
            </nav>
            {job.contractType && (
              <span className="tag" style={{ marginTop: '16px', display: 'inline-block' }}>
                {job.contractType}
              </span>
            )}
            <h1 style={{ marginTop: '12px' }}>{job.title}</h1>
            {job.memberName && (
              <p className="lead" style={{ marginTop: '12px' }}>
                {job.memberSlug ? (
                  <Link href={`/adherents/${job.memberSlug}`}>{job.memberName}</Link>
                ) : (
                  job.memberName
                )}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '0' }}>
        <div className="container article-layout">
          <ul className="job-detail__facts">
            {job.location && (
              <li>
                <strong>Localisation</strong>
                {job.location}
              </li>
            )}
            {job.contractType && (
              <li>
                <strong>Contrat</strong>
                {job.contractType}
              </li>
            )}
            {job.salary && (
              <li>
                <strong>Rémunération</strong>
                {job.salary}
              </li>
            )}
            {job.publishedAt && (
              <li>
                <strong>Publiée le</strong>
                {formatDate(job.publishedAt)}
              </li>
            )}
          </ul>

          {job.description ? (
            <div
              className="article-body"
              style={{ marginTop: '32px' }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(job.description) }}
            />
          ) : (
            <p style={{ color: 'var(--muted)', fontStyle: 'italic', marginTop: '32px' }}>
              Description non disponible. Contactez l&apos;entreprise pour plus d&apos;informations.
            </p>
          )}

          {(job.applicationUrl || mailtoHref) && (
            <div style={{ marginTop: '40px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {job.applicationUrl && (
                <a
                  href={job.applicationUrl}
                  className="btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Postuler en ligne
                </a>
              )}
              {mailtoHref && (
                <a href={mailtoHref} className={job.applicationUrl ? 'btn btn-secondary' : 'btn'}>
                  Postuler par email
                </a>
              )}
            </div>
          )}

          <div className="article-back">
            <Link href="/offres-emploi" className="btn btn-secondary">
              ← Toutes les offres
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
