# WORKFLOW_EDITION_FICHE_ADHERENT — Édition de la fiche adhérent via magic link

## Classification
- **Type** : user_journey
- **Sous-type** : édition de profil sans compte, authentification par token
- **Visibilité** : external_user
- **Acteur principal** : Représentant de l'entreprise membre (accès via magic link)
- **Acteurs** : Adhérent (navigateur), serveur Next.js (RSC + Server Actions), base de données PostgreSQL
- **Criticité** : Haute — seul mécanisme permettant à l'adhérent de compléter sa fiche publique dans l'annuaire
- **Confiance** : high
- **Justification** : Flux tracé de bout en bout depuis la page `/fiche/[token]/page.tsx` jusqu'aux Server Actions `saveMemberProfileDraft()` et `submitMemberProfile()`, en passant par `getMemberByToken()` et la logique de vérification du token.

## Objectif

Permettre au représentant d'une entreprise membre d'accéder à sa fiche adhérent via un lien sécurisé (magic link) envoyé par l'admin, de compléter ou mettre à jour les informations publiques de son entreprise (description, logo, site web, domaines d'activité, certifications), et de soumettre sa fiche pour publication dans l'annuaire OPEN PF — sans créer de compte ni mémoriser un mot de passe.

## Acteurs
- **Adhérent** : représentant de l'entreprise membre, accède à la page via le lien reçu par email
- **Serveur Next.js (RSC)** : valide le token et charge les données existantes de la fiche
- **Server Actions** : `saveMemberProfileDraft()`, `submitMemberProfile()`, `getMemberByToken()` — `src/lib/actions/member-profile.ts`
- **Base de données PostgreSQL** : `memberTokens`, `members`, `memberActivities`, `memberCertifications`

## Points d'entrée
- `src/app/(public)/fiche/[token]/page.tsx` — page publique d'édition de la fiche
- `src/components/fiche/profile-form.tsx` — composant client du formulaire (non lu directement)
- `src/lib/actions/member-profile.ts` — Server Actions `getMemberByToken()`, `saveMemberProfileDraft()`, `submitMemberProfile()`

## Étapes principales

### A. Accès à la page et vérification initiale du token

1. **Chargement de la page** — L'adhérent clique sur le lien reçu par email. Next.js route vers `/fiche/[token]`, où `token` est le payload brut `"${uuid}.${hmac}"`.

2. **Vérification HMAC + lookup DB** — `getMemberByToken(token)` est appelée dans le RSC (`src/app/(public)/fiche/[token]/page.tsx`) :
   - `verifyMagicToken(token)` : vérifie la signature HMAC (recalcule `expectedHmac` et compare avec `timingSafeEqual`) — `src/lib/auth/magic-link.ts`
   - Si invalide : `getMemberByToken()` retourne `null`
   - `hashMagicToken(token)` : calcule le SHA-256 du payload brut
   - Recherche dans `memberTokens WHERE tokenHash = hash AND expiresAt > now()` (note : `usedAt` n'est **pas filtré** dans `getMemberByToken()`, contrairement à `resolveToken()`)
   - Si token expiré ou non trouvé : retourne `null`

3. **Chargement des données du membre** — Si le token est valide : charge `members` (description, websiteUrl, linkedinUrl, address, yearFounded, employeeCount, logoUrl), `memberActivities`, `memberCertifications` pour pré-remplir le formulaire.

4. **Affichage ou 404** — Si `memberData === null` : `notFound()`. Sinon : render de la page avec `ProfileForm` pré-rempli.

### B. Édition et sauvegarde brouillon

5. **Modification du formulaire** — L'adhérent remplit les champs : description, site web, LinkedIn, adresse, année de création, effectif, logo (upload séparé via `WORKFLOW_UPLOAD_LOGO.md`), domaines d'activité, certifications.

6. **Sauvegarde brouillon** — Clic sur un bouton « Sauvegarder » (implémentation dans `ProfileForm`, non lu directement) appelle `saveMemberProfileDraft(rawToken, data)` :
   - `resolveToken(rawToken)` : vérifie HMAC + recherche DB avec filtre `isNull(memberTokens.usedAt)` — le token doit être non utilisé
   - Validation `memberProfileSchema.safeParse(raw)` — `src/lib/validations/member-profile.ts` (non lu directement)
   - `UPDATE members SET description, websiteUrl, linkedinUrl, address, yearFounded, employeeCount, logoUrl, updatedAt WHERE id=token.memberId`
   - Le token **n'est pas marqué usedAt** lors d'une sauvegarde brouillon — il reste réutilisable

### C. Soumission finale

7. **Soumission** — Clic sur « Soumettre ma fiche » appelle `submitMemberProfile(rawToken, data)` :
   - `resolveToken(rawToken)` : même vérification HMAC + DB avec `isNull(usedAt)`
   - Validation du schéma
   - `UPDATE members SET ...` (même champs que le draft)
   - Suppression + remplacement des domaines d'activité : `DELETE FROM member_activities WHERE memberId`, puis `INSERT INTO member_activities` si la liste est non vide
   - Suppression + remplacement des certifications : `DELETE FROM member_certifications WHERE memberId`, puis `INSERT INTO member_certifications` — si `certificationId === 'autre'`, insère `otherLabel` depuis le champ libre
   - **Invalidation du token** : `UPDATE member_tokens SET usedAt=now() WHERE id=token.tokenId` — le token ne peut plus être utilisé

8. **Retour** — `{ success: true, memberName }`. Le composant affiche un message de confirmation.

## Règles métier

- **Signature HMAC obligatoire** : `verifyMagicToken()` rejette tout token dont la signature ne correspond pas à `MAGIC_LINK_SECRET` — `src/lib/auth/magic-link.ts`
- **Token non expiré** : `expiresAt > now()` filtré en DB dans toutes les vérifications — `src/lib/actions/member-profile.ts`
- **Token non utilisé pour les mutations** : `isNull(memberTokens.usedAt)` filtré par `resolveToken()` dans `saveMemberProfileDraft()` et `submitMemberProfile()`. **Attention** : `getMemberByToken()` ne filtre pas `usedAt`, donc la page s'affiche même avec un token déjà utilisé, mais les actions de mutation échoueront — `src/lib/actions/member-profile.ts`
- **Token consommé à la soumission** : `UPDATE member_tokens SET usedAt=now()` uniquement dans `submitMemberProfile()`, pas dans `saveMemberProfileDraft()` — `src/lib/actions/member-profile.ts`
- **Domaines et certifications remplacés intégralement** : delete-then-insert sur `memberActivities` et `memberCertifications` à chaque soumission (pas de merge partiel) — `src/lib/actions/member-profile.ts`
- **`otherLabel` pour certification "autre"** : si `certificationId === 'autre'`, `otherLabel` est renseigné depuis `certificationOtherLabel` — `src/lib/actions/member-profile.ts`
- **Insertions séquentielles sans transaction** : commentaire explicite dans `submitMemberProfile()` — `src/lib/actions/member-profile.ts`

## Données

- **`memberTokens`** (lecture + écriture) : vérification du token (`tokenHash`, `expiresAt`, `usedAt`) ; `usedAt` mis à jour à la soumission — `src/lib/db/schema.ts`
- **`members`** (lecture + écriture) : champs profil (`description`, `websiteUrl`, `linkedinUrl`, `address`, `yearFounded`, `employeeCount`, `logoUrl`, `updatedAt`) — `src/lib/db/schema.ts`
- **`memberActivities`** (lecture + suppression + insertion) : liste des domaines d'activité du membre — `src/lib/db/schema.ts`
- **`memberCertifications`** (lecture + suppression + insertion) : liste des certifications, avec `otherLabel` optionnel — `src/lib/db/schema.ts`

## Intégrations

Aucune intégration externe dans ce workflow. L'upload du logo est géré via un endpoint API séparé (voir `WORKFLOW_UPLOAD_LOGO.md`).

## Risques

- **Token affiché dans l'URL** : le token brut (`uuid.hmac`) est visible dans l'URL `/fiche/[token]` et potentiellement dans les logs serveur, l'historique du navigateur, et les en-têtes `Referer`. Toute fuite de l'URL compromet l'accès.
- **Page accessible avec token usedAt** : `getMemberByToken()` ne filtre pas `usedAt`, donc la page de formulaire s'affiche même si le token a déjà été consommé. L'utilisateur peut voir et éditer les champs, mais `saveMemberProfileDraft()` et `submitMemberProfile()` échoueront avec `{ errors: { _token: ['Lien invalide ou expiré'] } }`. UX dégradée sans explication claire.
- **Pas de transaction sur les insertions** : si `submitMemberProfile()` échoue après la mise à jour de `members` mais avant les insertions dans `memberActivities`, les domaines d'activité seront incohérents avec les données affichées — `src/lib/actions/member-profile.ts`
- **Token non marqué `usedAt` sur draft** : un adhérent peut enregistrer plusieurs brouillons successifs avec le même token. Si l'admin renvoie un nouveau lien entre deux, les deux liens restent valides (aucune invalidation des anciens lors de `sendMagicLink()` — voir `WORKFLOW_MAGIC_LINK_ENVOI.md`).

## Questions ouvertes

- **Comportement post-soumission** : la page affiche un message de confirmation (`memberName` retourné), mais pas de redirection. L'adhérent peut-il ré-accéder à sa fiche publique depuis `/adherents/[slug]` ? Le lien est-il visible dans l'UI ?
- **Validation admin post-édition** : la note de bas de page de la sidebar indique « votre fiche sera vérifiée par l'équipe OPEN et publiée dans les 48 h ». Cela implique-t-il un nouveau cycle de validation admin après chaque édition ? Le code ne montre aucune transition de statut post-soumission de fiche.
- **`ProfileForm`** : le composant `src/components/fiche/profile-form.tsx` n'a pas été lu. Son contenu (champs, validations côté client, gestion de l'upload logo, messages de succès) est supposé cohérent avec les Server Actions mais non vérifié.

## Preuves
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/lib/actions/member-profile.ts`
- `src/lib/auth/magic-link.ts`
- `src/lib/db/schema.ts`
