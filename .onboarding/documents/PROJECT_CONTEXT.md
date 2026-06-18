# PROJECT_CONTEXT.md — Contexte projet OPEN PF

> Produit par l'agent Rédacteur (ONBAAA-50) le 2026-06-18.  
> Synthèse de : CARTE_DES_DOMAINES.md, RELECTURE_DOMAINES.md, WORKFLOWS_INDEX.md, RELECTURE_WORKFLOWS.md, ARCHITECTURE_AUDIT.md, DB_AUDIT.md, AUTH_AUDIT.md, PERF_AUDIT.md, SEO_AUDIT.md, FORMS_AUDIT.md, A11Y_AUDIT.md.  
> **Preuves uniquement — aucune invention.**

---

## Ce que fait le projet

OPEN PF est un site vitrine et module d'adhésion pour une organisation patronale du numérique en Polynésie française (~50 entreprises membres), construit pour remplacer un WordPress vieillissant par une application Next.js 15 App Router. Il sert deux publics distincts : le **grand public** (annuaire filtrable des membres actifs, actualités, offres d'emploi, présentation institutionnelle) et l'**administrateur unique du bureau** (validation des candidatures à l'adhésion, gestion du contenu éditorial, envoi de liens d'accès aux adhérents, suivi des relances automatiques). La cotisation est traitée hors-ligne ; il n'y a pas de paiement en ligne dans le périmètre actuel.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15, App Router, TypeScript strict (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| Base de données | Neon PostgreSQL (serverless HTTP driver), Drizzle ORM, migrations commitées dans `drizzle/` |
| Authentification | Auth.js v5 beta (`next-auth@5.0.0-beta.31`) — credentials admin + session JWT ; magic link maison (HMAC-SHA256 + hash SHA-256 en DB) |
| Validation | Zod — schémas centralisés dans `src/lib/validations/`, `z.infer<>` systématique |
| Formulaires | react-hook-form + zodResolver |
| UI | Shadcn + Tailwind CSS, variantes via `cva` |
| Emails | React Email templates + API Brevo (`POST https://api.brevo.com/v3/smtp/email`) |
| Stockage fichiers | Vercel Blob (logos adhérents, images actualités) |
| Traitement image | Sharp (conversion WebP, max 1200×1200, qualité 85) |
| Hébergement | Vercel (functions, cron, Blob) |
| Tests | Vitest (unitaires, 9 fichiers dans `tests/unit/`), Playwright + `@axe-core/playwright` (E2E + a11y, `tests/e2e/`) |
| Outillage | Husky pre-commit, ESLint, Prettier + plugin Tailwind |

**⚠ Dépendance beta en production** : `next-auth@5.0.0-beta.31` — API susceptible de changer entre versions beta. (Source : ARCHITECTURE_AUDIT.md)

---

## Domaines métier et leurs responsabilités

| Domaine | Catégorie | Priorité | Responsabilité |
|---|---|---|---|
| `adhesion` | Métier | **Cœur** | Cycle de vie complet d'une demande d'adhésion : formulaire 5 étapes public, soumission, validation/rejet/désactivation par l'admin |
| `annuaire` | Métier | **Cœur** | Exposition publique des membres `active` (annuaire filtrable + fiche par slug) et édition autonome de la fiche via magic link |
| `editorial` | Métier | Support | CRUD admin des actualités (`news`) et des offres d'emploi (`jobOffers`), cycle de vie `draft → published → closed` |
| `institutional` | Métier | Support | Pages institutionnelles (réseau, contact, légales), chiffres clés editables par l'admin (`siteStats`) |
| `auth` | Technique | Support | (1) Auth admin via Auth.js v5 + session JWT ; (2) magic link adhérent via token HMAC-SHA256 |
| `notifications` | Technique | Support | Envoi emails transactionnels Brevo (magic link, contact, relances) ; cron de relances automatiques J+3 puis +7j |
| `backoffice` | Technique | Support | Shell admin (layout, sidebar, tableau de bord agrégé) et journal d'audit cross-domaine (`auditLog`) |

**Point de couplage important** : la table `members` est partagée entre `adhesion` (toutes mutations) et `annuaire` (lecture seule sur `status = 'active'`). Convention à respecter : `adhesion` possède les mutations, `annuaire` lit uniquement via `src/lib/db/queries/members.ts`. (Source : RELECTURE_DOMAINES.md — problème bloquant #1)

---

## État actuel du projet

**Phase** : développement initial, non encore en production au 2026-06-18.

### Fonctionnalités présentes dans le code
- Formulaire d'adhésion 5 étapes (identité, contacts, domaines d'activité, certifications, récapitulatif + consentement RGPD) avec sauvegarde brouillon `localStorage`
- Back-office admin complet : validation/rejet/désactivation des membres, envoi magic link, CRUD actualités et offres d'emploi, mise à jour chiffres clés
- Annuaire public avec recherche ILIKE, filtres par domaine, fiche publique par slug
- Magic link adhérent pour édition de fiche sans compte (description, logo, contacts, domaines, certifications)
- Upload de logo via endpoint API (`/api/upload/logo`) avec conversion WebP via Sharp
- Cron de relances automatiques Vercel (`/api/cron/reminders`) : 1ère relance J+3, suivantes +7j
- Emails transactionnels Brevo : magic link, contact public, relances admin
- Pages institutionnelles : accueil, réseau, contact, mentions légales, confidentialité, documents utiles
- Journal d'audit des actions admin (`auditLog`)
- Sitemap dynamique, robots.txt, JSON-LD sur les fiches membres

### Hors périmètre phase 1
- Espace adhérent complet (`/espace-adherent` présent dans le mockup mais sans route App Router correspondante — CARTE_DES_DOMAINES incertitude #3)
- Paiement en ligne (cotisations traitées hors système)
- Webhook Brevo (`/api/webhooks/brevo`) : fichier stub `TODO P4`, non implémenté

---

## Points d'attention critiques (top 5 des audits)

Ces cinq points sont des bugs confirmés ou des risques structurels à traiter avant mise en production.

### 1. `legalStatusId: null` — bug de perte silencieuse de données (B1)
Le statut juridique est collecté comme champ **obligatoire** à l'étape 1 du formulaire d'adhésion (`legalStatus: z.string().min(1)` dans `src/lib/validations/adhesion.ts`), mais `submitAdhesion()` insère systématiquement `legalStatusId: null` en DB — la valeur est silencieusement perdue. Toutes les adhésions depuis le début du projet ont un statut juridique `null`. (Sources : WORKFLOW_SOUMISSION_ADHESION.md, DB_AUDIT.md, FORMS_AUDIT.md)

### 2. Absence de transactions Neon HTTP — incohérence DB possible (B2)
Le driver Neon HTTP serverless ne supporte pas les transactions. `submitAdhesion()` effectue 4 insertions séquentielles (`members`, `memberContacts`, `memberActivities`, `memberCertifications`) sans rollback. `submitMemberProfile()` effectue 5 opérations séquentielles. En cas de panne réseau intermédiaire, un membre peut se retrouver `submitted` en DB sans ses contacts ou domaines. Aucune procédure de récupération documentée. (Sources : WORKFLOW_SOUMISSION_ADHESION.md, WORKFLOW_EDITION_FICHE_ADHERENT.md, DB_AUDIT.md)

### 3. Magic link : token inséré avant envoi email + anciens tokens non invalidés (B8, B9)
Dans `sendMagicLink()` (`src/lib/actions/admin/members.ts`), le token est inséré en DB **avant** l'appel Brevo. Si Brevo échoue, un token valide existe 30 jours sans que l'adhérent ait reçu le lien. De plus, aucun ancien token n'est invalidé lors de l'envoi d'un nouveau lien — plusieurs tokens actifs peuvent coexister pour le même membre. (Sources : WORKFLOW_MAGIC_LINK_ENVOI.md, AUTH_AUDIT.md)

### 4. Bugs de cache ISR — contenu non visible après mutation (B4, B12)
`approveMember()` ne déclenche pas `revalidatePath('/adherents')` : un membre nouvellement approuvé est invisible dans l'annuaire public pendant jusqu'à 1 heure (ISR 3600s). `upsertJob()` en mode UPDATE ne déclenche pas `revalidatePath('/offres-emploi')` : une offre modifiée ou publiée reste cachée en page publique jusqu'à revalidation automatique. (Sources : WORKFLOW_ANNUAIRE_PUBLIC.md, WORKFLOW_GESTION_OFFRES_EMPLOI.md, PERF_AUDIT.md)

### 5. `jsonLd` jamais alimenté — violation CLAUDE.md §13 (B10)
Les champs `news.jsonLd` et `jobOffers.jsonLd` sont définis dans le schéma DB mais jamais renseignés par `upsertNews()` ni `upsertJob()` (`src/lib/actions/admin/content.ts`). Toutes les actualités et offres d'emploi publiées sont sans données structurées (`Article`, `JobPosting`). Cette violation directe du CLAUDE.md §13 empêche notamment l'apparition des offres dans Google Jobs. (Sources : WORKFLOW_GESTION_ACTUALITES.md, WORKFLOW_GESTION_OFFRES_EMPLOI.md, SEO_AUDIT.md)

---

## Incertitudes ouvertes (à trancher avant implémentation)

| # | Sujet | Impact |
|---|---|---|
| I1 | `src/lib/data/board-members.ts` vs table `team_members` DB — laquelle est la source de vérité pour la page réseau ? | Impacte l'implémentation de l'édition admin du bureau |
| I2 | `/documents-utiles` — contenu statique ou table DB à créer ? | Impacte le sitemap et le SEO |
| I3 | `admin/fiches` vs `admin/adherents` vs `admin/demandes` — responsabilités distinctes ou overlap ? | Impacte la structure des composants admin |
| I4 | Email de confirmation promis à l'entreprise candidate après soumission (message UI « Vous recevrez une confirmation ») — jamais envoyé dans le code | Décision métier à trancher |
| I5 | `@base-ui/react` présent en dépendances en parallèle de Shadcn — utilisé ou résidu ? | Potentiellement à supprimer |
