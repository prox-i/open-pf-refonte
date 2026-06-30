# Architecture — Refonte open.pf

> Document de référence technique pour le projet de refonte du site OPEN Polynésie française.  
> **Lu par Claude Code à chaque session via `CLAUDE.md`.** Ne pas s'en éloigner sans raison documentée.

---

## 1. Contexte rapide

Site vitrine + module d'adhésion pour une organisation patronale du numérique (cluster ~50 entreprises). Refonte ergonomique et technique d'un WordPress vieillissant. Voir `CDC_Refonte_open-pf.pdf` pour le périmètre fonctionnel exhaustif.

**Particularités fortes :**

- Parcours d'adhésion en 5 étapes (overlay/modale)
- "Magic link" pour la saisie de la fiche adhérent (sans création de mot de passe)
- Relances e-mail automatiques (J+3 puis tous les 7 jours)
- Back-office mono-administrateur
- Pas de paiement en ligne (cotisation hors-ligne)
- Hébergement UE recommandé, RGAA AA visé, Core Web Vitals au vert

---

## 2. Stack technique

| Couche | Choix | Justification |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR/SSG natifs, Server Components, écosystème mature, excellent SEO |
| Langage | **TypeScript strict** | `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Styling | **Tailwind CSS v4** | Theme dérivé du design system du mockup (`--open-magenta`, etc.) |
| UI primitives | **Shadcn/ui** (Radix) | Accessibilité RGAA AA par défaut, copiés dans le repo (pas de dep lourde) |
| Forms | **react-hook-form + Zod** | Validation typée client + serveur, sauvegarde de saisie |
| Base de données | **PostgreSQL** sur Neon (région `eu-central-1` Frankfurt) | RGPD-compatible, serverless, branching pour les preview deploys |
| ORM | **Drizzle ORM** | Schéma TypeScript, requêtes typées, migrations versionnées, pas de codegen |
| Auth admin | **Auth.js v5** (credentials provider) | 1 seul admin → simple, sécurisé, sessions JWT |
| Magic links | **Implémentation custom** | Token signé (JWT) en DB, TTL 30 jours, renouvelable. Pas besoin d'une lib full-auth |
| E-mails | **Brevo** (transactionnels) + **React Email** (templates) | Brevo mentionné au CDC, délivrabilité bonne FR, journal d'envoi natif |
| Stockage fichiers | **Vercel Blob** ou **Scaleway Object Storage** (logos adhérents) | Région EU, signed URLs |
| Cron / scheduler | **Vercel Cron** (préféré) ou **Upstash QStash** (région EU) | Pour la mécanique de relances J+3 puis +7j |
| Recherche | **PostgreSQL full-text search** (`tsvector`) | Suffisant pour ~50 fiches + actus, pas besoin d'Algolia/Meilisearch |
| Analytics | **Plausible** | RGPD-friendly, **pas de bandeau cookies** requis |
| Monitoring | **Sentry** | Erreurs + perfs côté server + client |
| Hébergement | **Vercel** (compute region `fra1`) ou **self-hosted Hetzner + Coolify** | Vercel pour la rapidité de mise en route ; Hetzner si RGPD strict / maîtrise totale |

**À ne pas utiliser :**

- ❌ Redux, Zustand : useState/Server Components suffisent pour ce périmètre
- ❌ tRPC : Server Actions de Next 15 couvrent le besoin sans la couche supplémentaire
- ❌ Prisma : Drizzle est plus performant et plus "senior" (SQL transparent)
- ❌ Bibliothèque de composants payante (Tailwind UI excepté en référence)

---

## 3. Structure des dossiers

```
.
├── architecture.md
├── CLAUDE.md
├── README.md
├── .env.example
├── .nvmrc                       # node version pinned
├── package.json
├── pnpm-lock.yaml               # pnpm > npm > yarn pour ce projet
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── playwright.config.ts
├── vitest.config.ts
│
├── drizzle/                     # migrations SQL versionnées
│
├── public/                      # assets statiques (favicon, og-image par défaut)
│
├── src/
│   ├── app/
│   │   ├── (public)/            # route group : tout le site vitrine
│   │   │   ├── layout.tsx       # header + footer
│   │   │   ├── page.tsx         # accueil
│   │   │   ├── reseau/page.tsx
│   │   │   ├── adherents/
│   │   │   │   ├── page.tsx     # annuaire + filtres
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── actualites/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── tremplins/page.tsx
│   │   │   ├── offres-emploi/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── adhesion/page.tsx   # formulaire 5 étapes
│   │   │   ├── fiche/[token]/page.tsx   # magic link adhérent
│   │   │   └── mentions-legales/page.tsx
│   │   │
│   │   ├── admin/               # back-office
│   │   │   ├── layout.tsx       # sidebar admin
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx         # tableau de bord
│   │   │   ├── demandes/page.tsx
│   │   │   ├── adherents/
│   │   │   │   ├── page.tsx     # liste, validation, activation
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── actualites/
│   │   │   ├── offres-emploi/
│   │   │   ├── evenements/
│   │   │   ├── relances/page.tsx    # journal d'envoi
│   │   │   ├── contenu/page.tsx     # éditorial : chiffres clés, bureau, frise (CRUD)
│   │   │   └── reglages/page.tsx    # réglages site : email destinataire, coordonnées publiques
│   │   │
│   │   ├── api/
│   │   │   ├── cron/
│   │   │   │   └── reminders/route.ts   # invoqué par Vercel Cron
│   │   │   └── webhooks/
│   │   │       └── brevo/route.ts        # callbacks délivrabilité
│   │   │
│   │   ├── layout.tsx           # root layout (fonts, providers)
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── not-found.tsx
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── manifest.ts
│   │
│   ├── components/
│   │   ├── ui/                  # primitives Shadcn (button, input, dialog, etc.)
│   │   ├── layout/              # SiteHeader, SiteFooter, AdminSidebar
│   │   ├── adhesion/            # Stepper, StepIdentite, StepContacts, ...
│   │   ├── annuaire/            # MemberCard, MemberFilters, SearchBar
│   │   ├── home/                # HeroSection, StatsBlock, NewsPreview
│   │   └── admin/               # DataTable, StatusBadge, ConfirmDialog
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts        # tables Drizzle
│   │   │   ├── index.ts         # instance db
│   │   │   └── queries/         # queries réutilisables par domaine
│   │   │       ├── members.ts
│   │   │       ├── news.ts
│   │   │       └── jobs.ts
│   │   ├── auth/
│   │   │   ├── config.ts        # Auth.js v5
│   │   │   └── magic-link.ts    # génération/vérif token fiche adhérent
│   │   ├── email/
│   │   │   ├── client.ts        # client Brevo
│   │   │   └── templates/       # composants React Email
│   │   │       ├── welcome-link.tsx
│   │   │       ├── reminder.tsx
│   │   │       └── admin-notification.tsx
│   │   ├── validations/         # schémas Zod
│   │   │   ├── adhesion.ts
│   │   │   ├── member-profile.ts
│   │   │   └── admin.ts
│   │   ├── actions/             # Server Actions
│   │   │   ├── adhesion.ts
│   │   │   ├── member-profile.ts
│   │   │   └── admin/
│   │   ├── env.ts               # validation Zod des variables d'env
│   │   ├── constants.ts         # pas de magic strings/numbers
│   │   └── utils.ts             # cn(), formatDate(), etc.
│   │
│   └── styles/
│       └── globals.css          # @theme tailwind + variables design system
│
└── tests/
    ├── unit/
    │   └── validations.test.ts
    └── e2e/
        ├── adhesion-happy-path.spec.ts
        ├── magic-link.spec.ts
        └── admin-validation.spec.ts
```

---

## 4. Modèle de données (Drizzle)

Schéma haut niveau — voir `src/lib/db/schema.ts` pour la version exhaustive.

### Tables principales

- **`members`** — fiche adhérent
  - `id` (uuid), `slug` (unique), `status` (`'draft' | 'submitted' | 'active' | 'inactive'`)
  - Données entreprise (raison sociale, statut juridique, n° TAHITI, contact, etc.)
  - `logo_url`, `description`, `website`
  - `magic_token` (hash), `magic_token_expires_at`
  - `created_at`, `updated_at`, `submitted_at`, `validated_at`

- **`activity_domains`** (référentiel), **`skills`** (référentiel), **`certifications`** (référentiel)
- **`member_activities`**, **`member_skills`**, **`member_certifications`** (tables de liaison m:n)

- **`news`** — actualités (id, slug, title, excerpt, body, category, published_at, status)
- **`news_categories`**
- **`job_offers`** — offres d'emploi
- **`partners`** — bloc partenaires
- **`team_members`** — bureau (CRUD via `/admin/contenu`)
- **`timeline_events`** — frise chronologique (CRUD via `/admin/contenu`)
- **`site_stats`** — chiffres clés (**source de vérité unique** pour résoudre l'incohérence 51/65)
- **`site_settings`** — réglages éditables (1 ligne, id=1) : email destinataire des contacts/relances + coordonnées publiques de /contact. Lecture via `lib/settings.ts` avec **repli** sur les valeurs d'env / défauts si vide. Édité via `/admin/reglages`.

> La table `events` (Tremplins du Numérique) a été supprimée (migration `0003_drop_events`).

- **`admin_users`** — Auth.js (id, email, password_hash, name)
- **`reminder_logs`** — journal d'envoi (member_id, type, sent_at, status)
- **`audit_log`** — actions admin (qui a validé/désactivé quoi, quand)

### Règles ORM

- Aucune requête SQL brute hors `lib/db/queries/` (et même là, préférer le builder Drizzle)
- Migrations générées via `drizzle-kit generate` puis **commitées**. Jamais `drizzle-kit push` en production
- Toutes les colonnes texte non-nullables ont un `default('')` explicite si métier le permet

---

## 5. Parcours critiques

### 5.1 Adhésion (overlay 5 étapes)

1. Form multi-step en `client component` avec `react-hook-form` + `zodResolver`
2. Sauvegarde locale dans `localStorage` à chaque changement d'étape (clé : `adhesion-draft`)
3. Step "Récapitulatif" → submit via Server Action → `members.insert({ status: 'submitted' })`
4. E-mail au bureau (template `admin-notification`) + e-mail magic link à l'adhérent
5. Le bureau valide → status passe à `draft` (l'adhérent peut compléter sa fiche)

### 5.2 Magic link

- Token = `crypto.randomUUID() + signature HMAC` — stocké hashé en DB (`magic_token` = SHA-256 du token)
- TTL initial : 30 jours, renouvelable côté admin
- URL : `/fiche/[token]` — le token n'est jamais réenvoyé dans l'URL après chargement
- Si expiré : page d'explication + bouton "Demander un nouveau lien" → e-mail à l'admin
- Pas de cookie de session : chaque chargement re-vérifie le token

### 5.3 Relances automatiques

- Cron `0 8 * * *` (8h Pacific) → `/api/cron/reminders`
- Requête : `members WHERE status = 'draft' AND (last_reminder_at IS NULL OR last_reminder_at <= now() - interval '7 days')` avec dérogation J+3 pour la première
- Pour chaque match : envoi Brevo + insert dans `reminder_logs`
- Arrêt automatique si `status != 'draft'` (soumise, désactivée)
- Endpoint protégé par header `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron envoie automatiquement)

### 5.4 Recherche annuaire

- Index Postgres : `tsvector` sur (raison_sociale, description, domaines, compétences)
- Query côté serveur (Server Component) → pas de JS bundle pour la recherche
- Filtres : query params (`?domaine=cybersecurity&competence=react`) — partageables, indexables

---

## 6. SEO & performance

- **Métadonnées** : `generateMetadata` par page, OG dynamiques pour articles/fiches
- **JSON-LD** : `Organization` global, `BreadcrumbList` par page, `Article` pour actus, `JobPosting` pour offres
- **Sitemap** : généré dynamiquement depuis la DB (`app/sitemap.ts`)
- **Images** : `next/image` partout, formats AVIF/WebP, dimensions explicites
- **Polices** : `next/font/google` (Inter), `display: 'swap'`, subset latin
- **Cache** : `revalidate: 3600` sur pages éditoriales, `revalidate: 60` sur annuaire
- **Préchargement** : `<Link prefetch>` (par défaut), preload des hero images
- **Bundle** : `@next/bundle-analyzer` configuré, budget : < 80 kb JS first-load

### Cibles Core Web Vitals (CDC)

- LCP < 2,5 s | CLS < 0,1 | INP < 200 ms — mesurés sur 4G + mobile mid-range
- CDN : Vercel Edge (Pacific POPs : Tokyo, Sydney, LA — latence acceptable depuis Papeete)

---

## 7. Accessibilité (RGAA AA)

- Tous les composants interactifs viennent de Shadcn/Radix → focus management, keyboard nav, ARIA OK par défaut
- Tests automatisés : `@axe-core/playwright` exécuté dans les e2e
- Tests manuels obligatoires sur :
  - Stepper d'adhésion (focus piégé dans la modale, échap pour fermer)
  - Filtres annuaire (annonce des changements via `aria-live`)
  - Formulaire de fiche (messages d'erreur reliés via `aria-describedby`)
- Contraste : palette validée avec [WebAIM Contrast Checker], magenta `#e6007e` sur blanc OK pour large text uniquement → **ne pas utiliser en body text**

---

## 8. Sécurité

- HTTPS forcé, HSTS, CSP stricte (script-src 'self' + Plausible + Sentry)
- Anti-spam formulaires : honeypot + rate limiting (Upstash Redis ou Next.js middleware)
- Bcrypt (cost 12) pour le mot de passe admin
- Magic link : token hashé en DB, jamais loggué, signed JWT pour la résistance à la falsification
- Secrets : `.env.local` git-ignoré, validés au boot via `lib/env.ts` (Zod)
- Dépendances : `pnpm audit` en CI, Dependabot activé
- Backup DB : Neon snapshots quotidiens, rétention 7 jours min

---

## 9. CI/CD & qualité

### GitHub Actions

```
.github/workflows/ci.yml
- Lint (ESLint)
- Typecheck (tsc --noEmit)
- Test unit (vitest)
- Test e2e (playwright, sur preview deploy)
- Build (next build)
```

### Pre-commit (Husky + lint-staged)

- Prettier sur les fichiers stagés
- ESLint --fix
- Typecheck du fichier modifié

### Conventions

- Branches : `main` (prod) / `develop` (staging) / `feat/*`, `fix/*`
- Commits : [Conventional Commits](https://www.conventionalcommits.org)
- PR : au moins 1 review, CI verte, branche à jour

---

## 10. Variables d'environnement

```env
# .env.example (à copier en .env.local et remplir)

# Base de données
DATABASE_URL=postgres://...

# Auth
AUTH_SECRET=...                  # openssl rand -base64 32
AUTH_URL=http://localhost:3000

# Magic links
MAGIC_LINK_SECRET=...            # openssl rand -base64 32

# Brevo
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=emailtestopen@prox-i.pf   # expéditeur (FROM) — domaine authentifié Brevo
BREVO_SENDER_NAME=OPEN PF

# Cron
CRON_SECRET=...                  # protège /api/cron/*

# Storage
BLOB_READ_WRITE_TOKEN=...        # Vercel Blob

# Analytics & monitoring
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=open.pf
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...

# Admin destinataire des notifications (REPLI uniquement)
# La valeur réellement utilisée est lue depuis site_settings.contact_recipient_email
# (éditable dans /admin/reglages). Cette env ne sert que de repli initial.
ADMIN_NOTIFICATION_EMAIL=contact@open.pf
```

Toutes ces variables sont validées au démarrage via `src/lib/env.ts` (sinon : crash explicite, pas de fail silencieux).

> **Sender vs destinataire.** `BREVO_SENDER_EMAIL` = adresse d'envoi (FROM), qui **doit** appartenir à un domaine authentifié dans Brevo (SPF/DKIM). `open.pf` n'autorise pas Brevo dans son SPF (`include:sendgrid.net … -all`, DMARC `quarantine`) → on envoie depuis `emailtestopen@prox-i.pf` (domaine validé). Le **destinataire** des contacts/relances est `site_settings.contact_recipient_email` (repli `ADMIN_NOTIFICATION_EMAIL`).

---

## 11. Phases de développement (pour Claude Code)

Découper le travail en lots commitables. **Ne pas tout générer en une seule passe.**

| Phase | Périmètre | Sortie attendue |
|---|---|---|
| **P0 — Setup** | Init Next, TS, Tailwind, Shadcn, Drizzle, ESLint, Prettier, Husky, Vitest, Playwright | Repo qui build, lint, test (vide) |
| **P1 — Design system** | Tokens Tailwind depuis le mockup, composants UI Shadcn installés, layout (header/footer) | Pages vides mais branding OK |
| **P2 — Schéma DB** | `schema.ts` complet, première migration, seed du référentiel (domaines, compétences, certifs) | DB en place |
| **P3 — Site public statique** | Toutes les pages vitrine en lecture (accueil, réseau, adhérents, actus, offres, tremplins, contact) avec données mockées puis DB | Site navigable |
| **P4 — Adhésion** | Form 5 étapes, Server Action, e-mails Brevo, magic link | Parcours adhésion fonctionnel |
| **P5 — Fiche adhérent** | Page `/fiche/[token]`, upload logo, save brouillon | Adhérent peut compléter sa fiche |
| **P6 — Back-office** | Auth admin, dashboard, gestion demandes/fiches/actus/offres/relances + **contenu** (chiffres, bureau, frise) et **réglages** (email destinataire, coordonnées) | Bureau autonome |
| **P7 — Cron relances** | Endpoint cron, logique J+3 puis +7j, journal | Relances qui tournent |
| **P8 — SEO/perf/a11y** | Sitemap, JSON-LD, Web Vitals, axe-core, redirections 301 | Audit propre |
| **P9 — Recette & doc** | Tests e2e des parcours critiques, doc d'admin pour le bureau, README de déploiement | Prêt production |

---

## 12. Hors-périmètre (phase 2 si demandé)

- Paiement de la cotisation en ligne (Stripe / SystemPay)
- Espace adhérent complet (ressources, annuaire interne)
- Multi-rôles back-office
- Version EN
