import { describe, it, expect } from 'vitest'
import { tahitiToday, isUpcoming, formatAgendaDate } from '@/lib/agenda'

// Tahiti = UTC−10 (pas de changement d'heure).
describe('tahitiToday', () => {
  it('reste le 30/06 quand il est 05:00 UTC le 01/07 (19:00 à Tahiti)', () => {
    expect(tahitiToday(new Date('2026-07-01T05:00:00Z'))).toBe('2026-06-30')
  })
  it('passe au 01/07 quand il est 11:00 UTC le 01/07 (01:00 à Tahiti)', () => {
    expect(tahitiToday(new Date('2026-07-01T11:00:00Z'))).toBe('2026-07-01')
  })
})

describe('isUpcoming — expiration le lendemain, heure de Tahiti', () => {
  const now = new Date('2026-07-01T05:00:00Z') // 30/06 19:00 à Tahiti

  it('affiche un événement futur', () => {
    expect(isUpcoming('2026-08-02', now)).toBe(true)
  })
  it('affiche encore un événement du jour même (à Tahiti)', () => {
    expect(isUpcoming('2026-06-30', now)).toBe(true)
  })
  it('masque un événement passé', () => {
    expect(isUpcoming('2026-06-29', now)).toBe(false)
  })
  it('masque le lendemain : un événement du 30/06 disparaît quand Tahiti est le 01/07', () => {
    const nextDay = new Date('2026-07-01T11:00:00Z') // 01/07 01:00 à Tahiti
    expect(isUpcoming('2026-06-30', nextDay)).toBe(false)
  })
})

describe('formatAgendaDate', () => {
  it('découpe une date en jour / mois court FR / année', () => {
    expect(formatAgendaDate('2026-07-04')).toEqual({ day: '04', month: 'JUIL.', year: '2026' })
    expect(formatAgendaDate('2026-08-02')).toEqual({ day: '02', month: 'AOÛT', year: '2026' })
    expect(formatAgendaDate('2026-01-15')).toEqual({ day: '15', month: 'JANV.', year: '2026' })
  })
})
