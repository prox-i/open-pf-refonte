'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteRowButtonProps {
  confirmMessage: string
  action: (id: string) => Promise<{ success: boolean; error?: string }>
  id: string
}

export function DeleteRowButton({ confirmMessage, action, id }: DeleteRowButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) return
    setDeleting(true)
    const result = await action(id)
    setDeleting(false)
    if (result.success) {
      router.refresh()
    } else {
      window.alert(result.error ?? 'Erreur lors de la suppression.')
    }
  }

  return (
    <button
      type="button"
      className="btn btn-danger btn-small"
      disabled={deleting}
      onClick={handleDelete}
    >
      {deleting ? 'Suppression…' : 'Supprimer'}
    </button>
  )
}
