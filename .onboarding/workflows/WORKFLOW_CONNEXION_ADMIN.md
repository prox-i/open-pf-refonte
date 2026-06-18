# WORKFLOW_CONNEXION_ADMIN — Connexion de l'administrateur

## Classification
- **Type** : backoffice_flow
- **Sous-type** : authentification par credentials + session JWT
- **Visibilité** : internal_user
- **Acteur principal** : Administrateur OPEN PF
- **Acteurs** : Admin (navigateur), middleware Next.js, Auth.js v5 (Credentials provider), base de données PostgreSQL, bcryptjs
- **Criticité** : Haute — condition préalable à toute action admin ; sans session valide, aucune route `/admin/*` n'est accessible
- **Confiance** : high
- **Justification** : Flux tracé de bout en bout depuis la Server Action `loginAction()`, le provider Auth.js, la vérification bcrypt, jusqu'au middleware de protection. Tous les fichiers cités ont été ouverts.

## Objectif

Permettre à l'administrateur unique de s'authentifier sur le back-office OPEN PF via email et mot de passe. À l'issue d'une connexion réussie, une session JWT est établie dans un cookie HttpOnly, donnant accès à toutes les routes `/admin/*`. Le middleware Next.js vérifie cette session à chaque requête protégée.

## Acteurs
- **Admin** : unique administrateur, saisit email + mot de passe sur `/admin/login`
- **Auth.js v5** : gère le Credentials provider, la session JWT et les callbacks
- **Middleware Next.js** (`src/middleware.ts`) : applique la protection sur toutes les routes `/admin/:path*`
- **Base de données PostgreSQL** : stocke `adminUsers` (email, passwordHash, isActive)
- **bcryptjs** : compare le mot de passe fourni au hash stocké

## Points d'entrée
- `src/app/admin/(auth)/login/page.tsx` — page de connexion (non lue directement)
- `src/components/admin/login-form.tsx` — formulaire (non lu directement)
- `src/lib/actions/login.ts` — Server Action `loginAction(email, password)`
- `src/app/api/auth/[...nextauth]/route.ts` — handler Auth.js (non lu directement)
- `src/middleware.ts` — protection des routes admin

## Étapes principales

1. **Accès à une route admin** — Si l'admin tente d'accéder à une route `/admin/*` (hors `/admin/login`), le middleware `src/middleware.ts` vérifie `req.auth`. Si absent : redirection vers `/admin/login?callbackUrl=<chemin>`.

2. **Affichage du formulaire** — `/admin/login` s'affiche. Si la session est déjà active (`req.auth` présent), redirection immédiate vers `/admin`.

3. **Soumission des credentials** — Le formulaire `LoginForm` appelle la Server Action `loginAction(email, password)` (`src/lib/actions/login.ts`).

4. **Appel Auth.js `signIn`** — `signIn('credentials', { email, password, redirectTo: '/admin' })` est appelé. Auth.js achemine la requête vers le Credentials provider configuré dans `src/lib/auth/config.ts`.

5. **Validation Zod des credentials** — `adminLoginSchema.safeParse(credentials)` (`src/lib/validations/admin.ts`) — si invalide : retourne `null` (échec silencieux côté provider).

6. **Recherche de l'utilisateur admin** — `SELECT id, email, name, passwordHash, isActive FROM admin_users WHERE email = email LIMIT 1`. Si l'utilisateur n'existe pas ou `isActive === false` : retourne `null`.

7. **Vérification du mot de passe** — `compare(password, user.passwordHash)` (bcryptjs). Si invalide : retourne `null`.

8. **Mise à jour de `lastLoginAt`** — `UPDATE admin_users SET lastLoginAt = now() WHERE id = user.id`.

9. **Établissement de la session JWT** — Auth.js crée un JWT avec `token['adminId'] = user.id` (via callback `jwt`). Le callback `session` expose `session.user.id = token['adminId']`. Le cookie de session est posé par Auth.js.

10. **Gestion de la redirection** — `signIn()` dans Next.js lève une erreur interne `NEXT_REDIRECT`. `loginAction()` détecte ce digest (`err.digest.startsWith('NEXT_REDIRECT')`) et le re-lance pour que le framework gère la navigation vers `/admin`.

11. **Retour d'erreur** — Si `signIn()` lève une `AuthError` (credentials invalides) : `loginAction()` retourne `{ error: 'Email ou mot de passe incorrect.' }`. Pour toute autre erreur : `{ error: 'Une erreur est survenue. Réessayez.' }`.

## Règles métier

- **Compte actif obligatoire** : `if (!user?.isActive) return null` dans le provider — `src/lib/auth/config.ts`
- **Comparaison bcrypt** : `compare(password, passwordHash)` — pas de comparaison en clair — `src/lib/auth/config.ts`
- **Session JWT (pas de session DB)** : `strategy: 'jwt'` — aucune table de session en base — `src/lib/auth/config.ts`
- **`adminId` dans le token JWT** : `token['adminId'] = user.id` exposé via `session.user.id` — `src/lib/auth/config.ts`
- **Middleware actif sur `/admin/:path*` uniquement** : le matcher est `['/admin/:path*']` — les routes publiques ne sont pas protégées — `src/middleware.ts`
- **Redirection `/admin/login` → `/admin` si déjà connecté** : évite d'afficher le formulaire à un admin déjà authentifié — `src/middleware.ts`
- **Re-lancement de NEXT_REDIRECT** : nécessaire pour que Next.js gère correctement la navigation post-login — `src/lib/actions/login.ts`

## Données

- **`adminUsers`** (lecture + écriture) : email, passwordHash, isActive pour l'authentification ; `lastLoginAt` mis à jour à chaque connexion — `src/lib/db/schema.ts`
- **Cookie de session** : JWT posé par Auth.js, contient `adminId` — géré par Auth.js, non stocké en DB
- **`env.*`** : `AUTH_SECRET` (clé de signature JWT Auth.js), `AUTH_URL` (base URL) — utilisés par Auth.js, non tracés directement dans les fichiers lus

## Intégrations

Aucune intégration externe dans ce workflow. L'authentification est entièrement locale (DB + bcrypt + JWT).

## Risques

- **Pas de rate limiting ni de protection brute-force** : aucun mécanisme de verrouillage de compte après N tentatives échouées n'est visible dans le code. Un attaquant peut tenter des combinaisons email/mot de passe sans limite — `src/lib/auth/config.ts`
- **Pas de log des tentatives échouées** : les échecs de connexion (mauvais mot de passe, compte inactif) retournent `null` sans écriture en `auditLog` ni log serveur. L'anomalie est invisible dans le journal admin.
- **Un seul administrateur prévu** : l'architecture suppose un unique administrateur. Si plusieurs comptes `adminUsers` existent, Auth.js sélectionne par email — pas de gestion de rôles différenciés.
- **Middleware edge-safe** : le commentaire dans `src/middleware.ts` indique « Use the edge-safe config (no bcryptjs, no DB) for middleware ». La vérification dans le middleware porte uniquement sur la présence du cookie JWT, pas sur la validité de la session en DB. Un admin désactivé (`isActive: false`) conserve sa session jusqu'à expiration du JWT.

## Questions ouvertes

- **Durée de la session JWT** : la TTL du JWT Auth.js n'est pas visible dans les fichiers lus. Elle est configurable dans `AUTH_TRUST_HOST`, `AUTH_SECRET` ou via `session.maxAge` — non tracé.
- **Déconnexion** : aucun flux de `signOut()` n'a été tracé dans cette analyse. Existe-t-il un bouton de déconnexion dans le back-office ?
- **`adminLoginSchema`** : la validation Zod des credentials (`src/lib/validations/admin.ts`) n'a pas été lue directement. Les contraintes exactes (longueur minimale du mot de passe, format email) sont supposées raisonnables mais non vérifiées.

## Preuves
- `src/lib/actions/login.ts`
- `src/lib/auth/config.ts`
- `src/middleware.ts`
- `src/lib/db/schema.ts`
- `src/lib/auth/session.ts`
