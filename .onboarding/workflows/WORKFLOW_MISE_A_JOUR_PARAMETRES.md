# WORKFLOW_MISE_A_JOUR_PARAMETRES — Mise à jour des chiffres clés du site

## Classification
- **Type** : backoffice_flow
- **Sous-type** : édition d'une table single-row avec upsert idempotent
- **Visibilité** : internal_user
- **Acteur principal** : Administrateur OPEN PF
- **Acteurs** : Admin (navigateur), serveur Next.js (Server Action), base de données PostgreSQL
- **Criticité** : Basse — données institutionnelles de vitrine, leur absence ou inexactitude ne bloque pas le site
- **Confiance** : medium
- **Justification** : La Server Action `updateSiteStats()` a été lue en intégralité. Cependant, la page `/admin/parametres/page.tsx` et le composant `site-stats-form.tsx` n'ont pas été lus — le formulaire et les autres paramètres éventuels (bureau, partenaires) ne sont pas tracés. La confiance est **medium** car seule la partie `siteStats` est vérifiée.

## Objectif

Permettre à l'administrateur de mettre à jour manuellement les chiffres clés affichés sur le site (notamment le nombre de salariés dans le secteur numérique polynésien). Ces statistiques sont affichées sur la page d'accueil et dans l'en-tête de l'annuaire. La donnée est saisie manuellement par l'admin car elle ne peut pas être calculée automatiquement depuis la DB (elle représente des données sectorielles, pas uniquement les membres d'OPEN PF).

## Acteurs
- **Admin** : saisit les chiffres depuis `/admin/parametres`
- **Serveur Next.js** : exécute `updateSiteStats()`
- **Base de données PostgreSQL** : table single-row `siteStats` (id toujours = 1)

## Points d'entrée
- `src/app/admin/parametres/page.tsx` — page de paramètres admin (non lue directement)
- `src/components/admin/site-stats-form.tsx` — formulaire (non lu directement)
- `src/lib/actions/admin/settings.ts` — Server Action `updateSiteStats(employeeCount)`

## Étapes principales

1. **Accès à la page** — L'admin navigue vers `/admin/parametres`. Session JWT vérifiée par le middleware.

2. **Affichage des valeurs actuelles** — La page charge les valeurs actuelles de `siteStats` (non tracé — probablement via une query directe dans le RSC de la page).

3. **Saisie du chiffre** — L'admin modifie `employeeCount` dans le formulaire `SiteStatsForm`.

4. **Soumission** — Appel à `updateSiteStats(employeeCount)` — `src/lib/actions/admin/settings.ts`.

5. **Vérification de session** — `auth()` vérifie `session?.user?.id`. Lève `'Non autorisé'` si absent (pas de `try/catch` — l'erreur remonte en exception).

6. **Upsert idempotent** — `INSERT INTO site_stats (id=1, employeeCount, updatedAt) ON CONFLICT (id) DO UPDATE SET (employeeCount, updatedAt)`. La table ne contient qu'une seule ligne (id toujours = 1). Si la ligne n'existe pas, elle est créée ; sinon, mise à jour.

7. **Invalidation du cache** — `revalidatePath('/')` + `revalidatePath('/admin/parametres')`.

8. **Retour** — `{ success: true }`.

## Règles métier

- **Session admin requise** : `auth()` vérifié — `src/lib/actions/admin/settings.ts`
- **Table single-row** : `id = 1` en dur, commenté dans le schéma : « always 1 » — `src/lib/db/schema.ts`
- **Upsert ON CONFLICT** : idempotent — pas de création/suppression de ligne, uniquement mise à jour — `src/lib/actions/admin/settings.ts`
- **`employeeCount` nullable** : `integer('employee_count')` sans `notNull()` — peut être null — `src/lib/db/schema.ts`
- **Revalidation de la home** : `revalidatePath('/')` après mise à jour — la page d'accueil affiche ces statistiques — `src/lib/actions/admin/settings.ts`

## Données

- **`siteStats`** (lecture + écriture) : `id` (toujours 1), `employeeCount`, `updatedAt` — `src/lib/db/schema.ts`

## Intégrations

Aucune intégration externe dans ce workflow.

## Risques

- **Pas de validation Zod** : `updateSiteStats(employeeCount: number | null)` accepte le paramètre tel quel sans validation Zod côté serveur. La validation (min/max, type entier) est vraisemblablement faite côté client dans `SiteStatsForm` (non vérifié) — `src/lib/actions/admin/settings.ts`
- **Pas d'audit log** : la mise à jour des paramètres n'est pas tracée dans `auditLog`, contrairement aux actions sur les membres — `src/lib/actions/admin/settings.ts`

## Questions ouvertes

- **Autres paramètres** : la page `/admin/parametres` gère-t-elle d'autres données (bureau, partenaires, frise chronologique) ? La carte des domaines liste `settings.ts` mais l'action lue ne contient que `updateSiteStats()`. Y a-t-il d'autres actions dans ce fichier non visibles dans l'extrait lu ? (Le fichier s'arrête à la ligne 24 — il est possible qu'il soit complet.)
- **Source de vérité pour `teamMembers`** : la relecture des domaines signale une ambiguïté entre `src/lib/data/board-members.ts` (fichier statique) et la table `team_members` en DB. La page paramètres permet-elle d'éditer les membres du bureau ? L'action correspondante n'a pas été trouvée dans `settings.ts`.
- **`siteStats.memberCount`, `domainCount`** : la page annuaire affiche `stats.memberCount` et `stats.domainCount` via `getSiteStats()`. Ces champs sont-ils dans `siteStats` DB ou calculés dynamiquement ? Non tracé — `siteStats` en DB ne contient que `employeeCount`.

## Preuves
- `src/lib/actions/admin/settings.ts`
- `src/lib/db/schema.ts`
