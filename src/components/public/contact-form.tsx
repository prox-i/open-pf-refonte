'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { contactSchema, CONTACT_SUBJECTS, type ContactInput } from '@/lib/validations/contact'
import { submitContact } from '@/lib/actions/contact'

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', message: '', company: '', rgpdConsent: false },
  })

  async function onSubmit(data: ContactInput) {
    setServerError(null)
    const result = await submitContact(data)
    if (result.success) {
      setSubmitted(true)
      reset()
    } else if (result.message) {
      setServerError(result.message)
    } else if (result.errors) {
      setServerError('Veuillez corriger les champs en erreur.')
    }
  }

  if (submitted) {
    return (
      <div className="form-shell" role="status" aria-live="polite">
        <div className="contact-success">
          <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" className="contact-success__icon">
            <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="3" />
            <path
              d="m15 24 6 6 12-12"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 style={{ marginTop: '16px' }}>Message envoyé.</h2>
          <p style={{ marginTop: '10px' }}>
            Merci, nous avons bien reçu votre message et reviendrons vers vous dans les meilleurs
            délais.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '24px' }}
            onClick={() => setSubmitted(false)}
          >
            Envoyer un autre message
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="form-shell" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 id="contact-form-title">Envoyez-nous un message</h2>
      <p style={{ margin: '10px 0 24px' }}>Nous vous répondrons dans les meilleurs délais.</p>

      {/* Honeypot — visually hidden, off the tab order, ignored by humans */}
      <div aria-hidden="true" className="hp-field">
        <label htmlFor="contact-company">Ne pas remplir</label>
        <input
          id="contact-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('company')}
        />
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="contact-name">
            Nom complet <span className="required">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p className="field-error" id="contact-name-error">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="contact-email">
            Email <span className="required">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p className="field-error" id="contact-email-error">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="form-field" style={{ marginTop: '20px' }}>
        <label htmlFor="contact-subject">
          Sujet <span className="required">*</span>
        </label>
        <select
          id="contact-subject"
          defaultValue=""
          aria-invalid={errors.subject ? 'true' : undefined}
          aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
          {...register('subject')}
        >
          <option value="" disabled>
            Choisir un sujet
          </option>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p className="field-error" id="contact-subject-error">
            {errors.subject.message}
          </p>
        )}
      </div>

      <div className="form-field" style={{ marginTop: '20px' }}>
        <label htmlFor="contact-message">
          Message <span className="required">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={6}
          aria-invalid={errors.message ? 'true' : undefined}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          {...register('message')}
        />
        {errors.message && (
          <p className="field-error" id="contact-message-error">
            {errors.message.message}
          </p>
        )}
      </div>

      <div className="form-field" style={{ marginTop: '20px' }}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            aria-required="true"
            aria-invalid={errors.rgpdConsent ? 'true' : undefined}
            aria-describedby={errors.rgpdConsent ? 'contact-rgpd-error' : undefined}
            {...register('rgpdConsent')}
          />
          <span>
            J&apos;accepte que les informations transmises soient utilisées par OPEN PF pour
            traiter ma demande, conformément à notre{' '}
            <a href="/confidentialite" target="_blank" rel="noopener noreferrer">
              politique de confidentialité
            </a>
            . <span aria-hidden="true">*</span>
          </span>
        </label>
        {errors.rgpdConsent && (
          <p id="contact-rgpd-error" className="field-error" role="alert">
            {errors.rgpdConsent.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="field-error" role="alert" style={{ marginTop: '16px' }}>
          {serverError}
        </p>
      )}

      <button className="btn" type="submit" style={{ marginTop: '22px' }} disabled={isSubmitting}>
        {isSubmitting ? 'Envoi en cours…' : 'Envoyer le message'} <ArrowIcon />
      </button>
    </form>
  )
}
