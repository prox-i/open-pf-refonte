import type { Metadata } from 'next'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { CtaBand } from '@/components/public/cta-band'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { BoardMemberCard } from '@/components/public/board-member-card'
import { getDb } from '@/lib/db'
import { teamMembers } from '@/lib/db/schema'
import { BOARD_TERM } from '@/lib/data/board-term'
import { buildBreadcrumbJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Le réseau OPEN',
  description:
    "OPEN fédère les entreprises du numérique en Polynésie française pour représenter la filière, animer le réseau et promouvoir les compétences locales depuis 2011.",
  alternates: { canonical: '/reseau' },
  openGraph: {
    title: 'Le réseau OPEN – OPEN PF',
    description:
      "Découvrez les missions, la gouvernance et l'histoire d'OPEN Polynésie française depuis 2011.",
    type: 'website',
    url: '/reseau',
    images: [{ url: '/logo-open.png', width: 1169, height: 533, alt: 'OPEN PF' }],
  },
  twitter: { card: 'summary_large_image', images: ['/logo-open.png'] },
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

const TIMELINE = [
  {
    year: 2011,
    description: "Création de l'association. Élection de Guillaume PROIA à la présidence d'OPEN PF",
  },
  { year: 2013, description: 'Changements de bureau et de président. Élection de Frédéric DOCK' },
  { year: 2015, description: 'Changements de bureau et de président. Élection de Vincent FABRE' },
  { year: 2017, description: 'Rapprochement avec OPEN NC (Nouvelle-Calédonie)' },
  {
    year: 2021,
    description: 'Changements de bureau et de président. Élection de Thibault DE REVIERE',
  },
  {
    year: 2021,
    description: "Vision, convictions, missions… Travaux autour de la raison d'être OPEN",
  },
  { year: 2022, description: 'Développement de partenariats clés — CLUSIR, French Tech' },
  { year: 2025, description: 'AG ordinaire — Renouvellement du CA pour le mandat 2025-2027' },
  { year: 2026, description: 'Refonte du site et lancement de la plateforme numérique' },
]

export default async function ReseauPage() {
  const db = getDb()
  const boardMembers = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isActive, true))
    .orderBy(teamMembers.sortOrder)

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Accueil', href: '/' },
    { name: 'Le réseau', href: '/reseau' },
  ])

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
              <Link href="/">Accueil</Link> › Le réseau OPEN
            </nav>
            <h1>Le réseau OPEN</h1>
            <p className="lead" style={{ marginTop: '20px' }}>
              Fédérer, représenter et faire grandir l&apos;écosystème numérique en Polynésie
              française.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="missions" aria-labelledby="missions-title">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Nos missions</span>
              <h2 id="missions-title">
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

      <section className="section" id="gouvernance" aria-labelledby="gouvernance-title">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Gouvernance</span>
              <h2 id="gouvernance-title">Bureau OPEN {BOARD_TERM}</h2>
            </div>
            <p>
              Le bureau d&apos;OPEN est composé de professionnels bénévoles issus de la filière,
              élus pour le mandat {BOARD_TERM}.
            </p>
          </div>
          <div className="board-grid">
            {boardMembers.map((member) => (
              <BoardMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="section section-tight bg-soft"
        id="origines"
        aria-labelledby="origines-title"
      >
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Nos origines</span>
              <h2 id="origines-title">Une histoire au service du numérique polynésien</h2>
            </div>
          </div>
          <div className="grid-4">
            {TIMELINE.map((event, i) => (
              <article key={i} className="card">
                <h3 style={{ color: 'var(--open-magenta)' }}>{event.year}</h3>
                <p style={{ marginTop: '10px' }}>{event.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="nous-rejoindre" aria-labelledby="apropos-title">
        <div className="container" style={{ maxWidth: '760px' }}>
          <span className="eyebrow">L&apos;association</span>
          <h2 id="apropos-title">À propos d&apos;OPEN</h2>
          <p style={{ marginTop: '24px', lineHeight: 1.75 }}>
            OPEN est née en mars 2011 sous l&apos;impulsion de dirigeants d&apos;entreprises
            passionnées par le numérique, qui ont décidé de se fédérer pour favoriser
            l&apos;émergence d&apos;une filière numérique en représentant les entreprises privées
            dont l&apos;activité est directement liée à la filière ou qui la considère comme une
            plus-value économique.
          </p>
          <p style={{ marginTop: '16px', lineHeight: 1.75 }}>
            Dans l&apos;ADN de OPEN se trouve aussi la volonté d&apos;informer et former les
            entreprises adhérentes ou non des potentialités et évolutions du numérique, au regard de
            sa capacité forte dans le développement des entreprises de Polynésie française ainsi que
            de défendre les intérêts des entreprises du secteur numérique notamment auprès des
            institutions publiques.
          </p>
          <p style={{ marginTop: '16px', lineHeight: 1.75 }}>
            Pour y arriver, OPEN peut compter sur son affiliation à un organisme solide : le MEDEF
            Polynésie française.
          </p>
          <div style={{ marginTop: '32px' }}>
            <Link href="/adhesion" className="btn">
              Rejoindre OPEN <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
