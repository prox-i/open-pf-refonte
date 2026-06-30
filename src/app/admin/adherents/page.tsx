import type { Metadata } from 'next'
import Link from 'next/link'
import { and, count, desc, eq, ilike } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { members } from '@/lib/db/schema'

export const metadata: Metadata = { title: 'Adhérents — Admin OPEN PF' }

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'En attente',
  active: 'Actif',
  inactive: 'Inactif',
}

const STATUS_FILTERS = ['', 'submitted', 'active', 'inactive', 'draft'] as const
const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ q?: string; statut?: string; page?: string }>
}

export default async function AdherentsPage({ searchParams }: PageProps) {
  const { q = '', statut = '', page = '1' } = await searchParams
  const search = q.trim()
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)
  const db = getDb()

  // BO-015 : recherche par nom + filtre statut + pagination, côté serveur.
  const conditions = [
    search ? ilike(members.name, `%${search}%`) : undefined,
    statut ? eq(members.status, statut as typeof members.status.enumValues[number]) : undefined,
  ].filter(Boolean)
  const whereClause = conditions.length ? and(...conditions) : undefined

  const [{ total } = { total: 0 }] = await db
    .select({ total: count() })
    .from(members)
    .where(whereClause)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const list = await db
    .select({
      id: members.id,
      name: members.name,
      status: members.status,
      submittedAt: members.submittedAt,
      reviewedAt: members.reviewedAt,
    })
    .from(members)
    .where(whereClause)
    .orderBy(desc(members.createdAt))
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE)

  function pageHref(targetPage: number) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statut) params.set('statut', statut)
    if (targetPage > 1) params.set('page', String(targetPage))
    const qs = params.toString()
    return qs ? `/admin/adherents?${qs}` : '/admin/adherents'
  }

  function filterHref(targetStatut: string) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (targetStatut) params.set('statut', targetStatut)
    const qs = params.toString()
    return qs ? `/admin/adherents?${qs}` : '/admin/adherents'
  }

  return (
    <>
      <div className="admin-top">
        <h1>Adhérents</h1>
        <span style={{ color: 'var(--muted)', fontSize: '14px' }}>{total} entreprises</span>
      </div>

      <div className="admin-list-toolbar">
        <form method="GET" action="/admin/adherents" role="search" className="admin-search">
          {statut && <input type="hidden" name="statut" value={statut} />}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Rechercher une entreprise…"
            aria-label="Rechercher une entreprise"
          />
          <button type="submit" className="btn btn-secondary btn-small">
            Rechercher
          </button>
        </form>
        <div className="admin-filters">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s || 'all'}
              href={filterHref(s)}
              className={`filter-chip${statut === s ? ' active' : ''}`}
              aria-current={statut === s ? 'page' : undefined}
            >
              {s ? STATUS_LABELS[s] : 'Tous'}
            </Link>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Statut</th>
              <th>Déposé</th>
              <th>Validé</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                  Aucun adhérent ne correspond à ces critères.
                </td>
              </tr>
            ) : (
              list.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td>
                    <span className={`status-badge status-badge--${m.status}`}>
                      {STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    {m.submittedAt ? new Date(m.submittedAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    {m.reviewedAt ? new Date(m.reviewedAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td>
                    <Link href={`/admin/adherents/${m.id}`} className="btn btn-secondary btn-small">
                      Voir
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="admin-pagination" aria-label="Pagination">
          {currentPage > 1 && (
            <Link href={pageHref(currentPage - 1)} className="btn btn-secondary btn-small">
              ← Précédent
            </Link>
          )}
          <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Page {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link href={pageHref(currentPage + 1)} className="btn btn-secondary btn-small">
              Suivant →
            </Link>
          )}
        </nav>
      )}
    </>
  )
}
