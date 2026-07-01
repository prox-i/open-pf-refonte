import type { Metadata } from 'next'
import Link from 'next/link'
import { AgendaEventForm } from '@/components/admin/agenda-event-form'

export const metadata: Metadata = { title: 'Nouvel événement — Admin OPEN PF' }

export default function NewAgendaEventPage() {
  return (
    <>
      <div className="admin-top">
        <div>
          <nav style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
            <Link href="/admin/agenda">Agenda</Link> › Nouvel événement
          </nav>
          <h1>Nouvel événement</h1>
        </div>
      </div>
      <AgendaEventForm />
    </>
  )
}
