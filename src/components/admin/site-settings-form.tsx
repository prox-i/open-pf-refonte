'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { siteSettingsSchema, type SiteSettingsData } from '@/lib/validations/admin'
import { updateSiteSettings } from '@/lib/actions/admin/settings'

interface SiteSettingsFormProps {
  initial: SiteSettingsData
}

export function SiteSettingsForm({ initial }: SiteSettingsFormProps) {
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SiteSettingsData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: initial,
  })

  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  async function handleSubmit(data: SiteSettingsData) {
    setServerError(null)
    setSaved(false)
    const result = await updateSiteSettings(data)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      setServerError(result.error ?? 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate style={{ display: 'grid', gap: '24px' }}>
      <section className="card">
        <h2>Emails</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
          L&apos;email destinataire reçoit les messages du formulaire de contact et les relances de
          demandes d&apos;adhésion.
        </p>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="contactRecipientEmail">Email destinataire (interne) *</label>
            <input
              id="contactRecipientEmail"
              type="email"
              autoComplete="off"
              {...register('contactRecipientEmail')}
            />
            {errors.contactRecipientEmail && (
              <p className="field-error">{errors.contactRecipientEmail.message}</p>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="publicEmail">Email affiché publiquement *</label>
            <input id="publicEmail" type="email" autoComplete="off" {...register('publicEmail')} />
            {errors.publicEmail && <p className="field-error">{errors.publicEmail.message}</p>}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Coordonnées publiques</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
          Affichées sur la page Contact. Une ligne par retour à la ligne.
        </p>
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="form-field">
            <label htmlFor="publicAddress">Adresse *</label>
            <textarea id="publicAddress" rows={4} {...register('publicAddress')} />
            {errors.publicAddress && <p className="field-error">{errors.publicAddress.message}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="publicHours">Horaires *</label>
            <textarea id="publicHours" rows={3} {...register('publicHours')} />
            {errors.publicHours && <p className="field-error">{errors.publicHours.message}</p>}
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="facebookUrl">Lien Facebook</label>
              <input
                id="facebookUrl"
                type="url"
                placeholder="https://www.facebook.com/…"
                {...register('facebookUrl')}
              />
              {errors.facebookUrl && <p className="field-error">{errors.facebookUrl.message}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="linkedinUrl">Lien LinkedIn</label>
              <input
                id="linkedinUrl"
                type="url"
                placeholder="https://www.linkedin.com/company/…"
                {...register('linkedinUrl')}
              />
              {errors.linkedinUrl && <p className="field-error">{errors.linkedinUrl.message}</p>}
            </div>
          </div>
        </div>
      </section>

      {serverError && (
        <p className="field-error" role="alert">
          {serverError}
        </p>
      )}

      <div className="form-actions">
        {saved && <span style={{ color: 'var(--open-magenta)', fontWeight: 700 }}>✓ Enregistré</span>}
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
