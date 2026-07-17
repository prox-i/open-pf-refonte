import type { Metadata } from 'next'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { jobOffers } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { DeleteRowButton } from '@/components/admin/delete-row-button'
import { deleteJob } from '@/lib/actions/admin/content'

export const metadata: Metadata = { title: "Offres d'emploi — Admin OPEN PF" }

export default async function OffresAdminPage() {
  const db = getDb()
  const list = await db
    .select({
      id: jobOffers.id,
      title: jobOffers.title,
      status: jobOffers.status,
      contractType: jobOffers.contractType,
      publishedAt: jobOffers.publishedAt,
    })
    .from(jobOffers)
    .orderBy(desc(jobOffers.updatedAt))

  return (
    <>
      <div className="admin-top">
        <h1>Offres d&apos;emploi</h1>
        <Link href="/admin/offres-emploi/new" className="btn">
          + Nouvelle offre
        </Link>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {list.length === 0 ? (
          <p style={{ padding: '32px', color: 'var(--muted)', textAlign: 'center' }}>
            Aucune offre.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Poste</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Publié</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((j) => (
                <tr key={j.id}>
                  <td style={{ fontWeight: 600 }}>{j.title}</td>
                  <td style={{ color: 'var(--muted)' }}>{j.contractType ?? '—'}</td>
                  <td>
                    <span className={`status-badge status-badge--${j.status}`}>{j.status}</span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    {j.publishedAt ? new Date(j.publishedAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        href={`/admin/offres-emploi/${j.id}`}
                        className="btn btn-secondary btn-small"
                      >
                        Éditer
                      </Link>
                      <DeleteRowButton
                        id={j.id}
                        action={deleteJob}
                        confirmMessage={`Supprimer définitivement l'offre « ${j.title} » ?`}
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
