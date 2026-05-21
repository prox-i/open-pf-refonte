import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand } from '@/components/public/cta-band'
import { ArrowIcon } from '@/components/public/arrow-icon'

export const metadata: Metadata = {
  title: 'Contact OPEN PF',
  description: 'Contactez OPEN Polynésie française.',
  openGraph: {
    title: 'Contact OPEN PF',
    description: 'Contactez OPEN Polynésie française.',
    type: 'website',
  },
}

export default function ContactPage() {
  return (
    <>
      <section className="hero hero-simple">
        <div className="hero-inner container">
          <div>
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link> › Contact
            </nav>
            <h1 style={{ color: 'white', marginTop: '8px' }}>Contactez OPEN.</h1>
            <p className="lead" style={{ marginTop: '20px' }}>
              Notre équipe est à votre écoute pour répondre à vos questions et vous accompagner dans
              vos démarches.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="grid-2 container">
          <div className="form-shell">
            <h2>Envoyez-nous un message</h2>
            <p style={{ margin: '10px 0 24px' }}>Nous vous répondrons dans les meilleurs délais.</p>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="contact-name">
                  Nom complet <span className="required">*</span>
                </label>
                <input id="contact-name" type="text" autoComplete="name" required />
              </div>
              <div className="form-field">
                <label htmlFor="contact-email">
                  Email <span className="required">*</span>
                </label>
                <input id="contact-email" type="email" autoComplete="email" required />
              </div>
            </div>
            <div className="form-field" style={{ marginTop: '20px' }}>
              <label htmlFor="contact-subject">
                Sujet <span className="required">*</span>
              </label>
              <select id="contact-subject" required>
                <option value="">Choisir un sujet</option>
                <option>Information sur l&apos;adhésion</option>
                <option>Partenariat</option>
                <option>Presse et communication</option>
                <option>Autre</option>
              </select>
            </div>
            <div className="form-field" style={{ marginTop: '20px' }}>
              <label htmlFor="contact-message">
                Message <span className="required">*</span>
              </label>
              <textarea id="contact-message" required />
            </div>
            <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)' }}>
              Ce formulaire sera activé lors du lancement. En attendant, écrivez-nous directement à{' '}
              <a href="mailto:contact@open.pf" style={{ color: 'var(--open-magenta)' }}>
                contact@open.pf
              </a>
              .
            </p>
            <button className="btn" type="button" style={{ marginTop: '22px' }} disabled>
              Envoyer le message <ArrowIcon />
            </button>
          </div>

          <aside className="card contact-card">
            <h2 style={{ marginBottom: '24px' }}>Nos coordonnées</h2>

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
                <a href="mailto:contact@open.pf">contact@open.pf</a>
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
                Immeuble ATEIVI, 3ème étage
                <br />
                Rue Mgr Tepano Jaussen, face SEFI
                <br />
                BP 972 – 98713 Papeete, Tahiti
                <br />
                Polynésie française
              </p>
            </div>

            <div className="contact-item">
              <span style={{ color: 'var(--open-magenta)', paddingTop: '2px' }}>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
                  />
                </svg>
              </span>
              <p>
                <strong>Horaires</strong>
                <br />
                Lun–Jeu : 7h30–12h00, 13h30–17h00
                <br />
                Vendredi : 7h30–12h00, 13h30–16h00
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
                <a
                  href="https://www.facebook.com/open.polynesie/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </a>
                {' · '}
                <a
                  href="https://www.linkedin.com/company/open-pf/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </p>
            </div>
          </aside>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
