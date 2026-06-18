# WORKFLOW_ANNUAIRE_PUBLIC — Consultation et filtrage de l'annuaire public

## Classification
- **Type** : user_journey
- **Sous-type** : recherche/filtrage côté serveur + affichage de fiche détail
- **Visibilité** : external_user
- **Acteur principal** : Grand public (visiteur anonyme)
- **Acteurs** : Visiteur (navigateur), Next.js RSC, base de données PostgreSQL (lecture seule)
- **Criticité** : Haute — vitrine principale de l'organisation OPEN PF ; c'est pour cette page que les adhésions ont de la valeur
- **Confiance** : high
- **Justification** : Flux tracé depuis la page `adherents/page.tsx`, la query `searchMembers()`, jusqu'à la page de fiche `adherents/[slug]/page.tsx` via `getMemberBySlug()`. Tous les fichiers cités ont été ouverts.

## Objectif

Permettre à tout visiteur de consulter la liste des membres actifs du réseau OPEN PF, de les filtrer par domaine d'activité et de les rechercher par nom ou description, puis d'accéder à la fiche détaillée d'un membre. Seuls les membres au statut `active` sont exposés publiquement.

## Acteurs
- **Visiteur anonyme** : aucune authentification requise
- **Next.js RSC** : exécute les requêtes DB côté serveur, render HTML statique/ISR
- **Base de données PostgreSQL** : requêtes en lecture seule sur `members`, `memberActivities`, `activityDomains`, `memberContacts`

## Points d'entrée
- `src/app/(public)/adherents/page.tsx` — liste avec filtres et recherche
- `src/app/(public)/adherents/[slug]/page.tsx` — fiche publique d'un membre (non lue directement)
- `src/lib/db/queries/members.ts` — fonctions `searchMembers()`, `getMemberBySlug()`, `getActivityDomains()`

## Étapes principales

### A. Consultation de l'annuaire

1. **Chargement de la page** — Le visiteur accède à `/adherents`. La page est rendue en RSC avec `revalidate = 3600` (cache ISR, rechargement max toutes les heures) — `src/app/(public)/adherents/page.tsx`.

2. **Lecture des paramètres de recherche** — Les search params `?q=<texte>` et `?domaine=<slug>` sont lus depuis l'URL. Si filtrés, les meta robots passent à `index: false, follow: false` (les pages filtrées ne sont pas indexées).

3. **Exécution des requêtes en parallèle** — `Promise.all([searchMembers({ q, domainId }), getActivityDomains(), getSiteStats()])` :
   - `searchMembers()` (`src/lib/db/queries/members.ts`) : `SELECT id, slug, name, logoUrl, description FROM members WHERE status='active' AND (name ILIKE '%q%' OR description ILIKE '%q%') AND id IN (domainSubquery)` trié par `name ASC`
   - `getActivityDomains()` : liste des domaines pour les filtres
   - `getSiteStats()` : chiffres clés pour l'en-tête de page

4. **Enrichissement des résultats** — Pour chaque membre trouvé, une seconde requête récupère le premier domaine d'activité (`memberActivities JOIN activityDomains`) pour l'affichage sur les cartes. Seul le premier domaine est retenu (pas de liste complète sur la carte).

5. **Render** — La page affiche : statistiques du secteur (`DirectoryStats`), barre de recherche (`MemberSearch`), filtres par domaine (`MemberFilters`), résumé du nombre de résultats (`MemberResultsSummary`), grille de cartes (`MemberGrid`). L'élément `<DirectoryHero>` (h1) est rendu immédiatement (non async) ; le reste est différé via `<Suspense>` avec skeleton.

### B. Fiche publique d'un membre

6. **Accès à la fiche** — Le visiteur clique sur une carte. Navigation vers `/adherents/[slug]`.

7. **Chargement de la fiche** — `getMemberBySlug(slug)` (`src/lib/db/queries/members.ts`) : `SELECT ... FROM members WHERE slug=slug AND status='active' LIMIT 1`. Si absent ou non actif : `null` → `notFound()`.

8. **Affichage** — La page affiche les informations du membre (logo, description, site web, LinkedIn, adresse, domaines d'activité, certifications, contacts visibles). La page de fiche n'a pas été lue directement — les composants d'affichage sont dans `src/components/annuaire/`.

## Règles métier

- **Seuls les membres `active` sont exposés** : toutes les queries publiques filtrent `status = 'active'` — commentaire explicite en tête de `src/lib/db/queries/members.ts` : « Publication governance: all public queries filter on status = 'active'. »
- **Recherche ILIKE** : la recherche textuelle `q` filtre sur `name` et `description` par `ILIKE '%q%'` (insensible à la casse) — `src/lib/db/queries/members.ts`
- **Filtre par domaine via sous-requête** : `id IN (SELECT memberId FROM member_activities WHERE domainId = domainId)` — `src/lib/db/queries/members.ts`
- **Tri alphabétique** : les résultats sont triés par `name ASC` — `src/lib/db/queries/members.ts`
- **ISR 1 heure** : `export const revalidate = 3600` — la liste n'est pas temps-réel — `src/app/(public)/adherents/page.tsx`
- **Pages filtrées non indexées** : `robots: { index: false }` si `q` ou `domaine` est renseigné — `src/app/(public)/adherents/page.tsx`

## Données

- **`members`** (lecture) : `id`, `slug`, `name`, `logoUrl`, `description`, `websiteUrl`, `address`, `yearFounded`, `employeeCount`, `linkedinUrl`, `isMedefMember`, `tahitiNumber` — `src/lib/db/schema.ts`
- **`memberActivities`** (lecture) : liaison membre ↔ domaine pour le filtre et l'affichage — `src/lib/db/schema.ts`
- **`activityDomains`** (lecture) : labels des domaines pour les filtres — `src/lib/db/schema.ts`
- **`siteStats`** (lecture) : `employeeCount` pour les statistiques en-tête — `src/lib/db/schema.ts`
- **`memberContacts`** (lecture probable sur fiche) : contacts visibles sur la fiche détail (via `getMemberContacts()` dans `src/lib/db/queries/members.ts`)

## Intégrations

Aucune intégration externe dans ce workflow. Lecture seule de la base de données.

## Risques

- **Cache ISR décalé de 1 heure** : si un membre est approuvé ou désactivé, il peut apparaître ou disparaître de l'annuaire avec jusqu'à 1 heure de délai. `revalidatePath('/adherents')` n'est pas appelé depuis `approveMember()` ou `deactivateMember()` — `src/lib/actions/admin/members.ts`. Le délai peut induire en erreur un visiteur.
- **Injection SQL via ILIKE** : le paramètre `q` est interpolé directement dans `ilike(members.name, '%${searchTerm}%')`. L'utilisation du query builder Drizzle protège contre l'injection SQL, mais un terme de recherche très long (sans limite) pourrait générer une requête coûteuse.
- **N+1 sur les domaines** : `searchMembers()` charge d'abord les membres filtrés, puis exécute une seconde requête pour tous leurs domaines. Cette requête est bornée par le filtre `inArray(memberActivities.memberId, memberIds)`, ce qui est correct, mais non paginé — si 500 membres sont actifs, toute la liste est chargée en mémoire.
- **Pas de pagination** : l'annuaire charge tous les membres actifs en une seule requête. Avec ~50 membres actuels, ce n'est pas un problème, mais cela n'est pas conçu pour passer à l'échelle.

## Questions ouvertes

- **`revalidatePath('/adherents')` après approbation** : pourquoi l'action `approveMember()` ne déclenche-t-elle pas `revalidatePath('/adherents')` ? Est-ce intentionnel (le délai ISR est acceptable) ou un oubli ?
- **Page de fiche `adherents/[slug]/page.tsx`** : non lue directement. Les composants `member-profile-hero.tsx`, `member-contact-card.tsx`, `member-domains-card.tsx`, `member-presentation-card.tsx` sont listés dans la carte des domaines mais non vérifiés.
- **OG image dynamique** : `src/app/(public)/adherents/opengraph-image.tsx` est listé dans la carte des domaines. Son contenu (génération dynamique de l'image OG) n'a pas été vérifié.

## Preuves
- `src/app/(public)/adherents/page.tsx`
- `src/lib/db/queries/members.ts`
- `src/lib/db/schema.ts`
