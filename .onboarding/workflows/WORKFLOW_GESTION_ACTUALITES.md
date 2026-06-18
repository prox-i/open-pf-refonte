# WORKFLOW_GESTION_ACTUALITES — Création et publication d'une actualité

## Classification
- **Type** : backoffice_flow
- **Sous-type** : CRUD éditorial avec cycle de vie draft/published
- **Visibilité** : internal_user
- **Acteur principal** : Administrateur OPEN PF
- **Acteurs** : Admin (navigateur), serveur Next.js (Server Action), base de données PostgreSQL
- **Criticité** : Moyenne — contenu éditorial de support, le site reste fonctionnel sans actualités
- **Confiance** : high
- **Justification** : Server Action `upsertNews()` et `deleteNews()` lues en intégralité dans `src/lib/actions/admin/content.ts`. La logique de validation Zod, de génération de slug, et de cycle de vie `draft/published` est entièrement tracée.

## Objectif

Permettre à l'administrateur de créer, modifier et publier des articles d'actualité sur le site OPEN PF. Un article peut rester en `draft` (brouillon invisible publiquement) jusqu'à sa publication explicite. La même action (`upsertNews`) gère la création et la mise à jour.

## Acteurs
- **Admin** : rédige et publie les articles depuis le back-office
- **Serveur Next.js** : exécute `upsertNews()` et `deleteNews()`
- **Base de données PostgreSQL** : persiste les articles dans la table `news`

## Points d'entrée
- `src/app/admin/actualites/page.tsx` — liste des articles admin (non lue directement)
- `src/app/admin/actualites/new/page.tsx` — création d'un nouvel article (non lue directement)
- `src/app/admin/actualites/[id]/page.tsx` — édition d'un article existant (non lue directement)
- `src/components/admin/news-form.tsx` — formulaire d'édition (non lu directement)
- `src/lib/actions/admin/content.ts` — Server Actions `upsertNews(raw, id?)`, `deleteNews(id)`

## Étapes principales

### A. Création d'un article

1. **Accès au formulaire** — L'admin navigue vers `/admin/actualites/new`. Session JWT vérifiée par le middleware.

2. **Saisie** — Le formulaire `NewsForm` collecte : titre (obligatoire), extrait, contenu, catégorie (UUID ou vide), auteur, URL image, meta description (max 160 car.), statut (`draft` | `published`).

3. **Soumission** — Appel à `upsertNews(raw)` sans `id` — `src/lib/actions/admin/content.ts`.

4. **Vérification de session** — `requireAdmin()` vérifie `session?.user?.id`. Lève `'Non autorisé'` si absent.

5. **Validation Zod** — `newsSchema.safeParse(raw)` : titre min 1 char, statut enum, meta description max 160, URL image optionnelle. Si invalide : `{ success: false, error: 'Données invalides' }`.

6. **Génération du slug** — `toSlug(data.title)` : slug dérivé du titre. **Attention** : pas de vérification d'unicité du slug (contrairement à la soumission d'adhésion).

7. **Insertion en base** — `INSERT INTO news (slug, title, excerpt, content, categoryId, authorName, imageUrl, metaDescription, status, publishedAt)`.
   - `publishedAt` = `new Date()` si `status === 'published'`, sinon `null`.

8. **Invalidation du cache** — `revalidatePath('/admin/actualites')` + `revalidatePath('/actualites')`.

### B. Mise à jour d'un article

3b. **Soumission avec id** — Appel à `upsertNews(raw, id)`.

7b. **Mise à jour en base** — `UPDATE news SET ... WHERE id=id`. `publishedAt` = `new Date()` si passage en `published`, `null` si `draft`. `updatedAt = new Date()`.

### C. Suppression

3c. **Appel** — `deleteNews(id)` : `DELETE FROM news WHERE id=id`. `revalidatePath` sur les deux paths.

## Règles métier

- **Session admin requise** : `requireAdmin()` sur toutes les actions — `src/lib/actions/admin/content.ts`
- **Titre obligatoire** : `title: z.string().min(1, 'Titre requis')` — `src/lib/actions/admin/content.ts`
- **Meta description max 160 caractères** : `metaDescription: z.string().max(160)` — `src/lib/actions/admin/content.ts`
- **Statut `draft` | `published`** : enum strict — `src/lib/actions/admin/content.ts`
- **`publishedAt` automatique** : renseigné à `now()` lors du passage en `published`, remis à `null` si repassé en `draft` — `src/lib/actions/admin/content.ts`
- **Slug non vérifié en unicité** : `toSlug(title)` sans contrôle d'unicité — risque de collision si deux articles ont le même titre — `src/lib/actions/admin/content.ts`

## Données

- **`news`** (création/mise à jour/suppression) : `slug`, `title`, `excerpt`, `content`, `categoryId`, `status`, `publishedAt`, `authorName`, `imageUrl`, `metaDescription`, `jsonLd`, `updatedAt` — `src/lib/db/schema.ts`
- **`newsCategories`** (lecture implicite) : référentiel des catégories pour le select dans le formulaire (non tracé dans cette action)
- **`jsonLd`** : champ JSONB défini dans le schéma mais non alimenté par `upsertNews()` — les données JSON-LD sont absentes de l'action

## Intégrations

Aucune intégration externe dans ce workflow. L'upload d'image d'illustration passe par `src/app/api/upload/news-image/route.ts` (non lu dans cette analyse — endpoint séparé).

## Risques

- **Slug non unique** : `toSlug(data.title)` sans vérification d'unicité avant insertion. Si deux articles ont le même titre, la contrainte `UNIQUE` sur `news.slug` (`src/lib/db/schema.ts`) lèvera une erreur DB non gérée proprement dans l'action (pas de `try/catch` sur l'insertion) — `src/lib/actions/admin/content.ts`
- **`publishedAt` non idempotent** : si un article `published` est modifié sans changer de statut, `publishedAt` sera réécrit à `now()` à chaque sauvegarde (le code écrit `new Date()` systématiquement si `status === 'published'`) — `src/lib/actions/admin/content.ts`
- **`jsonLd` non alimenté** : le champ `jsonLd` est défini dans le schéma DB mais l'action `upsertNews()` ne le renseigne jamais. Les données structurées JSON-LD pour le SEO des articles ne sont pas générées — `src/lib/actions/admin/content.ts`
- **Suppression sans confirmation** : `deleteNews()` supprime directement sans soft-delete ni confirmation en DB. La suppression est immédiate et irréversible depuis l'action.

## Questions ouvertes

- **Upload d'image d'illustration** : `src/app/api/upload/news-image/route.ts` existe. Comment fonctionne-t-il ? Est-il authentifié par session admin (contrairement au logo qui utilise un magic token) ? Non lu.
- **`jsonLd` sur les articles** : quand et comment ce champ sera-t-il alimenté ? Une action séparée ? Une génération automatique depuis le titre/contenu ?
- **Unicité du slug** : si deux articles ont le même titre, comment l'erreur DB est-elle présentée à l'admin ? Actuellement non gérée.

## Preuves
- `src/lib/actions/admin/content.ts`
- `src/lib/db/schema.ts`
