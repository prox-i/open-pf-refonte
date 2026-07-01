'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteMembers } from '@/lib/actions/admin/members'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'En attente',
  active: 'Actif',
  inactive: 'Inactif',
}

export interface AdherentRow {
  id: string
  name: string
  status: string
  dateLabel: string
  complete: boolean
}

interface AdherentsTableProps {
  rows: AdherentRow[]
  sort: string
  dir: 'asc' | 'desc'
  q: string
  statut: string
}

export function AdherentsTable({ rows, sort, dir, q, statut }: AdherentsTableProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const allSelected = rows.length > 0 && selected.size === rows.length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  }

  async function handleBulkDelete() {
    const ids = [...selected]
    if (ids.length === 0) return
    if (!window.confirm(`Supprimer définitivement ${ids.length} adhérent(s) ? Cette action est irréversible.`)) return
    setDeleting(true)
    const result = await deleteMembers(ids)
    setDeleting(false)
    if (result.success) {
      setSelected(new Set())
      router.refresh()
    } else {
      window.alert(result.error ?? 'Erreur lors de la suppression.')
    }
  }

  function sortHref(column: string) {
    const nextDir = sort === column && dir === 'asc' ? 'desc' : 'asc'
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (statut) params.set('statut', statut)
    params.set('sort', column)
    params.set('dir', nextDir)
    return `/admin/adherents?${params.toString()}`
  }

  function sortArrow(column: string) {
    if (sort !== column) return ''
    return dir === 'asc' ? ' ▲' : ' ▼'
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span>{selected.size} sélectionné(s)</span>
          <button type="button" className="btn btn-danger btn-small" disabled={deleting} onClick={handleBulkDelete}>
            {deleting ? 'Suppression…' : 'Supprimer la sélection'}
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Tout sélectionner"
                />
              </th>
              <th>
                <Link href={sortHref('name')} className="sort-link">
                  Entreprise{sortArrow('name')}
                </Link>
              </th>
              <th>
                <Link href={sortHref('status')} className="sort-link">
                  Statut{sortArrow('status')}
                </Link>
              </th>
              <th>
                <Link href={sortHref('date')} className="sort-link">
                  Déposé{sortArrow('date')}
                </Link>
              </th>
              <th>Fiche</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                  Aucun adhérent ne correspond à ces critères.
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={m.id} className={selected.has(m.id) ? 'row-selected' : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggle(m.id)}
                      aria-label={`Sélectionner ${m.name}`}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/admin/adherents/${m.id}/edit`}>{m.name}</Link>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${m.status}`}>
                      {STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{m.dateLabel}</td>
                  <td>
                    {m.complete ? (
                      <span className="fiche-badge fiche-badge--ok">Complète</span>
                    ) : (
                      <span className="fiche-badge fiche-badge--todo">Incomplète</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/adherents/${m.id}/edit`} className="btn btn-secondary btn-small">
                      Éditer
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
