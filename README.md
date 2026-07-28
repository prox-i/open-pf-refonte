# OPEN PF — Refonte

Site vitrine + module d'adhésion pour l'Organisation des Professionnels de l'Économie Numérique de Polynésie française.

## Prérequis

- Node.js 22 (voir `.nvmrc`)
- pnpm 11+

## Installation

```bash
cp .env.example .env.local   # remplir les variables
pnpm install
```

## Commandes

```bash
pnpm dev          # serveur de développement (http://localhost:3000)
pnpm build        # build de production
pnpm start        # démarrer le build de production
pnpm lint         # ESLint
pnpm typecheck    # vérification TypeScript
pnpm test         # tests unitaires (Vitest)
pnpm e2e          # tests end-to-end (Playwright)
```

## Base de données

```bash
pnpm exec drizzle-kit generate   # générer une migration après modification du schema
pnpm exec drizzle-kit migrate    # appliquer les migrations (prod : via CI uniquement)
pnpm exec drizzle-kit studio     # Drizzle Studio (UI locale)
```

## Déploiement (Vercel)

1. Connecter le repo GitHub à Vercel
2. Renseigner toutes les variables d'environnement (voir `.env.example`)
3. `pnpm exec drizzle-kit migrate` — appliquer les migrations avant la mise en prod
4. Le cron `/api/cron/reminders` se déclenche automatiquement via `vercel.json` (08h00 UTC quotidien)

## Premier admin

```bash
# Générer un hash bcrypt (node REPL ou script one-shot)
node -e "const b = require('bcryptjs'); b.hash('MOT_DE_PASSE', 10).then(h => console.log(h))"

# Insérer dans la table admin_users (Drizzle Studio ou psql)
INSERT INTO admin_users (email, password_hash, name)
VALUES ('admin@open.pf', '<hash>', 'Admin OPEN PF');
```

## Spécifications

Voir `architecture.md`, `DECISIONS.md`, `seeds/` et `mockup/` pour le détail du projet.

<!-- test auto-deploy Vercel: 23bb1ab -->
