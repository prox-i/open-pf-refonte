/**
 * Bureau OPEN — mandat 2025-2027.
 *
 * Source de vérité unique pour la gouvernance affichée sur /reseau.
 *
 * Photos : `photoUrl` est OPTIONNEL et reste vide tant que la personne n'a pas
 * validé l'usage de son portrait. Quand une photo est validée, déposer le
 * fichier dans `public/board/` (ex : `public/board/olivier-kressmann.jpg`) puis
 * renseigner `photoUrl: '/board/olivier-kressmann.jpg'` ci-dessous.
 *
 * ⚠️ Ne JAMAIS pointer `photoUrl` vers une URL LinkedIn (ni aucune source
 * externe non maîtrisée) : ce ne sont pas des URLs stables de production.
 * En l'absence de photo, un placeholder premium aux initiales est affiché.
 */
export interface BoardMember {
  /** Nom complet, tel qu'affiché. */
  name: string
  /** Fonction au sein du bureau OPEN (Co-Président, Trésorier, Assesseur…). */
  openRole: string
  /** Fonction professionnelle (poste + entreprise). */
  professionalRole: string
  /**
   * Chemin RELATIF d'une photo validée, servie depuis `public/board/`.
   * Laisser absent tant que la photo n'est pas validée → placeholder à initiales.
   */
  photoUrl?: string
}

export const BOARD_TERM = '2025-2027'

export const BOARD_MEMBERS: BoardMember[] = [
  {
    name: 'Olivier Kressmann',
    openRole: 'Co-Président',
    professionalRole: 'Président de la SAS Innovative Digital Technologies',
  },
  {
    name: 'Anthony Ginter',
    openRole: 'Co-Président',
    professionalRole: "Dirigeant d'Oraclia",
  },
  {
    name: 'Cédric Chan',
    openRole: 'Vice-Président',
    professionalRole: 'Dirigeant de Foodease',
  },
  {
    name: 'Jean-Pierre Claude',
    openRole: 'Secrétaire',
    professionalRole: 'Dirigeant de ExoData PF',
  },
  {
    name: 'Alain Chane',
    openRole: 'Trésorier',
    professionalRole: 'Directeur Général Adjoint de la TEP',
  },
  {
    name: 'Yann Lejeune',
    openRole: 'Assesseur',
    professionalRole: 'Responsable Projets, Organisation, Qualité à la Banque de Tahiti',
  },
  {
    name: 'Thibault De Reviere',
    openRole: 'Assesseur',
    professionalRole: 'Président de la SAS Proximity',
  },
  {
    name: 'Sébastien Puravet',
    openRole: 'Assesseur',
    professionalRole: 'DGA de OSB',
  },
]
