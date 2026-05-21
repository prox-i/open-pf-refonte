import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand } from '@/components/public/cta-band'
import { ArrowIcon } from '@/components/public/arrow-icon'

export const metadata: Metadata = {
  title: 'Actualités OPEN PF',
  description: "Toute l'actualité du numérique en Polynésie française.",
  openGraph: {
    title: 'Actualités OPEN PF',
    description: "Toute l'actualité du numérique en Polynésie française.",
    type: 'website',
  },
}

const ARTICLES = [
  {
    slug: 'ag-juillet-2025',
    type: 'event',
    tag: "Vie de l'association",
    title: 'Assemblée Générale Ordinaire du 04 juillet 2025 – Nouveau CA',
    excerpt:
      "Retour sur l'Assemblée Générale Ordinaire du 4 juillet 2025 et présentation du nouveau Conseil d'Administration.",
    date: '4 juillet 2025',
    featured: true,
  },
  {
    slug: 'info-cyber-2025',
    type: 'cyber',
    tag: 'Cybersécurité',
    title: "« L'INFO-CYBER des partenaires » n°1 2025",
    excerpt:
      'Une publication du Commandement de la Gendarmerie pour la Polynésie française dédiée aux bonnes pratiques en cybersécurité.',
    date: 'Janvier 2025',
    featured: false,
  },
  {
    slug: 'horizons-numerique-2025',
    type: 'lagoon',
    tag: 'Événement',
    title: "Retour sur l'implication de l'OPEN PF au premier forum Les Horizons du Numérique 2025",
    excerpt:
      'OPEN PF était présent au premier forum Les Horizons du Numérique 2025. Retour sur cette édition inaugurale.',
    date: 'Juin 2025',
    featured: false,
  },
  {
    slug: 'dematerialisation-marches-publics',
    type: 'lagoon',
    tag: 'Filière numérique',
    title:
      'Dématérialisation des marchés publics en Polynésie : un réel avantage pour les entreprises locales ?',
    excerpt:
      'Analyse des enjeux et opportunités de la dématérialisation des marchés publics pour les entreprises polynésiennes.',
    date: 'Mars 2025',
    featured: false,
  },
  {
    slug: 'meta-fenua-tntv',
    type: 'event',
    tag: "Vie de l'association",
    title: "OPEN Polynésie à l'honneur dans Meta Fenua sur TNTV",
    excerpt:
      "OPEN Polynésie française était à l'honneur dans l'émission Meta Fenua diffusée sur TNTV.",
    date: 'Novembre 2024',
    featured: false,
  },
]

export default function ActualitesPage() {
  const featured = ARTICLES.find((a) => a.featured)
  const rest = ARTICLES.filter((a) => !a.featured)

  return (
    <>
      <section className="hero hero-simple">
        <div className="hero-inner container">
          <div>
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link> › Actualités
            </nav>
            <h1 style={{ color: 'white', marginTop: '8px' }}>Actualités.</h1>
            <p className="lead" style={{ marginTop: '20px' }}>
              Toute l&apos;actualité du numérique en Polynésie française.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="filters">
              <span className="filter-chip light active">Tous les articles</span>
              <span className="filter-chip light">Vie de l&apos;association</span>
              <span className="filter-chip light">Cybersécurité</span>
              <span className="filter-chip light">Filière numérique</span>
              <span className="filter-chip light">Événement</span>
            </div>
          </div>

          {featured && (
            <article
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr',
                gap: '28px',
                alignItems: 'center',
                marginBottom: '36px',
              }}
            >
              <div
                className={`news-image ${featured.type}`}
                style={{ height: '260px', borderRadius: '18px' }}
              />
              <div>
                <p className="meta">{featured.date}</p>
                <h2>{featured.title}</h2>
                <p style={{ marginTop: '14px' }}>{featured.excerpt}</p>
                <Link
                  href={`/actualites/${featured.slug}`}
                  className="card-link"
                  style={{ marginTop: '16px' }}
                >
                  Lire l&apos;article <ArrowIcon />
                </Link>
              </div>
            </article>
          )}

          <div className="grid-3">
            {rest.map((article) => (
              <article key={article.slug} className="card news-card">
                <div className={`news-image ${article.type}`} />
                <div className="news-body">
                  <span className="tag">{article.tag}</span>
                  <h3>{article.title}</h3>
                  <p className="meta" style={{ marginTop: '8px' }}>
                    {article.date}
                  </p>
                  <Link href={`/actualites/${article.slug}`} className="card-link">
                    Lire l&apos;article <ArrowIcon />
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
