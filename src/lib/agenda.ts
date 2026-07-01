/**
 * Helpers agenda — logique d'expiration et de formatage des événements.
 *
 * Règle produit : un événement disparaît le **lendemain** du jour où il a lieu,
 * en **heure de Tahiti** (UTC−10, sans changement d'heure). Autrement dit il
 * reste visible toute sa journée d'événement, puis disparaît le jour suivant.
 * On raisonne à la journée calendaire de Tahiti (l'heure éventuelle n'avance pas
 * l'expiration : « expire à la fin de la journée »).
 */

/** Décalage fixe de Tahiti par rapport à UTC (UTC−10, pas de DST). */
const TAHITI_OFFSET_MS = 10 * 60 * 60 * 1000

/** Date du jour à Tahiti au format `YYYY-MM-DD`. */
export function tahitiToday(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - TAHITI_OFFSET_MS)
  return shifted.toISOString().slice(0, 10)
}

/**
 * Un événement (date `YYYY-MM-DD`) est-il encore à venir/en cours ?
 * Vrai tant que sa date est >= à la date du jour de Tahiti.
 */
export function isUpcoming(eventDate: string, now: Date = new Date()): boolean {
  return eventDate >= tahitiToday(now)
}

const MONTHS_FR_SHORT = [
  'JANV.',
  'FÉVR.',
  'MARS',
  'AVR.',
  'MAI',
  'JUIN',
  'JUIL.',
  'AOÛT',
  'SEPT.',
  'OCT.',
  'NOV.',
  'DÉC.',
]

export interface AgendaDateParts {
  day: string
  month: string
  year: string
}

/** Découpe une date `YYYY-MM-DD` en libellés d'affichage (jour / mois court FR / année). */
export function formatAgendaDate(eventDate: string): AgendaDateParts {
  const [year = '', month = '01', day = '01'] = eventDate.split('-')
  const monthIndex = Math.min(11, Math.max(0, Number.parseInt(month, 10) - 1))
  return {
    day: day.padStart(2, '0'),
    month: MONTHS_FR_SHORT[monthIndex] ?? '',
    year,
  }
}
