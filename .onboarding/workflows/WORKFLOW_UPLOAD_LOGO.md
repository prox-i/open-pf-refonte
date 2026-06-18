# WORKFLOW_UPLOAD_LOGO — Upload du logo d'un adhérent

## Classification
- **Type** : technical_flow
- **Sous-type** : upload de fichier avec authentification par token + traitement image
- **Visibilité** : external_user
- **Acteur principal** : Représentant de l'entreprise membre (via magic link)
- **Acteurs** : Adhérent (navigateur), endpoint API Route Next.js, base de données PostgreSQL, Vercel Blob, Sharp (traitement image)
- **Criticité** : Moyenne — fonctionnalité de complétude de la fiche, l'absence de logo n'empêche pas la publication dans l'annuaire
- **Confiance** : high
- **Justification** : L'endpoint `src/app/api/upload/logo/route.ts` a été lu en intégralité. Le flux de vérification du token, de traitement de l'image, et d'upload vers Vercel Blob est entièrement tracé.

## Objectif

Permettre à un adhérent authentifié via magic link d'uploader le logo de son entreprise. Le fichier est validé (type, taille), optimisé (conversion WebP via Sharp, sauf SVG), et stocké sur Vercel Blob. L'URL publique résultante est retournée pour être enregistrée dans le formulaire de fiche (`logoUrl`).

## Acteurs
- **Adhérent** : envoie le fichier via `multipart/form-data` avec le token dans l'en-tête
- **Endpoint API** : `POST /api/upload/logo` — route Next.js gérant la validation et l'upload
- **Base de données PostgreSQL** : vérification du token dans `memberTokens`
- **Vercel Blob** : stockage public du fichier image
- **Sharp** : traitement et conversion de l'image côté serveur

## Points d'entrée
- `src/app/api/upload/logo/route.ts` — endpoint `POST /api/upload/logo`

## Étapes principales

1. **Envoi de la requête** — Le composant `ProfileForm` (depuis `/fiche/[token]`) envoie une requête `POST` à `/api/upload/logo` avec :
   - En-tête `x-magic-token: <rawToken>`
   - Body : `multipart/form-data` avec le champ `file`

2. **Vérification HMAC du token en-tête** — `verifyMagicToken(token)` vérifie la signature HMAC-SHA256 du token passé dans `x-magic-token`. Si invalide : `401 { error: 'Token invalide' }`.

3. **Vérification du token en base** — `hashMagicToken(token)` calcule le SHA-256 du payload, puis : `SELECT memberId FROM member_tokens WHERE tokenHash=hash AND expiresAt>now() AND usedAt IS NULL`. Si absent : `401 { error: 'Token expiré ou invalide' }`.

4. **Lecture du fichier** — `req.formData().get('file')`. Si `!(file instanceof File)` : `400 { error: 'Aucun fichier reçu' }`.

5. **Validation du type** — Types autorisés : `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`. Tout autre type : `400 { error: 'Format non supporté (JPEG, PNG, WebP, SVG)' }`.

6. **Validation de la taille** — Taille max : `2 * 1024 * 1024` bytes (2 Mo). Si dépassée : `400 { error: 'Fichier trop volumineux (max 2 Mo)' }`.

7. **Traitement de l'image** :
   - Si **SVG** : upload sans transformation (`contentType: 'image/svg+xml'`, extension `.svg`)
   - Sinon : conversion via `sharp(bytes).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 })` → buffer WebP, `contentType: 'image/webp'`, extension `.webp`

8. **Upload vers Vercel Blob** — `put(filename, buffer, { access: 'public', contentType, token: env.BLOB_READ_WRITE_TOKEN })` avec `filename = "logos/${record.memberId}-${Date.now()}.${finalExt}"`.

9. **Retour de l'URL** — `200 { url: blob.url }`. Le composant `ProfileForm` doit ensuite renseigner `logoUrl` dans le formulaire de fiche pour que la valeur soit persistée lors de `saveMemberProfileDraft()` ou `submitMemberProfile()`.

## Règles métier

- **Token valide, non expiré, non utilisé** : triple vérification (HMAC + expiresAt + usedAt IS NULL) — `src/app/api/upload/logo/route.ts`
- **Types autorisés** : JPEG, PNG, WebP, SVG uniquement — `src/app/api/upload/logo/route.ts`
- **Taille max 2 Mo** : vérifiée sur le fichier original avant traitement — `src/app/api/upload/logo/route.ts`
- **SVG non transformé** : le SVG est uploadé tel quel, contrairement aux formats raster — `src/app/api/upload/logo/route.ts`
- **Raster → WebP** : toute image JPEG/PNG/WebP est reconvertie en WebP, qualité 85, redimensionnée à max 1200×1200px (`fit: 'inside'`, sans agrandissement) — `src/app/api/upload/logo/route.ts`
- **Nommage** : `logos/${memberId}-${Date.now()}.{ext}` — pas de déduplication, chaque upload génère un nouveau fichier — `src/app/api/upload/logo/route.ts`
- **Accès public** : les fichiers uploadés sont publics (`access: 'public'` dans Vercel Blob) — `src/app/api/upload/logo/route.ts`

## Données

- **`memberTokens`** (lecture) : vérification `tokenHash`, `expiresAt`, `usedAt` pour authentifier la requête — `src/lib/db/schema.ts`
- **Vercel Blob** (écriture) : stockage de l'image optimisée, retourne une URL publique
- **`members.logoUrl`** (indirectement écrite) : l'URL retournée par cet endpoint est destinée à être persistée via `saveMemberProfileDraft()` ou `submitMemberProfile()` — `src/lib/actions/member-profile.ts`
- **`env.BLOB_READ_WRITE_TOKEN`** : token Vercel Blob pour l'upload — `src/lib/env.ts`

## Intégrations

- **Vercel Blob** : `put()` depuis `@vercel/blob`. Sens : écriture (upload sortant). Stockage public. Les anciens logos ne sont pas supprimés lors d'un nouvel upload.

## Risques

- **Anciens logos non supprimés** : chaque nouvel upload crée un nouveau fichier dans Vercel Blob sans supprimer le précédent. Si un adhérent change de logo plusieurs fois, les fichiers orphelins s'accumulent sans nettoyage automatique — `src/app/api/upload/logo/route.ts`
- **Logo non lié automatiquement** : l'endpoint retourne une URL mais ne met pas à jour `members.logoUrl` directement. Si le composant `ProfileForm` échoue à inclure l'URL dans la soumission suivante, le logo est uploadé sur Vercel Blob mais jamais associé au membre.
- **Pas de protection CSRF** : l'endpoint accepte toute requête POST avec un token valide dans l'en-tête, sans vérification d'origine. Le token lui-même sert d'authentification implicite, mais l'absence de protection CSRF explicite est notable.
- **Date.now() dans le nom** : si deux uploads arrivent quasi-simultanément pour le même membre, une collision de nommage est théoriquement possible (même `memberId-timestamp`), bien qu'improbable en pratique.

## Questions ouvertes

- **Suppression des anciens logos** : est-il prévu de supprimer l'ancien `logoUrl` de Vercel Blob lors d'un remplacement ? Actuellement non implémenté.
- **Quand `logoUrl` est-il persisté** : le composant `ProfileForm` doit mettre à jour l'état local après l'upload pour inclure l'URL dans la prochaine sauvegarde/soumission. Ce comportement n'a pas été vérifié (fichier `profile-form.tsx` non lu).
- **Route de l'upload pour les images d'actualités** : `src/app/api/upload/news-image/route.ts` existe pour les images d'articles (domaine `editorial`). Elle n'a pas été lue dans cette analyse.

## Preuves
- `src/app/api/upload/logo/route.ts`
- `src/lib/auth/magic-link.ts`
- `src/lib/db/schema.ts`
- `src/lib/actions/member-profile.ts`
