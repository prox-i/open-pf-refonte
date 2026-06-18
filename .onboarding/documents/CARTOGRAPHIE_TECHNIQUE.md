# CARTOGRAPHIE_TECHNIQUE.md — Cartographie technique OPEN PF

> Produit par l'agent Rédacteur (ONBAAA-50) le 2026-06-18.  
> Synthèse de : CARTE_DES_DOMAINES.md, ARCHITECTURE_AUDIT.md, DB_AUDIT.md, AUTH_AUDIT.md, PERF_AUDIT.md, SEO_AUDIT.md, tous les WORKFLOW_*.md.  
> **Preuves uniquement — aucune invention.** Les zones à faible confiance sont explicitement signalées.

---

## 1. Architecture des fichiers (dossiers clés)

```
src/
├── app/                          # Routes Next.js App Router
│   ├── (public)/                 # Routes publiques (sans authentification)
│   │   ├── page.tsx              # Accueil (siteStats + contenu éditorial)
│   │   ├── adhesion/page.tsx     # Formulaire d'adhésion 5 étapes
│   │   ├── adherents/
│   │   │   ├── page.tsx          # Annuaire public (ISR 3600s)
│   │   │   ├── [slug]/page.tsx   # Fiche publique membre (force-dynamic)
│   │   │   └── opengraph-image.tsx
│   │   ├── fiche/[token]/page.tsx # Édition fiche via magic link
│   │   ├── actualites/           # Lecture publique des actualités
│   │   ├── offres-emploi/        # Lecture publique des offres d'emploi
│   │   ├── reseau/page.tsx       # Bureau, partenaires, frise
│   │   ├── contact/page.tsx      # Formulaire de contact
│   │   └── (légales)             # confidentialite, mentions-legales, documents-utiles
│   ├── admin/                    # Routes protégées (middleware JWT)
│   │   ├── layout.tsx            # Shell admin avec AdminSidebar
│   │   ├── page.tsx              # Tableau de bord agrégé
│   │   ├── (auth)/login/         # Page de connexion admin
│   │   ├── demandes/             # Liste + détail des demandes submitted
│   │   ├── adherents/            # Liste + détail des membres actifs
│   │   ├── fiches/               # Gestion des fiches (rôle exact incertain — voir I3)
│   │   ├── actualites/           # CRUD actualités admin
│   │   ├── offres-emploi/        # CRUD offres d'emploi admin
│   │   ├── relances/page.tsx     # Journal des relances envoyées
│   │   └── parametres/page.tsx   # Chiffres clés + bureau (périmètre exact incertain)
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Handler Auth.js v5
│   │   ├── cron/reminders/       # Cron relances (GET, auth CRON_SECRET)
│   │   ├── upload/
│   │   │   ├── logo/route.ts     # Upload logo adhérent (auth magic token)
│   │   │   └── news-image/route.ts # Upload image actualité (auth admin — non lu)
│   │   └── webhooks/brevo/       # Callbacks délivrabilité Brevo (stub non implémenté)
│   ├── sitemap.ts                # Sitemap dynamique (force-dynamic — à passer en ISR)
│   └── robots.ts                 # robots.txt (disallow /admin/)
├── components/
│   ├── adhesion/                 # adhesion-form.tsx, stepper.tsx, step-*.tsx
│   ├── annuaire/                 # member-card.tsx, member-filters.tsx, member-grid.tsx, etc.
│   ├── fiche/                    # profile-form.tsx (non lu directement)
│   ├── admin/                    # admin-sidebar.tsx, member-actions.tsx, news-form.tsx, job-form.tsx, login-form.tsx, site-stats-form.tsx
│   └── public/                   # board-member-card.tsx, contact-form.tsx, job-card.tsx
├── lib/
│   ├── actions/                  # Server Actions ('use server')
│   │   ├── adhesion.ts           # submitAdhesion()
│   │   ├── contact.ts            # submitContact()
│   │   ├── login.ts              # loginAction()
│   │   ├── member-profile.ts     # getMemberByToken(), saveMemberProfileDraft(), submitMemberProfile()
│   │   └── admin/
│   │       ├── members.ts        # approveMember(), rejectMember(), deactivateMember(), sendMagicLink()
│   │       ├── content.ts        # upsertNews(), deleteNews(), upsertJob(), deleteJob()
│   │       └── settings.ts       # updateSiteStats()
│   ├── auth/
│   │   ├── config.ts             # Configuration Auth.js v5 (Credentials provider, session JWT)
│   │   ├── magic-link.ts         # generateMagicToken(), hashMagicToken(), verifyMagicToken()
│   │   └── session.ts            # Utilitaires session
│   ├── db/
│   │   ├── schema.ts             # Schéma Drizzle (19 tables + 4 enums — source unique)
│   │   └── queries/
│   │       ├── members.ts        # searchMembers(), getMemberBySlug(), getActivityDomains(), getMemberContacts()
│   │       ├── news.ts           # Requêtes lecture actualités
│   │       └── jobs.ts           # Requêtes lecture offres d'emploi
│   ├── email/
│   │   ├── client.tsx            # sendMagicLinkEmail(), sendContactEmail(), sendReminderEmail()
│   │   └── templates/            # magic-link.tsx, reminder.tsx, contact.tsx (React Email)
│   ├── validations/              # Schémas Zod centralisés
│   │   ├── adhesion.ts           # stepEntrepriseSchema, stepActivitesSchema, stepContactsSchema, stepCertificationsSchema, adhesionSchema
│   │   ├── member-profile.ts     # memberProfileSchema (non lu directement)
│   │   ├── admin.ts              # adminLoginSchema (non lu directement)
│   │   └── contact.ts            # contactSchema (non lu directement)
│   ├── data/
│   │   ├── board-members.ts      # ⚠ Fichier statique — source de vérité incertaine vs table team_members DB
│   │   └── referentials.ts       # Données référentielles statiques
│   └── env.ts                    # Validation Zod des variables d'environnement (crash au boot si manquante)
├── auth.ts                       # Export Auth.js (handlers, auth(), signIn(), signOut())
├── auth.config.ts                # Config edge-safe (sans bcryptjs ni DB — pour middleware)
└── middleware.ts                 # Protection routes /admin/:path* via JWT
drizzle/                          # Migrations SQL commitées
├── 0000_quiet_phalanx.sql
├── 0001_keen_the_executioner.sql
└── 0003_drop_events.sql
tests/
├── unit/                         # 9 fichiers Vitest (schémas Zod, utils, composants)
└── e2e/                          # Playwright + axe-core
```

---

## 2. Modèle de données (vue métier)

### Tables et entités

| Table | Rôle métier | États / Enums |
|---|---|---|
| `members` | Entreprise candidate puis adhérente | `draft \| submitted \| active \| inactive` |
| `memberContacts` | Contacts d'une entreprise (FK cascade) | — |
| `memberActivities` | Liaison m:n membre ↔ domaine d'activité | — |
| `memberCertifications` | Liaison m:n membre ↔ certification (avec `otherLabel`) | — |
| `activityDomains` | Référentiel des domaines d'activité | — |
| `certifications` | Référentiel des certifications | — |
| `legalStatuses` | Référentiel des statuts juridiques | ⚠ Jamais utilisé en écriture (bug `legalStatusId: null`) |
| `news` | Articles d'actualité | `draft \| published` |
| `newsCategories` | Référentiel des catégories d'actualités | — |
| `jobOffers` | Offres d'emploi (FK optionnelle vers `members`) | `draft \| published \| closed` |
| `partners` | Partenaires (logo, url, ordre) | — |
| `teamMembers` | Membres du bureau (nom, rôle, photo, ordre) | ⚠ Source de vérité incertaine vs `board-members.ts` |
| `timelineEvents` | Frise chronologique (année + description) | — |
| `siteStats` | Table single-row id=1 (chiffres clés secteur) | — |
| `adminUsers` | Compte(s) admin (email, passwordHash bcrypt, isActive) | — |
| `memberTokens` | Tokens magic link (hash SHA-256, TTL 30j, usedAt) | — |
| `reminderLogs` | Journal des relances envoyées | `submission_reminder \| validation_pending \| renewal_reminder \| profile_incomplete` |
| `auditLog` | Journal d'audit des actions admin (JSONB data) | `member.approve \| member.reject \| member.deactivate \| ...` |

**Clés primaires** : UUID sur toutes les tables. Timestamps avec fuseau horaire (`{ withTimezone: true }`).

**Règle de lecture publique** : toutes les queries publiques dans `src/lib/db/queries/members.ts` filtrent explicitement `status = 'active'` — commentaire dans le fichier : *"Publication governance: all public queries filter on status = 'active'."*

**⚠ Absence d'index secondaires** : aucun index sur `members.status`, `member_tokens.member_id`, `reminder_logs.member_id + type`, `news.status`, `job_offers.status`. Acceptable à ~50 membres, problématique à l'échelle. (Source : DB_AUDIT.md)

---

## 3. Flux de données principaux

### Flux 1 — Soumission d'adhésion
```
Visiteur → /adhesion (public)
  → AdhesionForm (react-hook-form + zodResolver)
    → Validation par étape (stepEntrepriseSchema, stepContactsSchema, stepActivitesSchema)
    → localStorage['adhesion-draft'] (sauvegarde continue)
  → submitAdhesion(data) [Server Action]
    → adhesionSchema.safeParse(raw) [Zod]
    → generateUniqueSlug() [20 tentatives + fallback timestamp]
    → INSERT members {status: 'submitted', submittedAt: now()}
    → INSERT memberContacts
    → INSERT memberActivities
    → INSERT memberCertifications
    ⚠ Pas de transaction — insertions séquentielles
    → { success: true, slug }
  → Nettoyage localStorage + affichage confirmation
```

### Flux 2 — Validation admin
```
Admin (authentifié) → /admin/demandes/[id]
  → MemberActions (composant client)
  → approveMember(memberId) [Server Action]
    → requireAdmin() [vérification session JWT]
    → UPDATE members {status: 'active', reviewedAt, reviewedBy}
    → INSERT auditLog {action: 'member.approve'}
    → revalidatePath('/admin/demandes')
    → revalidatePath('/admin/adherents')
    ⚠ revalidatePath('/adherents') ABSENT — bug B4
  → (optionnel) sendMagicLink(memberId) [Server Action]
    → generateMagicToken() [UUID + HMAC-SHA256]
    → INSERT memberTokens {tokenHash: SHA256(raw), expiresAt: +30j}
    ⚠ Insertion AVANT envoi email — bug B8
    ⚠ Anciens tokens non invalidés — bug B9
    → sendMagicLinkEmail() → API Brevo
```

### Flux 3 — Édition fiche adhérent (magic link)
```
Adhérent → /fiche/{uuid.hmac}
  → getMemberByToken(token) [RSC]
    → verifyMagicToken(token) [HMAC timingSafeEqual]
    → SELECT memberTokens WHERE tokenHash=SHA256(token) AND expiresAt>now()
    ⚠ usedAt NON filtré — page accessible même avec token consommé
    → Chargement membres + activités + certifications
  → ProfileForm (composant client — non lu directement)
    → Upload logo : POST /api/upload/logo {x-magic-token: raw}
      → Sharp : raster→WebP q85 max1200×1200 / SVG conservé
      → Vercel Blob : PUT → URL publique
    → saveMemberProfileDraft(rawToken, data) [Server Action]
      → resolveToken() [HMAC + isNull(usedAt)]
      → UPDATE members {description, websiteUrl, ...}
    → submitMemberProfile(rawToken, data) [Server Action]
      → DELETE + INSERT memberActivities
      → DELETE + INSERT memberCertifications
      → UPDATE memberTokens {usedAt: now()}
      ⚠ Pas de transaction — 5 opérations séquentielles
```

### Flux 4 — Cron de relances
```
Scheduler Vercel → GET /api/cron/reminders {Authorization: Bearer CRON_SECRET}
  → Vérification secret
  → SELECT members WHERE status='submitted'
  → Pour chaque membre :
    → SELECT reminderLogs ORDER BY sentAt DESC LIMIT 1  ⚠ N+1 queries
    → Si délai >= 3j (première) ou >= 7j (suivantes) :
      → sendReminderEmail() → API Brevo
      → INSERT reminderLogs {type: 'validation_pending'}
  → { ok: true, sent, skipped }
```

### Flux 5 — Connexion admin
```
Admin → /admin/login
  → LoginForm → loginAction(email, password) [Server Action]
    → signIn('credentials', ...) [Auth.js v5]
      → adminLoginSchema.safeParse(credentials) [Zod]
      → SELECT adminUsers WHERE email=email AND isActive=true
      → bcryptjs.compare(password, passwordHash)
      → UPDATE adminUsers {lastLoginAt: now()}
      → JWT: {adminId: user.id}
    → Cookie session (HttpOnly JWT, durée non documentée)
  → Middleware : req.auth vérifié sur /admin/:path*
  ⚠ Pas de rate limiting sur les tentatives échouées — bug B6
  ⚠ Admin désactivé conserve sa session JWT jusqu'à expiration — bug B7
```

---

## 4. Services externes et intégrations

| Service | Usage | Authentification | Sens |
|---|---|---|---|
| **Neon** (PostgreSQL serverless) | Persistance de toutes les données | Variable `DATABASE_URL` | Lecture/Écriture |
| **Brevo** (API REST v3) | Envoi d'emails transactionnels (magic link, contact, relances) | `BREVO_API_KEY` dans l'en-tête | Écriture (sortant) |
| **Vercel Blob** | Stockage logos adhérents + images actualités | `BLOB_READ_WRITE_TOKEN` | Écriture (upload) / Lecture (URL publique) |
| **Vercel Cron** | Déclenchement quotidien du cron de relances (`/api/cron/reminders`) | `CRON_SECRET` dans l'en-tête `Authorization` | Déclenchement entrant |
| **Sharp** | Conversion raster→WebP côté serveur lors de l'upload logo | — (dépendance locale) | — |

### Variables d'environnement (validées via `src/lib/env.ts` à Zod au boot)
- `DATABASE_URL` — connexion Neon
- `AUTH_SECRET` (≥32 chars) — signature JWT Auth.js
- `AUTH_URL` — URL de base pour les callbacks Auth.js et les magic links
- `MAGIC_LINK_SECRET` (≥32 chars) — clé HMAC des magic link tokens
- `BREVO_API_KEY` — clé API Brevo
- `ADMIN_NOTIFICATION_EMAIL` — adresse de destination des relances et contacts
- `CRON_SECRET` — secret d'authentification du cron
- `BLOB_READ_WRITE_TOKEN` — accès Vercel Blob

---

## 5. Conventions de code (résumé des règles CLAUDE.md)

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — zéro `any`, pas de `@ts-ignore` sans commentaire
- Types inférés > types explicites. `z.infer<typeof schema>` pour les types Zod — jamais redéfinis manuellement.
- Interfaces pour les contrats publics, types pour unions/intersections

### Server Components et Actions
- Server Components par défaut, `"use client"` uniquement pour state, effects, event handlers, browser APIs
- Mutations via Server Actions (pas d'API routes sauf webhooks, cron, uploads volumineux)
- Retour structuré `{ success, errors? }` des Server Actions

### Validation
- Toute donnée externe passe par un schéma Zod (`src/lib/validations/`)
- Variables d'env : `src/lib/env.ts` — crash explicite au boot si manquante
- **Exception identifiée** : `updateSiteStats()` manque de validation Zod côté serveur (violation CLAUDE.md §3)

### Base de données
- Schéma : `src/lib/db/schema.ts` (un seul fichier, 243 lignes au moment de l'audit)
- Migrations : `drizzle-kit generate` → commiter dans `drizzle/`. Jamais `drizzle-kit push` en production
- Requêtes : query builder Drizzle, jamais `SELECT *`, transactions sur les écritures multi-tables
- **Exception structurelle** : driver Neon HTTP serverless sans support des transactions

### UI
- Shadcn en premier (`npx shadcn add`), Tailwind only, mobile-first (`text-base md:text-lg`)
- Jamais `<div>` cliquable — utiliser `<button>` ou `<Link>`
- `next/image` partout, dimensions explicites

### SEO
- `generateMetadata` sur toutes les pages publiques
- JSON-LD : `Organization` global + `Article`, `JobPosting`, `BreadcrumbList` selon le type de page
- `sitemap.ts` et `robots.ts` à la racine de `app/`

### Fichiers et imports
- Un export par fichier. `kebab-case.tsx` pour les fichiers, `PascalCase` pour les composants
- Pas de fichier > 300 lignes
- Ordre imports : node → externe → `@/lib` → `@/components` → relatif → types
- Path aliases : `@/components`, `@/lib`, `@/app`

---

## 6. Points de couplage forts entre domaines

| Couplage | Nature | Risque |
|---|---|---|
| `adhesion` → `annuaire` via `members` | Table `members` partagée : `adhesion` mute, `annuaire` lit uniquement les `active`. Convention implicite, non codifiée par des imports stricts | Un agent peut dupliquer les requêtes Drizzle ou ignorer le filtre `active` |
| `backoffice (approveMember)` → `annuaire` via `revalidatePath` | Absent ! `approveMember()` ne revalide pas `/adherents` (bug B4) | Membres approuvés invisibles dans l'annuaire jusqu'à 1h |
| `adhesion` → `notifications` | `sendMagicLink()` dans `admin/members.ts` appelle `sendMagicLinkEmail()` puis insère dans `memberTokens` | Inversion de l'ordre correct : token avant email = token orphelin si Brevo échoue |
| `auth` → `notifications` | `sendMagicLinkEmail()` depuis `email/client.tsx` — dépendance directe | Échec Brevo non tracé dans `auditLog` |
| `editorial` → `annuaire` | `jobOffers.memberId` FK optionnelle vers `members` (`ON DELETE SET NULL`) | Suppression d'un membre orpheline les offres sans erreur |
| `institutional` → `notifications` | `submitContact()` appelle `sendContactEmail()` — email sans trace DB | Perte du message si Brevo échoue (aucun recours) |
| `auditLog` | Cross-domaine : `approveMember`, `rejectMember`, `deactivateMember` logguent ; `sendMagicLink`, `updateSiteStats` ne logguent **pas** | Journal d'audit incomplet |
| Middleware → Auth.js config | `src/middleware.ts` importe `authConfig` depuis `./auth.config` (edge-safe, sans bcryptjs) | Si le middleware tourne en Edge Runtime, l'import bcryptjs dans `auth.config.ts` peut causer une erreur |

---

## 7. Fichiers critiques — ne pas modifier sans tests

Ces fichiers portent des bugs connus ou des règles métier transverses. Toute modification doit être testée de bout en bout.

| Fichier | Pourquoi critique |
|---|---|
| `src/lib/actions/adhesion.ts` | Bug `legalStatusId: null` + insertions sans transaction + point d'entrée unique du workflow d'adhésion |
| `src/lib/actions/admin/members.ts` | `approveMember` (bug B4), `sendMagicLink` (bugs B8, B9, audit log manquant) |
| `src/lib/actions/admin/content.ts` | `upsertJob` (bug B12), `jsonLd` jamais alimenté (B10) dans les deux actions |
| `src/lib/actions/member-profile.ts` | 5 opérations DB séquentielles sans transaction dans `submitMemberProfile` |
| `src/middleware.ts` | Protection de tout le back-office — toute modification doit être testée avec accès non authentifié |
| `src/lib/auth/magic-link.ts` | Cryptographie du magic link — `generateMagicToken`, `verifyMagicToken`, `hashMagicToken` |
| `src/lib/db/schema.ts` | Source unique du modèle de données — toute modification génère une migration |
| `src/lib/validations/adhesion.ts` | Schémas composés via `.merge()` — un changement de type se propage au `adhesionSchema` global |
