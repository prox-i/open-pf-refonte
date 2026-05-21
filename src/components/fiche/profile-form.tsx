'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { ACTIVITY_DOMAINS, CERTIFICATIONS } from '@/lib/data/referentials'
import { memberProfileSchema, type MemberProfileData } from '@/lib/validations/member-profile'
import { saveMemberProfileDraft, submitMemberProfile } from '@/lib/actions/member-profile'

const AUTOSAVE_DEBOUNCE_MS = 2000

interface ProfileFormProps {
  token: string
  initialData: MemberProfileData & { name: string }
}

export function ProfileForm({ token, initialData }: ProfileFormProps) {
  const [logoPreview, setLogoPreview] = useState<string>(initialData.logoUrl ?? '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [submitted, setSubmitted] = useState(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<MemberProfileData>({
    resolver: zodResolver(memberProfileSchema),
    defaultValues: {
      description: initialData.description ?? '',
      websiteUrl: initialData.websiteUrl ?? '',
      linkedinUrl: initialData.linkedinUrl ?? '',
      address: initialData.address ?? '',
      yearFounded: initialData.yearFounded,
      employeeCount: initialData.employeeCount,
      logoUrl: initialData.logoUrl ?? '',
      activityDomains: initialData.activityDomains ?? [],
      certifications: initialData.certifications ?? [],
      certificationOtherLabel: initialData.certificationOtherLabel ?? '',
    },
    mode: 'onTouched',
  })

  // Auto-save draft on changes (debounced)
  useEffect(() => {
    const sub = form.watch((values) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      autosaveTimer.current = setTimeout(async () => {
        setSaveStatus('saving')
        await saveMemberProfileDraft(token, values)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, AUTOSAVE_DEBOUNCE_MS)
    })
    return () => {
      sub.unsubscribe()
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [form, token])

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoError(null)
    setLogoUploading(true)

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/upload/logo', {
      method: 'POST',
      headers: { 'x-magic-token': token },
      body: fd,
    })

    setLogoUploading(false)

    if (!res.ok) {
      const json = (await res.json()) as { error?: string }
      setLogoError(json.error ?? 'Erreur lors du téléversement')
      return
    }

    const json = (await res.json()) as { url: string }
    setLogoPreview(json.url)
    form.setValue('logoUrl', json.url, { shouldDirty: true })
  }

  async function handleSubmit(data: MemberProfileData) {
    setServerError(null)
    const result = await submitMemberProfile(token, data)
    if (!result.success) {
      const first = Object.values(result.errors)[0]?.[0]
      setServerError(first ?? 'Une erreur est survenue.')
      return
    }
    setSubmitted(true)
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
        <h2>Fiche envoyée !</h2>
        <p>
          Votre fiche a été transmise au bureau d&apos;OPEN. Elle sera publiée dans l&apos;annuaire
          après validation, généralement sous 48 h.
        </p>
      </div>
    )
  }

  const watchCerts = form.watch('certifications')
  const showOtherCert = watchCerts.includes('autre')

  return (
    <div className="profile-form-shell">
      <div className="profile-form-header">
        <h1>{initialData.name}</h1>
        <p className="profile-form-autosave">
          {saveStatus === 'saving' && <span className="autosave-saving">Enregistrement…</span>}
          {saveStatus === 'saved' && <span className="autosave-saved">✓ Brouillon sauvegardé</span>}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
        {/* Logo */}
        <section className="profile-section">
          <h2 className="profile-section-title">Logo</h2>
          <div className="logo-upload-area">
            {logoPreview ? (
              <div className="logo-preview">
                <Image
                  src={logoPreview}
                  alt="Logo"
                  width={120}
                  height={80}
                  style={{ objectFit: 'contain' }}
                  unoptimized
                />
              </div>
            ) : (
              <div className="logo-placeholder" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
                  <rect width="48" height="48" rx="12" fill="var(--line)" />
                  <path d="M14 32l9-9 5 5 4-4 6 8H14z" fill="var(--muted)" opacity=".5" />
                  <circle cx="30" cy="18" r="4" fill="var(--muted)" opacity=".5" />
                </svg>
              </div>
            )}
            <div>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading}
              >
                {logoUploading
                  ? 'Téléversement…'
                  : logoPreview
                    ? 'Changer le logo'
                    : 'Ajouter un logo'}
              </button>
              <p className="help-text">JPEG, PNG, WebP ou SVG — 2 Mo max.</p>
              {logoError && <p className="field-error">{logoError}</p>}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleLogoChange}
            style={{ display: 'none' }}
            aria-label="Sélectionner un logo"
          />
        </section>

        {/* Présentation */}
        <section className="profile-section">
          <h2 className="profile-section-title">Présentation</h2>
          <div className="form-grid">
            <div className="form-field form-field--full">
              <label htmlFor="description">Description (1000 car. max.)</label>
              <textarea
                id="description"
                rows={5}
                maxLength={1000}
                placeholder="Décrivez votre activité, vos expertises et ce qui vous différencie…"
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="field-error">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="form-field form-field--full">
              <label htmlFor="address">Adresse</label>
              <input
                id="address"
                type="text"
                placeholder="Immeuble X, Rue Y, Papeete"
                {...form.register('address')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="websiteUrl">Site web</label>
              <input
                id="websiteUrl"
                type="url"
                placeholder="https://example.com"
                {...form.register('websiteUrl')}
              />
              {form.formState.errors.websiteUrl && (
                <p className="field-error">{form.formState.errors.websiteUrl.message}</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="linkedinUrl">LinkedIn</label>
              <input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/company/…"
                {...form.register('linkedinUrl')}
              />
              {form.formState.errors.linkedinUrl && (
                <p className="field-error">{form.formState.errors.linkedinUrl.message}</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="yearFounded">Année de création</label>
              <input
                id="yearFounded"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                placeholder="2010"
                {...form.register('yearFounded', { valueAsNumber: true })}
              />
            </div>

            <div className="form-field">
              <label htmlFor="employeeCount">Nombre de salariés</label>
              <input
                id="employeeCount"
                type="number"
                min="0"
                placeholder="10"
                {...form.register('employeeCount', { valueAsNumber: true })}
              />
            </div>
          </div>
        </section>

        {/* Domaines d'activité */}
        <section className="profile-section">
          <h2 className="profile-section-title">
            Domaines d&apos;activité <span aria-hidden="true">*</span>
          </h2>
          {form.formState.errors.activityDomains && (
            <p className="field-error">{form.formState.errors.activityDomains.message}</p>
          )}
          <div className="domain-grid" role="group" aria-label="Domaines d'activité">
            {ACTIVITY_DOMAINS.map((domain) => (
              <label key={domain.id} className="domain-chip">
                <input type="checkbox" value={domain.id} {...form.register('activityDomains')} />
                <span>{domain.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Certifications */}
        <section className="profile-section">
          <h2 className="profile-section-title">Certifications &amp; labels</h2>
          <div className="domain-grid" role="group" aria-label="Certifications">
            {CERTIFICATIONS.map((cert) => (
              <label key={cert.id} className="domain-chip">
                <input type="checkbox" value={cert.id} {...form.register('certifications')} />
                <span>{cert.label}</span>
              </label>
            ))}
          </div>
          {showOtherCert && (
            <div className="form-field" style={{ marginTop: '16px', maxWidth: '400px' }}>
              <label htmlFor="certificationOtherLabel">Précisez la certification</label>
              <input
                id="certificationOtherLabel"
                type="text"
                placeholder="Nom de la certification…"
                {...form.register('certificationOtherLabel')}
              />
            </div>
          )}
        </section>

        {serverError && (
          <p className="form-server-error" role="alert">
            {serverError}
          </p>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => saveMemberProfileDraft(token, form.getValues())}
          >
            Sauvegarder le brouillon
          </button>
          <button type="submit" className="btn" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Envoi…' : 'Soumettre ma fiche'}
            {!form.formState.isSubmitting && <ArrowIcon />}
          </button>
        </div>
      </form>
    </div>
  )
}
