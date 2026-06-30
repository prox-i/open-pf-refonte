/**
 * Valeurs par défaut des réglages publics — module PUR (aucun import de `env`
 * ni de la couche DB), donc sûr à importer depuis un composant client
 * (ex. SiteFooter rendu dans error.tsx). Identiques au contenu d'origine de /contact.
 */
export const SITE_SETTINGS_DEFAULTS = {
  publicEmail: 'contact@open.pf',
  publicAddress:
    'Immeuble ATEIVI, 3ème étage\nRue Mgr Tepano Jaussen, face SEFI\nBP 972 – 98713 Papeete, Tahiti\nPolynésie française',
  publicHours: 'Lun–Jeu : 7h30–12h00, 13h30–17h00\nVendredi : 7h30–12h00, 13h30–16h00',
  facebookUrl: 'https://www.facebook.com/open.polynesie/',
  linkedinUrl: 'https://www.linkedin.com/company/open-pf/',
} as const
