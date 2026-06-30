import type { Metadata } from 'next'
import { Fragment } from 'react'
import Link from 'next/link'
import { CtaBand } from '@/components/public/cta-band'
import { ContactForm } from '@/components/public/contact-form'
import { buildBreadcrumbJsonLd } from '@/lib/seo'
import { getSiteSettings } from '@/lib/settings'

// ISR : les coordonnées changent rarement ; la sauvegarde dans le BO
// déclenche un revalidatePath('/contact') pour une mise à jour immédiate.
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Contact',
  description:
    "Contactez OPEN PF, le cluster numérique de Polynésie française. Notre équipe répond à vos questions sur l'adhésion, les partenariats et les démarches institutionnelles.",
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact – OPEN PF',
    description:
      "Notre équipe est à votre écoute pour vos questions d'adhésion, de partenariat et de presse.",
    type: 'website',
    url: '/contact',
    images: [{ url: '/logo-open.png', width: 1169, height: 533, alt: 'OPEN PF' }],
  },
  twitter: { card: 'summary_large_image', images: ['/logo-open.png'] },
}

/** Rend un texte multi-lignes en insérant des <br/> entre chaque ligne. */
function multiline(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ))
}

export default async function ContactPage() {
  const settings = await getSiteSettings()
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Accueil', href: '/' },
    { name: 'Contact', href: '/contact' },
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
              <Link href="/">Accueil</Link> › Contact
            </nav>
            <h1>Contactez OPEN.</h1>
            <p className="lead" style={{ marginTop: '20px' }}>
              Notre équipe est à votre écoute pour répondre à vos questions et vous accompagner dans
              vos démarches.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="contact-form-title">
        <div className="grid-2 container">
          <ContactForm />

          <aside className="card contact-card" aria-labelledby="contact-coords-title">
            <h2 id="contact-coords-title" style={{ marginBottom: '24px' }}>
              Nos coordonnées
            </h2>

            <div className="contact-item">
              <span style={{ color: 'var(--open-magenta)', paddingTop: '2px' }}>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M3 5h18v14H3V5zm2 2v.4l7 4.4 7-4.4V7H5zm14 10V9.8l-7 4.4-7-4.4V17h14z"
                  />
                </svg>
              </span>
              <p>
                <strong>Email</strong>
                <br />
                <a href={`mailto:${settings.publicEmail}`}>{settings.publicEmail}</a>
              </p>
            </div>

            <div className="contact-item">
              <span style={{ color: 'var(--open-magenta)', paddingTop: '2px' }}>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
                  />
                </svg>
              </span>
              <p>
                <strong>Adresse</strong>
                <br />
                {multiline(settings.publicAddress)}
              </p>
            </div>

            <div className="contact-item">
              <span style={{ color: 'var(--open-magenta)', paddingTop: '2px' }}>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13h-1.5v6l5.2 3.1.75-1.23-4.45-2.64V7z"
                  />
                </svg>
              </span>
              <p>
                <strong>Horaires</strong>
                <br />
                {multiline(settings.publicHours)}
              </p>
            </div>

            <div className="contact-item">
              <span style={{ color: 'var(--open-magenta)', paddingTop: '2px' }}>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12z"
                  />
                </svg>
              </span>
              <p>
                <strong>Réseaux sociaux</strong>
                <br />
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
                {' · '}
                <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Carte de localisation du siège (REC-022). OpenStreetMap : sans cookie ni
          clé d'API, donc aucun bandeau de consentement requis. */}
      <section className="section section-tight" aria-labelledby="contact-map-title">
        <div className="container">
          <h2 id="contact-map-title" style={{ marginBottom: '20px' }}>
            Nous trouver
          </h2>
          <div className="contact-map">
            <iframe
              title="Carte de localisation du siège d'OPEN PF à Papeete"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-149.5790%2C-17.5450%2C-149.5580%2C-17.5250&layer=mapnik&marker=-17.5350%2C-149.5685"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Immeuble+ATEIVI+Rue+Mgr+Tepano+Jaussen+Papeete"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir l&apos;itinéraire dans Google Maps →
            </a>
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
