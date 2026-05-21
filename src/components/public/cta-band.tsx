import Link from 'next/link'
import { ArrowIcon } from './arrow-icon'

export function CtaBand() {
  return (
    <section className="cta-band" aria-labelledby="cta-band-title">
      <div className="cta-inner container">
        <h2 id="cta-band-title">Votre entreprise fait le numérique polynésien. Rejoignez OPEN.</h2>
        <p>
          Ensemble, faisons grandir la filière, soutenons l&apos;innovation locale et construisons
          un avenir numérique durable pour la Polynésie française.
        </p>
        <Link href="/adhesion" className="btn btn-secondary">
          Adhérer à OPEN <ArrowIcon />
        </Link>
      </div>
    </section>
  )
}
