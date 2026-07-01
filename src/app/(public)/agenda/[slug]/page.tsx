import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAgendaEventBySlug } from '@/lib/db/queries/agenda'
import { formatAgendaDate } from '@/lib/agenda'
import { renderMarkdown } from '@/lib/markdown'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await getAgendaEventBySlug(slug)
  if (!event) return {}
  const description = event.description ?? undefined
  return {
    title: { absolute: `${event.title} – Agenda OPEN PF` },
    ...(description ? { description } : {}),
    alternates: { canonical: `/agenda/${slug}` },
  }
}

export default async function AgendaEventDetailPage({ params }: Props) {
  const { slug } = await params
  const event = await getAgendaEventBySlug(slug)
  if (!event) notFound()

  const d = formatAgendaDate(event.eventDate)

  return (
    <>
      <section className="hero hero-simple">
        <div className="hero-inner container">
          <div>
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link> › <span aria-current="page">Agenda</span>
            </nav>
            <p className="lead" style={{ color: 'var(--open-magenta)', fontWeight: 800, marginBottom: '8px' }}>
              {d.day} {d.month} {d.year}
              {event.startTime && ` · ${event.startTime}`}
            </p>
            <h1>{event.title}</h1>
            {event.location && (
              <p className="lead" style={{ marginTop: '16px' }}>
                📍 {event.location}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container article-layout">
          {event.description && (
            <p className="article-excerpt" style={{ fontWeight: 600 }}>
              {event.description}
            </p>
          )}
          {event.content ? (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(event.content) }}
            />
          ) : (
            !event.description && (
              <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                Détails à venir.
              </p>
            )
          )}

          {event.detailUrl && (
            <div style={{ marginTop: '32px' }}>
              <a
                href={event.detailUrl}
                className="btn"
                {...(event.isExternalUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {event.isExternalUrl ? 'Lien externe' : 'En savoir plus'} →
              </a>
            </div>
          )}

          <div className="article-back">
            <Link href="/" className="btn btn-secondary">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
