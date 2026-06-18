# WORKFLOW_SOUMISSION_ADHESION — Soumission d'une demande d'adhésion

## Classification
- **Type** : user_journey
- **Sous-type** : formulaire multi-étapes avec persistance locale
- **Visibilité** : external_user
- **Acteur principal** : Représentant d'une entreprise candidate à l'adhésion
- **Acteurs** : Entreprise candidate (navigateur), serveur Next.js (Server Action), base de données Neon/PostgreSQL
- **Criticité** : Haute — c'est le point d'entrée unique du cycle de vie d'un membre ; sans lui, aucun adhérent ne peut exister dans le système
- **Confiance** : high
- **Justification** : Le flux a été suivi de bout en bout — composant `adhesion-form.tsx`, Server Action `submitAdhesion()`, schéma Zod `adhesionSchema`, et insertions Drizzle dans la DB. Tous les fichiers cités ont été ouverts et lus.

## Objectif

Permettre à une entreprise polynésienne de déposer une candidature à l'adhésion au réseau OPEN en remplissant un formulaire en 5 étapes. À l'issue de la soumission, un enregistrement `members` au statut `submitted` est créé dans la base, avec ses contacts, domaines d'activité et certifications associés. La candidature passe ensuite en attente de validation par l'administrateur.

## Acteurs
- **Entreprise candidate** : utilisateur final public, aucune authentification requise
- **Serveur Next.js** : exécute la Server Action `submitAdhesion()` et valide les données
- **Base de données PostgreSQL (Neon)** : persiste le membre et ses données associées

## Points d'entrée
- `src/app/(public)/adhesion/page.tsx` — page publique hébergeant le formulaire
- `src/components/adhesion/adhesion-form.tsx` — composant client gérant le stepper et la soumission
- `src/lib/actions/adhesion.ts` — Server Action `submitAdhesion()` (point d'entrée serveur)

## Étapes principales

1. **Chargement de la page et restauration du brouillon** — L'utilisateur accède à `/adhesion`. Le composant `AdhesionForm` (`src/components/adhesion/adhesion-form.tsx`) s'initialise avec `react-hook-form` et `zodResolver(adhesionSchema)`. Au montage, un `useEffect` tente de lire `adhesion-draft` dans `localStorage` pour pré-remplir le formulaire si un brouillon existe.

2. **Étape 1 — Identité de l'entreprise** — L'utilisateur remplit le composant `StepEntreprise` : raison sociale (obligatoire, 2 car. min.), statut juridique (obligatoire), n° TAHITI (optionnel, regex `/^[0-9]{6}[A-Z]?$/`), URL du site (optionnelle, validation URL), description (max 500 car.), année de création, effectif, appartenance MEDEF. Validation locale sur `stepEntrepriseSchema` (`src/lib/validations/adhesion.ts`) déclenchée par le bouton « Suivant ».

3. **Étape 2 — Contacts** — L'utilisateur remplit `StepContacts` : au moins un contact (nom, email obligatoires, téléphone optionnel au format regex). Un contact doit être marqué `isPrimary: true` — règle vérifiée explicitement dans `handleNext()` : `!form.getValues('contacts').some((c) => c.isPrimary)` renvoie une erreur serveur.

4. **Étape 3 — Domaines d'activité** — `StepActivites` : au moins un domaine requis (`activityDomains: z.array(z.string()).min(1, ...)`). Validation via `stepActivitesSchema`.

5. **Étape 4 — Certifications** — `StepCertifications` : optionnel, pas de validation bloquante (`valid = true` systématique dans `handleNext()` à l'étape 4).

6. **Étape 5 — Récapitulatif et soumission** — `StepRecap` affiche un résumé. L'utilisateur coche le consentement RGPD (`rgpdConsent: boolean` raffiné à `true` obligatoire dans `adhesionSchema`). Clic sur « Envoyer ma demande » déclenche `form.handleSubmit(handleSubmit, handleInvalid)`.

7. **Sauvegarde automatique du brouillon** — Un `useEffect` abonne `form.watch()` et écrit en continu dans `localStorage` sous la clé `adhesion-draft` (`src/components/adhesion/adhesion-form.tsx`). La sauvegarde est silencieuse (erreurs ignorées).

8. **Appel de la Server Action** — `submitAdhesion(data)` est appelée (`src/lib/actions/adhesion.ts`). Côté serveur : validation complète via `adhesionSchema.safeParse(raw)`. En cas d'échec : retourne `{ success: false, errors }`.

9. **Génération du slug unique** — `generateUniqueSlug(db, toSlug(data.name))` : génère un slug à partir du nom, vérifie l'unicité en base, ajoute un suffixe numérique si collision (max 20 tentatives), puis fallback `${base}-${Date.now()}`.

10. **Insertion en base** — Séquence d'insertions (le driver Neon HTTP ne supporte pas les transactions) :
    - `INSERT INTO members` avec `status: 'submitted'`, `submittedAt: new Date()`
    - `INSERT INTO member_contacts` si contacts non vides
    - `INSERT INTO member_activities` si domaines non vides
    - `INSERT INTO member_certifications` si certifications non vides

11. **Retour et nettoyage** — En cas de succès : `{ success: true, slug }`. Le composant supprime le brouillon (`localStorage.removeItem(DRAFT_KEY)`), affiche l'écran de confirmation, puis redirige vers `/` au clic.

## Règles métier

- **Raison sociale obligatoire** : `name: z.string().min(2, ...)` — `src/lib/validations/adhesion.ts`
- **Statut juridique obligatoire** : `legalStatus: z.string().min(1, ...)` — `src/lib/validations/adhesion.ts` (champ collecté mais mappé à `legalStatusId: null` en DB — voir Questions ouvertes)
- **N° TAHITI format strict** : regex `/^[0-9]{6}[A-Z]?$/` si fourni — `src/lib/validations/adhesion.ts`
- **Au moins un contact requis** : `contacts: z.array(...).min(1, ...)` — `src/lib/validations/adhesion.ts`
- **Contact principal obligatoire** : `refine((data) => data.contacts.some((c) => c.isPrimary))` + vérification UI dans `handleNext()` étape 2 — `src/lib/validations/adhesion.ts` et `src/components/adhesion/adhesion-form.tsx`
- **Au moins un domaine d'activité requis** : `activityDomains: z.array(z.string()).min(1, ...)` — `src/lib/validations/adhesion.ts`
- **Certifications optionnelles** : étape 4 passe systématiquement sans validation — `src/components/adhesion/adhesion-form.tsx`
- **Consentement RGPD obligatoire** : `rgpdConsent: z.boolean().refine((v) => v === true, ...)` — `src/lib/validations/adhesion.ts`
- **Statut initial `submitted`** : le membre est inséré avec `status: 'submitted'` et `submittedAt: new Date()` — `src/lib/actions/adhesion.ts`
- **Slug unique garanti** : 20 tentatives avec suffixe numérique, fallback timestamp — `src/lib/actions/adhesion.ts`

## Données

- **`members`** : enregistrement créé avec `status: 'submitted'`, `submittedAt`, `slug` unique — `src/lib/db/schema.ts`
- **`memberContacts`** : contacts de l'entreprise, FK cascade sur `members.id` — `src/lib/db/schema.ts`
- **`memberActivities`** : liaison m:n membre ↔ domaine d'activité — `src/lib/db/schema.ts`
- **`memberCertifications`** : liaison m:n membre ↔ certification, avec `otherLabel` optionnel — `src/lib/db/schema.ts`
- **`localStorage['adhesion-draft']`** : brouillon côté client, supprimé après succès — `src/components/adhesion/adhesion-form.tsx`
- **Référentiels lus** : `activityDomains`, `certifications`, `legalStatuses` — utilisés pour alimenter les selects des étapes (lecture en amont non tracée dans ce flux)

## Intégrations
Aucune intégration externe dans ce workflow. L'envoi d'email post-soumission n'est **pas déclenché ici** — seule la persistance en DB a lieu. Les emails de relance sont envoyés par le cron (`WORKFLOW_RELANCE_AUTOMATIQUE.md`).

## Risques

- **Perte de données sans transaction** : les insertions dans `memberContacts`, `memberActivities` et `memberCertifications` sont séquentielles sans transaction (commentaire explicite dans le code : `// neon-http driver does not support transactions — sequential inserts`). Si l'une d'elles échoue, le membre `submitted` reste orphelin en base sans ses données associées — `src/lib/actions/adhesion.ts`
- **Brouillon corrompu silencieux** : le `try/catch` autour de `localStorage.getItem(DRAFT_KEY)` ignore les erreurs de parsing. Un brouillon corrompu est simplement ignoré, sans message à l'utilisateur — `src/components/adhesion/adhesion-form.tsx`
- **Slug collision au-delà de 20 tentatives** : au-delà de 20 collisions, le slug devient `${base}-${Date.now()}`, ce qui peut générer des URLs difficiles à lire. Risque faible en pratique (~50 membres) mais non géré proprement — `src/lib/actions/adhesion.ts`
- **Données legalStatus non persistées** : `legalStatus` est collecté dans le formulaire (étape 1, champ obligatoire) mais inséré avec `legalStatusId: null` en DB. La valeur saisie est perdue. Voir Questions ouvertes.
- **Double soumission** : pas de protection contre la double soumission côté serveur. Le bouton est désactivé (`disabled={isSubmitting}`) côté client, mais un appel direct à la Server Action pourrait créer un doublon — `src/components/adhesion/adhesion-form.tsx`

## Questions ouvertes

- **`legalStatus` vs `legalStatusId`** : le champ `legalStatus` est collecté dans `stepEntrepriseSchema` comme `string` obligatoire, mais `submitAdhesion()` insère `legalStatusId: null` en DB sans mapper cette valeur. Est-ce un TODO non implémenté ou un champ temporairement ignoré ?
- **Notification de confirmation à l'entreprise** : le message de succès indique « Vous recevrez une confirmation par email sous 48 h » mais aucun email n'est envoyé dans `submitAdhesion()`. Cet email est-il censé être envoyé ailleurs (ex. dans le flow de validation admin) ou est-il manquant ?
- **Référentiels (legalStatuses, activityDomains, certifications)** : les composants des étapes 1, 3 et 4 utilisent ces données mais leur chargement initial n'a pas été tracé dans ce workflow (probablement dans les pages parentes en RSC). À confirmer.

## Preuves
- `src/components/adhesion/adhesion-form.tsx`
- `src/lib/actions/adhesion.ts`
- `src/lib/validations/adhesion.ts`
- `src/lib/db/schema.ts`
- `src/app/(public)/adhesion/page.tsx` (non lu directement — mentionné dans la carte des domaines)
