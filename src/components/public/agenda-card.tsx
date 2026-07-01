import { AgendaEventItem } from './agenda-event-item'
import type { HomeAgendaEvent } from '@/lib/db/queries/agenda'

export function AgendaCard({ events }: { events: HomeAgendaEvent[] }) {
  return (
    <aside className="card agenda-card" aria-labelledby="agenda-title">
      <div className="agenda-head">
        <p className="agenda-kicker">Prochains rendez-vous</p>
        <h3 className="agenda-title" id="agenda-title">
          Agenda OPEN
        </h3>
        <p className="agenda-subtitle">
          Les événements importants peuvent renvoyer vers une page détail. Les autres restent
          simplement annoncés ici.
        </p>
      </div>

      {events.length > 0 ? (
        <ul className="events-scroll" aria-label="Prochains événements OPEN" tabIndex={0}>
          {events.map((event) => (
            <AgendaEventItem key={event.id} event={event} />
          ))}
        </ul>
      ) : (
        <p className="agenda-empty">Aucun rendez-vous programmé pour le moment.</p>
      )}
    </aside>
  )
}
