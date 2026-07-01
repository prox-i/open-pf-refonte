'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Stepper } from './stepper'
import { ArrowIcon } from '@/components/public/arrow-icon'
import {
  adhesionSchema,
  stepEntrepriseSchema,
  stepActivitesSchema,
  type AdhesionData,
} from '@/lib/validations/adhesion'
import { submitAdhesion } from '@/lib/actions/adhesion'
import { StepEntreprise } from './step-entreprise'
import { StepContacts } from './step-contacts'
import { StepActivites } from './step-activites'
import { StepCertifications } from './step-certifications'
import { StepRecap } from './step-recap'
import { ADHESION_STEPS } from '@/lib/data/adhesion-steps'

const DRAFT_KEY = 'adhesion-draft'

/**
 * Renvoie le chemin (ex. `name`, `contacts.0.email`) du premier champ en erreur,
 * pour pouvoir le focaliser / faire défiler la vue jusqu'à lui (REC-038).
 */
function firstErrorPath(errors: Record<string, unknown>, prefix = ''): string | undefined {
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== 'object') continue
    const path = prefix ? `${prefix}.${key}` : key
    if ('message' in value && 'type' in value) return path // FieldError feuille
    const nested = firstErrorPath(value as Record<string, unknown>, path)
    if (nested) return nested
  }
  return undefined
}

interface AdhesionFormProps {
  onSuccess?: (slug: string) => void
  onClose?: () => void
}

export function AdhesionForm({ onSuccess, onClose }: AdhesionFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<AdhesionData>({
    resolver: zodResolver(adhesionSchema),
    defaultValues: {
      name: '',
      legalStatus: '',
      tahitiNumber: '',
      websiteUrl: '',
      description: '',
      isMedefMember: false,
      activityDomains: [],
      certifications: [],
      contacts: [{ name: '', role: '', email: '', phone: '', isPrimary: true }],
      rgpdConsent: false,
    },
    mode: 'onTouched',
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AdhesionData>
        form.reset({ ...form.getValues(), ...parsed })
      }
    } catch {
      // ignore corrupted draft
    }
  }, [form])

  useEffect(() => {
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
      } catch {
        // ignore storage errors
      }
    })
    return () => sub.unsubscribe()
  }, [form])

  // À chaque changement d'étape, revenir en haut du formulaire. Sans cela, la
  // vue restait en bas de page (l'étape suivante, plus courte, laissait le scroll
  // sur le footer) → impression d'être « envoyé au footer ».
  const shellRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    shellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])

  async function handleNext() {
    setServerError(null)
    let valid = false

    if (step === 1) {
      valid = await form.trigger(
        Object.keys(stepEntrepriseSchema.shape) as (keyof AdhesionData)[],
      )
    } else if (step === 2) {
      valid = await form.trigger(['contacts'])
      if (valid && !form.getValues('contacts').some((c) => c.isPrimary)) {
        setServerError('Un contact principal doit être désigné')
        valid = false
      }
    } else if (step === 3) {
      valid = await form.trigger(
        Object.keys(stepActivitesSchema.shape) as (keyof AdhesionData)[],
      )
    } else if (step === 4) {
      valid = true // certifications are optional
    }

    if (valid) {
      setStep((s) => s + 1)
      return
    }

    // REC-038 : retour visuel explicite quand l'étape est invalide — sans cela,
    // « Suivant » paraît ne rien faire. On focalise + défile vers le 1er champ en
    // erreur et on affiche un message global (sauf si un message a déjà été posé).
    const path = firstErrorPath(form.formState.errors as Record<string, unknown>)
    if (path) {
      form.setFocus(path as keyof AdhesionData, { shouldSelect: true })
    }
    setServerError((prev) => prev ?? 'Certains champs sont à corriger avant de continuer.')
  }

  // MOB-023 : sur les champs simples, Entrée passe au champ suivant (et déclenche
  // l'étape suivante sur le dernier champ) au lieu de paraître inerte. Le textarea
  // n'est pas intercepté : Entrée y insère bien un saut de ligne.
  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter') return
    const target = e.target
    if (!(target instanceof HTMLInputElement)) return
    if (target.type === 'submit' || target.type === 'button') return
    e.preventDefault()
    const focusables = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        'input:not([type=hidden]):not([disabled]), select, textarea',
      ),
    )
    const index = focusables.indexOf(target)
    const next = index >= 0 ? focusables[index + 1] : undefined
    if (next) {
      next.focus()
    } else {
      void handleNext()
    }
  }

  async function handleSubmit(data: AdhesionData) {
    setIsSubmitting(true)
    setServerError(null)
    try {
      const result = await submitAdhesion(data)
      setIsSubmitting(false)
      if (!result.success) {
        const firstError = Object.values(result.errors)[0]?.[0]
        setServerError(firstError ?? 'Une erreur est survenue. Réessayez.')
        return
      }
      localStorage.removeItem(DRAFT_KEY)
      setSubmitted(true)
      onSuccess?.(result.slug)
    } catch {
      setIsSubmitting(false)
      setServerError('Une erreur est survenue. Veuillez réessayer dans quelques instants.')
    }
  }

  function handleInvalid() {
    const errs = form.formState.errors
    const keys = Object.keys(errs)
    if (keys.length === 1 && keys[0] === 'rgpdConsent') {
      setServerError('Veuillez accepter la politique de confidentialité ci-dessus.')
    } else {
      setServerError('Certains champs sont invalides. Vérifiez les étapes précédentes.')
    }
  }

  if (submitted) {
    return (
      <div className="adhesion-success">
        <div className="adhesion-success-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
            <circle cx="24" cy="24" r="24" fill="var(--open-magenta)" opacity=".12" />
            <path
              d="M14 24l7 7 13-13"
              stroke="var(--open-magenta)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2>Demande envoyée !</h2>
        <p>
          Votre demande d&apos;adhésion a été transmise au bureau d&apos;OPEN. Vous recevrez une
          confirmation par email sous 48 h.
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            onClose?.()
            router.push('/')
          }}
        >
          Retour à l&apos;accueil <ArrowIcon />
        </button>
      </div>
    )
  }

  return (
    <div className="adhesion-shell" ref={shellRef}>
      <Stepper steps={ADHESION_STEPS} currentStep={step} />

      <form
        onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
        onKeyDown={handleFormKeyDown}
        noValidate
      >
        {step === 1 && <StepEntreprise form={form} />}
        {step === 2 && <StepContacts form={form} />}
        {step === 3 && <StepActivites form={form} />}
        {step === 4 && <StepCertifications form={form} />}
        {step === 5 && <StepRecap form={form} />}

        {serverError && (
          <p className="form-server-error" role="alert">
            {serverError}
          </p>
        )}

        <div className="form-actions">
          {step > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setServerError(null)
                setStep((s) => s - 1)
              }}
            >
              Précédent
            </button>
          )}
          {step < 5 ? (
            <button type="button" className="btn" onClick={handleNext}>
              Suivant <ArrowIcon />
            </button>
          ) : (
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
              {!isSubmitting && <ArrowIcon />}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
