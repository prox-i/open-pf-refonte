# SEO — Audit

> Confiance : high (pages clés lues) / medium (pages éditoriales non toutes lues)
> Produit par l'agent Auditeur (ONBAAA-48) le 2026-06-18.
> Fondé sur la lecture directe de : `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/(public)/adherents/page.tsx`, `src/app/(public)/adherents/[slug]/page.tsx`, `src/lib/actions/admin/content.ts`, `src/lib/db/schema.ts` (champs `jsonLd`, `metaDescription`), `next.config.ts`, `RELECTURE_WORKFLOWS.md`.

---

## Compréhension globale

OPEN PF est un site vitrine public pour une organisation patronale : l'annuaire des membres, les actualités, les offres d'emploi et les pages institutionnelles sont les principales cibles SEO. Le CLAUDE.md §13 impose : `generateMetadata` sur toutes les pages publiques, JSON-LD (`Organization`, `Article`, `JobPosting`, `BreadcrumbList`) par type de page, `sitemap.ts` et `robots.ts` à la racine de `app/`, et redirections 301 depuis les URLs WordPress legacy.

---

## Résumé exécutif

L'infrastructure SEO de base est en place et correctement câblée : `sitemap.ts` dynamique, `robots.ts`, `generateMetadata` sur les pages visitées, JSON-LD sur les fiches membres, CSP et headers de sécurité. Deux violations directes du CLAUDE.md §13 persistent : (1) le champ `jsonLd` de la table `news` n'est jamais rempli par `upsertNews` — toutes les actualités publiées sont sans données structurées `Article` ; (2) le champ `jsonLd` de la table `job_offers` n'est jamais rempli par `upsertJob` — toutes les offres d'emploi sont sans `JobPosting`. Ces deux lacunes impactent directement le ranking sur les requêtes de type "offres d'emploi Polynésie française" dans Google Search. Par ailleurs, les URLs canoniques sont construites avec des chemins relatifs plutôt qu'absolus, ce qui peut causer des ambiguïtés selon les crawlers.

---

## Constats détaillés

### `sitemap.ts` : présent et dynamique

**Fait observé** : `src/app/sitemap.ts` génère un sitemap dynamique couvrant les pages statiques (accueil, annuaire, actualités, offres, réseau, contact, légales), les fiches membres actifs, les articles publiés, et les offres publiées. Le sitemap est déclaré comme `force-dynamic`, ce qui signifie qu'il est régénéré à chaque requête de crawler. L'URL de base `https://open.pf` est codée en dur.

**Hypothèse** : `force-dynamic` est inutilement coûteux pour le sitemap — il déclenche 3 requêtes DB à chaque visite de crawler, sans bénéfice d'fraîcheur supplémentaire par rapport à un `revalidate = 86400`. (Voir PERF_AUDIT pour la recommandation correspondante.)

**Fait observé** : `documents-utiles` est inclus dans le sitemap statique, mais aucune table DB ne correspond (CARTE_DES_DOMAINES, incertitude #2). Si la page est statique/vide, sa présence dans le sitemap est acceptable ; si la page retourne un 404 ou un contenu très pauvre, cela peut pénaliser le crawl budget.

### `robots.ts` : conforme

**Fait observé** : `src/app/robots.ts` autorise `/` et disallow `/admin/`. Le sitemap est référencé à `https://open.pf/sitemap.xml`. Conforme aux bonnes pratiques.

### `generateMetadata` : bien câblée sur les pages lues

**Fait observé** : `src/app/(public)/adherents/page.tsx` implémente `generateMetadata` avec title, description, Open Graph (title, description, type `website`, url, images), Twitter Card. Pour les recherches filtrées (`?q=` ou `?domaine=`), les métadonnées incluent `robots: { index: false, follow: false }` — protection correcte pour éviter l'indexation de pages filtrées à faible valeur.

**Fait observé** : `src/app/(public)/adherents/[slug]/page.tsx` implémente `generateMetadata` par fiche avec title absolu (`${member.name} – Adhérent OPEN PF`), description tronquée à 160 chars, Open Graph de type `profile`, canonical, Twitter Card. Fallback sur le logo OPEN si pas de logo membre.

**Incertitude** : les pages `actualites/page.tsx`, `actualites/[slug]/page.tsx`, `offres-emploi/page.tsx`, `offres-emploi/[slug]/page.tsx` n'ont pas été lues. La présence de `generateMetadata` sur ces pages n'est pas confirmée, bien qu'elle soit exigée par le CLAUDE.md §13.

### JSON-LD : fiches membres correctes, contenus éditoriaux vides (B10)

**Fait observé** : `src/app/(public)/adherents/[slug]/page.tsx` injecte deux blocs JSON-LD via `dangerouslySetInnerHTML` : `buildBreadcrumbJsonLd` et `buildMemberJsonLd`. L'implémentation est conforme au CLAUDE.md §13.

**Fait observé** : La table `news` possède un champ `jsonLd jsonb` et la table `job_offers` de même. Ces champs sont prévus pour stocker les données structurées `Article` et `JobPosting`. Mais `upsertNews` dans `src/lib/actions/admin/content.ts` n'alimente jamais `jsonLd` : le champ n'est même pas mentionné dans l'objet de mise à jour (lignes 43–55 et 64–76). Même constat pour `upsertJob`. Toutes les actualités et offres d'emploi publiées depuis le début du projet sont sans JSON-LD. C'est une violation directe du CLAUDE.md §13 : "JSON-LD : `Organization` global + spécifique par page (`Article`, `JobPosting`, `BreadcrumbList`)".

### URLs canoniques relatives

**Fait observé** : `generateMetadata` dans `adherents/page.tsx` et `[slug]/page.tsx` utilise `alternates: { canonical: '/adherents' }` et `alternates: { canonical: `/adherents/${slug}` }` — des chemins **relatifs**. La spécification des URLs canoniques recommande des URLs absolues pour éviter toute ambiguïté. Next.js résout ces URLs automatiquement en utilisant l'`APP_URL` ou le header `Host`, mais ce comportement dépend de la configuration du déploiement. **Hypothèse** : en production sur Vercel avec `AUTH_URL` correctement configuré, Next.js résout correctement les canoniques relatives. Mais expliciter les URLs absolues (ex. `https://open.pf/adherents`) serait plus robuste.

### Redirection WordPress legacy

**Fait observé** : `next.config.ts` définit une seule redirection 301 : `/politique-confidentialite` → `/confidentialite`. Le CLAUDE.md §13 mentionne "redirections 301 depuis les URLs WordPress legacy (à fournir par le bureau)". **Incertitude** : la liste complète des redirections n'a pas encore été fournie ou implémentée. L'absence de redirections depuis les URLs WordPress peut engendrer une perte de PageRank sur les pages qui avaient acquis des backlinks sur l'ancien site.

### Headers de sécurité et CSP

**Fait observé** : `next.config.ts` configure un CSP complet avec `frame-ancestors 'none'`, `upgrade-insecure-requests`, HSTS (`max-age=63072000; includeSubDomains; preload`), X-Content-Type-Options, Referrer-Policy. Pas d'impact SEO direct, mais ces headers améliorent la note de sécurité perçue et la confiance des crawlers.

### OG Image dynamique

**Fait observé** : `src/app/(public)/adherents/opengraph-image.tsx` et `src/app/(public)/opengraph-image.tsx` existent (non lus). La CARTE_DES_DOMAINES mentionne `opengraph-image.tsx` pour les fiches membres. **Hypothèse** : une image OG dynamique est générée par fiche. C'est une bonne pratique pour le partage social.

---

## Forces

- **Sitemap dynamique couvrant les trois types de contenu** : membres actifs, actualités publiées, offres publiées — mis à jour automatiquement sur chaque mutation.
- **`robots: { index: false }` sur les pages filtrées** : empêche l'indexation de combinaisons de filtres à faible valeur.
- **JSON-LD sur les fiches membres** : `BreadcrumbList` + `Organization`-like par membre, injecté côté serveur.
- **Canonical sur toutes les pages lues** : présent sur annuaire et fiche membre.
- **HSTS + CSP** : en production, le site sera servi exclusivement en HTTPS.

---

## Dettes techniques

- **`jsonLd` jamais rempli pour actualités et offres** : violation CLAUDE.md §13, toutes les actualités et offres sont sans données structurées depuis le lancement.
- **URLs canoniques relatives** : dépendance au comportement de résolution Next.js. Mieux vaut être explicite.
- **Sitemap `force-dynamic`** : requêtes DB inutiles à chaque passage de crawler.
- **Redirections WordPress incomplètes** : une seule redirection configurée, la liste complète n'est pas intégrée.

---

## Zones critiques

- **`src/lib/actions/admin/content.ts` (`upsertNews`, `upsertJob`)** : c'est là que le JSON-LD doit être calculé et persisté. La logique de construction de `jsonLd` n'existe pas encore (le champ est présent en DB mais jamais alimenté).

---

## Risques

- **Absence de JSON-LD sur le contenu éditorial** : les actualités et offres d'emploi ne bénéficient pas des rich snippets Google (`Article`, `JobPosting`). Les offres d'emploi sans `JobPosting` structuré ne peuvent pas apparaître dans Google Jobs. Impact direct sur la visibilité des offres publiées.
- **Perte de PageRank WordPress** : sans redirections 301 depuis les URLs de l'ancien site, les pages qui avaient des backlinks ou une notoriété Google voient leur PageRank perdu. La priorité de ces redirections dépend du trafic entrant.

---

## Recommandations priorisées

1. **Construire et persister le JSON-LD `Article` dans `upsertNews`** — calculer le bloc `{ "@context": "https://schema.org", "@type": "Article", ... }` à partir des données validées et le stocker dans `news.jsonLd`. L'injection dans la page se fait ensuite via `dangerouslySetInnerHTML`. — `src/lib/actions/admin/content.ts`, `src/lib/seo.ts`
2. **Construire et persister le JSON-LD `JobPosting` dans `upsertJob`** — même logique que pour les actualités. Le `JobPosting` schema inclut `title`, `description`, `datePosted`, `validThrough`, `hiringOrganization`, `jobLocation`. — `src/lib/actions/admin/content.ts`, `src/lib/seo.ts`
3. **Vérifier la présence de `generateMetadata` sur les pages actualités et offres** — `src/app/(public)/actualites/[slug]/page.tsx` et `src/app/(public)/offres-emploi/[slug]/page.tsx` doivent générer des métadonnées avec le titre de l'article/offre, description, canonical.
4. **Passer le sitemap en ISR** — `export const revalidate = 86400` au lieu de `force-dynamic`. — `src/app/sitemap.ts`
5. **Intégrer la liste complète des redirections WordPress** — récupérer les URLs legacy auprès du bureau, les ajouter dans `next.config.ts`. — `next.config.ts`
6. **Rendre les canoniques absolues** — préfixer avec `https://open.pf` pour éviter toute ambiguïté de résolution. — toutes les pages publiques

---

## Questions ouvertes

- `src/app/(public)/actualites/[slug]/page.tsx` : implémente-t-il `generateMetadata` avec le titre de l'article ? Non confirmé.
- `src/app/(public)/offres-emploi/[slug]/page.tsx` : idem pour les offres.
- L'OG image dynamique (`opengraph-image.tsx`) est-elle connectée à la fiche membre pour utiliser son logo, ou une image générique OPEN PF ?
- La liste des redirections WordPress a-t-elle été fournie par le bureau ? Si oui, elle n'est pas dans le code ; si non, c'est à prévoir avant la mise en production.
