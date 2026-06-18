# WORKFLOW_MAGIC_LINK_ENVOI — Envoi d'un magic link à un adhérent

## Classification
- **Type** : backoffice_flow
- **Sous-type** : génération de token sécurisé + envoi email transactionnel
- **Visibilité** : internal_user
- **Acteur principal** : Administrateur OPEN PF
- **Acteurs** : Admin (navigateur), serveur Next.js (Server Action), base de données PostgreSQL, API Brevo (email)
- **Criticité** : Haute — c'est le seul mécanisme permettant à un adhérent d'accéder à sa fiche pour la compléter ; sans lui, la fiche reste vide
- **Confiance** : high
- **Justification** : Flux tracé de bout en bout : Server Action `sendMagicLink()`, génération du token dans `magic-link.ts`, insertion en DB, et appel Brevo dans `client.tsx`. Tous les fichiers cités ont été ouverts.

## Objectif

Permettre à l'administrateur d'envoyer un lien sécurisé (magic link) à l'email principal d'un adhérent. Ce lien donne accès à la page `/fiche/[token]` où l'adhérent peut compléter ou mettre à jour sa fiche publique sans créer de compte. Le token JWT est signé HMAC, hashé SHA-256 en base de données, et expire après 30 jours.

## Acteurs
- **Admin** : déclenche l'envoi depuis les pages d'administration
- **Serveur Next.js** : exécute `sendMagicLink()`, génère le token, insère en DB, appelle Brevo
- **Base de données PostgreSQL** : stocke le hash SHA-256 du token dans `memberTokens`
- **API Brevo** : service d'envoi d'email transactionnel (SMTP API)
- **Adhérent** : destinataire de l'email (acteur passif dans ce workflow)

## Points d'entrée
- `src/components/admin/member-actions.tsx` — bouton « Envoyer le lien fiche », visible pour les statuts `submitted`, `active`, `draft`
- `src/lib/actions/admin/members.ts` — Server Action `sendMagicLink(memberId)`
- `src/lib/auth/magic-link.ts` — utilitaires `generateMagicToken()`, `hashMagicToken()`, `verifyMagicToken()`
- `src/lib/email/client.tsx` — `sendMagicLinkEmail()`

## Étapes principales

1. **Déclenchement** — L'admin clique sur « Envoyer le lien fiche » dans `MemberActions` (`src/components/admin/member-actions.tsx`). Le bouton est activé pour les statuts `submitted`, `active`, et `draft`.

2. **Vérification de session admin** — `requireAdmin()` dans `sendMagicLink()` appelle `auth()` et vérifie `session?.user?.id`. Lève `'Non autorisé'` si la session est absente.

3. **Récupération du membre** — `SELECT id, name FROM members WHERE id = memberId LIMIT 1`. Si le membre n'existe pas : retourne `{ success: false, error: 'Membre introuvable' }`.

4. **Récupération de l'email de contact** — `SELECT email, isPrimary FROM member_contacts WHERE memberId = memberId`. Sélectionne le contact avec `isPrimary: true` ; à défaut, prend le premier contact. Si aucun contact ou email vide : retourne `{ success: false, error: 'Aucun contact trouvé pour cet adhérent' }`.

5. **Génération du token** — `generateMagicToken()` (`src/lib/auth/magic-link.ts`) :
   - Génère un UUID aléatoire (`crypto.randomUUID()`)
   - Calcule un HMAC-SHA256 du UUID avec la clé `env.MAGIC_LINK_SECRET`
   - Construit le payload brut : `"${uuid}.${hmac}"` (la valeur envoyée dans l'URL)
   - Calcule le hash SHA-256 du payload brut (la valeur stockée en DB)
   - Calcule `expiresAt` = maintenant + 30 jours

6. **Insertion en base** — `INSERT INTO member_tokens (memberId, tokenHash, expiresAt)`. Aucune invalidation des anciens tokens non expirés — plusieurs tokens actifs peuvent coexister pour le même membre.

7. **Construction de l'URL** — `magicUrl = "${env.AUTH_URL}/fiche/${raw}"` où `raw` est le payload `"${uuid}.${hmac}"`.

8. **Envoi de l'email** — `sendMagicLinkEmail({ to: contact.email, memberName: member.name, magicUrl })` (`src/lib/email/client.tsx`) :
   - Render HTML via React Email (`MagicLinkEmail` template)
   - POST à `https://api.brevo.com/v3/smtp/email` avec `api-key: env.BREVO_API_KEY`
   - Objet : `"Complétez la fiche adhérent de ${memberName} — OPEN PF"`
   - Reply-To : `contact@open.pf`
   - Si `res.ok === false` : lève une `Error` avec le status et le body Brevo

9. **Retour** — En cas de succès : `{ success: true }`. En cas d'erreur : `{ success: false, error: "..." }`. L'UI affiche le message d'erreur ou actualise la page (`router.refresh()`).

## Règles métier

- **Session admin requise** : `requireAdmin()` sur toute action — `src/lib/actions/admin/members.ts`
- **Bouton disponible pour `submitted`, `active`, `draft`** (pas `inactive`) : logique dans `MemberActions` — `src/components/admin/member-actions.tsx`
- **Email destiné au contact principal** : `contacts.find((c) => c.isPrimary) ?? contacts[0]` — `src/lib/actions/admin/members.ts`
- **Token TTL = 30 jours** : `TOKEN_TTL_DAYS = 30`, `expiresAt.setDate(...)` — `src/lib/auth/magic-link.ts`
- **Token non réutilisable après usage** : la vérification lors de l'accès à la fiche filtre `isNull(memberTokens.usedAt)` (voir `WORKFLOW_EDITION_FICHE_ADHERENT.md`)
- **Signature HMAC-SHA256** : protège contre la falsification du token côté client — `src/lib/auth/magic-link.ts`
- **Hash SHA-256 en base** : le token brut n'est jamais stocké en DB — seul le hash est persisté — `src/lib/auth/magic-link.ts`

## Données

- **`members`** (lecture) : `id`, `name` — `src/lib/db/schema.ts`
- **`memberContacts`** (lecture) : `email`, `isPrimary` pour trouver le destinataire — `src/lib/db/schema.ts`
- **`memberTokens`** (écriture) : `memberId`, `tokenHash` (SHA-256 hex), `expiresAt` — `src/lib/db/schema.ts`
- **`env.MAGIC_LINK_SECRET`** : clé HMAC pour signer le token, non loggée ni stockée — `src/lib/env.ts`
- **`env.BREVO_API_KEY`** : clé API Brevo — `src/lib/env.ts`
- **`env.AUTH_URL`** : base URL pour construire le magic link — `src/lib/env.ts`

## Intégrations

- **Brevo (API REST)** : `POST https://api.brevo.com/v3/smtp/email` — envoi de l'email transactionnel avec l'URL du magic link. Sens : écriture (envoi sortant). Erreur HTTP non-2xx lève une exception capturée dans `sendMagicLink()` — `src/lib/email/client.tsx`

## Risques

- **Accumulation de tokens actifs** : rien n'invalide les anciens tokens non expirés lors de la génération d'un nouveau. Un admin peut envoyer plusieurs liens successifs et tous resteront valides jusqu'à expiration ou utilisation. Risque de confusion pour l'adhérent.
- **Pas de limite d'envoi** : aucun rate-limit ni mécanisme anti-abus ne protège `sendMagicLink()` contre les appels répétés — `src/lib/actions/admin/members.ts`
- **Échec Brevo non visible en audit** : si `sendMagicLinkEmail()` échoue, `sendMagicLink()` retourne `{ success: false }` mais le token a **déjà été inséré** en base (ligne 121-125 avant l'appel email à la ligne 129) — `src/lib/actions/admin/members.ts`. Le token existe sans que l'email soit parti.
- **Pas de trace admin de l'envoi** : contrairement à `approveMember()` et `rejectMember()`, `sendMagicLink()` n'écrit pas dans `auditLog` — `src/lib/actions/admin/members.ts`

## Questions ouvertes

- **Invalidation des anciens tokens** : est-il prévu d'invalider les tokens existants lors de l'envoi d'un nouveau lien ? Actuellement non implémenté.
- **Statut `inactive`** : pourquoi le bouton magic link est-il masqué pour les membres `inactive` ? Un membre désactivé pourrait-il avoir besoin de corriger sa fiche avant réactivation ?

## Preuves
- `src/lib/actions/admin/members.ts`
- `src/components/admin/member-actions.tsx`
- `src/lib/auth/magic-link.ts`
- `src/lib/email/client.tsx`
- `src/lib/db/schema.ts`
