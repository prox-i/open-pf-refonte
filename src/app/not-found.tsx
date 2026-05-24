import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" role="main">
        <div className="not-found-page">
          <div className="not-found-inner">
            <span className="eyebrow">Erreur 404</span>
            <h1 style={{ marginTop: '16px' }}>Page introuvable.</h1>
            <p style={{ marginTop: '20px', maxWidth: '480px' }}>
              La page que vous cherchez n&apos;existe pas ou a été déplacée. Vérifiez l&apos;adresse
              ou explorez le réseau OPEN.
            </p>
            <div style={{ display: 'flex', gap: '14px', marginTop: '32px', flexWrap: 'wrap' }}>
              <Link href="/" className="btn">
                Retour à l&apos;accueil <ArrowIcon />
              </Link>
              <Link href="/adherents" className="btn btn-secondary">
                Voir les adhérents <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
