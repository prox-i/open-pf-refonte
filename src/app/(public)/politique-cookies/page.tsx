import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de cookies',
  description: 'Politique de cookies du site OPEN PF.',
  alternates: { canonical: '/politique-cookies' },
  robots: { index: false },
}

export default function PolitiqueCookiesPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <nav className="breadcrumb" aria-label="Fil d'Ariane">
          <Link href="/">Accueil</Link> › Politique de cookies
        </nav>
        <h1 style={{ marginTop: '16px' }}>Politique de cookies</h1>
        <div className="card" style={{ marginTop: '32px' }}>
          <h2>Ce que nous utilisons</h2>
          <p style={{ marginTop: '12px' }}>
            Le site public d&apos;OPEN PF ne dépose aucun cookie de mesure d&apos;audience ni de
            publicité. Aucun outil de suivi tiers n&apos;est utilisé sur les pages publiques.
          </p>
          <h2 style={{ marginTop: '24px' }}>Cookie strictement nécessaire</h2>
          <p style={{ marginTop: '12px' }}>
            Un cookie de session est déposé uniquement lorsqu&apos;un administrateur se connecte au
            back-office (<code>/admin</code>). Il permet de maintenir la connexion et est
            indispensable au fonctionnement de cet espace réservé. Il n&apos;est jamais déposé pour
            un visiteur du site public.
          </p>
          <h2 style={{ marginTop: '24px' }}>Contenus tiers</h2>
          <p style={{ marginTop: '12px' }}>
            La carte affichée sur la page{' '}
            <Link href="/contact">Contact</Link> est fournie par OpenStreetMap, qui ne dépose pas de
            cookie.
          </p>
          <h2 style={{ marginTop: '24px' }}>Vos droits</h2>
          <p style={{ marginTop: '12px' }}>
            Pour toute question sur les cookies ou les données personnelles, contactez-nous à{' '}
            <a href="mailto:contact@open.pf">contact@open.pf</a>. Voir aussi notre{' '}
            <Link href="/confidentialite">politique de confidentialité</Link>.
          </p>
        </div>
      </div>
    </section>
  )
}
