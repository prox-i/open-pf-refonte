import type { Metadata } from 'next'
import Link from 'next/link'
import { and, asc, count, desc, eq, ilike, inArray, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { members, memberActivities } from '@/lib/db/schema'
import { AdherentsTable, type AdherentRow } from '@/components/admin/adherents-table'

export const metadata: Metadata = { title: 'Adhérents — Admin OPEN PF' }

const STATUS_FILTERS = ['', 'submitted', 'active', 'inactive', 'draft'] as const
const STATUS_LABELS: Record<string, string> = {
  submitted: 'En attente',
  active: 'Actif',
  inactive: 'Inactif',
  draft: 'Brouillon',
}
const PAGE_SIZE = 25
type SortCol = 'name' | 'status' | 'date'

interface PageProps {
  searchParams: Promise<{ q?: string; statut?: string; page?: string; sort?: string; dir?: string }>
}

export default async function AdherentsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search = (sp.q ?? '').trim()
  const statut = sp.statut ?? ''
  const sort: SortCol = (['name', 'status', 'date'] as const).includes(sp.sort as SortCol)
    ? (sp.sort as SortCol)
    : 'date'
  const dir: 'asc' | 'desc' = sp.dir === 'asc' ? 'asc' : 'desc'
  const currentPage = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const db = getDb()

  const conditions = [
    search ? ilike(members.name, `%${search}%`) : undefined,
    statut ? eq(members.status, statut as typeof members.status.enumValues[number]) : undefined,
  ].filter(Boolean)
  const whereClause = conditions.length ? and(...conditions) : undefined

  const sortCol =
    sort === 'name' ? members.name : sort === 'status' ? members.status : members.createdAt
  const orderBy = dir === 'asc' ? asc(sortCol) : desc(sortCol)

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
      logoUrl: members.logoUrl,
      description: members.description,
    })
    .from(members)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE)

  // Nombre de domaines par adhérent (pour « fiche complète »).
  const ids = list.map((m) => m.id)
  const domainCounts = ids.length
    ? await db
        .select({ memberId: memberActivities.memberId, n: sql<number>`count(*)::int` })
        .from(memberActivities)
        .where(inArray(memberActivities.memberId, ids))
        .groupBy(memberActivities.memberId)
    : []
  const domainMap = new Map(domainCounts.map((d) => [d.memberId, d.n]))

  const rows: AdherentRow[] = list.map((m) => ({
    id: m.id,
    name: m.name,
    status: m.status,
    dateLabel: m.submittedAt ? new Date(m.submittedAt).toLocaleDateString('fr-FR') : '—',
    // Fiche « complète » : logo + description + au moins un domaine d'activité.
    complete: Boolean(m.logoUrl) && Boolean(m.description) && (domainMap.get(m.id) ?? 0) > 0,
  }))

  function filterHref(targetStatut: string) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (targetStatut) params.set('statut', targetStatut)
    if (sort !== 'date') params.set('sort', sort)
    if (dir !== 'desc') params.set('dir', dir)
    const qs = params.toString()
    return qs ? `/admin/adherents?${qs}` : '/admin/adherents'
  }
  function pageHref(target: number) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statut) params.set('statut', statut)
    if (sort !== 'date') params.set('sort', sort)
    if (dir !== 'desc') params.set('dir', dir)
    if (target > 1) params.set('page', String(target))
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

      <AdherentsTable rows={rows} sort={sort} dir={dir} q={search} statut={statut} />

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
