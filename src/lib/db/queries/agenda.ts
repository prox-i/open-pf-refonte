import { and, asc, desc, eq, gte } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { agendaEvents } from '@/lib/db/schema'
import { tahitiToday } from '@/lib/agenda'

export interface HomeAgendaEvent {
  id: string
  title: string
  description: string | null
  eventDate: string
  startTime: string | null
  detailUrl: string | null
  isExternalUrl: boolean
}

/**
 * Événements affichés dans la carte agenda de la home :
 * publiés + `showOnHome` + à venir (date >= aujourd'hui à Tahiti), triés par
 * date croissante puis `sortOrder`. Résilient : renvoie [] si la table n'existe
 * pas encore (avant migration) pour ne pas casser la home.
 */
export async function getHomeAgendaEvents(): Promise<HomeAgendaEvent[]> {
  try {
    const db = getDb()
    return await db
      .select({
        id: agendaEvents.id,
        title: agendaEvents.title,
        description: agendaEvents.description,
        eventDate: agendaEvents.eventDate,
        startTime: agendaEvents.startTime,
        detailUrl: agendaEvents.detailUrl,
        isExternalUrl: agendaEvents.isExternalUrl,
      })
      .from(agendaEvents)
      .where(
        and(
          eq(agendaEvents.isPublished, true),
          eq(agendaEvents.showOnHome, true),
          gte(agendaEvents.eventDate, tahitiToday()),
        ),
      )
      .orderBy(asc(agendaEvents.eventDate), asc(agendaEvents.sortOrder))
  } catch (e) {
    console.error('[getHomeAgendaEvents]', e)
    return []
  }
}

/** Tous les événements pour l'admin (récents d'abord). */
export async function getAllAgendaEvents() {
  const db = getDb()
  return db
    .select()
    .from(agendaEvents)
    .orderBy(desc(agendaEvents.eventDate), asc(agendaEvents.sortOrder))
}
