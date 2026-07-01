import { formatAgendaDate } from '@/lib/agenda'
import type { HomeAgendaEvent } from '@/lib/db/queries/agenda'

export function AgendaEventItem({ event }: { event: HomeAgendaEvent }) {
  const d = formatAgendaDate(event.eventDate)

  // Priorité : page de détail interne (si contenu), sinon URL externe/interne saisie.
  const href = event.hasContent ? `/agenda/${event.slug}` : (event.detailUrl ?? null)
  const isExternal = !event.hasContent && event.isExternalUrl

  return (
    <li className="agenda-event">
      <div className="agenda-event-date">
        {d.day} {d.month}
        <span>{d.year}</span>
      </div>
      <div className="agenda-event-body">
        <h4 className="agenda-event-title">{event.title}</h4>
        {event.description && <p className="agenda-event-desc">{event.description}</p>}
        {href && (
          <a
            className="agenda-event-more"
            href={href}
            aria-label={`Voir plus sur ${event.title}`}
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            Voir plus →
          </a>
        )}
      </div>
    </li>
  )
}
