import type { Metadata } from 'next'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { news } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { ArrowIcon } from '@/components/public/arrow-icon'
import { DeleteRowButton } from '@/components/admin/delete-row-button'
import { deleteNews } from '@/lib/actions/admin/content'

export const metadata: Metadata = { title: 'Actualités — Admin OPEN PF' }

export default async function ActualitesAdminPage() {
  const db = getDb()
  const list = await db
    .select({
      id: news.id,
      title: news.title,
      status: news.status,
      publishedAt: news.publishedAt,
      updatedAt: news.updatedAt,
    })
    .from(news)
    // Tri sur la date de création (pas publishedAt, null pour les brouillons) :
    // toute nouvelle actu, brouillon ou publiée, remonte en haut du listing.
    .orderBy(desc(news.createdAt))

  return (
    <>
      <div className="admin-top">
        <h1>Actualités</h1>
        <Link href="/admin/actualites/new" className="btn">
          + Nouvelle actualité <ArrowIcon />
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {list.length === 0 ? (
          <p style={{ padding: '32px', color: 'var(--muted)', textAlign: 'center' }}>
            Aucune actualité.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Statut</th>
                <th>Publié le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((n) => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 600 }}>{n.title}</td>
                  <td>
                    <span className={`status-badge status-badge--${n.status}`}>
                      {n.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        href={`/admin/actualites/${n.id}`}
                        className="btn btn-secondary btn-small"
                      >
                        Éditer
                      </Link>
                      <DeleteRowButton
                        id={n.id}
                        action={deleteNews}
                        confirmMessage={`Supprimer définitivement l'actualité « ${n.title} » ?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
