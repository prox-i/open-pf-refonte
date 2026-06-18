# Carte des domaines — open-pf (refonte)

> Produit par l'agent « Découverte de domaines » (ONBAAA-44) le 2026-06-18.  
> Fondée exclusivement sur les entités DB (`src/lib/db/schema.ts`), les routes App Router (`src/app/`), les Server Actions (`src/lib/actions/`), et les composants (`src/components/`).  
> **Ne pas modifier manuellement** — toute correction doit passer par une nouvelle exécution de l'étape 1a.

---

## Nature du projet

**OPEN PF** est un site vitrine + module d'adhésion pour une organisation patronale du numérique en Polynésie française (~50 entreprises membres). Il remplace un WordPress vieillissant par une application Next.js 15 App Router. Le logiciel sert deux publics : le **grand public** (annuaire des membres, actualités, offres d'emploi, présentation de l'organisation) et le **bureau** (administrateur unique qui valide les adhésions, gère le contenu et surveille les relances). Il n'y a pas de paiement en ligne : la cotisation est traitée hors-ligne.

---

## Domaines

### Adhésion (`adhesion`)

- **Catégorie** : métier
- **Priorité** : **cœur** — sans ce domaine, le logiciel n'a pas de raison d'exister
- **Confiance** : high
- **Description** : Cycle de vie complet d'une demande d'adhésion. Une entreprise remplit un formulaire en 5 étapes (identité, activités, contacts, certifications, récapitulatif), soumet sa candidature, et attend la validation du bureau. L'admin peut accepter (→ `active`), rejeter (→ `draft`) ou laisser en attente (→ `submitted`).
- **Entités** :
  - `members` (status enum : `draft | submitted | active | inactive`, `submittedAt`, `reviewedAt`, `reviewedBy`)
  - `memberContacts` (contacts liés à un membre, FK cascade sur `members.id`)
  - `memberActivities` (table m:n `members ↔ activity_domains`)
  - `memberCertifications` (table m:n `members ↔ certifications`)
  - Référentiels : `activityDomains`, `certifications`, `legalStatuses`
- **Routes / points d'entrée** :
  - `(public)/adhesion/page.tsx` — formulaire 5 étapes public
  - `admin/demandes/page.tsx` — liste des demandes en attente
  - `admin/demandes/[id]/page.tsx` — détail d'une demande + actions de validation
- **Indices de rattachement** : chemins `src/components/adhesion/*`, `src/lib/actions/adhesion.ts`, `src/lib/actions/admin/members.ts`, `src/lib/validations/adhesion.ts`, enum `member_status`, `submittedAt`, `reviewedBy`
- **Types de workflows attendus** : soumission d'adhésion, validation/rejet admin, envoi magic link post-validation, relance en cas de non-traitement
- **Preuves** :
  - `src/lib/db/schema.ts` — tables `members`, `memberContacts`, `memberActivities`, `memberCertifications`, `legalStatuses`, `activityDomains`, `certifications`
  - `src/lib/actions/adhesion.ts` — `submitAdhesion()` insère `status: 'submitted'`
  - `src/lib/actions/admin/members.ts` — `approveMember()`, `rejectMember()`, `deactivateMember()`
  - `src/components/adhesion/` — `adhesion-form.tsx`, `stepper.tsx`, `step-entreprise.tsx`, `step-activites.tsx`, `step-contacts.tsx`, `step-certifications.tsx`, `step-recap.tsx`
  - `src/lib/validations/adhesion.ts` — schémas Zod par étape + `adhesionSchema` global
  - `mockup/open_pf_site_8_5/adhesion.html` — maquette de référence

---

### Annuaire et Fiche Adhérent (`annuaire`)

- **Catégorie** : métier
- **Priorité** : **cœur** — vitrine principale de l'organisation envers le grand public
- **Confiance** : high
- **Description** : Exposition publique des membres actifs (annuaire filtrable, fiche détail par slug) et édition autonome de leur profil via un magic link. Un membre `active` peut mettre à jour sa description, son logo, ses contacts, ses domaines d'activité et ses certifications sans créer de compte.
- **Entités** :
  - `members` (status `active`, `logoUrl`, `description`, `websiteUrl`, `slug`)
  - `memberContacts`, `memberActivities`, `memberCertifications` (données de la fiche)
  - Référentiels en lecture : `activityDomains`, `certifications`, `legalStatuses`
- **Routes / points d'entrée** :
  - `(public)/adherents/page.tsx` — annuaire public avec filtres et recherche
  - `(public)/adherents/[slug]/page.tsx` — fiche publique d'un membre
  - `(public)/fiche/[token]/page.tsx` — édition privée via magic link
  - `admin/adherents/page.tsx` — liste admin des membres actifs
  - `admin/adherents/[id]/page.tsx` — vue admin d'un membre
  - `admin/fiches/page.tsx` — gestion des fiches
  - `api/upload/logo/route.ts` — upload du logo de l'adhérent (Vercel Blob)
- **Indices de rattachement** : chemins `src/components/annuaire/*`, `src/components/fiche/*`, `src/lib/db/queries/members.ts`, `src/lib/actions/member-profile.ts`, route `/fiche/[token]`, `logoUrl`, `slug`
- **Types de workflows attendus** : recherche/filtrage par domaine, affichage de la fiche, sauvegarde brouillon de la fiche, upload logo, renouvellement du magic link par l'admin
- **Preuves** :
  - `src/app/(public)/adherents/` — `page.tsx`, `[slug]/page.tsx`, `opengraph-image.tsx`
  - `src/app/(public)/fiche/[token]/page.tsx`
  - `src/lib/actions/member-profile.ts`
  - `src/lib/validations/member-profile.ts`
  - `src/lib/db/queries/members.ts`
  - `src/components/annuaire/` — `member-card.tsx`, `member-filters.tsx`, `member-search.tsx`, `member-grid.tsx`, `member-profile-hero.tsx`, `member-contact-card.tsx`, `member-domains-card.tsx`, `member-presentation-card.tsx`
  - `src/components/fiche/profile-form.tsx`
  - `src/app/api/upload/logo/route.ts`
  - `mockup/open_pf_site_8_5/adherents.html`, `fiche-onati.html`, `espace-adherent.html`

---

### Contenu Éditorial (`editorial`)

- **Catégorie** : métier
- **Priorité** : support
- **Confiance** : high
- **Description** : Publication et gestion par l'admin des actualités (articles) et des offres d'emploi. Les deux types de contenu partagent le même cycle de vie editorial (`draft → published`) et sont gérés dans le même fichier d'actions. Les offres peuvent être rattachées à un membre.
- **Entités** :
  - `news` (slug, title, excerpt, content, `categoryId`, status `draft | published`, `publishedAt`, imageUrl, metaDescription, jsonLd)
  - `newsCategories` (référentiel des catégories d'actualités)
  - `jobOffers` (slug, title, description, contractType, salary, `memberId` optionnel, status `draft | published | closed`, expiresAt, jsonLd)
- **Routes / points d'entrée** :
  - `(public)/actualites/page.tsx` + `[slug]/page.tsx` — lecture publique
  - `(public)/offres-emploi/page.tsx` + `[slug]/page.tsx` — lecture publique
  - `admin/actualites/page.tsx`, `new/page.tsx`, `[id]/page.tsx` — CRUD admin
  - `admin/offres-emploi/page.tsx`, `new/page.tsx`, `[id]/page.tsx` — CRUD admin
  - `api/upload/news-image/route.ts` — upload illustration d'actualité
- **Indices de rattachement** : chemins `src/lib/actions/admin/content.ts`, `src/lib/db/queries/news.ts`, `src/lib/db/queries/jobs.ts`, tables `news`, `job_offers`, `news_categories`, composants `news-form.tsx`, `job-form.tsx`, `job-card.tsx`
- **Types de workflows attendus** : création/édition/publication d'un article, création/clôture d'une offre d'emploi, upload image d'illustration, association offre ↔ membre
- **Preuves** :
  - `src/lib/db/schema.ts` — tables `news`, `newsCategories`, `jobOffers`
  - `src/lib/actions/admin/content.ts` — `upsertNews()`, `deleteNews()`, `upsertJob()`, `deleteJob()`
  - `src/lib/db/queries/news.ts`, `src/lib/db/queries/jobs.ts`
  - `src/app/admin/actualites/`, `src/app/admin/offres-emploi/`
  - `src/components/admin/news-form.tsx`, `src/components/admin/job-form.tsx`
  - `src/components/public/job-card.tsx`
  - `src/app/api/upload/news-image/route.ts`
  - `mockup/open_pf_site_8_5/actualites.html`, `offres-emploi.html`, `admin-actualites.html`, `admin-actualite-edit.html`

---

### Institutionnel (`institutional`)

- **Catégorie** : métier
- **Priorité** : support
- **Confiance** : high
- **Description** : Présentation publique de l'organisation : page réseau (membres du bureau, frise chronologique, partenaires), chiffres clés du secteur, pages légales (CGU, confidentialité, mentions légales, documents utiles) et formulaire de contact. L'admin édite les données via la page « Paramètres ».
- **Entités** :
  - `partners` (logo, url, ordre)
  - `teamMembers` (bureau : nom, rôle, photo, ordre)
  - `timelineEvents` (frise chronologique : année + description)
  - `siteStats` (table single-row : chiffres clés saisis manuellement)
- **Routes / points d'entrée** :
  - `(public)/reseau/page.tsx` — page réseau (bureau + partenaires + frise)
  - `(public)/contact/page.tsx` — formulaire de contact public
  - `(public)/page.tsx` — accueil (utilise `siteStats` + contenu éditorial)
  - `(public)/confidentialite/page.tsx`, `mentions-legales/page.tsx`, `documents-utiles/page.tsx`
  - `admin/parametres/page.tsx` — édition des chiffres clés et du bureau
- **Indices de rattachement** : tables `partners`, `team_members`, `timeline_events`, `site_stats`, `src/lib/data/board-members.ts`, `src/lib/actions/admin/settings.ts`, `src/lib/actions/contact.ts`, composants `board-member-card.tsx`, `contact-form.tsx`, `site-stats-form.tsx`
- **Types de workflows attendus** : mise à jour des chiffres clés, ajout/modification d'un membre du bureau, envoi d'un message via le formulaire de contact (→ email Brevo, sans trace en DB)
- **Preuves** :
  - `src/lib/db/schema.ts` — tables `partners`, `teamMembers`, `timelineEvents`, `siteStats`
  - `src/lib/actions/admin/settings.ts`
  - `src/lib/actions/contact.ts`
  - `src/lib/data/board-members.ts`, `src/lib/data/referentials.ts`
  - `src/components/public/board-member-card.tsx`, `src/components/public/contact-form.tsx`
  - `src/components/admin/site-stats-form.tsx`
  - `src/app/(public)/reseau/page.tsx`, `contact/page.tsx`
  - `mockup/open_pf_site_8_5/reseau.html`, `contact.html`, `admin-parametres.html`

---

### Authentification (`auth`)

- **Catégorie** : technique
- **Priorité** : support
- **Confiance** : high
- **Description** : Deux mécanismes distincts cohabitent. (1) **Auth admin** via Auth.js v5 (credentials provider, session JWT, bcrypt cost 12) — protège toutes les routes `/admin/*`. (2) **Magic link adhérent** — token JWT signé + hashé SHA-256 en DB, TTL 30 jours, sans création de mot de passe — protège `/fiche/[token]`. Le middleware Next.js applique la protection.
- **Entités** :
  - `adminUsers` (email, passwordHash, name, isActive, lastLoginAt)
  - `memberTokens` (memberId FK, tokenHash SHA-256, expiresAt, usedAt)
- **Routes / points d'entrée** :
  - `api/auth/[...nextauth]/route.ts` — handler Auth.js
  - `admin/(auth)/login/page.tsx` — page de connexion admin
  - `(public)/fiche/[token]/page.tsx` — vérifie le token avant d'afficher la fiche
  - `src/middleware.ts` — protection middleware des routes `/admin/*`
- **Indices de rattachement** : `src/lib/auth/config.ts`, `src/lib/auth/magic-link.ts`, `src/lib/auth/session.ts`, tables `admin_users`, `member_tokens`, `src/auth.ts`, `src/auth.config.ts`, `src/lib/actions/login.ts`
- **Types de workflows attendus** : connexion admin (credentials → session JWT), vérification magic link (hash DB + expiration), invalidation token après usage, renouvellement token par l'admin
- **Preuves** :
  - `src/lib/db/schema.ts` — tables `adminUsers`, `memberTokens`
  - `src/lib/auth/config.ts`, `src/lib/auth/magic-link.ts`, `src/lib/auth/session.ts`
  - `src/auth.ts`, `src/auth.config.ts`
  - `src/middleware.ts`
  - `src/lib/actions/login.ts`
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `src/components/admin/login-form.tsx`
  - `src/lib/actions/admin/members.ts` — `sendMagicLink()` génère le token et insère dans `memberTokens`

---

### Notifications et Relances (`notifications`)

- **Catégorie** : technique
- **Priorité** : support
- **Confiance** : high
- **Description** : Envoi d'emails transactionnels via l'API Brevo (React Email templates) et automatisation des relances de validation. Un cron Vercel déclenche quotidiennement `/api/cron/reminders` qui identifie les demandes `submitted` en attente depuis J+3 puis tous les 7 jours, envoie un email à l'admin et enregistre chaque envoi. Un webhook Brevo reçoit les callbacks de délivrabilité.
- **Entités** :
  - `reminderLogs` (memberId FK, type enum `submission_reminder | validation_pending | renewal_reminder | profile_incomplete`, sentAt, emailTo)
- **Routes / points d'entrée** :
  - `api/cron/reminders/route.ts` — endpoint cron protégé par `CRON_SECRET`
  - `api/webhooks/brevo/route.ts` — callbacks délivrabilité Brevo
  - `admin/relances/page.tsx` — journal des relances envoyées
- **Indices de rattachement** : table `reminder_logs`, enum `reminder_type`, `src/lib/email/client.tsx`, `src/lib/email/templates/`, `BREVO_API_KEY`, `CRON_SECRET`, `sendReminderEmail()`, `sendMagicLinkEmail()`, `sendContactEmail()`
- **Types de workflows attendus** : relance automatique J+3 puis +7j, envoi magic link depuis l'admin, envoi email de contact, réception callbacks délivrabilité, consultation du journal d'envoi
- **Preuves** :
  - `src/lib/db/schema.ts` — table `reminderLogs`, enum `reminderTypeEnum`
  - `src/app/api/cron/reminders/route.ts` — logique J+3 puis +7j sur membres `submitted`
  - `src/app/api/webhooks/brevo/route.ts`
  - `src/lib/email/client.tsx` — `sendMagicLinkEmail()`, `sendContactEmail()`, `sendReminderEmail()`
  - `src/lib/email/templates/magic-link.tsx`, `reminder.tsx`, `contact.tsx`
  - `src/app/admin/relances/page.tsx`

---

### Back-office Admin (`backoffice`)

- **Catégorie** : technique
- **Priorité** : support
- **Confiance** : high
- **Description** : Interface shell de l'administrateur unique : tableau de bord agrégé, navigation latérale, et journal d'audit (qui a fait quoi sur quel objet). Donne accès à tous les autres domaines depuis un seul espace protégé. Les actions critiques (validation, rejet, désactivation) écrivent dans `auditLog`.
- **Entités** :
  - `auditLog` (adminId FK, action `member.approve | member.reject | member.deactivate | ...`, targetType, targetId, data JSONB)
  - `adminUsers` (partagée avec Auth)
- **Routes / points d'entrée** :
  - `admin/page.tsx` — tableau de bord (statistiques croisées sur membres, demandes, actus)
  - `admin/layout.tsx` — shell avec `AdminSidebar`
- **Indices de rattachement** : table `audit_log`, `src/components/admin/admin-sidebar.tsx`, `src/components/admin/member-actions.tsx`, `src/lib/validations/admin.ts`, `revalidatePath('/admin/...')` dans toutes les actions
- **Types de workflows attendus** : consultation du tableau de bord, navigation vers les modules de gestion, consultation de l'historique des actions admin
- **Preuves** :
  - `src/lib/db/schema.ts` — table `auditLog`
  - `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`
  - `src/components/admin/admin-sidebar.tsx`, `src/components/admin/member-actions.tsx`
  - `src/lib/validations/admin.ts`
  - `src/lib/actions/admin/members.ts` — chaque action admin insère dans `auditLog`
  - `mockup/open_pf_site_8_5/admin.html`, `admin-adherents.html`, `admin-demandes.html`, `admin-demande-detail.html`, `admin-fiche-detail.html`, `admin-relances.html`, `admin-parametres.html`

---

## Carte des dépendances inter-domaines

```
                        ┌─────────────┐
                        │  backoffice │  (shell admin, audit log)
                        └──────┬──────┘
                               │ utilise tous les domaines métier
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   ┌──────────────┐    ┌────────────────┐    ┌──────────────┐
   │  adhesion    │    │   editorial    │    │ institutional│
   │  (cœur)      │    │ (news + jobs)  │    │ (réseau,     │
   └──────┬───────┘    └────────────────┘    │  contact,    │
          │                                  │  paramètres) │
          │ crée/met à jour                  └──────────────┘
          ▼
   ┌──────────────┐
   │   annuaire   │ ◄── jobOffers.memberId (editorial → annuaire)
   │   (cœur)     │
   └──────┬───────┘
          │
          │ déclenche envoi token
          ▼
   ┌──────────────┐
   │    auth      │ ◄── backoffice (login admin)
   │ (admin +     │
   │  magic link) │
   └──────┬───────┘
          │ sendMagicLinkEmail / magic link vérifié
          ▼
   ┌──────────────────────┐
   │  notifications       │ ◄── adhesion (relances demandes submitted)
   │  (Brevo + cron +     │ ◄── institutional (email de contact)
   │   relances)          │ ◄── auth (email magic link)
   └──────────────────────┘
```

**Flux principaux :**

| Source | Destination | Nature de la dépendance |
|---|---|---|
| `adhesion` | `annuaire` | Création du membre (`members.insert`) — le membre passe en `active` après validation |
| `adhesion` | `notifications` | Envoi magic link post-approbation (`sendMagicLink()`) |
| `adhesion` | `notifications` | Relances automatiques sur membres `submitted` (cron) |
| `backoffice` | `adhesion` | Validation/rejet via `approveMember()`, `rejectMember()` |
| `backoffice` | `auth` | Session admin requise pour toute action |
| `auth` | `notifications` | `sendMagicLinkEmail()` appelée depuis `sendMagicLink()` |
| `editorial` | `annuaire` | `jobOffers.memberId` lie une offre à un membre |
| `institutional` | `notifications` | `sendContactEmail()` depuis `contact.ts` |

---

## Incertitudes

1. **`/reseau/page.tsx` vs `teamMembers` DB** — Le fichier `src/lib/data/board-members.ts` existe en parallèle de la table `team_members` en DB. Lequel est la source de vérité pour la page réseau ? Si c'est le fichier statique, la table est inutilisée. Si c'est la DB, le fichier est du legacy. À trancher avant d'implémenter l'édition admin dans « Paramètres ».

2. **`documents-utiles/page.tsx`** — La route existe mais aucune entité DB ne correspond. Le contenu est-il statique (fichiers PDF servis depuis `public/`) ou à venir (table `documents` non encore migrée) ?

3. **`espace-adherent.html`** dans le mockup sans route App Router correspondante — Le mockup prévoit un espace membre complet. L'architecture.md §12 le classe hors-périmètre phase 1. Confirmer que `/espace-adherent` n'est pas dans le scope courant pour éviter qu'un agent génère du code en avance de phase.

4. **`admin/fiches/page.tsx`** — Cette route existe en plus de `admin/adherents/[id]/page.tsx`. La distinction entre « gestion des demandes » (`/demandes`), « gestion des adhérents » (`/adherents`) et « gestion des fiches » (`/fiches`) n'est pas documentée. Trois pages pour trois états du cycle de vie ? Ou overlap à nettoyer ?

5. **Webhook Brevo (`api/webhooks/brevo/route.ts`)** — Le fichier existe mais son contenu n'a pas été vérifié (pas encore implémenté, ou stub ?). Le domaine `notifications` le liste mais son intégration réelle avec `reminderLogs` reste à confirmer.
