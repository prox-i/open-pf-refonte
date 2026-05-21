import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-grid container">
        {/* Brand + description */}
        <div>
          <Link href="/" className="brand" aria-label="OPEN Polynésie française, accueil">
            <span className="open-logo-mark" aria-hidden="true" />
            <span>
              <span className="brand-word">OPEN</span>
              <span className="brand-sub">
                Organisation des Professionnels
                <br />
                de l&apos;Économie Numérique
              </span>
            </span>
          </Link>
          <p style={{ marginTop: '18px' }}>
            OPEN fédère les entreprises du numérique en Polynésie française pour représenter,
            promouvoir et développer la filière.
          </p>
        </div>

        {/* Le réseau */}
        <div>
          <h2>Le réseau</h2>
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
        </div>

        {/* Adhérents */}
        <div>
          <h2>Adhérents</h2>
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
        </div>

        {/* Ressources */}
        <div>
          <h2>Ressources</h2>
          <ul className="footer-links">
            <li>
              <Link href="/actualites">Actualités</Link>
            </li>
            <li>
              <Link href="/offres-emploi">Offres d&apos;emploi</Link>
            </li>
            <li>
              <Link href="/actualites">Documents utiles</Link>
            </li>
            <li>
              <Link href="/actualites">Événements</Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h2>Contact</h2>
          <ul className="footer-links">
            <li>
              Papeete, Tahiti
              <br />
              Polynésie française
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
        </span>
      </div>
    </footer>
  )
}
