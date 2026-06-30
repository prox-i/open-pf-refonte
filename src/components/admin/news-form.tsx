'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { upsertNews } from '@/lib/actions/admin/content'

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  slug: z.string().optional().or(z.literal('')),
  excerpt: z.string().optional().or(z.literal('')),
  content: z.string().optional().or(z.literal('')),
  authorName: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  metaDescription: z.string().max(160).optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
})

type FormData = z.infer<typeof schema>

interface NewsFormProps {
  id?: string
  initialData?: Partial<FormData>
}

export function NewsForm({ id, initialData }: NewsFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? '',
      slug: initialData?.slug ?? '',
      excerpt: initialData?.excerpt ?? '',
      content: initialData?.content ?? '',
      authorName: initialData?.authorName ?? '',
      imageUrl: initialData?.imageUrl ?? '',
      metaDescription: initialData?.metaDescription ?? '',
      status: initialData?.status ?? 'draft',
    },
  })

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/news-image', { method: 'POST', body: fd })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Erreur upload')
      form.setValue('imageUrl', json.url, { shouldValidate: true })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(false)
      // reset input so same file can be re-selected
      e.target.value = ''
    }
  }

  async function handleSubmit(data: FormData) {
    const result = await upsertNews(data, id)
    if (result.success) {
      router.push('/admin/actualites')
      router.refresh()
    }
  }

  const previewUrl = form.watch('imageUrl')

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
      <div className="card" style={{ display: 'grid', gap: '20px' }}>
        <div className="form-field">
          <label htmlFor="title">Titre *</label>
          <input id="title" type="text" {...form.register('title')} />
          {form.formState.errors.title && (
            <p className="field-error">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="slug">URL de l’article (slug)</label>
          <input id="slug" type="text" placeholder="ex. voeux-2025" {...form.register('slug')} />
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            Laisser vide pour générer automatiquement depuis le titre. Modifier le slug change l’URL
            publique de l’article.
          </p>
        </div>

        <div className="form-field">
          <label htmlFor="excerpt">Extrait</label>
          <textarea id="excerpt" rows={3} {...form.register('excerpt')} />
        </div>

        <div className="form-field">
          <label htmlFor="content">Contenu</label>
          <textarea id="content" rows={10} {...form.register('content')} />
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            Markdown supporté : <code>**gras**</code>, <code>[lien](https://…)</code>, listes avec{' '}
            <code>- </code>, sous-titres avec <code>## </code>.
          </p>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="authorName">Auteur</label>
            <input id="authorName" type="text" {...form.register('authorName')} />
          </div>

          <div className="form-field">
            <label>Image</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                id="imageUrl"
                type="url"
                placeholder="https://… ou choisissez un fichier →"
                style={{ flex: 1, minWidth: 0 }}
                {...form.register('imageUrl')}
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
                onChange={handleImageFile}
              />
            </div>
            {uploadError && <p className="field-error">{uploadError}</p>}
            {form.formState.errors.imageUrl && (
              <p className="field-error">{form.formState.errors.imageUrl.message}</p>
            )}
            {previewUrl && (
              <img
                src={previewUrl}
                alt=""
                style={{ marginTop: '8px', maxHeight: '100px', borderRadius: '8px', objectFit: 'cover' }}
                referrerPolicy="no-referrer"
              />
            )}
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              Fichier auto-converti en WebP (JPEG / PNG / WebP, max 5 Mo)
            </p>
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
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
            Annuler
          </button>
          <button type="submit" className="btn" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Enregistrement…' : id ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </div>
    </form>
  )
}
