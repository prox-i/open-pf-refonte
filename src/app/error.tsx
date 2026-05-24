'use client'

import { useEffect } from 'react'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface the error in the console for debugging / monitoring hooks.
    console.error(error)
  }, [error])

  return (
    <>
      <SiteHeader />
      <main id="contenu" role="main">
        <div className="not-found-page">
          <div className="not-found-inner">
            <span className="eyebrow">Une erreur est survenue</span>
            <h1 style={{ marginTop: '16px' }}>Quelque chose s&apos;est mal passé.</h1>
            <p style={{ marginTop: '20px', maxWidth: '480px' }}>
              Une erreur inattendue s&apos;est produite. Essayez de recharger la page ou revenez à
              l&apos;accueil.
            </p>
            {error.digest && (
              <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--muted)' }}>
                Code de référence&nbsp;: <code>{error.digest}</code>
              </p>
            )}
            <div style={{ display: 'flex', gap: '14px', marginTop: '32px', flexWrap: 'wrap' }}>
              <button type="button" className="btn" onClick={reset}>
                Réessayer <ArrowIcon />
              </button>
              <a href="/" className="btn btn-secondary">
                Retour à l&apos;accueil <ArrowIcon />
              </a>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
