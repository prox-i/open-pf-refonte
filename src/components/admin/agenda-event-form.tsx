'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { agendaEventSchema, type AgendaEventData } from '@/lib/validations/admin'
import { deleteAgendaEvent, upsertAgendaEvent } from '@/lib/actions/admin/agenda'
import { RichTextEditor } from './rich-text-editor'

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
      content: initialData?.content ?? '',
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'grid', gap: '20px' }}>
      {/* ── Bloc 1 : ce qui apparaît dans l'agenda de la home ── */}
      <section className="card admin-form-block" style={{ display: 'grid', gap: '20px' }}>
        <header className="admin-form-block-head">
          <h2>1. Informations de l’agenda</h2>
          <p>Ce qui s’affiche dans la carte « Agenda OPEN » de la page d’accueil.</p>
        </header>

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
            <label htmlFor="sortOrder">Ordre d’affichage (optionnel)</label>
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
            <label htmlFor="isPublished">Statut</label>
            <select
              id="isPublished"
              defaultValue={initialData?.isPublished ? 'published' : 'draft'}
              onChange={(e) => form.setValue('isPublished', e.target.value === 'published')}
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </div>
          <div className="form-field" style={{ justifyContent: 'flex-end' }}>
            <label className="checkbox-label">
              <input type="checkbox" {...register('showOnHome')} />
              <span>Afficher dans l’agenda de la home</span>
            </label>
          </div>
        </div>
      </section>

      {/* ── Bloc 2 : page de détail optionnelle ── */}
      <section className="card admin-form-block" style={{ display: 'grid', gap: '20px' }}>
        <header className="admin-form-block-head">
          <h2>2. Page de détail (optionnelle)</h2>
          <p>
            Si vous rédigez un contenu ci-dessous, un bouton « Voir plus » mènera à une page dédiée
            (<code>/agenda/…</code>). Sinon, vous pouvez pointer vers une URL externe. Laissez tout
            vide pour un simple événement annoncé, sans lien.
          </p>
        </header>

        <div className="form-field">
          <label>Contenu de la page de détail</label>
          <RichTextEditor
            value={form.watch('content') ?? ''}
            onChange={(html) => form.setValue('content', html, { shouldDirty: true })}
          />
          {errors.content && <p className="field-error">{errors.content.message}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="detailUrl">…ou une URL externe (au lieu d’une page de détail)</label>
          <input id="detailUrl" type="url" placeholder="https://…" {...register('detailUrl')} />
          {errors.detailUrl && <p className="field-error">{errors.detailUrl.message}</p>}
          <label className="checkbox-label" style={{ marginTop: '10px' }}>
            <input type="checkbox" {...register('isExternalUrl')} />
            <span>Lien externe (ouvre dans un nouvel onglet)</span>
          </label>
        </div>
      </section>

      {serverError && (
        <p className="field-error" role="alert">
          {serverError}
        </p>
      )}

      <div className="form-actions" style={{ justifyContent: 'space-between', marginTop: 0 }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/agenda')}>
            Annuler
          </button>
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : id ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
        {id && (
          <button type="button" className="btn btn-danger" disabled={deleting} onClick={onDelete}>
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        )}
      </div>
    </form>
  )
}
