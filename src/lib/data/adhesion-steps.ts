/**
 * Source de vérité unique des étapes du formulaire d'adhésion (REC-017).
 *
 * Utilisée à la fois par le stepper interne (`Stepper`) et par l'encart latéral
 * (`AdhesionProgressSidebar`) pour éviter toute divergence de libellés.
 */
export interface AdhesionStep {
  label: string
  description: string
}

export const ADHESION_STEPS: AdhesionStep[] = [
  { label: 'Entreprise', description: 'Identité & légal' },
  { label: 'Contacts', description: 'Interlocuteurs' },
  { label: 'Activités', description: 'Domaines & secteurs' },
  { label: 'Certifications', description: 'Labels & engagements' },
  { label: 'Récapitulatif', description: 'Vérification & envoi' },
]
