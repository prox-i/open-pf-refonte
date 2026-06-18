# Authentification — Audit

> Confiance : high
> Produit par l'agent Auditeur (ONBAAA-48) le 2026-06-18.
> Fondé sur la lecture directe de : `src/lib/auth/magic-link.ts`, `src/lib/auth/config.ts`, `src/middleware.ts`, `src/lib/env.ts`, `src/lib/actions/admin/members.ts` (sendMagicLink), `src/lib/actions/member-profile.ts` (resolveToken, getMemberByToken), `src/lib/db/schema.ts` (adminUsers, memberTokens), `src/app/api/upload/logo/route.ts`, `CARTE_DES_DOMAINES.md`, `RELECTURE_WORKFLOWS.md`.

---

## Compréhension globale

Deux mécanismes d'authentification cohabitent. L'**auth admin** repose sur Auth.js v5 (credentials provider, session JWT) protégeant toutes les routes `/admin/*` via un middleware Next.js. Le **magic link adhérent** utilise un token HMAC-signé, hashé en SHA-256 avant persistance, avec TTL de 30 jours, pour permettre à un membre actif d'éditer sa fiche sans créer de compte. Les deux mécanismes sont indépendants et n'interagissent que via l'admin qui génère les tokens.

---

## Résumé exécutif

L'implémentation cryptographique du magic link est techniquement solide : HMAC avec secret, `timingSafeEqual` pour la comparaison, hash SHA-256 en DB (jamais le token brut). L'auth admin est fonctionnelle avec bcrypt cost correctement configuré à la création. Cependant, cinq problèmes de sécurité significatifs existent dans les workflows opérationnels : (1) les anciens tokens magic link ne sont pas invalidés lors d'un renvoi, cumulant les surfaces d'attaque ; (2) le token est inséré en DB avant l'envoi email, créant des tokens orphelins en cas d'échec Brevo ; (3) un admin désactivé (`isActive: false`) conserve sa session JWT jusqu'à expiration sans possibilité de révocation immédiate ; (4) la page de chargement du profil (`getMemberByToken`) ne filtre pas les tokens `usedAt IS NOT NULL`, permettant la lecture en mode lecture seule avec un token consommé ; (5) aucun rate limiting sur le login ni sur l'envoi de magic links.

---

## Constats détaillés

### Implémentation cryptographique du magic link

**Fait observé** : `generateMagicToken()` dans `src/lib/auth/magic-link.ts` génère un `crypto.randomUUID()`, calcule un HMAC-SHA256 avec `env.MAGIC_LINK_SECRET`, concatène `uuid.hmac` comme payload brut. Le hash SHA-256 de ce payload est stocké en DB (`tokenHash`). La vérification (`verifyMagicToken`) recalcule l'HMAC et utilise `timingSafeEqual` pour éviter les timing attacks. Cette implémentation est correcte : le secret HMAC n'est jamais exposé, le hash DB ne permet pas de retrouver le token brut, et la comparaison est résistante aux attaques de timing.

### Token inséré avant envoi email (B8)

**Fait observé** : dans `sendMagicLink` (`src/lib/actions/admin/members.ts`, lignes 121–129), le token est inséré dans `memberTokens` **avant** l'appel à `sendMagicLinkEmail`. Si Brevo retourne une erreur, le token valide existe en DB mais l'adhérent n'a pas reçu l'URL. Ce token orphelin est utilisable si quelqu'un devine ou intercepte l'URL (improbable mais non nul sur 30 jours de TTL). La correction correcte est d'effectuer l'envoi email en premier et de ne persister le token qu'en cas de succès.

### Anciens tokens non invalidés (B9)

**Fait observé** : `sendMagicLink` ne nettoie jamais les tokens précédents pour `memberId` avant d'en créer un nouveau. Chaque appel admin accumule un token actif supplémentaire pour le même membre. La table `memberTokens` peut contenir N tokens valides simultanément pour un membre. Surface d'attaque croissante si un admin envoie plusieurs liens de suite par erreur. La correction : `UPDATE member_tokens SET used_at = now() WHERE member_id = ? AND used_at IS NULL AND expires_at > now()` avant l'insert.

### `getMemberByToken` : token consommé peut lire le profil

**Fait observé** : `getMemberByToken` dans `src/lib/actions/member-profile.ts` (lignes 142–151) filtre uniquement sur `tokenHash = hash AND expires_at > now()`, **sans** `isNull(memberTokens.usedAt)`. Un token marqué `usedAt IS NOT NULL` (consommé après soumission) permet encore de charger la page de profil en mode lecture. Ce n'est pas une faille d'écriture (`resolveToken` filtre correctement `isNull(usedAt)` pour les saves/submits), mais l'UX est incohérente : un adhérent peut revoir sa fiche avec un lien expiré fonctionnellement mais non nettoyé. **Hypothèse** : comportement probablement intentionnel pour permettre la relecture post-soumission, mais non documenté.

### Session JWT persistante après désactivation admin (B7)

**Fait observé** : `src/middleware.ts` vérifie uniquement la présence de `req.auth` (token JWT valide). La vérification de `isActive: true` dans l'admin DB est faite dans `authorize()` à la connexion (`src/lib/auth/config.ts`, ligne 33) mais pas à chaque requête. Une fois connecté, un admin dont le champ `isActive` passe à `false` conserve sa session JWT jusqu'à son expiration naturelle. `authConfig` ne définit pas `maxAge` dans `session: { strategy: 'jwt' }` — **incertitude** sur la durée de session par défaut (Auth.js v5 beta, probablement 30 jours). Pour un back-office avec un admin unique, l'impact est faible, mais le comportement n'est pas documenté comme décision explicite.

### Absence de rate limiting

**Fait observé** : `src/lib/auth/config.ts` ne limite pas les tentatives de connexion. `authorize()` fait une requête DB à chaque tentative. La page `/admin/login` est publique. **Hypothèse** : Vercel peut appliquer un rate limiting au niveau infrastructure, mais ce n'est pas documenté ni configurable dans le code. Pour un back-office avec un seul compte admin, une attaque brute-force est un vecteur réel. RELECTURE_WORKFLOWS l'identifie comme B6.

### `trustHost: true` dans la config Auth.js

**Fait observé** : `authConfig` inclut `trustHost: true`. Cette option indique à Auth.js de faire confiance à l'en-tête `Host` de la requête pour construire les URLs de callback. C'est le comportement attendu et recommandé pour les déploiements Vercel derrière un proxy. Pas de risque dans ce contexte.

### Validation des env vars auth

**Fait observé** : `src/lib/env.ts` valide `AUTH_SECRET: z.string().min(32)` et `MAGIC_LINK_SECRET: z.string().min(32)`. Le démarrage échoue explicitement si ces variables sont absentes ou trop courtes. Bonne pratique.

### Upload logo : vérification token correcte

**Fait observé** : `src/app/api/upload/logo/route.ts` vérifie le token magic link en trois étapes : `verifyMagicToken` (HMAC), requête DB avec `expires_at > now() AND used_at IS NULL`, puis autorise l'upload uniquement si le token est valide et non consommé. La cohérence avec `resolveToken` est maintenue.

### Audit log incomplet

**Fait observé** : `approveMember()` et `rejectMember()` insèrent dans `auditLog`. `sendMagicLink()` n'insère **rien** dans `auditLog`. `updateSiteStats()` non plus. Cette incohérence rend le journal d'audit partiel : les envois de magic links et les modifications de paramètres ne sont pas traçables via `auditLog`.

---

## Forces

- **Cryptographie magic link correcte** : HMAC avec secret dédié, `timingSafeEqual`, hash SHA-256 en DB. Pas de token brut stocké.
- **Vérification HMAC avant requête DB** : `verifyMagicToken` rejette les tokens mal formés sans toucher à la DB, évitant des requêtes inutiles sur des entrées malformées.
- **Isolation des deux mécanismes** : l'auth admin et le magic link sont deux systèmes distincts. Compromettre l'un ne compromet pas l'autre.
- **Secrets validés au démarrage** : `AUTH_SECRET` et `MAGIC_LINK_SECRET` doivent faire au moins 32 caractères — erreur explicite sinon.
- **Protection middleware exhaustive** : toutes les routes `/admin/*` sont protégées via `src/middleware.ts`. Le pattern matcher `'/admin/:path*'` couvre les sous-routes.
- **Vérification `isActive` à la connexion** : un admin désactivé ne peut pas créer de nouvelle session.

---

## Dettes techniques

- **Token inséré avant email** : ordre des opérations inversé dans `sendMagicLink`. Correction simple à faible risque.
- **Anciens tokens non invalidés** : accumulation indéfinie de tokens actifs pour un même membre.
- **`getMemberByToken` sans filtre `usedAt`** : incohérence avec `resolveToken` qui filtre correctement.
- **Audit log partiel** : `sendMagicLink` et `updateSiteStats` ne logguent pas leurs actions.
- **Durée de session JWT non documentée** : `maxAge` absent de la config — la durée par défaut d'Auth.js v5 beta n'est pas documentée dans le projet.

---

## Zones critiques

- **`src/lib/actions/admin/members.ts` (sendMagicLink)** : c'est le point d'entrée du plus grand risque de sécurité actuellement — tokens orphelins si Brevo échoue, accumulation de tokens actifs, absence d'audit log.
- **`src/middleware.ts`** : protection de tout le back-office. Toute modification de ce fichier doit être testée avec des scénarios d'accès non authentifié.

---

## Risques

- **Token orphelin utilisable** : si un admin envoie un magic link et que Brevo échoue, un token valide existe en DB 30 jours. Si l'URL est devinée (improbable mais possible via logs Vercel) ou si un autre vecteur expose l'URL, l'adhérent pourrait modifier sa fiche sans avoir reçu le lien officiel.
- **Multiple tokens actifs pour un membre** : si l'admin envoie 5 liens en deux jours, 5 tokens actifs coexistent. N'importe lequel peut être utilisé pour modifier la fiche.
- **Session admin active après désactivation** : dans le scénario d'un admin compromis, désactiver le compte (`isActive: false`) n'invalide pas immédiatement la session en cours. Le délai de grâce est la durée de vie du JWT.
- **Brute-force login** : sans rate limiting, 1000 tentatives de mot de passe par minute sont techniquement possibles si Vercel ne bloque pas.

---

## Recommandations priorisées

1. **Inverser l'ordre d'opération dans `sendMagicLink`** — envoyer l'email Brevo d'abord, insérer le token en DB uniquement si l'envoi réussit. — `src/lib/actions/admin/members.ts`
2. **Invalider les anciens tokens à l'émission d'un nouveau** — `UPDATE member_tokens SET used_at = now() WHERE member_id = ? AND used_at IS NULL` avant l'insert du nouveau token. — `src/lib/actions/admin/members.ts`
3. **Ajouter l'audit log pour `sendMagicLink`** — cohérence avec `approveMember`/`rejectMember`. — `src/lib/actions/admin/members.ts`
4. **Documenter la durée de session JWT** — ajouter explicitement `session: { strategy: 'jwt', maxAge: X }` dans `authConfig` pour rendre le comportement prévisible et auditables. — `src/lib/auth/config.ts`
5. **Ajouter rate limiting sur le login** — via un middleware IP ou un compteur Redis/KV (Vercel KV disponible). Pour un back-office admin unique, même une limite simple (10 tentatives/minute/IP) suffit. — `src/middleware.ts` ou nouvelle route
6. **Clarifier l'intention de `getMemberByToken` sur les tokens consommés** — documenter si l'accès en lecture avec un token consommé est intentionnel, et si oui, l'indiquer clairement dans le code.

---

## Questions ouvertes

- La durée de session JWT par défaut d'Auth.js v5 beta est-elle documentée ? Un `maxAge` explicite est préférable à un défaut opaque.
- Le comportement de `getMemberByToken` avec un token `usedAt IS NOT NULL` est-il intentionnel (relecture après soumission) ou un oubli ?
- Vercel applique-t-il un rate limiting automatique sur les requêtes POST à `/admin/login` ? Si oui, à quel seuil ?
