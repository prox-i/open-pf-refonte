import { formatAgendaDate } from '@/lib/agenda'
import type { HomeAgendaEvent } from '@/lib/db/queries/agenda'

export function AgendaEventItem({ event }: { event: HomeAgendaEvent }) {
  const d = formatAgendaDate(event.eventDate)

  return (
    <li className="agenda-event">
      <div className="agenda-event-date">
        {d.day} {d.month}
        <span>{d.year}</span>
      </div>
      <div className="agenda-event-body">
        <h4 className="agenda-event-title">{event.title}</h4>
        {event.description && <p className="agenda-event-desc">{event.description}</p>}
        {event.detailUrl && (
          <a
            className="agenda-event-more"
            href={event.detailUrl}
            aria-label={`Voir plus sur ${event.title}`}
            {...(event.isExternalUrl
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            Voir plus →
          </a>
        )}
      </div>
    </li>
  )
}
