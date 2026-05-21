import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowIcon } from '@/components/public/arrow-icon'

export const metadata: Metadata = {
  title: 'Adhérer à OPEN PF',
  description:
    "Rejoignez le réseau des professionnels du numérique de Polynésie française. Formulaire d'adhésion OPEN PF.",
  openGraph: {
    title: 'Adhérer à OPEN PF',
    description: 'Rejoignez le réseau des professionnels du numérique de Polynésie française.',
    type: 'website',
  },
}

const AVANTAGES = [
  {
    title: 'Visibilité',
    description:
      "Votre entreprise référencée dans l'annuaire des adhérents, visible par tous les acteurs de la filière.",
  },
  {
    title: 'Réseau',
    description:
      'Accès aux événements OPEN, aux groupes de travail et aux opportunités de mise en relation entre professionnels.',
  },
  {
    title: 'Représentation',
    description:
      'Votre voix portée auprès des institutions publiques et des partenaires institutionnels de la filière numérique.',
  },
  {
    title: 'Ressources',
    description:
      "Accès aux publications, études et ressources exclusives de l'écosystème numérique polynésien.",
  },
]

export default function AdhesionPage() {
  return (
    <>
      <section className="hero hero-simple">
        <div className="hero-inner container">
          <div>
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link> › Adhésion
            </nav>
            <h1 style={{ color: 'white', marginTop: '8px' }}>Rejoignez OPEN.</h1>
            <p className="lead" style={{ marginTop: '20px' }}>
              Intégrez le cluster numérique de Polynésie française et développez votre activité au
              sein d&apos;un réseau de professionnels engagés.
            </p>
            <div className="hero-actions">
              <a href="#formulaire" className="btn">
                Démarrer ma demande <ArrowIcon />
              </a>
              <Link href="/contact" className="btn btn-secondary">
                Nous contacter <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--soft)' }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Pourquoi rejoindre OPEN</span>
              <h2 style={{ marginTop: '12px' }}>Les avantages de l&apos;adhésion</h2>
            </div>
          </div>
          <div className="grid-4">
            {AVANTAGES.map((avantage) => (
              <article key={avantage.title} className="card">
                <h3>{avantage.title}</h3>
                <p style={{ marginTop: '12px' }}>{avantage.description}</p>
                <div className="card-line" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="formulaire">
        <div className="container" style={{ maxWidth: '760px' }}>
          <div className="section-head">
            <div>
              <span className="eyebrow">Formulaire d&apos;adhésion</span>
              <h2 style={{ marginTop: '12px' }}>Votre demande d&apos;adhésion</h2>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '52px 36px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--soft-pink)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 24px',
                color: 'var(--open-magenta)',
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="32" height="32">
                <path
                  fill="currentColor"
                  d="M12 1a9 9 0 1 1 0 18A9 9 0 0 1 12 1zm0 2a7 7 0 1 0 0 14A7 7 0 0 0 12 3zm1 3v5h3l-4 5-4-5h3V6h2z"
                />
              </svg>
            </div>
            <h3>Formulaire en cours de déploiement</h3>
            <p style={{ marginTop: '12px', maxWidth: '480px', margin: '12px auto 0' }}>
              Le formulaire d&apos;adhésion en ligne sera disponible très prochainement. En
              attendant, contactez-nous par email pour initier votre démarche.
            </p>
            <div
              style={{
                marginTop: '28px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <a href="mailto:contact@open.pf" className="btn">
                Écrire à contact@open.pf <ArrowIcon />
              </a>
              <Link href="/contact" className="btn btn-secondary">
                Page contact <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
