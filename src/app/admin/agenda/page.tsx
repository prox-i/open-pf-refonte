import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllAgendaEvents } from '@/lib/db/queries/agenda'
import { formatAgendaDate, isUpcoming } from '@/lib/agenda'

export const metadata: Metadata = { title: 'Agenda — Admin OPEN PF' }

export default async function AdminAgendaPage() {
  const events = await getAllAgendaEvents()

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Agenda</h1>
          <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
            {events.length} événement{events.length > 1 ? 's' : ''}
          </span>
        </div>
        <Link href="/admin/agenda/new" className="btn">
          Nouvel événement
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Titre</th>
              <th>Publié</th>
              <th>Home</th>
              <th>Lien</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                  Aucun événement. Créez le premier avec « Nouvel événement ».
                </td>
              </tr>
            ) : (
              events.map((ev) => {
                const d = formatAgendaDate(ev.eventDate)
                const past = !isUpcoming(ev.eventDate)
                return (
                  <tr key={ev.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {d.day} {d.month} {d.year}
                    </td>
                    <td style={{ fontWeight: 600 }}>{ev.title}</td>
                    <td>
                      {past ? (
                        <span className="fiche-badge fiche-badge--todo">Passé</span>
                      ) : ev.isPublished ? (
                        <span className="fiche-badge fiche-badge--ok">Publié</span>
                      ) : (
                        'Brouillon'
                      )}
                    </td>
                    <td>{ev.showOnHome ? 'Oui' : 'Non'}</td>
                    <td>{ev.detailUrl ? 'Oui' : '—'}</td>
                    <td>
                      <Link href={`/admin/agenda/${ev.id}`} className="btn btn-secondary btn-small">
                        Modifier
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
