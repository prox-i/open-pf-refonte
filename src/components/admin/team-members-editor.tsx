'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertTeamMember, deleteTeamMember } from '@/lib/actions/admin/content'

export interface TeamMemberRow {
  id: string
  fullName: string
  role: string
  professionalRole: string | null
  photoUrl: string | null
  sortOrder: number
  isActive: boolean
}

interface Props {
  members: TeamMemberRow[]
}

const EMPTY = {
  fullName: '',
  role: '',
  professionalRole: '',
  photoUrl: '',
  sortOrder: 0,
  isActive: true,
}

export function TeamMembersEditor({ members }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    setBusy(true)
    setError(null)
    const result = await upsertTeamMember(adding)
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
      <h2>Bureau OPEN ({members.length} membres)</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Rôle (bureau)</th>
            <th>Fonction pro.</th>
            <th style={{ width: '70px' }}>Ordre</th>
            <th style={{ width: '70px' }}>Actif</th>
            <th style={{ width: '160px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <MemberRow key={m.id} member={m} onChange={() => router.refresh()} />
          ))}
          <tr>
            <td>
              <input
                type="text"
                placeholder="Nom complet"
                value={adding.fullName}
                onChange={(e) => setAdding({ ...adding, fullName: e.target.value })}
              />
            </td>
            <td>
              <input
                type="text"
                placeholder="Rôle"
                value={adding.role}
                onChange={(e) => setAdding({ ...adding, role: e.target.value })}
              />
            </td>
            <td>
              <input
                type="text"
                placeholder="Poste + entreprise"
                value={adding.professionalRole}
                onChange={(e) => setAdding({ ...adding, professionalRole: e.target.value })}
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
            <td style={{ textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={adding.isActive}
                onChange={(e) => setAdding({ ...adding, isActive: e.target.checked })}
              />
            </td>
            <td>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy || !adding.fullName || !adding.role}
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

function MemberRow({ member, onChange }: { member: TeamMemberRow; onChange: () => void }) {
  const [draft, setDraft] = useState({
    fullName: member.fullName,
    role: member.role,
    professionalRole: member.professionalRole ?? '',
    photoUrl: member.photoUrl ?? '',
    sortOrder: member.sortOrder,
    isActive: member.isActive,
  })
  const [busy, setBusy] = useState(false)
  const dirty =
    draft.fullName !== member.fullName ||
    draft.role !== member.role ||
    draft.professionalRole !== (member.professionalRole ?? '') ||
    draft.sortOrder !== member.sortOrder ||
    draft.isActive !== member.isActive

  async function save() {
    setBusy(true)
    await upsertTeamMember(draft, member.id)
    setBusy(false)
    onChange()
  }

  async function remove() {
    if (!confirm(`Supprimer ${member.fullName} ?`)) return
    setBusy(true)
    await deleteTeamMember(member.id)
    setBusy(false)
    onChange()
  }

  return (
    <tr>
      <td>
        <input
          type="text"
          value={draft.fullName}
          onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
        />
      </td>
      <td>
        <input
          type="text"
          value={draft.role}
          onChange={(e) => setDraft({ ...draft, role: e.target.value })}
        />
      </td>
      <td>
        <input
          type="text"
          placeholder="Poste + entreprise"
          value={draft.professionalRole}
          onChange={(e) => setDraft({ ...draft, professionalRole: e.target.value })}
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
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
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
