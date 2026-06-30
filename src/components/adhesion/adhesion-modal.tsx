'use client'

import { useEffect, useRef } from 'react'
import { AdhesionForm } from './adhesion-form'

interface AdhesionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdhesionModal({ isOpen, onClose }: AdhesionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // MOB-027 : verrouiller le scroll du body tant que la modale est ouverte
  // (la balise <dialog> native laisse défiler l'arrière-plan sur iOS).
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  // MOB-022 : recentrer le champ actif quand le clavier mobile s'ouvre, afin
  // qu'il ne soit pas masqué (la modale est à hauteur fixe).
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !isOpen) return
    function handleFocusIn(event: FocusEvent) {
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        // Laisse le clavier s'afficher avant de recentrer.
        window.setTimeout(() => {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }, 150)
      }
    }
    dialog.addEventListener('focusin', handleFocusIn)
    return () => dialog.removeEventListener('focusin', handleFocusIn)
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      className="adhesion-dialog"
      aria-label="Formulaire d'adhésion à OPEN PF"
      onClose={onClose}
    >
      {isOpen && (
        <div className="adhesion-dialog-inner">
          <button
            type="button"
            className="adhesion-dialog-close"
            aria-label="Fermer"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                fill="currentColor"
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="adhesion-dialog-header">
            <h2>Rejoindre OPEN PF</h2>
            <p>Remplissez ce formulaire pour soumettre votre demande d&apos;adhésion.</p>
          </div>
          <AdhesionForm onClose={onClose} />
        </div>
      )}
    </dialog>
  )
}
