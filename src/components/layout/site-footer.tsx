import Link from 'next/link'
import Image from 'next/image'
import { SITE_SETTINGS_DEFAULTS } from '@/lib/settings-defaults'

interface SiteFooterProps {
  facebookUrl?: string
  linkedinUrl?: string
  publicAddress?: string
}

// Composant synchrone (rendu aussi dans error.tsx, un Client Component, donc pas
// d'async ici). Le layout public lui passe les réglages éditables ; ailleurs
// (404, page d'erreur), on retombe sur les valeurs par défaut.
export function SiteFooter({
  facebookUrl = SITE_SETTINGS_DEFAULTS.facebookUrl,
  linkedinUrl = SITE_SETTINGS_DEFAULTS.linkedinUrl,
  publicAddress = SITE_SETTINGS_DEFAULTS.publicAddress,
}: SiteFooterProps = {}) {
  const addressLines = publicAddress.split('\n').filter(Boolean)

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-grid container">
        {/* Brand + description */}
        <div>
          <Link href="/" className="footer-brand" aria-label="OPEN Polynésie française, accueil">
            <Image
              src="/logo-open.png"
              alt="OPEN – Organisation des Professionnels de l'Économie Numérique"
              width={149}
              height={68}
              style={{ height: '60px', width: 'auto' }}
            />
          </Link>
          <p style={{ marginTop: '18px' }}>
            OPEN fédère les entreprises du numérique en Polynésie française pour représenter,
            promouvoir et développer la filière.
          </p>

          {/* Réseaux sociaux (REC-025) */}
          <ul className="footer-social" aria-label="OPEN sur les réseaux sociaux">
            <li>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="OPEN sur Facebook">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z"
                  />
                </svg>
              </a>
            </li>
            <li>
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="OPEN sur LinkedIn">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"
                  />
                </svg>
              </a>
            </li>
          </ul>
        </div>

        {/* Le réseau */}
        <nav aria-labelledby="footer-reseau">
          <h2 id="footer-reseau">Le réseau</h2>
          <ul className="footer-links">
            <li>
              <Link href="/reseau">Qui sommes-nous&nbsp;?</Link>
            </li>
            <li>
              <Link href="/reseau#missions">Nos missions</Link>
            </li>
            <li>
              <Link href="/reseau#gouvernance">Gouvernance</Link>
            </li>
            <li>
              <Link href="/adhesion">Nous rejoindre</Link>
            </li>
          </ul>
        </nav>

        {/* Adhérents */}
        <nav aria-labelledby="footer-adherents">
          <h2 id="footer-adherents">Adhérents</h2>
          <ul className="footer-links">
            <li>
              <Link href="/adherents">Annuaire des adhérents</Link>
            </li>
            <li>
              <Link href="/adhesion">Avantages membres</Link>
            </li>
            <li>
              <Link href="/adhesion">Devenir adhérent</Link>
            </li>
          </ul>
        </nav>

        {/* Ressources */}
        <nav aria-labelledby="footer-ressources">
          <h2 id="footer-ressources">Ressources</h2>
          <ul className="footer-links">
            <li>
              <Link href="/actualites">Actualités</Link>
            </li>
            <li>
              <Link href="/offres-emploi">Offres d&apos;emploi</Link>
            </li>
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h2 id="footer-contact">Contact</h2>
          <ul className="footer-links" aria-labelledby="footer-contact">
            <li>
              {addressLines.map((line, i) => (
                <span key={line}>
                  {line}
                  {i < addressLines.length - 1 && <br />}
                </span>
              ))}
            </li>
            <li>
              <a href="mailto:contact@open.pf">contact@open.pf</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom container">
        <span>© OPEN – Organisation des Professionnels de l&apos;Économie Numérique</span>
        <span>
          <Link href="/mentions-legales">Mentions légales</Link>
          {' · '}
          <Link href="/confidentialite">Politique de confidentialité</Link>
          {' · '}
          <Link href="/politique-cookies">Politique de cookies</Link>
        </span>
      </div>
    </footer>
  )
}
