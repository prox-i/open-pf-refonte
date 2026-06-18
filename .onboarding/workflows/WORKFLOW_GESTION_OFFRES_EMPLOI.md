# WORKFLOW_GESTION_OFFRES_EMPLOI — Création et gestion d'une offre d'emploi

## Classification
- **Type** : backoffice_flow
- **Sous-type** : CRUD éditorial avec cycle de vie draft/published/closed + liaison optionnelle à un membre
- **Visibilité** : internal_user
- **Acteur principal** : Administrateur OPEN PF
- **Acteurs** : Admin (navigateur), serveur Next.js (Server Action), base de données PostgreSQL
- **Criticité** : Basse — fonctionnalité éditoriale annexe, le cœur du site n'en dépend pas
- **Confiance** : high
- **Justification** : Server Actions `upsertJob()` et `deleteJob()` lues en intégralité dans `src/lib/actions/admin/content.ts`. La logique de cycle de vie à trois statuts et la liaison optionnelle à un membre sont entièrement tracées.

## Objectif

Permettre à l'administrateur de créer, modifier, publier et clôturer des offres d'emploi visibles publiquement sur le site OPEN PF. Une offre peut être liée optionnellement à un membre de l'annuaire (l'employeur). Le cycle de vie comporte trois statuts : `draft` (brouillon), `published` (visible), `closed` (clôturée).

## Acteurs
- **Admin** : crée et gère les offres depuis le back-office
- **Serveur Next.js** : exécute `upsertJob()` et `deleteJob()`
- **Base de données PostgreSQL** : persiste les offres dans `jobOffers`, avec FK optionnelle vers `members`

## Points d'entrée
- `src/app/admin/offres-emploi/page.tsx` — liste des offres admin (non lue directement)
- `src/app/admin/offres-emploi/new/page.tsx` — création (non lue directement)
- `src/app/admin/offres-emploi/[id]/page.tsx` — édition (non lue directement)
- `src/components/admin/job-form.tsx` — formulaire d'édition (non lu directement)
- `src/lib/actions/admin/content.ts` — Server Actions `upsertJob(raw, id?)`, `deleteJob(id)`

## Étapes principales

### A. Création d'une offre

1. **Accès au formulaire** — L'admin navigue vers `/admin/offres-emploi/new`. Session JWT vérifiée par le middleware.

2. **Saisie** — `JobForm` collecte : titre (obligatoire), description, localisation, type de contrat (CDI/CDD/Stage/Alternance…), salaire, URL de candidature (optionnelle, validation URL), email de candidature (optionnel, validation email), membre associé (UUID ou vide), statut (`draft` | `published` | `closed`).

3. **Soumission** — Appel à `upsertJob(raw)` sans `id` — `src/lib/actions/admin/content.ts`.

4. **Vérification de session** — `requireAdmin()`.

5. **Validation Zod** — `jobSchema.safeParse(raw)` : titre min 1 char, statut enum à 3 valeurs, `applicationUrl` validée si renseignée, `applicationEmail` validé si renseigné, `memberId` UUID ou vide.

6. **Génération du slug** — `toSlug(data.title) + '-' + Date.now()` : slug dérivé du titre avec timestamp pour garantir l'unicité (contrairement aux articles).

7. **Insertion en base** — `INSERT INTO job_offers (slug, title, description, location, contractType, salary, applicationUrl, applicationEmail, memberId, status, publishedAt)`.
   - `publishedAt` = `new Date()` si `status === 'published'`, sinon `null`
   - `memberId` = `null` si la valeur est vide (`data.memberId || null`)

8. **Invalidation du cache** — `revalidatePath('/admin/offres-emploi')` uniquement (pas de `revalidatePath('/offres-emploi')` côté public — voir Risques).

### B. Mise à jour d'une offre

3b. **Soumission avec id** — `upsertJob(raw, id)`.

7b. **Mise à jour** — `UPDATE job_offers SET ... WHERE id=id`. `publishedAt` = `new Date()` si `published`, `null` sinon. `updatedAt = new Date()`.

### C. Clôture d'une offre

3c. **Passage au statut `closed`** — Via le formulaire, l'admin sélectionne `status: 'closed'` et sauvegarde. `publishedAt` est remis à `null` (condition `data.status === 'published'`). L'offre reste en DB mais n'est plus visible publiquement (selon le filtre de lecture publique — non vérifié dans cette analyse).

### D. Suppression

3d. **Appel** — `deleteJob(id)` : `DELETE FROM job_offers WHERE id=id`. Seul `revalidatePath('/admin/offres-emploi')` est appelé.

## Règles métier

- **Session admin requise** : `requireAdmin()` sur toutes les actions — `src/lib/actions/admin/content.ts`
- **Titre obligatoire** : `title: z.string().min(1, 'Titre requis')` — `src/lib/actions/admin/content.ts`
- **Statut tripartite** : `draft` | `published` | `closed` — `src/lib/db/schema.ts` et `src/lib/actions/admin/content.ts`
- **`publishedAt` automatique** : renseigné à `now()` si `published`, `null` sinon — `src/lib/actions/admin/content.ts`
- **Slug avec timestamp** : `toSlug(title) + '-' + Date.now()` à la création — unicité garantie par le timestamp — `src/lib/actions/admin/content.ts`
- **FK vers `members` optionnelle avec `ON DELETE SET NULL`** : si le membre associé est supprimé, `jobOffers.memberId` passe à `null` — `src/lib/db/schema.ts`
- **`memberId` normalisé à `null` si vide** : `data.memberId || null` — `src/lib/actions/admin/content.ts`

## Données

- **`jobOffers`** (création/mise à jour/suppression) : `slug`, `title`, `description`, `location`, `contractType`, `salary`, `applicationUrl`, `applicationEmail`, `memberId`, `status`, `publishedAt`, `expiresAt`, `metaDescription`, `jsonLd`, `updatedAt` — `src/lib/db/schema.ts`
- **`members`** (lecture implicite) : référentiel pour le select « membre associé » dans le formulaire (FK `memberId`)
- **`expiresAt`** : champ défini dans le schéma DB mais non alimenté par `upsertJob()` — les offres n'ont pas de date d'expiration automatique dans l'action actuelle
- **`jsonLd`** : défini en DB, non alimenté par l'action

## Intégrations

Aucune intégration externe dans ce workflow.

## Risques

- **`revalidatePath('/offres-emploi')` absent** : `upsertJob()` invalide seulement `/admin/offres-emploi`, pas la page publique `/offres-emploi`. Après publication ou clôture d'une offre, la page publique reste dans son cache ISR jusqu'au prochain rechargement naturel — `src/lib/actions/admin/content.ts`. Incohérence avec `upsertNews()` qui invalide bien les deux paths.
- **`publishedAt` réécrit à chaque sauvegarde** : même problème que pour les actualités — si une offre `published` est modifiée sans changer de statut, `publishedAt` est réécrit à `now()`.
- **`expiresAt` non géré** : le champ existe dans le schéma mais n'est jamais renseigné par `upsertJob()`. Les offres n'expirent jamais automatiquement. Si une logique de clôture automatique est prévue (cron), elle est absente du code actuel.
- **`jsonLd` non alimenté** : les données structurées `JobPosting` pour le SEO (mentionnées dans `CLAUDE.md §13`) ne sont pas générées.

## Questions ouvertes

- **Filtre public sur `status`** : les queries publiques filtrent-elles `status = 'published'` sur `jobOffers` ? Les fichiers `src/lib/db/queries/jobs.ts` n'ont pas été lus dans cette analyse.
- **`expiresAt`** : est-ce un champ prévu pour un futur cron de clôture automatique ? Ou doit-il être saisi manuellement par l'admin dans le formulaire (et simplement non implémenté) ?
- **Revalidation path public** : l'absence de `revalidatePath('/offres-emploi')` est-elle un oubli ou intentionnelle ?

## Preuves
- `src/lib/actions/admin/content.ts`
- `src/lib/db/schema.ts`
