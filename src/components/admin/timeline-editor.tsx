'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertTimelineEvent, deleteTimelineEvent } from '@/lib/actions/admin/content'

export interface TimelineRow {
  id: string
  year: number
  description: string
  sortOrder: number
}

interface Props {
  events: TimelineRow[]
}

const EMPTY = { year: new Date().getFullYear(), description: '', sortOrder: 0 }

export function TimelineEditor({ events }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    setBusy(true)
    setError(null)
    const result = await upsertTimelineEvent(adding)
    setBusy(false)
    if (result.success) {
      setAdding(EMPTY)
      router.refresh()
    } else {
      setError(result.error ?? 'Erreur')
    }
  }

  return (
    <section className="card">
      <h2>Frise chronologique ({events.length} entrées)</h2>
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: '90px' }}>Année</th>
            <th>Description</th>
            <th style={{ width: '70px' }}>Ordre</th>
            <th style={{ width: '160px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <EventRow key={ev.id} event={ev} onChange={() => router.refresh()} />
          ))}
          <tr>
            <td>
              <input
                type="number"
                min="1900"
                max="2100"
                value={adding.year}
                onChange={(e) => setAdding({ ...adding, year: Number(e.target.value) })}
              />
            </td>
            <td>
              <input
                type="text"
                placeholder="Description"
                value={adding.description}
                onChange={(e) => setAdding({ ...adding, description: e.target.value })}
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                value={adding.sortOrder}
                onChange={(e) => setAdding({ ...adding, sortOrder: Number(e.target.value) })}
              />
            </td>
            <td>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy || !adding.description}
                onClick={handleAdd}
              >
                {busy ? '…' : 'Ajouter'}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      {error && <p className="field-error">{error}</p>}
    </section>
  )
}

function EventRow({ event, onChange }: { event: TimelineRow; onChange: () => void }) {
  const [draft, setDraft] = useState({
    year: event.year,
    description: event.description,
    sortOrder: event.sortOrder,
  })
  const [busy, setBusy] = useState(false)
  const dirty =
    draft.year !== event.year ||
    draft.description !== event.description ||
    draft.sortOrder !== event.sortOrder

  async function save() {
    setBusy(true)
    await upsertTimelineEvent(draft, event.id)
    setBusy(false)
    onChange()
  }

  async function remove() {
    if (!confirm(`Supprimer l'entrée ${event.year} ?`)) return
    setBusy(true)
    await deleteTimelineEvent(event.id)
    setBusy(false)
    onChange()
  }

  return (
    <tr>
      <td>
        <input
          type="number"
          min="1900"
          max="2100"
          value={draft.year}
          onChange={(e) => setDraft({ ...draft, year: Number(e.target.value) })}
        />
      </td>
      <td>
        <input
          type="text"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          value={draft.sortOrder}
          onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
        />
      </td>
      <td style={{ display: 'flex', gap: '6px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || !dirty}
          onClick={save}
        >
          {busy ? '…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ color: 'var(--color-danger)' }}
          disabled={busy}
          onClick={remove}
        >
          Suppr.
        </button>
      </td>
    </tr>
  )
}
