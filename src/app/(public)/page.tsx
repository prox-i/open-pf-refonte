import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CtaBand } from '@/components/public/cta-band'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { MemberShowcase } from '@/components/annuaire/member-showcase'
import { getFeaturedMembers } from '@/lib/db/queries/members'
import { getSiteStats } from '@/lib/db/queries/stats'
import { getRecentNews } from '@/lib/db/queries/news'
import { getHomeAgendaEvents } from '@/lib/db/queries/agenda'
import { AgendaCard } from '@/components/public/agenda-card'
import { getDailySeed } from '@/lib/random/seeded-shuffle'
import { formatDate } from '@/lib/utils'

// Order is deterministic per day (seededShuffle + daily seed), so we can cache
// the page with ISR instead of recomputing on every request — measurable TTFB win.
export const revalidate = 3600

export const metadata: Metadata = {
  // ≤ 60 chars target so Google doesn't truncate the snippet
  title: { absolute: 'OPEN PF — Cluster numérique de Polynésie française' },
  description:
    'OPEN réunit les entreprises du numérique de Polynésie française pour valoriser la filière, représenter les professionnels et structurer un écosystème numérique durable.',
  alternates: { canonical: '/' },
  openGraph: {
    title: "OPEN PF – Organisation des Professionnels de l'Économie Numérique",
    description:
      'OPEN réunit les entreprises du numérique de Polynésie française pour valoriser la filière, représenter les professionnels et structurer un écosystème numérique durable.',
    type: 'website',
    url: '/',
    images: [{ url: '/hero-illustration.png', width: 1200, height: 800, alt: 'OPEN PF – Cluster numérique de Polynésie française' }],
  },
  twitter: { card: 'summary_large_image', images: ['/hero-illustration.png'] },
}

const MISSIONS = [
  {
    title: 'Animer le réseau',
    description:
      "Favoriser les échanges, le partage d'expériences et les rencontres entre professionnels du numérique.",
    icon: (
      <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M7 11a4 4 0 1 1 .1 0H7zm10 0a3.5 3.5 0 1 1 .1 0H17zM2.5 20a6.5 6.5 0 0 1 13 0v1h-13v-1zm12.3-2.9A7.5 7.5 0 0 1 17.5 21h4v-1a5.5 5.5 0 0 0-6.7-5.4v2.5z"
        />
      </svg>
    ),
  },
  {
    title: 'Renforcer la filière',
    description:
      'Représenter les entreprises, défendre leurs intérêts et structurer une filière solide et unie.',
    icon: (
      <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M4 19h16v2H2V3h2v16zm3-2V9h3v8H7zm5 0V5h3v12h-3zm5 0v-6h3v6h-3z"
        />
      </svg>
    ),
  },
  {
    title: 'Promouvoir le numérique',
    description:
      'Valoriser les compétences locales et sensibiliser aux enjeux et opportunités du numérique.',
    icon: (
      <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M3 10v4h4l8 4V6l-8 4H3zm15.5 2a5 5 0 0 0-2.5-4.3v8.6a5 5 0 0 0 2.5-4.3zM7 16v4h3l-1.5-4H7z"
        />
      </svg>
    ),
  },
  {
    title: 'Développer le business',
    description:
      'Créer des opportunités, encourager les partenariats et soutenir la croissance des entreprises.',
    icon: (
      <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="m9.2 12.4 2.1-2.1 2.4 2.4a2 2 0 0 0 2.8 0l.5-.5 3.5 3.6-4.8 4.8a3 3 0 0 1-4.2 0L3.4 12.5 8 7.9l1.9 1.9-2.1 2.1 1.4.5zM14 4l-3.2 3.2 1.4 1.4L15.4 5.4 21 11l-2.6 2.6-3.5-3.6-.5.5-2.4-2.4a2 2 0 0 0-2.8 0l-1.8 1.8L3 5.6 4.4 4.2 8 7.8 11.8 4H14z"
        />
      </svg>
    ),
  },
]

export default async function HomePage() {
  const [featuredMembers, { memberCount, employeeCount, domainCount }, recentNews, agendaEvents] =
    await Promise.all([
      getFeaturedMembers(12, { seed: `home:${getDailySeed()}` }),
      getSiteStats(),
      getRecentNews(2),
      getHomeAgendaEvents(),
    ])

  return (
    <>
      <section className="hero">
        <div className="hero-inner container">
          <div>
            <span className="eyebrow">Cluster numérique de Polynésie française</span>
            <h1>La voix collective des entreprises du numérique polynésien.</h1>
            <p className="lead" style={{ marginTop: '24px' }}>
              OPEN fédère les entreprises du secteur pour valoriser les compétences locales,
              représenter la filière et structurer un écosystème numérique durable et performant en
              Polynésie française.
            </p>
            <div className="hero-actions">
              <Link href="/adhesion" className="btn">
                Rejoindre OPEN <ArrowIcon />
              </Link>
              <Link href="/adherents" className="btn btn-secondary">
                Explorer l&apos;annuaire <ArrowIcon />
              </Link>
            </div>
          </div>
          <div className="hero-visual" style={{ position: 'relative', overflow: 'hidden' }}>
            <Image
              src="/hero-illustration.png"
              alt="Professionnelle polynésienne du numérique"
              fill
              // REC-030 : le hero occupe ~50% en desktop, 100% en mobile. Sans `sizes`,
              // Next servait une image surdimensionnée (w=3840) → LCP mobile dégradé.
              sizes="(max-width: 980px) 100vw, 50vw"
              quality={80}
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
              priority
            />
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Chiffres clés OPEN">
        <div className="stat">
          <div className="stat-icon">
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M7 11a4 4 0 1 1 .1 0H7zm10 0a3.5 3.5 0 1 1 .1 0H17zM2.5 20a6.5 6.5 0 0 1 13 0v1h-13v-1zm12.3-2.9A7.5 7.5 0 0 1 17.5 21h4v-1a5.5 5.5 0 0 0-6.7-5.4v2.5z"
              />
            </svg>
          </div>
          <div>
            <b>{memberCount}</b>
            <span>entreprises adhérentes</span>
          </div>
        </div>
        {employeeCount != null && (
          <div className="stat">
            <div className="stat-icon">
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M7 11a4 4 0 1 1 .1 0H7zm10 0a3.5 3.5 0 1 1 .1 0H17zM2.5 20a6.5 6.5 0 0 1 13 0v1h-13v-1zm12.3-2.9A7.5 7.5 0 0 1 17.5 21h4v-1a5.5 5.5 0 0 0-6.7-5.4v2.5z"
                />
              </svg>
            </div>
            <div>
              <b>{employeeCount}+</b>
              <span>salariés représentés</span>
            </div>
          </div>
        )}
        <div className="stat">
          <div className="stat-icon">
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M4 19h16v2H2V3h2v16zm3-2V9h3v8H7zm5 0V5h3v12h-3zm5 0v-6h3v6h-3z"
              />
            </svg>
          </div>
          <div>
            <b>{domainCount}</b>
            <span>domaines de compétences</span>
          </div>
        </div>
      </section>

      <section className="section" id="missions">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Nos missions</span>
              <h2>Agir ensemble pour faire grandir le numérique polynésien</h2>
            </div>
            <p>
              OPEN agit comme un réseau professionnel, un espace de coordination et une voix
              collective au service de l&apos;économie numérique locale.
            </p>
          </div>
          <div className="grid-4">
            {MISSIONS.map((mission) => (
              <article key={mission.title} className="card mission-card">
                <div className="card-icon">{mission.icon}</div>
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>
                <div className="card-line" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight" aria-labelledby="adherents-strip-title">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Le réseau OPEN</span>
              <h2 id="adherents-strip-title">Les adhérents OPEN</h2>
            </div>
            <Link href="/adherents" className="btn btn-secondary">
              Voir tous les adhérents <ArrowIcon />
            </Link>
          </div>
          <MemberShowcase members={featuredMembers} />
        </div>
      </section>

      {(recentNews.length > 0 || agendaEvents.length > 0) && (
        <section className="section section-tight bg-soft" aria-labelledby="news-home-title">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Actualités</span>
                <h2 id="news-home-title">Actualités de la filière</h2>
              </div>
              <Link href="/actualites" className="btn btn-secondary">
                Toutes les actualités <ArrowIcon />
              </Link>
            </div>
            <div className="news-agenda-grid">
              {recentNews.map((article) => (
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
                    <div className="news-image event" />
                  )}
                  <div className="news-body">
                    {article.categoryLabel && (
                      <span className="tag">{article.categoryLabel}</span>
                    )}
                    <h3>{article.title}</h3>
                    {article.publishedAt && (
                      <p className="meta">{formatDate(article.publishedAt)}</p>
                    )}
                    <span className="card-link" aria-hidden="true">
                      Lire l&apos;article <ArrowIcon />
                    </span>
                  </div>
                </Link>
              ))}
              <AgendaCard events={agendaEvents} />
            </div>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  )
}
