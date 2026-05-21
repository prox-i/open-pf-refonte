import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CtaBand } from '@/components/public/cta-band'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { MEMBERS } from '@/lib/data/members'

export const metadata: Metadata = {
  title: 'Annuaire des adhérents OPEN – OPEN PF',
  description: 'Recherchez les entreprises membres du réseau OPEN en Polynésie française.',
  openGraph: {
    title: 'Annuaire des adhérents OPEN – OPEN PF',
    description: 'Recherchez les entreprises membres du réseau OPEN en Polynésie française.',
    type: 'website',
  },
}

export default function AdherentsPage() {
  return (
    <>
      <section className="hero hero-simple">
        <div className="hero-inner container">
          <div>
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link> › Adhérents OPEN
            </nav>
            <h1 style={{ color: 'white', marginTop: '8px' }}>Annuaire des adhérents.</h1>
            <p className="lead" style={{ marginTop: '20px' }}>
              Découvrez les entreprises et organisations qui composent le réseau OPEN en Polynésie
              française.
            </p>
            <form
              className="search-box"
              role="search"
              aria-label="Recherche dans l'annuaire"
              style={{ marginTop: '32px' }}
              action="/adherents"
              method="GET"
            >
              <label className="sr-only" htmlFor="search-member">
                Rechercher une entreprise
              </label>
              <input
                id="search-member"
                name="q"
                type="search"
                placeholder="Rechercher une entreprise, un mot-clé…"
              />
              <button className="btn" type="submit">
                Rechercher{' '}
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="m21 19.6-5.2-5.2a7 7 0 1 0-1.4 1.4l5.2 5.2 1.4-1.4zM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0z"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>
              <span style={{ color: 'var(--open-magenta)' }}>{MEMBERS.length}</span> entreprises
              adhérentes
            </h2>
          </div>
          <div className="grid-3">
            {MEMBERS.map((member) => (
              <article key={member.slug} className="card member-card">
                <div className="logo-card">
                  {member.logoUrl ? (
                    <Image
                      src={member.logoUrl}
                      alt={`Logo ${member.name}`}
                      width={100}
                      height={60}
                      style={{ objectFit: 'contain', maxHeight: '60px' }}
                      unoptimized
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        color: 'var(--navy)',
                        textAlign: 'center',
                        lineHeight: 1.2,
                      }}
                    >
                      {member.name}
                    </span>
                  )}
                </div>
                <div>
                  <h3>{member.name}</h3>
                  {member.description && (
                    <p style={{ marginTop: '8px', fontSize: '14px' }}>
                      {member.description.length > 100
                        ? `${member.description.slice(0, 100)}…`
                        : member.description}
                    </p>
                  )}
                  <Link href={`/adherents/${member.slug}`} className="card-link">
                    Voir la fiche <ArrowIcon />
                  </Link>
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
