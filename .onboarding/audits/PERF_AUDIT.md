# Performance — Audit

> Confiance : medium (bundle non mesuré directement ; ISR et Server Components observés dans le code ; composants UI non tous lus)
> Produit par l'agent Auditeur (ONBAAA-48) le 2026-06-18.
> Fondé sur la lecture directe de : `next.config.ts`, `src/app/(public)/adherents/page.tsx`, `src/app/(public)/adherents/[slug]/page.tsx`, `src/lib/db/queries/members.ts`, `src/app/api/cron/reminders/route.ts`, `src/app/sitemap.ts`, `package.json`, `RELECTURE_WORKFLOWS.md`.

---

## Compréhension globale

Le projet est une application Next.js 15 déployée sur Vercel, avec ISR (Incremental Static Regeneration) pour les pages publiques et `force-dynamic` pour les pages personnalisées (fiches membres, fiche éditable). Les images sont gérées par `next/image` avec conversion AVIF/WebP. Le back-end utilise le driver Neon HTTP serverless, adapté aux fonctions Vercel.

---

## Résumé exécutif

L'architecture de rendu est bien pensée : Server Components par défaut, Suspense pour le streaming, ISR configuré sur les pages listes, `force-dynamic` ciblé sur les pages à contenu personnalisé. Deux bugs de cache ISR bloquants ont été identifiés dans RELECTURE_WORKFLOWS et confirmés dans le code : (1) `approveMember()` n'appelle pas `revalidatePath('/adherents')`, rendant les nouveaux membres invisibles jusqu'à 1 heure dans l'annuaire ; (2) la mise à jour d'une offre d'emploi existante (`upsertJob` en mode UPDATE) n'appelle pas `revalidatePath('/offres-emploi')`. Ces deux bugs fonctionnels sont des conséquences directes de l'ISR mal wired. Par ailleurs, les requêtes DB n'ont pas d'index secondaires, ce qui pèsera sur les pages les plus visitées à volume croissant.

---

## Constats détaillés

### Stratégie ISR par page

**Fait observé** : `src/app/(public)/adherents/page.tsx` déclare `export const revalidate = 3600` (1 heure). L'annuaire est donc mis en cache pendant 1 heure après la dernière revalidation. `revalidatePath` est appelé dans les Server Actions pour forcer la revalidation anticipée sur mutation. Cette approche est correcte pour un contenu peu fréquemment modifié.

**Fait observé** : `src/app/(public)/adherents/[slug]/page.tsx` déclare `export const dynamic = 'force-dynamic'`. Les fiches individuelles ne sont pas mises en cache — chaque visite déclenche une requête DB. Justification probable : la fiche peut changer à tout moment suite à l'édition par l'adhérent via magic link. C'est un compromis acceptable pour l'intégrité des données, mais cela signifie que chaque visite de fiche déclenche 4–5 requêtes DB séquentielles (membre, contacts, domaines, autres membres).

**Hypothèse** : avec ~50 membres actifs et un trafic modéré, `force-dynamic` sur les fiches est tenable. Avec 500 membres et des pics de trafic, ce sera à revoir (envisager une revalidation par tag ou un TTL court comme `revalidate = 60`).

### Bug : `approveMember` ne revalide pas `/adherents` (B4)

**Fait observé** : `src/lib/actions/admin/members.ts`, `approveMember()` appelle `revalidatePath('/admin/demandes')` et `revalidatePath('/admin/adherents')` mais **pas** `revalidatePath('/adherents')` ni `revalidatePath('/adherents/[slug]')`. Un membre nouvellement approuvé n'apparaîtra pas dans l'annuaire public avant la prochaine revalidation ISR automatique (1 heure maximum). Ce bug est documenté comme B4 dans RELECTURE_WORKFLOWS.

### Bug : `upsertJob` ne revalide pas `/offres-emploi` en mode UPDATE (B12)

**Fait observé** : `src/lib/actions/admin/content.ts`, dans la branche `if (id)` de `upsertJob` (ligne 133–135), seul `revalidatePath('/admin/offres-emploi')` est appelé. `revalidatePath('/offres-emploi')` est **absent** de la branche UPDATE. La branche INSERT (ligne 143) l'appelle. Résultat : les modifications d'une offre existante (y compris le passage `draft → published`) ne sont pas reflétées en page publique jusqu'à la prochaine revalidation ISR. Ce bug est documenté comme B12 dans RELECTURE_WORKFLOWS. En revanche, `upsertNews` en mode UPDATE appelle correctement `revalidatePath('/actualites')` — la correction est triviale et par analogie.

### Optimisation images

**Fait observé** : `next.config.ts` configure `images.formats: ['image/avif', 'image/webp']` et des `remotePatterns` pour le domaine legacy WordPress (`open.pf/wp-content/uploads/**`) et Vercel Blob (`*.public.blob.vercel-storage.com`). L'endpoint upload logo (`src/app/api/upload/logo/route.ts`) utilise `sharp` pour convertir en WebP (qualité 85, max 1200x1200). SVG conservé en natif. C'est une configuration solide.

**Incertitude** : les composants affichant les logos (`member-card.tsx`, `member-profile-hero.tsx`) n'ont pas été lus. L'utilisation de `next/image` avec dimensions explicites est une exigence du CLAUDE.md §4 — non vérifiable sans lire les composants.

### Parallel data fetching

**Fait observé** : `src/app/(public)/adherents/[slug]/page.tsx` utilise `Promise.all` pour charger membre + autres membres en parallèle (ligne 48), puis un second `Promise.all` pour domaines + contacts (ligne 56). C'est du waterfall réduit (2 niveaux) mais acceptable : le premier appel est conditionnel (notFound si membre absent).

**Fait observé** : `src/app/(public)/adherents/page.tsx` utilise `Promise.all` pour `searchMembers`, `getActivityDomains`, et `getSiteStats` en parallèle (ligne 54).

### Streaming avec Suspense

**Fait observé** : `src/app/(public)/adherents/page.tsx` utilise un pattern élaboré : le composant page n'est pas `async` (le `<DirectoryHero>` avec le `h1` est rendu immédiatement), seul `<AdherentsContent>` est `async` et enveloppé dans `<Suspense>` avec un skeleton. Cela garantit que le `h1` arrive dans le HTML streamé avant les données, optimisant le LCP. Ce pattern est explicitement commenté dans le code.

### Requêtes DB sans index

**Fait observé** : `searchMembers` (`src/lib/db/queries/members.ts`) effectue un `WHERE status = 'active' AND (name ILIKE '%?%' OR description ILIKE '%?%')`. Sans index sur `members.status`, ce filtre scanne la table complète. L'`ILIKE` sur `description` (colonne `text`) est particulièrement coûteux sur de grands jeux de données. En l'état (50 membres), la requête est rapide. À 500+ membres avec du texte long dans `description`, ce sera une requête lente sur la page la plus visitée.

**Fait observé** : Le cron de relances (`api/cron/reminders/route.ts`) effectue N+1 requêtes DB (une par membre `submitted`). Sans index sur `reminder_logs.member_id + type`, chaque requête scanne le log complet.

### Sitemap dynamique

**Fait observé** : `src/app/sitemap.ts` déclare `export const dynamic = 'force-dynamic'` et effectue 3 requêtes DB parallèles au moment de la génération. Cela signifie que le sitemap est généré à chaque requête de crawler, sans cache. **Hypothèse** : un `revalidate = 3600` ou `revalidate = 86400` serait plus adapté — les crawlers peuvent solliciter le sitemap plusieurs fois par heure.

### Bundle size

**Incertitude** : le bundle first-load JS n'a pas pu être mesuré directement (pas de `next build` exécuté). Le CLAUDE.md §12 fixe un objectif `< 80 kB` sur la home. Les dépendances lourdes potentielles : `react-email` (server-only), `drizzle-orm` (server-only), `@vercel/blob` (server-only), `lucide-react` (tree-shakeable), `tailwindcss` (CSS uniquement). **Hypothèse** : le bundle client est probablement raisonnable car la majorité des dépendances sont server-only. `@base-ui/react` (non utilisé ou peu) et `lucide-react` sont les candidats les plus risqués côté bundle client.

---

## Forces

- **Server Components par défaut** : les pages publiques n'envoient pas de JavaScript inutile au client.
- **Streaming avec Suspense sur `/adherents`** : le `h1` est streamed avant les données DB, optimisant le LCP perçu.
- **`Promise.all` systématique** : les requêtes parallélisables sont effectivement parallélisées.
- **Conversion WebP à l'upload** : les logos sont optimisés à la source avec Sharp, pas à la volée.
- **ISR configuré sur les pages listes** : `revalidate = 3600` sur l'annuaire — les requêtes DB ne sont pas faites pour chaque visiteur.

---

## Dettes techniques

- **Bug `approveMember` / `revalidatePath('/adherents')` absent** : les membres approuvés sont invisibles dans l'annuaire jusqu'à 1 heure.
- **Bug `upsertJob` UPDATE / `revalidatePath('/offres-emploi')` absent** : les offres mises à jour ne sont pas visibles immédiatement.
- **Absence d'index DB** : scans complets sur `members.status` et `ILIKE` sur description sans index GIN.
- **Sitemap `force-dynamic`** : régénéré à chaque requête de crawler au lieu d'être mis en cache.
- **N+1 dans le cron** : une requête par membre `submitted` au lieu d'une requête groupée.

---

## Zones critiques

- **`src/lib/actions/admin/members.ts` (`approveMember`)** : bug de cache direct. Une ligne de `revalidatePath('/adherents')` manquante impacte la visibilité en production.
- **`src/lib/actions/admin/content.ts` (`upsertJob`)** : bug de cache dans la branche UPDATE. Trois lignes manquantes.
- **`src/lib/db/queries/members.ts` (`searchMembers`)** : requête `ILIKE` sans index sur la page publique la plus visitée. Première requête à optimiser à mesure que le nombre de membres croît.

---

## Risques

- **Faux négatifs dans l'annuaire** : un membre approuvé par l'admin n'apparaît pas dans l'annuaire pendant jusqu'à 1 heure, ce qui peut générer des questions de support et de la confusion.
- **Offres d'emploi fantômes** : une offre publiée/modifiée n'est pas visible immédiatement sur `/offres-emploi`, ce qui nuit à la fiabilité perçue du back-office.
- **Dégradation progressive de l'annuaire** : sans index sur `members.status`, la page `/adherents` deviendra lente à mesure que la table `members` grandit (rejets accumulés, membres inactifs).

---

## Recommandations priorisées

1. **Ajouter `revalidatePath('/adherents')` dans `approveMember`** — correction triviale, impact immédiat sur la fiabilité du workflow d'approbation. — `src/lib/actions/admin/members.ts`
2. **Ajouter `revalidatePath('/offres-emploi')` dans la branche UPDATE de `upsertJob`** — par analogie avec `upsertNews` qui le fait correctement. — `src/lib/actions/admin/content.ts`
3. **Ajouter des index sur `members.status`, `news.status`, `job_offers.status`** — migration Drizzle `CREATE INDEX`. — `src/lib/db/schema.ts`
4. **Passer le sitemap en ISR** — remplacer `force-dynamic` par `export const revalidate = 86400` (24h) pour éviter une requête DB à chaque visite de crawler. — `src/app/sitemap.ts`
5. **Corriger le N+1 du cron de relances** — une requête unique avec `LEFT JOIN LATERAL` ou `GROUP BY` pour récupérer le dernier log de chaque membre. — `src/app/api/cron/reminders/route.ts`
6. **Mesurer le bundle first-load** avec `next build && next analyze` pour vérifier l'objectif `< 80 kB` du CLAUDE.md §12.

---

## Questions ouvertes

- Les composants d'affichage (cards membres, hero fiche) utilisent-ils bien `next/image` avec dimensions explicites, ou y a-t-il des `<img>` HTML bruts ? Non vérifiable sans lire `member-card.tsx`, `member-profile-hero.tsx`.
- Quel est le bundle first-load JS réel sur la home ? L'objectif `< 80 kB` du CLAUDE.md §12 n'a pas pu être vérifié sans exécuter un build.
- La fiche adhérent (`force-dynamic`) génère 4–5 requêtes DB par visite. Avec de la mise en cache par tag (Next.js `unstable_cache`) ou un TTL court, serait-il possible d'améliorer les performances sans sacrifier la fraîcheur des données ?
