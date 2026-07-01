/**
 * Seed d'exemples pour l'Agenda OPEN (démo). Idempotent : n'insère rien si la
 * table contient déjà des événements. À lancer APRÈS la migration 0005.
 *
 *   pnpm tsx --env-file .env.local scripts/seed-agenda.ts
 */

/* eslint-disable no-console */
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'
import * as schema from '../src/lib/db/schema'
import { toSlug } from '../src/lib/utils'

const { agendaEvents } = schema

const EVENTS = [
  {
    title: 'Assemblée générale ordinaire',
    description: 'Bilan, gouvernance et perspectives 2025-2027.',
    eventDate: '2026-07-04',
    detailUrl: '/actualites/assemblee-generale-ordinaire-du-04-juillet-2025-nouveau-ca',
    isExternalUrl: false,
    sortOrder: 0,
  },
  {
    title: 'OPEN Bar',
    description: 'Temps d’échange informel entre adhérents.',
    eventDate: '2026-07-18',
    sortOrder: 1,
  },
  {
    title: 'Morning Tech',
    description: 'IA, cybersécurité et usages métiers.',
    eventDate: '2026-08-02',
    sortOrder: 2,
  },
  {
    title: 'Groupe de travail formation',
    description: 'Réunion membres sur les besoins en compétences.',
    eventDate: '2026-08-12',
    sortOrder: 3,
  },
  {
    title: 'Atelier cybersécurité',
    description: 'Retours terrain et bonnes pratiques pour les entreprises.',
    eventDate: '2026-08-28',
    sortOrder: 4,
  },
  {
    title: 'Réunion groupe de travail IA',
    description: 'Coordination des actions et priorités de la filière.',
    eventDate: '2026-09-09',
    sortOrder: 5,
  },
] as const

async function main() {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL manquant (.env.local)')
  const db = drizzle(neon(url), { schema })

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(agendaEvents)
  if (count > 0) {
    console.log(`Agenda déjà peuplé (${count} événements) — rien à faire.`)
    return
  }

  await db.insert(agendaEvents).values(
    EVENTS.map((e, i) => ({
      slug: `${toSlug(e.title)}-${i + 1}`,
      title: e.title,
      description: e.description,
      eventDate: e.eventDate,
      detailUrl: 'detailUrl' in e ? e.detailUrl : null,
      isExternalUrl: 'isExternalUrl' in e ? e.isExternalUrl : false,
      isPublished: true,
      showOnHome: true,
      sortOrder: e.sortOrder,
    })),
  )
  console.log(`${EVENTS.length} événements d'exemple insérés.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
