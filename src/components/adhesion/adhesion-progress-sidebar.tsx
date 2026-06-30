import Link from 'next/link'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { ADHESION_STEPS } from '@/lib/data/adhesion-steps'

export function AdhesionProgressSidebar() {
  return (
    <aside className="adhesion-progress-sidebar" aria-label="Guide du formulaire d'adhésion">
      <div className="adhesion-progress-card">
        <p className="adhesion-progress-card-title">Étapes du formulaire</p>
        <ol className="adhesion-step-list">
          {ADHESION_STEPS.map((step, i) => (
            <li key={step.label} className="adhesion-step-item">
              <span className="adhesion-step-badge" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <span className="adhesion-step-name">{step.label}</span>
                <span className="adhesion-step-desc">{step.description}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="adhesion-advisory-card">
        <h3>Besoin d&apos;aide ?</h3>
        <p>
          Notre équipe répond à toutes vos questions sur l&apos;adhésion au réseau OPEN PF.
        </p>
        <Link href="/contact" className="btn btn-secondary btn-small">
          Nous contacter <ArrowIcon />
        </Link>
      </div>
    </aside>
  )
}
