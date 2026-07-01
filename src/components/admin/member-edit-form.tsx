'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { ACTIVITY_DOMAINS, CERTIFICATIONS } from '@/lib/data/referentials'
import { adminMemberEditSchema, type AdminMemberEditData } from '@/lib/validations/admin'
import { updateMemberByAdmin } from '@/lib/actions/admin/members'

interface MemberEditFormProps {
  memberId: string
  initialData: AdminMemberEditData
}

export function MemberEditForm({ memberId, initialData }: MemberEditFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<AdminMemberEditData>({
    resolver: zodResolver(adminMemberEditSchema),
    defaultValues: initialData,
  })
  const { register, handleSubmit, setValue, watch, formState } = form
  const { errors, isSubmitting } = formState

  const certifications = watch('certifications')
  const logoUrl = watch('logoUrl')

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const blob = await upload(`logos/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload/news-image',
      })
      setValue('logoUrl', blob.url, { shouldValidate: true, shouldDirty: true })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function onSubmit(data: AdminMemberEditData) {
    setServerError(null)
    const result = await updateMemberByAdmin(memberId, data)
    if (result.success) {
      router.push(`/admin/adherents/${memberId}`)
      router.refresh()
      return
    }
    setServerError(result.error ?? 'Enregistrement impossible.')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="card" style={{ display: 'grid', gap: '20px' }}>
        <div className="form-field">
          <label htmlFor="name">Nom de l’entreprise *</label>
          <input id="name" type="text" {...register('name')} />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={5} {...register('description')} />
          {errors.description && <p className="field-error">{errors.description.message}</p>}
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="websiteUrl">Site web</label>
            <input id="websiteUrl" type="url" placeholder="https://…" {...register('websiteUrl')} />
            {errors.websiteUrl && <p className="field-error">{errors.websiteUrl.message}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="linkedinUrl">LinkedIn</label>
            <input id="linkedinUrl" type="url" placeholder="https://linkedin.com/company/…" {...register('linkedinUrl')} />
            {errors.linkedinUrl && <p className="field-error">{errors.linkedinUrl.message}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="address">Adresse</label>
            <input id="address" type="text" {...register('address')} />
          </div>
          <div className="form-field">
            <label htmlFor="yearFounded">Année de création</label>
            <input
              id="yearFounded"
              type="number"
              {...register('yearFounded', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            {errors.yearFounded && <p className="field-error">{errors.yearFounded.message}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="employeeCount">Effectif</label>
            <input
              id="employeeCount"
              type="number"
              {...register('employeeCount', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            {errors.employeeCount && <p className="field-error">{errors.employeeCount.message}</p>}
          </div>
        </div>

        <div className="form-field">
          <label>Logo</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              id="logoUrl"
              type="url"
              placeholder="https://… ou choisissez un fichier →"
              style={{ flex: 1, minWidth: 0 }}
              {...register('logoUrl')}
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? 'Envoi…' : 'Choisir'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              style={{ display: 'none' }}
              onChange={handleLogoFile}
            />
          </div>
          {uploadError && <p className="field-error">{uploadError}</p>}
          {errors.logoUrl && <p className="field-error">{errors.logoUrl.message}</p>}
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              style={{ marginTop: '8px', maxHeight: '80px', borderRadius: '8px', objectFit: 'contain' }}
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        <fieldset className="form-field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, marginBottom: '8px' }}>Domaines d’activité *</legend>
          <div className="admin-check-grid">
            {ACTIVITY_DOMAINS.map((d) => (
              <label key={d.id} className="admin-check">
                <input type="checkbox" value={d.id} {...register('activityDomains')} />
                <span>{d.label}</span>
              </label>
            ))}
          </div>
          {errors.activityDomains && (
            <p className="field-error">{errors.activityDomains.message}</p>
          )}
        </fieldset>

        <fieldset className="form-field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, marginBottom: '8px' }}>Certifications</legend>
          <div className="admin-check-grid">
            {CERTIFICATIONS.map((c) => (
              <label key={c.id} className="admin-check">
                <input type="checkbox" value={c.id} {...register('certifications')} />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          {certifications?.includes('autre') && (
            <input
              type="text"
              placeholder="Préciser l’autre certification"
              style={{ marginTop: '10px' }}
              {...register('certificationOtherLabel')}
            />
          )}
        </fieldset>

        {serverError && (
          <p className="field-error" role="alert">
            {serverError}
          </p>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push(`/admin/adherents/${memberId}`)}
          >
            Annuler
          </button>
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </form>
  )
}
