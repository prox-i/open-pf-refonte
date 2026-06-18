# Architecture — Audit

> Confiance : high
> Produit par l'agent Auditeur (ONBAAA-48) le 2026-06-18.
> Fondé sur la lecture directe de : `package.json`, `tsconfig.json`, `next.config.ts`, `src/middleware.ts`, `src/lib/env.ts`, `src/lib/auth/config.ts`, `src/lib/actions/adhesion.ts`, `src/lib/actions/admin/members.ts`, `src/lib/actions/admin/content.ts`, `src/lib/actions/admin/settings.ts`, `src/lib/db/schema.ts`, `src/lib/db/queries/members.ts`, `src/app/(public)/adherents/page.tsx`, `src/app/(public)/adherents/[slug]/page.tsx`, `CLAUDE.md`, `CARTE_DES_DOMAINES.md`, `RELECTURE_WORKFLOWS.md`.

---

## Compréhension globale

OPEN PF est une application Next.js 15 App Router remplaçant un WordPress. La codebase suit une architecture claire : pages et layouts dans `src/app/`, actions serveur dans `src/lib/actions/`, requêtes Drizzle dans `src/lib/db/queries/`, schémas Zod dans `src/lib/validations/`, emails dans `src/lib/email/`. Le CLAUDE.md est le document de gouvernance du projet.

---

## Résumé exécutif

L'architecture est solide et cohérente pour un projet de cette taille. Les conventions du CLAUDE.md sont respectées dans l'écrasante majorité du code : TypeScript strict, Server Components par défaut, Server Actions pour les mutations, Zod sur toutes les données externes, Drizzle pour la persistance, Shadcn/Tailwind pour l'UI. Le projet bénéficie d'une configuration de qualité (Husky, ESLint, Prettier, Playwright avec axe-core). Trois points d'attention méritent l'attention d'un tech lead avant de continuer : (1) une dépendance beta critique (`next-auth@5.0.0-beta.31`) ; (2) une dualité non résolue entre données statiques et DB pour le bureau et les partenaires ; (3) l'absence totale de tests automatisés sur les Server Actions (le filet de sécurité se limite aux schémas Zod et aux e2e superficiels).

---

## Constats détaillés

### Conformité TypeScript

**Fait observé** : `tsconfig.json` active `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true` — les trois exigences du CLAUDE.md §2. Le code source lu ne contient aucun `any`, aucun `@ts-ignore` non justifié. Les types sont inférés sauf pour les contrats publics (`SubmitResult`, `SaveResult`, `MemberProfileData`) qui utilisent des interfaces explicites.

### Conventions de fichiers et d'imports

**Fait observé** : Les fichiers sont en `kebab-case.tsx`, les composants exportés en `PascalCase`. Les imports respectent l'ordre préconisé (node → externe → `@/lib` → `@/components`). Les path aliases `@/*`, `@/components/*`, `@/lib/*`, `@/app/*` sont correctement configurés dans `tsconfig.json`. Aucun fichier parmi ceux lus ne dépasse 300 lignes.

### Server Components et Server Actions

**Fait observé** : Les pages lues (`adherents/page.tsx`, `adherents/[slug]/page.tsx`) sont des Server Components sans `"use client"`. Les mutations (`submitAdhesion`, `approveMember`, `sendMagicLink`, `upsertNews`, `updateSiteStats`) portent toutes `'use server'`. Les routes API ne sont présentes que pour les cas légitimes (webhooks Brevo, cron, uploads) — conforme au CLAUDE.md §4.

### Dualité données statiques / DB

**Fait observé** : `src/lib/data/board-members.ts` existe en parallèle de la table `team_members` dans `src/lib/db/schema.ts`. La CARTE_DES_DOMAINES identifie cette ambiguïté comme incertitude #1. **Incertitude** : sans lire `src/app/(public)/reseau/page.tsx`, impossible de confirmer quelle source est utilisée. Si c'est le fichier statique, la table `team_members` est morte. Si c'est la DB, l'éditeur des paramètres admin devra ignorer le fichier. Cette ambiguïté est la dette architecturale la plus risquée à court terme.

### Dépendances

**Fait observé** : `package.json` liste `next-auth: "5.0.0-beta.31"` en production. Auth.js v5 est toujours en beta au moment de cet audit — l'API peut casser entre beta releases. **Fait observé** : `bcrypt-ts: "^8.0.1"` et `bcryptjs: "^3.0.3"` sont tous deux listés comme dépendances de production. `src/lib/auth/config.ts` utilise `import { compare } from 'bcryptjs'`. `bcrypt-ts` semble un résidu non nettoyé. **Hypothèse** : cette dépendance orpheline ne génère pas de bug mais gonfle le bundle inutilement (les deux pèsent ~20 kB chacune). **Fait observé** : `@base-ui/react: "^1.5.0"` coexiste avec Shadcn. Le CLAUDE.md §5 impose Shadcn en premier. L'utilisation réelle de `@base-ui/react` n'est pas déterminable sans parcourir les composants.

### Structure des tests

**Fait observé** : 9 fichiers de tests unitaires dans `tests/unit/` (Vitest), 1 fichier e2e dans `tests/e2e/` (Playwright). Les tests unitaires couvrent les schémas Zod (`validations.test.ts`), les utilitaires (`utils.test.ts`, `seeded-shuffle.test.ts`), et des composants visuels (`member-card.test.tsx`, `member-showcase.test.tsx`). **Fait observé** : aucun test unitaire sur les Server Actions (`submitAdhesion`, `approveMember`, `sendMagicLink`, `upsertNews`) ni sur les requêtes DB (`queries/members.ts`). C'est la lacune de couverture la plus critique.

### Table `events` droppée

**Fait observé** : `drizzle/0000_quiet_phalanx.sql` crée une table `events`. `drizzle/0003_drop_events.sql` la supprime immédiatement (4 migrations en tout). **Hypothèse** : une fonctionnalité "événements" a été entamée puis abandonnée avant mise en production. La table n'apparaît plus dans `schema.ts` actuel. Pas de risque résiduel dans le code applicatif, mais c'est un indicateur de churn précoce dans les migrations.

---

## Forces

- **TypeScript maximaliste bien maintenu** : `strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes` sans compromis. Fait observé dans `tsconfig.json` et confirmé par l'absence d'`any` dans le code lu.
- **Séparation claire des responsabilités** : queries DB dans `lib/db/queries/`, actions dans `lib/actions/`, validations dans `lib/validations/`, emails dans `lib/email/`. Un développeur cherchant la logique de persistance d'un membre sait exactement où aller.
- **Outillage complet** : Husky pre-commit (lint-staged), ESLint, Prettier avec plugin Tailwind, Playwright avec axe-core. Fait observé dans `package.json` et `.husky/pre-commit`.
- **Env vars validées au boot** : `src/lib/env.ts` utilise Zod et lève une erreur descriptive en cas de variable manquante. Empêche les démarrages silencieusement cassés.
- **CSP et headers de sécurité dans `next.config.ts`** : X-Content-Type-Options, Referrer-Policy, HSTS, X-Frame-Options, CSP, Permissions-Policy — tous présents.

---

## Dettes techniques

- **`bcrypt-ts` orphelin** : `bcryptjs` est utilisé pour la comparaison des mots de passe (`src/lib/auth/config.ts`), mais `bcrypt-ts` reste listé en dépendance de production sans usage visible. À supprimer.
- **Dualité `board-members.ts` vs `team_members` DB** : incertitude architecturale documentée mais non tranchée. Si les deux sources existent, la page `/reseau` pourra diverger de la DB sans avertissement.
- **`@base-ui/react` aux côtés de Shadcn** : deux design systems de primitives coexistent. Si `@base-ui/react` n'est utilisé que dans quelques composants, c'est une dépendance inutile. Si c'est une alternative voulue à Shadcn pour certains cas, c'est une décision architecturale non documentée dans le CLAUDE.md.
- **Pas de tests sur les Server Actions** : toute la logique métier (soumission d'adhésion, approbation, magic link) est exercée uniquement par les e2e, qui s'appuient sur un serveur démarré. Aucun test isolé ne vérifie le comportement des actions sur données contrôlées.
- **`next-auth@5.0.0-beta.31`** : une dépendance beta en production est une dette opérationnelle. La migration vers la version stable devra être planifiée.

---

## Zones critiques

- **`src/lib/auth/config.ts` dans un contexte middleware** : `src/middleware.ts` importe `authConfig` depuis `./auth.config`. Ce fichier importe `bcryptjs` et `getDb`. Or `bcryptjs` n'est pas compatible avec l'Edge Runtime de Next.js. L'import est utilisé uniquement pour la configuration de NextAuth, pas pour la vérification de session — mais si Next.js tente de bundler ce code dans le middleware Edge, cela pourrait causer une erreur silencieuse ou un fallback Node. **Hypothèse** : le projet utilise le runtime Node pour le middleware (non Edge), ce qui rend cela acceptable, mais non documenté.
- **`src/lib/actions/adhesion.ts`** : point d'entrée du workflow le plus critique (adhésion), portant un bug de perte silencieuse de `legalStatusId`. Toute modification de cette action touche au cœur du domaine.

---

## Risques

- **Beta auth en production** : `next-auth@5.0.0-beta.31` — une API breaking change lors d'une mise à jour de dépendances peut casser silencieusement l'authentification admin et les magic links.
- **Dualité source de vérité bureau** : si un développeur édite `board-members.ts` pensant que c'est la source canonique alors que la DB est la vraie source (ou l'inverse), la page `/reseau` affichera des données incohérentes sans erreur visible.

---

## Recommandations priorisées

1. **Supprimer `bcrypt-ts` des dépendances** — c'est un doublon non utilisé. — `package.json`
2. **Documenter et trancher la dualité `board-members.ts` / `team_members`** — décider quelle source est canonique et supprimer l'autre avant que la feature admin des paramètres soit implémentée. — `src/lib/data/board-members.ts`, `src/lib/db/schema.ts`
3. **Planifier la migration vers `next-auth` stable** — pinner la version beta courante explicitement et ouvrir un ticket de migration dès que la v5 stable sort. — `package.json`
4. **Ajouter des tests unitaires sur les Server Actions** — au minimum `submitAdhesion`, `approveMember`, `sendMagicLink` avec des mocks DB. — `src/lib/actions/`
5. **Clarifier l'usage de `@base-ui/react`** — si non utilisé, le retirer ; si utilisé, documenter les cas dans le CLAUDE.md. — `package.json`
6. **Vérifier la compatibilité Edge du middleware** — confirmer si le middleware tourne en Edge ou en Node runtime, et documenter la décision. — `src/middleware.ts`, `src/auth.config.ts`

---

## Questions ouvertes

- `src/app/(public)/reseau/page.tsx` utilise-t-il `board-members.ts` ou la table `team_members` ? La réponse détermine la source de vérité canonique.
- `@base-ui/react` est-il réellement utilisé dans des composants non lus, ou est-ce un résidu ?
- Le middleware Next.js est-il configuré pour tourner en Node.js runtime ou Edge runtime ? Cette information n'est pas visible dans les fichiers lus.
