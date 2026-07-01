/**
 * Remplace les événements d'exemple (fictifs) par les vrais rendez-vous OPEN.
 * Idempotent : on repart d'une table propre puis on insère les événements réels.
 *
 *   pnpm tsx --env-file .env.local scripts/set-agenda-real.ts
 */

/* eslint-disable no-console */
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from '../src/lib/db/schema'

const { agendaEvents } = schema

// Événements réels (source : communications OPEN). Ne mettre ici que des
// événements à venir : les passés sont de toute façon masqués automatiquement.
const REAL_EVENTS = [
  {
    title: 'Assemblée générale — AGE puis AGO',
    description:
      'AGE : refonte des statuts (possible co-présidence). AGO : rapport moral et bilan financier 2025, budget 2026. Cocktail de clôture.',
    eventDate: '2026-07-08',
    startTime: '12:00',
    location: 'MEDEF Polynésie — Immeuble Ateivi, Rue Tepano Jaussen, Papeete',
    detailUrl: null as string | null,
    isExternalUrl: false,
    sortOrder: 0,
  },
]

async function main() {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL manquant (.env.local)')
  const db = drizzle(neon(url), { schema })

  await db.delete(agendaEvents)
  await db.insert(agendaEvents).values(
    REAL_EVENTS.map((e) => ({
      title: e.title,
      description: e.description,
      eventDate: e.eventDate,
      startTime: e.startTime,
      location: e.location,
      detailUrl: e.detailUrl,
      isExternalUrl: e.isExternalUrl,
      isPublished: true,
      showOnHome: true,
      sortOrder: e.sortOrder,
    })),
  )
  console.log(`Agenda réinitialisé : ${REAL_EVENTS.length} événement(s) réel(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
