import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { siteSettings } from '@/lib/db/schema'
import { env } from '@/lib/env'
import { SITE_SETTINGS_DEFAULTS } from '@/lib/settings-defaults'

/**
 * Réglages du site éditables depuis le back-office (`/admin/reglages`).
 *
 * Les valeurs vivent dans la table `site_settings` (une seule ligne, id=1).
 * Chaque champ vide retombe sur une valeur par défaut — variable d'env pour
 * l'email destinataire, contenu d'origine de la page /contact pour le reste.
 * Aucune régression possible si la ligne n'existe pas encore.
 */
export interface SiteSettings {
  /** Destinataire des messages de contact + relances. */
  contactRecipientEmail: string
  /** Email affiché publiquement sur la page /contact. */
  publicEmail: string
  /** Adresse postale (multi-lignes). */
  publicAddress: string
  /** Horaires d'ouverture (multi-lignes). */
  publicHours: string
  facebookUrl: string
  linkedinUrl: string
}

/**
 * Lit les réglages résolus (valeur DB sinon repli). Mémorisé par requête via
 * `cache()` pour éviter les requêtes répétées dans une même page/action.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  let row: typeof siteSettings.$inferSelect | undefined
  try {
    const db = getDb()
    ;[row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1)
  } catch {
    // DB injoignable / table absente : on sert les valeurs par défaut.
    row = undefined
  }

  return {
    contactRecipientEmail: row?.contactRecipientEmail || env.ADMIN_NOTIFICATION_EMAIL,
    publicEmail: row?.publicEmail || SITE_SETTINGS_DEFAULTS.publicEmail,
    publicAddress: row?.publicAddress || SITE_SETTINGS_DEFAULTS.publicAddress,
    publicHours: row?.publicHours || SITE_SETTINGS_DEFAULTS.publicHours,
    facebookUrl: row?.facebookUrl || SITE_SETTINGS_DEFAULTS.facebookUrl,
    linkedinUrl: row?.linkedinUrl || SITE_SETTINGS_DEFAULTS.linkedinUrl,
  }
})
