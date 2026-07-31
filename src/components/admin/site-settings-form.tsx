'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { upload } from '@vercel/blob/client'
import { siteSettingsSchema, type SiteSettingsData } from '@/lib/validations/admin'
import { updateSiteSettings } from '@/lib/actions/admin/settings'
import { RichTextEditor } from './rich-text-editor'

interface SiteSettingsFormProps {
  initial: SiteSettingsData
}

export function SiteSettingsForm({ initial }: SiteSettingsFormProps) {
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const form = useForm<SiteSettingsData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: initial,
  })

  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  async function handleHeroImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      // Upload direct navigateur → Vercel Blob (pas de limite de body serverless).
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload/news-image',
      })
      form.setValue('homeHeroImageUrl', blob.url, { shouldValidate: true, shouldDirty: true })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const heroPreviewUrl = form.watch('homeHeroImageUrl')

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

      <section className="card">
        <h2>Image d&apos;accueil</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
          Illustration affichée dans le hero de la page d&apos;accueil. Laissez vide pour garder
          l&apos;image par défaut du site.
        </p>
        <div className="form-field">
          <label>Image</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              id="homeHeroImageUrl"
              type="url"
              placeholder="https://… ou choisissez un fichier →"
              style={{ flex: 1, minWidth: 0 }}
              {...register('homeHeroImageUrl')}
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? 'Conversion…' : 'Choisir'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleHeroImageFile}
            />
          </div>
          {uploadError && <p className="field-error">{uploadError}</p>}
          {errors.homeHeroImageUrl && <p className="field-error">{errors.homeHeroImageUrl.message}</p>}
          {heroPreviewUrl && (
            <img
              src={heroPreviewUrl}
              alt=""
              style={{ marginTop: '8px', maxHeight: '140px', borderRadius: '8px', objectFit: 'cover' }}
              referrerPolicy="no-referrer"
            />
          )}
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            JPEG / PNG / WebP, max 5 Mo. Format portrait recommandé (l&apos;image occupe ~50% du hero
            en desktop).
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Mentions légales</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
          Contenu de la page <code>/mentions-legales</code>. Laissez vide pour garder le contenu
          par défaut du site.
        </p>
        <div className="form-field">
          <RichTextEditor
            value={form.watch('legalNoticeContent') ?? ''}
            onChange={(html) => form.setValue('legalNoticeContent', html, { shouldDirty: true })}
          />
          {errors.legalNoticeContent && (
            <p className="field-error">{errors.legalNoticeContent.message}</p>
          )}
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
