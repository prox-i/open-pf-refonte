'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  approveMember,
  rejectMember,
  deactivateMember,
  sendMagicLink,
} from '@/lib/actions/admin/members'

interface MemberActionsProps {
  memberId: string
  status: string
}

export function MemberActions({ memberId, status }: MemberActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handle(
    action: () => Promise<{ success: boolean; error?: string }>,
    label: string,
  ) {
    setLoading(label)
    setMessage(null)
    const result = await action()
    setLoading(null)
    if (!result.success) {
      setMessage(result.error ?? 'Erreur.')
    } else if (label === 'approve' || label === 'reject') {
      router.push('/admin/demandes')
    } else {
      router.refresh()
    }
  }

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      {message && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{message}</p>}

      {status === 'submitted' && (
        <>
          <button
            type="button"
            className="btn"
            disabled={loading !== null}
            onClick={() => handle(() => approveMember(memberId), 'approve')}
          >
            {loading === 'approve' ? '…' : '✓ Approuver'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading !== null}
            onClick={() => handle(() => rejectMember(memberId), 'reject')}
          >
            {loading === 'reject' ? '…' : '✕ Refuser'}
          </button>
        </>
      )}

      {(status === 'submitted' || status === 'active' || status === 'draft') && (
        <button
          type="button"
          className="btn btn-secondary"
          disabled={loading !== null}
          onClick={() => handle(() => sendMagicLink(memberId), 'magic')}
        >
          {loading === 'magic' ? 'Envoi…' : '✉ Envoyer le lien fiche'}
        </button>
      )}

      {status === 'active' && (
        <button
          type="button"
          className="btn btn-secondary"
          disabled={loading !== null}
          onClick={() => handle(() => deactivateMember(memberId), 'deactivate')}
        >
          {loading === 'deactivate' ? '…' : 'Désactiver'}
        </button>
      )}
    </div>
  )
}
