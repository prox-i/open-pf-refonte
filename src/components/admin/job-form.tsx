'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { upsertJob } from '@/lib/actions/admin/content'

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  contractType: z.string().optional().or(z.literal('')),
  salary: z.string().optional().or(z.literal('')),
  applicationUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  applicationEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  metaDescription: z.string().max(160).optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'closed']),
})

type FormData = z.infer<typeof schema>

interface JobFormProps {
  id?: string
  initialData?: Partial<FormData>
}

export function JobForm({ id, initialData }: JobFormProps) {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      location: initialData?.location ?? '',
      contractType: initialData?.contractType ?? '',
      salary: initialData?.salary ?? '',
      applicationUrl: initialData?.applicationUrl ?? '',
      applicationEmail: initialData?.applicationEmail ?? '',
      metaDescription: initialData?.metaDescription ?? '',
      status: initialData?.status ?? 'draft',
    },
  })

  async function handleSubmit(data: FormData) {
    const result = await upsertJob(data, id)
    if (result.success) {
      router.push('/admin/offres-emploi')
      router.refresh()
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
      <div className="card" style={{ display: 'grid', gap: '20px' }}>
        <div className="form-field">
          <label htmlFor="title">Intitulé du poste *</label>
          <input id="title" type="text" {...form.register('title')} />
          {form.formState.errors.title && (
            <p className="field-error">{form.formState.errors.title.message}</p>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={8} {...form.register('description')} />
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="location">Localisation</label>
            <input
              id="location"
              type="text"
              placeholder="Papeete, Tahiti"
              {...form.register('location')}
            />
          </div>
          <div className="form-field">
            <label htmlFor="contractType">Type de contrat</label>
            <select id="contractType" {...form.register('contractType')}>
              <option value="">—</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stage">Stage</option>
              <option value="Alternance">Alternance</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="salary">Salaire indicatif</label>
            <input
              id="salary"
              type="text"
              placeholder="Selon profil"
              {...form.register('salary')}
            />
          </div>
          <div className="form-field">
            <label htmlFor="applicationEmail">Email de candidature</label>
            <input id="applicationEmail" type="email" {...form.register('applicationEmail')} />
          </div>
          <div className="form-field">
            <label htmlFor="applicationUrl">URL de candidature</label>
            <input id="applicationUrl" type="url" {...form.register('applicationUrl')} />
          </div>
          <div className="form-field">
            <label htmlFor="metaDescription">Meta description (160 car.)</label>
            <input
              id="metaDescription"
              type="text"
              maxLength={160}
              {...form.register('metaDescription')}
            />
          </div>
          <div className="form-field">
            <label htmlFor="status">Statut</label>
            <select id="status" {...form.register('status')}>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="closed">Clôturé</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
            Annuler
          </button>
          <button type="submit" className="btn" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? '…' : id ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </div>
    </form>
  )
}
