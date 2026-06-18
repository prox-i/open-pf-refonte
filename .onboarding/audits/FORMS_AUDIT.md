# Formulaires — Audit

> Confiance : high (côté validation et Server Actions) / medium (côté composants UI, non tous lus)
> Produit par l'agent Auditeur (ONBAAA-48) le 2026-06-18.
> Fondé sur la lecture directe de : `src/lib/validations/adhesion.ts`, `src/lib/actions/adhesion.ts`, `src/lib/actions/admin/members.ts`, `src/lib/actions/admin/content.ts`, `src/lib/actions/admin/settings.ts`, `src/lib/actions/member-profile.ts`, `src/lib/validations/member-profile.ts` (non lu, référencé), `src/lib/validations/admin.ts` (non lu, référencé), `tests/unit/validations.test.ts`, `package.json`, `RELECTURE_WORKFLOWS.md`.

---

## Compréhension globale

Le projet utilise `react-hook-form` avec `zodResolver` pour les formulaires client-side, et des Server Actions (marquées `'use server'`) pour les mutations. Les schémas Zod sont centralisés dans `src/lib/validations/`. Le CLAUDE.md §3 exige Zod sur toute donnée externe, §9 impose `react-hook-form + zodResolver` et un retour `{ success, errors? }` des Server Actions.

---

## Résumé exécutif

La discipline de validation Zod est très bien tenue : schémas centralisés, `z.infer<typeof schema>` pour les types, validations multi-étapes correctement composées, tests unitaires sur les schémas clés. La double validation (client + serveur) est présente pour les workflows principaux. Deux exceptions constituent des violations directes du CLAUDE.md §3 : (1) `updateSiteStats` accepte une valeur sans schéma Zod côté serveur ; (2) le bug de mapping `legalStatus → legalStatusId: null` annule silencieusement une validation correctement définie côté client. Côté UX des formulaires, l'absence de confirmation avant `rejectMember()` (action irréversible) et l'ambiguïté du comportement post-soumission du profil adhérent sont les points fonctionnels les plus importants à résoudre.

---

## Constats détaillés

### Schémas Zod : organisation et structure

**Fait observé** : `src/lib/validations/adhesion.ts` définit 5 schémas par étape (`stepEntrepriseSchema`, `stepActivitesSchema`, `stepContactsSchema`, `stepCertificationsSchema`) et un `adhesionSchema` global résultant de leur composition via `.merge()`. Les types sont systématiquement extraits avec `z.infer<typeof ...>` — pas de redéfinition manuelle. La contrainte RGPD est encodée dans le schéma (`rgpdConsent: z.boolean().refine(v => v === true, ...)`). Le schéma contact utilise `.refine()` pour valider la présence d'exactement un contact primaire.

**Fait observé** : Le schéma `stepContactsSchema` exige `contacts.length >= 1` et au moins un `isPrimary: true`. Ces deux contraintes croisées sont vérifiées côté client via `react-hook-form` et côté serveur via `adhesionSchema.safeParse()` dans `submitAdhesion`.

### Bug : `legalStatus` validé mais ignoré (B1)

**Fait observé** : `stepEntrepriseSchema` définit `legalStatus: z.string().min(1, 'Statut juridique requis')`. La valeur passe la validation Zod de `adhesionSchema`. Mais dans `submitAdhesion` (`src/lib/actions/adhesion.ts`, ligne 52), l'insertion utilise `legalStatusId: null` en dur — la valeur `data.legalStatus` n'est **jamais** mappée. La validation côté client est trompeuse : l'utilisateur est obligé de choisir un statut juridique, mais cette valeur n'est jamais persistée. Ce bug est documenté comme B1 dans RELECTURE_WORKFLOWS.

### `updateSiteStats` : validation Zod absente (B14)

**Fait observé** : `src/lib/actions/admin/settings.ts` déclare `updateSiteStats(employeeCount: number | null)` et insère directement la valeur dans la DB sans schéma Zod. La seule vérification est le typage TypeScript statique (qui ne protège pas au runtime). Une Server Action peut être appelée directement depuis le browser DevTools avec n'importe quelle valeur. C'est une violation directe du CLAUDE.md §3 : "Toute donnée externe passe par un schéma Zod".

### Schémas locaux dans `content.ts`

**Fait observé** : `newsSchema` et `jobSchema` sont définis **directement dans** `src/lib/actions/admin/content.ts`, pas dans `src/lib/validations/`. Ce choix s'écarte légèrement de la convention CLAUDE.md §3 ("schémas centralisés dans `src/lib/validations/`") mais reste acceptable pour des schémas d'usage unique et local. Si ces schémas évoluent ou sont réutilisés (par exemple pour la validation d'un import en masse), leur position dans `content.ts` deviendra une friction.

### Double validation : client + serveur

**Fait observé** : Toutes les Server Actions lues effectuent un `safeParse` avant toute opération DB. En cas d'échec, elles retournent `{ success: false, errors }` sans lever d'exception. C'est le contrat documenté dans le CLAUDE.md §9. Les formulaires du front peuvent donc afficher les erreurs de validation serveur via ce retour structuré.

### Formulaire multi-étapes adhesion

**Fait observé** : Le CLAUDE.md §9 stipule "Sauvegarde locale (localStorage) pour les forms multi-étapes". La structure du formulaire d'adhésion (5 étapes, stepper, référence à `adhesion-form.tsx`) suggère cette implémentation, mais `adhesion-form.tsx` n'a pas été lu directement. **Incertitude** : la récupération de brouillon corrompu dans `localStorage` est identifiée comme comportement non géré dans RELECTURE_WORKFLOWS.

### Protection contre la double soumission

**Fait observé** : `submitAdhesion` côté serveur n'a pas de mécanisme de déduplication (pas d'idempotency key, pas de vérification d'unicité au-delà du slug). Le CLAUDE.md §9 ne mentionne pas ce cas, mais la protection est uniquement côté client. Un appel direct à la Server Action depuis un script peut créer des membres en doublon avec des slugs différents (`nom`, `nom-1`, etc.) grâce à `generateUniqueSlug`.

### `deleteNews` et `deleteJob` : irréversibles sans confirmation

**Fait observé** : `deleteNews` et `deleteJob` dans `src/lib/actions/admin/content.ts` effectuent une suppression immédiate en DB sans soft-delete ni mécanisme de confirmation. De même, `rejectMember()` remet un membre en `draft` (état irréversible dans le flux UX) sans modale de confirmation documentée. Ces comportements sont identifiés comme problèmes dans RELECTURE_WORKFLOWS (B13 pour le rejet, et pour les suppressions de contenu).

### Schéma `adminLoginSchema` non lu

**Incertitude** : `src/lib/validations/admin.ts` est référencé dans `src/lib/auth/config.ts` pour `adminLoginSchema.safeParse(credentials)` mais n'a pas été lu. Les contraintes exactes (longueur min du mot de passe, format email) sont inconnues.

---

## Forces

- **Zod systématique sur toutes les données externes** — à l'exception d'`updateSiteStats`, toutes les Server Actions validées par Zod avant toute opération.
- **Composition de schémas propre** — `adhesionSchema` composé depuis les schémas par étape via `.merge()`. Un seul point de validation pour le submit final.
- **`z.infer<>` systématique** — aucun type redéfini manuellement. La source de vérité du type est le schéma Zod.
- **Tests unitaires sur les schémas** — `tests/unit/validations.test.ts` couvre 15 cas de test sur `stepEntrepriseSchema`, `stepActivitesSchema`, `stepContactsSchema`, `adhesionSchema`. Les cas edge importants (tahitiNumber invalide, description > 500 chars, URL invalide, rgpdConsent false) sont tous couverts.
- **Retour structuré `{ success, errors? }`** — contrat respecté dans toutes les actions lues.

---

## Dettes techniques

- **Bug `legalStatus` non mappé** : violation fonctionnelle silencieuse. La validation client donne une fausse impression de robustesse.
- **`updateSiteStats` sans Zod** : violation du CLAUDE.md §3 — une valeur arbitraire peut être envoyée via DevTools.
- **Schémas `newsSchema` et `jobSchema` locaux** : légère non-conformité à la convention de centralisation.
- **Pas de protection contre la double soumission** : `submitAdhesion` peut être appelée plusieurs fois pour le même utilisateur.
- **Suppression contenu irréversible sans soft-delete** : risque opérationnel si un admin supprime par erreur.

---

## Zones critiques

- **`src/lib/actions/adhesion.ts`** : la correction du bug `legalStatusId` nécessite de résoudre l'ID depuis la table `legalStatuses` à partir du label, ou de changer le schéma pour accepter l'UUID directement. Ce changement touche à la fois la validation, le composant de formulaire et l'action.
- **`src/lib/validations/adhesion.ts`** : tout changement à ce fichier impacte le formulaire multi-étapes en production. La composition via `.merge()` signifie qu'un changement de type dans un schéma d'étape se propage au `adhesionSchema` global.

---

## Risques

- **Données de statut juridique invalides en production** : toutes les adhésions créées depuis le début du projet ont `legalStatusId: null`. Corriger le bug ne corrige pas l'historique.
- **`updateSiteStats` exploitable** : une Server Action sans validation Zod peut recevoir `employeeCount: -999999` ou `employeeCount: "'; DROP TABLE..."` — pas de risque injection SQL grâce à Drizzle ORM, mais des valeurs absurdes peuvent s'afficher sur la home et l'annuaire.

---

## Recommandations priorisées

1. **Corriger le mapping `legalStatus → legalStatusId`** — soit le composant d'étape 1 passe un UUID directement (en chargeant les `legalStatuses` depuis la DB), soit `submitAdhesion` fait un lookup `WHERE label = data.legalStatus`. Option 1 recommandée pour éviter une requête DB de lookup. — `src/lib/validations/adhesion.ts`, `src/lib/actions/adhesion.ts`, composant `step-entreprise.tsx`
2. **Ajouter un schéma Zod dans `updateSiteStats`** — `const schema = z.object({ employeeCount: z.number().int().min(0).max(999999).nullable() })` avant l'insert. — `src/lib/actions/admin/settings.ts`
3. **Déplacer `newsSchema` et `jobSchema` vers `src/lib/validations/`** — pour respecter la convention de centralisation et faciliter les réutilisations futures. — `src/lib/actions/admin/content.ts`
4. **Ajouter une modale de confirmation pour `rejectMember`** — l'action est irréversible (le membre revient à `draft`) sans indication dans l'UI. — composants admin dans `src/components/admin/`
5. **Documenter le comportement du formulaire multi-étapes** avec `localStorage` corrompu — afficher un message explicite plutôt qu'ignorer silencieusement.

---

## Questions ouvertes

- `src/lib/validations/admin.ts` : quelles sont les contraintes exactes de `adminLoginSchema` ? La longueur minimale du mot de passe impacte la politique de sécurité.
- `adhesion-form.tsx` : comment le brouillon `localStorage` est-il récupéré et validé ? En cas de schéma Zod changé entre deux visites, le brouillon ancien peut ne plus passer la validation.
- `src/lib/validations/member-profile.ts` : quelles sont les contraintes du profil adhérent ? Non lu — les règles de validation de la fiche éditable sont inconnues.
