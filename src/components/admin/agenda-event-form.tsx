'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { agendaEventSchema, type AgendaEventData } from '@/lib/validations/admin'
import { deleteAgendaEvent, upsertAgendaEvent } from '@/lib/actions/admin/agenda'

interface AgendaEventFormProps {
  id?: string
  initialData?: Partial<AgendaEventData>
}

export function AgendaEventForm({ id, initialData }: AgendaEventFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<AgendaEventData>({
    resolver: zodResolver(agendaEventSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      eventDate: initialData?.eventDate ?? '',
      startTime: initialData?.startTime ?? '',
      location: initialData?.location ?? '',
      detailUrl: initialData?.detailUrl ?? '',
      isExternalUrl: initialData?.isExternalUrl ?? false,
      isPublished: initialData?.isPublished ?? false,
      showOnHome: initialData?.showOnHome ?? true,
      sortOrder: initialData?.sortOrder ?? 0,
    },
  })
  const { register, handleSubmit, formState } = form
  const { errors, isSubmitting } = formState

  async function onSubmit(data: AgendaEventData) {
    setServerError(null)
    const result = await upsertAgendaEvent(data, id)
    if (result.success) {
      router.push('/admin/agenda')
      router.refresh()
      return
    }
    setServerError(result.error ?? 'Enregistrement impossible.')
  }

  async function onDelete() {
    if (!id) return
    if (!window.confirm('Supprimer définitivement cet événement ?')) return
    setDeleting(true)
    await deleteAgendaEvent(id)
    router.push('/admin/agenda')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="card" style={{ display: 'grid', gap: '20px' }}>
        <div className="form-field">
          <label htmlFor="title">Titre *</label>
          <input id="title" type="text" {...register('title')} />
          {errors.title && <p className="field-error">{errors.title.message}</p>}
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="eventDate">Date *</label>
            <input id="eventDate" type="date" {...register('eventDate')} />
            {errors.eventDate && <p className="field-error">{errors.eventDate.message}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="startTime">Heure (optionnel)</label>
            <input id="startTime" type="time" {...register('startTime')} />
            {errors.startTime && <p className="field-error">{errors.startTime.message}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="location">Lieu (optionnel)</label>
            <input id="location" type="text" {...register('location')} />
          </div>
          <div className="form-field">
            <label htmlFor="sortOrder">Ordre (optionnel)</label>
            <input
              id="sortOrder"
              type="number"
              min={0}
              {...register('sortOrder', { setValueAs: (v) => (v === '' || v == null ? 0 : Number(v)) })}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="description">Description courte (optionnel)</label>
          <textarea id="description" rows={3} {...register('description')} />
          {errors.description && <p className="field-error">{errors.description.message}</p>}
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="detailUrl">URL de détail (optionnel)</label>
            <input id="detailUrl" type="url" placeholder="https://…" {...register('detailUrl')} />
            {errors.detailUrl && <p className="field-error">{errors.detailUrl.message}</p>}
            <label className="checkbox-label" style={{ marginTop: '10px' }}>
              <input type="checkbox" {...register('isExternalUrl')} />
              <span>Lien externe (ouvre dans un nouvel onglet)</span>
            </label>
          </div>
          <div className="form-field">
            <label htmlFor="isPublished">Statut</label>
            <select
              id="isPublished"
              defaultValue={initialData?.isPublished ? 'published' : 'draft'}
              onChange={(e) => form.setValue('isPublished', e.target.value === 'published')}
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
            <label className="checkbox-label" style={{ marginTop: '12px' }}>
              <input type="checkbox" {...register('showOnHome')} />
              <span>Afficher dans l’agenda de la home</span>
            </label>
          </div>
        </div>

        {serverError && (
          <p className="field-error" role="alert">
            {serverError}
          </p>
        )}

        <div className="form-actions" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/agenda')}>
              Annuler
            </button>
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : id ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
          {id && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={deleting}
              onClick={onDelete}
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
