import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand } from '@/components/public/cta-band'
import { ArrowIcon } from '@/components/public/arrow-icon'

export const metadata: Metadata = {
  title: "Offres d'emploi OPEN PF",
  description: "Offres d'emploi des entreprises du numérique en Polynésie française.",
  openGraph: {
    title: "Offres d'emploi OPEN PF",
    description: "Offres d'emploi des entreprises du numérique en Polynésie française.",
    type: 'website',
  },
}

export default function OffresEmploiPage() {
  return (
    <>
      <section className="hero hero-simple">
        <div className="hero-inner container">
          <div>
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link> › Offres d&apos;emploi
            </nav>
            <h1 style={{ color: 'white', marginTop: '8px' }}>Offres d&apos;emploi</h1>
            <p className="lead" style={{ marginTop: '20px' }}>
              Découvrez les opportunités de carrière au sein des entreprises du numérique en
              Polynésie française.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <form
            className="form-shell"
            role="search"
            aria-label="Recherche d'offres"
            style={{ marginBottom: '36px' }}
          >
            <div className="form-grid-3">
              <div className="form-field">
                <label htmlFor="job-search">Recherche</label>
                <input id="job-search" type="search" placeholder="Poste, mot-clé…" />
              </div>
              <div className="form-field">
                <label htmlFor="job-domain">Domaine</label>
                <select id="job-domain">
                  <option>Tous les domaines</option>
                  <option>Développement logiciels</option>
                  <option>Conseil / Expertise</option>
                  <option>Cybersécurité</option>
                  <option>Cloud</option>
                  <option>Formation</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="job-contract">Contrat</label>
                <select id="job-contract">
                  <option>Tous types de contrat</option>
                  <option>CDI</option>
                  <option>CDD</option>
                  <option>Stage</option>
                  <option>Alternance</option>
                </select>
              </div>
            </div>
            <button className="btn" style={{ marginTop: '20px' }} type="submit">
              Rechercher{' '}
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="m21 19.6-5.2-5.2a7 7 0 1 0-1.4 1.4l5.2 5.2 1.4-1.4zM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0z"
                />
              </svg>
            </button>
          </form>

          <div className="card card-muted" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h3 style={{ color: 'var(--ink)' }}>Aucune offre disponible pour le moment</h3>
            <p style={{ marginTop: '8px' }}>
              Les offres d&apos;emploi des entreprises adhérentes seront publiées ici.
            </p>
            <p style={{ marginTop: '8px' }}>
              Vous êtes adhérent ? Publiez vos offres depuis votre espace membre.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                marginTop: '20px',
                flexWrap: 'wrap',
              }}
            >
              <Link href="/adhesion" className="btn">
                Devenir adhérent <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
