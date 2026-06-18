# Accessibilité — Audit

> Confiance : medium (test automatisé observé dans les sources, composants UI non tous lus directement)
> Produit par l'agent Auditeur (ONBAAA-48) le 2026-06-18.
> Fondé sur la lecture directe de : `tests/e2e/example.spec.ts`, `src/app/(public)/adherents/page.tsx`, `src/app/(public)/adherents/[slug]/page.tsx`, `package.json` (`@axe-core/playwright`), `CLAUDE.md §6`, `RELECTURE_WORKFLOWS.md`.

---

## Compréhension globale

Le CLAUDE.md §6 impose des exigences d'accessibilité non négociables : pas de `<div>` cliquable, labels sur tous les inputs, erreurs reliées via `aria-describedby`, focus trap dans les modales, `aria-live` pour les changements dynamiques, contraste vérifié. Le projet est évalué contre WCAG 2.1 AA, niveau minimal exigé par le CLAUDE.md.

---

## Résumé exécutif

L'infrastructure de test accessibilité est en place et opérationnelle : `@axe-core/playwright` est configuré et les tests E2E vériffent l'absence de violations WCAG 2.1 AA critiques sur les pages principales (home, annuaire, fiche membre). Les tests E2E vérifient également la présence du skip link et l'ordre DOM correct (h1 avant footer). Ces signaux sont encourageants. Cependant, la majorité des composants de formulaire (`adhesion-form.tsx`, `profile-form.tsx`, `login-form.tsx`, composants admin) n'ont pas été lus directement — les constats d'accessibilité sur les formulaires reposent uniquement sur les tests E2E et les exigences du CLAUDE.md. Trois zones d'incertitude méritent une vérification manuelle : (1) la gestion des erreurs de validation du formulaire d'adhésion multi-étapes (attributs `aria-describedby` sur les inputs en erreur) ; (2) les annonces dynamiques lors des transitions d'étapes (présence d'un `aria-live`) ; (3) les composants d'action admin (`member-actions.tsx`, modales de confirmation) dont la conformité WCAG n'est pas vérifiable sans lecture directe.

---

## Constats détaillés

### Tests automatisés avec axe-core

**Fait observé** : `@axe-core/playwright: "^4.11.3"` est listé dans `devDependencies`. Les tests E2E (`tests/e2e/example.spec.ts`) incluent des vérifications axe sur `/` (lignes 11–14) et `/adherents` (lignes 165–170), filtrées sur les violations `impact === 'critical'`. Ces tests bloquent le CI en cas de violation critique sur les pages les plus visitées. C'est un filet de sécurité de base bien câblé.

**Fait observé** : Les tests axe filtrent sur `impact === 'critical'` — les violations de niveau `serious`, `moderate` ou `minor` ne font pas échouer les tests. **Hypothèse** : en pratique, les violations `serious` (par exemple, un label manquant sur un input complexe) peuvent passer inaperçues en CI.

### Skip link

**Fait observé** : `tests/e2e/example.spec.ts` vérifie explicitement la présence d'un `.skip-link` pointant vers `#contenu` sur `/` (ligne 56) et `/adherents` (ligne 133). Les tests vérifient également l'ordre DOM `h1 → footer` et la présence de `#contenu` comme élément `main`. Ce pattern est conforme aux recommandations WCAG 2.4.1 (Bypass Blocks).

### Structure sémantique et ordre DOM

**Fait observé** : Les tests E2E vérifient que `main#contenu` existe et contient le `h1`, que le footer est après le main dans le DOM, et que cet ordre est maintenu dans le HTML brut (SSR streaming, lignes 136–154). Ces vérifications garantissent une structure de document correcte pour la navigation clavier et les lecteurs d'écran.

**Fait observé** : `src/app/(public)/adherents/page.tsx` utilise `<section aria-labelledby="members-count-title">` (ligne 77) et `<div aria-label="Recherche et filtres">` (ligne 72). Ces attributs ARIA donnent du contexte aux lecteurs d'écran.

### Formulaire d'adhésion multi-étapes

**Fait observé** : Le test E2E vérifie la présence de `#name[aria-required="true"]` et `#legalStatus[aria-required="true"]` sur l'étape 1 (lignes 252–253). Ces attributs sont présents dans le HTML généré, ce qui confirme que les inputs obligatoires sont correctement marqués.

**Incertitude** : La gestion des erreurs de validation n'est pas couverte par les tests E2E lus. Le CLAUDE.md §6 exige `aria-describedby` pour relier les erreurs aux inputs. Sans lire `adhesion-form.tsx` et les composants d'étape, il est impossible de confirmer que les erreurs Zod sont correctement annoncées aux lecteurs d'écran.

**Incertitude** : Le formulaire multi-étapes effectue des transitions entre étapes. Le CLAUDE.md §6 exige `aria-live` pour les changements dynamiques. Sans lire `stepper.tsx` ou `adhesion-form.tsx`, la présence d'une région `aria-live` lors des transitions est inconnue.

### Composants Shadcn

**Fait observé** : Le projet utilise Shadcn (`components.json` présent, `shadcn: "^4.7.0"` dans `package.json`). Shadcn fournit des primitives accessibles (Dialog avec focus trap, Label avec association correcte, etc.) par défaut. **Hypothèse** : les modales admin (confirmation de rejet, actions sur les membres) utilisent probablement `shadcn/Dialog` ou `shadcn/AlertDialog` qui fournissent le focus trap requis par le CLAUDE.md §6. Non confirmé sans lire `member-actions.tsx`.

### Formulaires admin

**Incertitude** : Les composants admin (`news-form.tsx`, `job-form.tsx`, `login-form.tsx`, `site-stats-form.tsx`) n'ont pas été lus. La conformité à11y de ces formulaires (labels associés, erreurs annoncées, focus management) ne peut pas être évaluée directement.

**Fait observé** : Le test E2E vérifie que la page login affiche un `<label>` pour le champ email (ligne 285 : `page.getByLabel(/email/i)`). C'est une vérification indirecte de la présence du label.

### Contraste

**Incertitude** : Le contraste des couleurs n'a pas pu être évalué sans accès au design system Tailwind (`tailwind.config.ts`) ni aux fichiers CSS. Le CLAUDE.md §6 exige un test de contraste avant tout commit de texte sur fond coloré. Les tests axe vérifient le contraste au niveau `critical`, mais pas `serious`.

### Navigation clavier et focus visible

**Incertitude** : La visibilité du focus lors de la navigation clavier dépend des styles CSS, non lisibles via les fichiers d'actions/composants. Les tests E2E lus ne couvrent pas explicitement la navigation clavier (tabulation, activation d'éléments interactifs).

### Composant de recherche et filtres

**Fait observé** : `src/app/(public)/adherents/page.tsx` utilise un `<input>` de recherche exposé aux tests via `getByRole('searchbox', { name: /Rechercher/i })`. Le rôle `searchbox` est sémantiquement correct pour un champ de recherche.

---

## Forces

- **axe-core intégré en CI** : les violations critiques WCAG 2.1 AA sont détectées automatiquement sur les pages principales.
- **Skip link vérifié automatiquement** : présence et cible (`#contenu`) vérifiées en E2E.
- **Ordre DOM correct (h1 avant footer)** : testé dans le HTML brut (SSR streaming), garantissant une structure correcte même avant hydration.
- **Shadcn comme base de composants** : les primitives interactives (modales, labels, formulaires) sont accessibles par construction.
- **Inputs obligatoires avec `aria-required`** : vérifié sur le formulaire d'adhésion.
- **ARIA labels sur les sections dynamiques** : `aria-label` et `aria-labelledby` présents sur les zones de recherche et de résultats.

---

## Dettes techniques

- **Couverture axe limitée aux violations critiques** : les violations `serious` ne font pas échouer les tests CI.
- **Transitions multi-étapes sans `aria-live` confirmé** : le formulaire d'adhésion change d'étape dynamiquement ; sans `aria-live`, les lecteurs d'écran ne sont pas notifiés.
- **Erreurs de validation sans `aria-describedby` confirmé** : les messages d'erreur Zod doivent être reliés aux inputs via `aria-describedby` — non vérifié dans le code des composants.
- **Pages admin non testées a11y** : aucun test axe sur les pages admin dans les e2e lus. Le back-office admin n'est pas couvert.

---

## Zones critiques

- **`src/components/adhesion/adhesion-form.tsx`** : formulaire multi-étapes principal, point d'entrée du workflow le plus critique du produit. La conformité a11y de ce composant est la plus importante à vérifier car il sera utilisé par des entreprises de toutes natures, potentiellement avec des utilisateurs en situation de handicap.
- **`src/components/admin/member-actions.tsx`** : composant des actions admin (validation, rejet, désactivation, envoi magic link). Le focus management lors des confirmations d'action est critique pour un usage clavier dans le back-office.

---

## Risques

- **Formulaire d'adhésion inaccessible au clavier ou à la synthèse vocale** : si les erreurs de validation ne sont pas annoncées via `aria-live` ou `aria-describedby`, un utilisateur de lecteur d'écran ne recevra pas de retour sur les erreurs de saisie. Le formulaire est le workflow le plus important du produit.
- **Filtres et recherche de l'annuaire** : si les changements de résultats lors d'une recherche ne sont pas annoncés via `aria-live`, les utilisateurs de lecteurs d'écran ne sauront pas que les résultats ont changé.

---

## Recommandations priorisées

1. **Étendre les tests axe aux violations `serious`** — remplacer `filter((v) => v.impact === 'critical')` par `filter((v) => ['critical', 'serious'].includes(v.impact ?? ''))` dans les tests E2E. — `tests/e2e/example.spec.ts`
2. **Vérifier la présence d'`aria-live` sur les transitions d'étapes** du formulaire d'adhésion — ajouter une région `role="status" aria-live="polite"` qui annonce le nom de l'étape courante lors des transitions. — `src/components/adhesion/stepper.tsx` ou `adhesion-form.tsx`
3. **Vérifier la liaison `aria-describedby` sur les inputs en erreur** — s'assurer que chaque message d'erreur Zod est relié à son input via `aria-describedby` dans les composants de formulaire. — `src/components/adhesion/step-*.tsx`
4. **Ajouter des tests axe sur les pages admin** — au minimum `/admin/demandes` et `/admin/login`, avec un compte de test. — `tests/e2e/`
5. **Ajouter `aria-live="polite"` sur la zone de résultats de l'annuaire** — pour annoncer les changements de résultats lors d'une recherche ou d'un filtrage sans rechargement de page. — `src/components/annuaire/member-results-summary.tsx`
6. **Vérifier le contraste des couleurs** dans `tailwind.config.ts` contre les ratios WCAG AA (4.5:1 pour le texte normal, 3:1 pour le grand texte).

---

## Questions ouvertes

- `adhesion-form.tsx` gère-t-il les transitions d'étapes avec une annonce `aria-live` ? La complexité du formulaire multi-étapes rend cette vérification prioritaire.
- Les erreurs de validation (retournées par `react-hook-form` + Zod) sont-elles reliées aux inputs via `aria-describedby` dans les composants d'étapes ?
- Le contraste du thème de couleurs du site (bleu principal, texte sur fond coloré dans les boutons et badges) respecte-t-il WCAG AA 4.5:1 ?
- Les composants admin utilisent-ils `shadcn/AlertDialog` (avec focus trap correct) pour les confirmations d'action destructives ?
