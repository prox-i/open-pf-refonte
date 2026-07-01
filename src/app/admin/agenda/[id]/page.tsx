import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { agendaEvents } from '@/lib/db/schema'
import { AgendaEventForm } from '@/components/admin/agenda-event-form'

export const metadata: Metadata = { title: 'Éditer un événement — Admin OPEN PF' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditAgendaEventPage({ params }: Props) {
  const { id } = await params
  const db = getDb()
  const [ev] = await db.select().from(agendaEvents).where(eq(agendaEvents.id, id)).limit(1)
  if (!ev) notFound()

  return (
    <>
      <div className="admin-top">
        <div>
          <nav style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
            <Link href="/admin/agenda">Agenda</Link> › {ev.title}
          </nav>
          <h1>{ev.title}</h1>
        </div>
      </div>
      <AgendaEventForm
        id={id}
        initialData={{
          title: ev.title,
          description: ev.description ?? '',
          content: ev.content ?? '',
          eventDate: ev.eventDate,
          startTime: ev.startTime ?? '',
          location: ev.location ?? '',
          detailUrl: ev.detailUrl ?? '',
          isExternalUrl: ev.isExternalUrl,
          isPublished: ev.isPublished,
          showOnHome: ev.showOnHome,
          sortOrder: ev.sortOrder,
        }}
      />
    </>
  )
}
