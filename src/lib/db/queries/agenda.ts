import { and, asc, desc, eq, gte, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { agendaEvents } from '@/lib/db/schema'
import { tahitiToday } from '@/lib/agenda'

export interface HomeAgendaEvent {
  id: string
  slug: string
  title: string
  description: string | null
  eventDate: string
  startTime: string | null
  detailUrl: string | null
  isExternalUrl: boolean
  hasContent: boolean
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
        slug: agendaEvents.slug,
        title: agendaEvents.title,
        description: agendaEvents.description,
        eventDate: agendaEvents.eventDate,
        startTime: agendaEvents.startTime,
        detailUrl: agendaEvents.detailUrl,
        isExternalUrl: agendaEvents.isExternalUrl,
        hasContent: sql<boolean>`(${agendaEvents.content} is not null and ${agendaEvents.content} <> '')`,
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

/** Événement publié par slug, pour la page de détail. Null si absent/brouillon. */
export async function getAgendaEventBySlug(slug: string) {
  try {
    const db = getDb()
    const [event] = await db
      .select()
      .from(agendaEvents)
      .where(and(eq(agendaEvents.slug, slug), eq(agendaEvents.isPublished, true)))
      .limit(1)
    return event ?? null
  } catch (e) {
    console.error('[getAgendaEventBySlug]', e)
    return null
  }
}

/** Tous les événements pour l'admin (récents d'abord). Résilient avant migration. */
export async function getAllAgendaEvents() {
  try {
    const db = getDb()
    return await db
      .select()
      .from(agendaEvents)
      .orderBy(desc(agendaEvents.eventDate), asc(agendaEvents.sortOrder))
  } catch (e) {
    console.error('[getAllAgendaEvents]', e)
    return []
  }
}
