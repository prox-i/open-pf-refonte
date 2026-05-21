import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CtaBand } from '@/components/public/cta-band'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { FEATURED_MEMBERS } from '@/lib/data/members'

export const metadata: Metadata = {
  title: "OPEN PF – Organisation des Professionnels de l'Économie Numérique",
  description: 'OPEN fédère les entreprises du numérique en Polynésie française.',
  openGraph: {
    title: "OPEN PF – Organisation des Professionnels de l'Économie Numérique",
    description: 'OPEN fédère les entreprises du numérique en Polynésie française.',
    type: 'website',
  },
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

const NEWS_PREVIEW = [
  {
    type: 'event',
    tag: 'Événement',
    title: 'Assemblée Générale Ordinaire du 04 juillet 2025 – Nouveau CA',
    date: '4 juillet 2025',
  },
  {
    type: 'cyber',
    tag: 'Cybersécurité',
    title: "« L'INFO-CYBER des partenaires » n°1 2025",
    date: 'Janvier 2025',
  },
  {
    type: 'lagoon',
    tag: 'Filière numérique',
    title: "Retour sur l'implication de l'OPEN PF au premier forum Les Horizons du Numérique 2025",
    date: 'Juin 2025',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner container">
          <div>
            <span className="eyebrow">Cluster numérique de Polynésie française</span>
            <h1 style={{ marginTop: '16px', color: 'white' }}>
              La voix collective des entreprises du numérique polynésien.
            </h1>
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
          <div
            className="hero-visual"
            role="img"
            aria-label="Illustration abstraite d'un réseau numérique polynésien"
          />
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
            <b>54</b>
            <span>entreprises adhérentes</span>
          </div>
        </div>
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
            <b>+500</b>
            <span>salariés représentés</span>
          </div>
        </div>
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
            <b>19</b>
            <span>domaines de compétences</span>
          </div>
        </div>
      </section>

      <section className="section" id="missions">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Nos missions</span>
              <h2 style={{ marginTop: '12px' }}>
                Agir ensemble pour faire grandir le numérique polynésien
              </h2>
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
              <h2 id="adherents-strip-title" style={{ marginTop: '12px' }}>
                Les adhérents OPEN
              </h2>
            </div>
            <Link href="/adherents" className="btn btn-secondary">
              Voir tous les adhérents <ArrowIcon />
            </Link>
          </div>
          <div className="logo-strip">
            {FEATURED_MEMBERS.map((member) => (
              <Link
                key={member.slug}
                href={`/adherents/${member.slug}`}
                className="logo-card"
                aria-label={member.name}
              >
                <Image
                  src={member.logoUrl ?? ''}
                  alt={member.name}
                  width={100}
                  height={60}
                  style={{ objectFit: 'contain', maxHeight: '60px' }}
                  unoptimized
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        className="section section-tight"
        aria-labelledby="news-home-title"
        style={{ background: 'var(--soft)' }}
      >
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Actualités</span>
              <h2 id="news-home-title" style={{ marginTop: '12px' }}>
                Actualités de la filière
              </h2>
            </div>
            <Link href="/actualites" className="btn btn-secondary">
              Toutes les actualités <ArrowIcon />
            </Link>
          </div>
          <div className="grid-3">
            {NEWS_PREVIEW.map((article) => (
              <article key={article.title} className="card news-card">
                <div className={`news-image ${article.type}`} />
                <div className="news-body">
                  <span className="tag">{article.tag}</span>
                  <h3>{article.title}</h3>
                  <p className="meta">{article.date}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
