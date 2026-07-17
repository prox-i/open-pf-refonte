# WORKFLOW_authentification et sécurité — Cahier de workflow fonctionnel et technique reconstitué

## 1. Objet

Décrire le workflow d’authentification et de sécurisation des accès du projet OPEN PF pour deux périmètres distincts :

- l’accès administrateur au back-office ;
- l’accès sécurisé à la fiche adhérent via magic link.

Le besoin couvre aussi les effets de bord sécurité associés : journalisation, contrôle de session, renouvellement de lien, gestion des statuts, et protection des routes sensibles.

**Sources / preuves**
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/lib/auth/magic-link.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/admin/(auth)/login/page.tsx`
- `src/components/admin/login-form.tsx`
- `src/components/admin/admin-sidebar.tsx`
- `src/components/admin/member-actions.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/lib/email/templates/magic-link.tsx`

---

## 2. Synthèse fonctionnelle

Le site repose sur deux mécanismes d’accès :

1. **Authentification du bureau / admin**
   - Connexion par identifiant et mot de passe.
   - Un seul espace d’administration, sans rôles multiples à ce stade.
   - La session est gérée via Auth.js v5 avec stratégie JWT.

2. **Accès adhérent par lien sécurisé**
   - L’adhérent ne crée pas de mot de passe.
   - Le bureau envoie un lien sécurisé permettant de compléter ou mettre à jour la fiche.
   - Le lien est signé, stocké hashé, limité dans le temps et validé côté serveur.

Le workflow sert à protéger :
- les écrans d’administration ;
- les API sensibles d’upload liées aux fiches ;
- l’édition des données publiques d’un membre ;
- la remise à disposition d’un magic link depuis le back-office.

**Sources / preuves**
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/lib/auth/magic-link.ts`
- `src/app/admin/(auth)/login/page.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/app/api/upload/logo/route.ts`
- `src/components/admin/member-actions.tsx`
- `src/components/fiche/profile-form.tsx`

---

## 3. Acteurs concernés

### 3.1 Administrateur / bureau
- se connecte au back-office ;
- valide ou refuse une demande d’adhésion ;
- désactive un membre ;
- renvoie un magic link ;
- suit les relances et le traitement des fiches.

### 3.2 Adhérent / contact principal
- reçoit un magic link ;
- accède à son espace sécurisé ;
- complète les données publiques de sa fiche ;
- téléverse éventuellement un logo.

### 3.3 Système
- Auth.js pour la session admin ;
- base de données PostgreSQL / Drizzle ;
- service d’email transactionnel ;
- stockage blob pour les médias ;
- routes API sécurisées par jeton ou session.

**Sources / preuves**
- `src/components/admin/member-actions.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/lib/email/templates/magic-link.tsx`
- `src/app/api/upload/logo/route.ts`

---

## 4. Points d’entrée

### 4.1 Connexion admin
- Page : `/admin/login`
- Formulaire : `LoginForm`
- Action serveur : `loginAction`

### 4.2 Route Auth.js
- API : `/api/auth/[...nextauth]`
- Handler exporté depuis `src/auth.ts`

### 4.3 Back-office
- `/admin`
- `/admin/demandes`
- `/admin/adherents`
- `/admin/fiches`
- `/admin/relances`
- `/admin/parametres`

### 4.4 Espace adhérent sécurisé
- `/fiche/[token]`

### 4.5 Upload logo sécurisé
- `/api/upload/logo`
- protégé par header `x-magic-token`

### 4.6 Envoi magic link depuis le BO
- via actions admin appelées par `MemberActions`

**Sources / preuves**
- `src/app/admin/(auth)/login/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/admin/page.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/app/api/upload/logo/route.ts`
- `src/components/admin/member-actions.tsx`

---

## 5. Composants source

### 5.1 Auth admin
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/lib/validations/admin`
- `src/components/admin/login-form.tsx`

### 5.2 Magic link
- `src/lib/auth/magic-link.ts`
- `src/lib/email/templates/magic-link.tsx`
- `src/components/admin/member-actions.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`

### 5.3 Protections upload / fiche
- `src/app/api/upload/logo/route.ts`
- `src/lib/actions/member-profile`
- `src/components/fiche/profile-form.tsx`

### 5.4 Administration des états
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/admin/fiches/page.tsx`
- `src/app/admin/relances/page.tsx`

**Sources / preuves**
- fichiers listés ci-dessus

---

## 6. Données principales

### 6.1 Table `admin_users`
Champs observés :
- `id`
- `email`
- `password_hash`
- `name`
- `is_active`
- `created_at`
- `updated_at`
- `last_login_at`

Rôle métier :
- stocker les comptes admin ;
- désactiver un compte ;
- historiser la dernière connexion.

### 6.2 Jeton magic link
Le magic link repose sur :
- un `raw` généré à partir d’un UUID + HMAC ;
- un hash SHA-256 stocké en base ;
- une date d’expiration.

Le lien est représenté sous la forme :
- `uuid.signatureHmac`

### 6.3 Table `member_tokens`
Utilisée pour retrouver le lien valide :
- `memberId`
- `tokenHash`
- `expiresAt`
- `usedAt`

### 6.4 Données de la fiche adhérent
La fiche sécurisée porte notamment :
- description ;
- site web ;
- LinkedIn ;
- adresse ;
- année de création ;
- nombre de salariés ;
- logo ;
- domaines d’activité ;
- certifications.

### 6.5 Données de session
La session admin contient l’identifiant admin dans le JWT, puis dans `session.user.id`.

**Sources / preuves**
- `src/lib/auth/config.ts`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/components/fiche/profile-form.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- schéma Drizzle consulté dans les extraits `drizzle/meta/0001_snapshot.json`, `drizzle/meta/0002_snapshot.json`

---

## 7. Étapes nominales

### 7.1 Connexion administrateur
1. L’utilisateur ouvre `/admin/login`.
2. Il saisit email et mot de passe.
3. Le formulaire est validé côté client puis côté serveur.
4. Le backend recherche le compte admin par email.
5. Le compte doit être actif.
6. Le mot de passe est comparé au hash bcrypt.
7. `lastLoginAt` est mis à jour.
8. Une session JWT est émise.
9. L’utilisateur est redirigé vers `/admin`.

### 7.2 Accès sécurisé à une fiche adhérent
1. Le bureau envoie un magic link depuis le back-office.
2. L’adhérent reçoit l’email contenant le lien.
3. Il ouvre `/fiche/[token]`.
4. Le token est validé par lecture du membre associé.
5. La fiche préremplie est affichée.
6. L’utilisateur complète les champs autorisés.
7. Les brouillons peuvent être sauvegardés automatiquement.
8. La soumission finale enregistre les données.

### 7.3 Téléversement d’un logo
1. L’adhérent sélectionne un fichier.
2. Le front envoie le fichier vers `/api/upload/logo`.
3. Le header `x-magic-token` est transmis.
4. Le serveur vérifie la validité du token.
5. Le serveur vérifie le token en base.
6. Le fichier est contrôlé :
   - type MIME autorisé ;
   - taille max 2 Mo.
7. L’image est convertie / redimensionnée si nécessaire.
8. Le fichier est envoyé au blob storage.
9. L’URL du blob est renvoyée au client.

### 7.4 Envoi d’un magic link depuis le back-office
1. L’admin ouvre la fiche ou la demande.
2. Il clique sur “Envoyer le lien fiche”.
3. Une action serveur génère ou réémet un lien.
4. Un email est envoyé au contact associé.
5. Le lien est stocké hashé avec date d’expiration.

**Sources / preuves**
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/components/admin/login-form.tsx`
- `src/components/admin/member-actions.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/app/api/upload/logo/route.ts`
- `src/lib/email/templates/magic-link.tsx`

---

## 8. Variantes

### 8.1 Compte admin inactif
- l’authentification échoue ;
- aucune session n’est créée.

### 8.2 Mot de passe invalide
- l’authentification échoue ;
- retour d’un état d’erreur sans divulguer de détail technique.

### 8.3 Token magic link mal formé
- le token est rejeté avant accès aux données.

### 8.4 Token expiré
- le token n’est plus valide ;
- l’accès à la fiche est refusé.

### 8.5 Token déjà utilisé / non trouvé
- l’accès est refusé ;
- le lien doit être régénéré ou renvoyé.

### 8.6 Upload logo avec mauvais format
- refus si le MIME type n’est pas autorisé.

### 8.7 Upload logo trop volumineux
- refus si taille > 2 Mo.

### 8.8 Fiche incomplète
- le brouillon peut être conservé ;
- la soumission finale peut être bloquée selon les règles métier de validation.

**Sources / preuves**
- `src/lib/auth/config.ts`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/components/fiche/profile-form.tsx`
- `src/components/admin/member-actions.tsx`

---

## 9. Cas d’erreur

### 9.1 Erreurs de connexion admin
- email absent ou invalide ;
- mot de passe absent ;
- compte non actif ;
- mot de passe incorrect ;
- échec serveur / base indisponible.

### 9.2 Erreurs magic link
- token manquant ;
- token au mauvais format ;
- token expiré ;
- token absent en base ;
- token déjà utilisé ;
- email de renvoi non délivré.

### 9.3 Erreurs upload
- absence de fichier ;
- type non supporté ;
- fichier trop volumineux ;
- stockage blob indisponible ;
- token invalide.

### 9.4 Erreurs de session / autorisation
- session absente sur les routes protégées ;
- compte admin non autorisé ;
- tentative d’accès direct à un espace sécurisé sans jeton.

### 9.5 Erreurs de sauvegarde fiche
- échec de `saveMemberProfileDraft` ;
- échec de `submitMemberProfile` ;
- erreurs de validation côté schéma Zod ;
- erreur réseau lors de l’upload.

**Sources / preuves**
- `src/components/admin/login-form.tsx`
- `src/lib/auth/config.ts`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/components/fiche/profile-form.tsx`

---

## 10. Documents / emails / effets de bord

### 10.1 Email magic link
Contenu fonctionnel :
- annonce de réception de la demande / de l’accès ;
- bouton “Compléter ma fiche” ;
- rappel de durée de validité ;
- adresse de contact.

Template :
- `src/lib/email/templates/magic-link.tsx`

### 10.2 Effets de bord admin
- mise à jour de `lastLoginAt` lors de l’authentification ;
- navigation vers `/admin` après login ;
- éventuelle remise à jour du statut du membre après action admin.

### 10.3 Effets de bord fiche
- sauvegarde automatique de brouillon ;
- affichage de succès après soumission ;
- mise à jour de l’URL du logo ;
- persistance d’un état de complétude.

### 10.4 Effets de bord stockage
- publication du logo ou média dans le blob storage public ;
- URL renvoyée au client.

**Sources / preuves**
- `src/lib/email/templates/magic-link.tsx`
- `src/auth.ts`
- `src/components/fiche/profile-form.tsx`
- `src/app/api/upload/logo/route.ts`
- `src/components/admin/member-actions.tsx`

---

## 11. Règles métier

### 11.1 Authentification admin
- un compte admin correspond à un membre du bureau ;
- tous les admins ont les mêmes droits à ce stade ;
- la session est JWT ;
- l’accès repose sur un couple email / mot de passe ;
- un compte inactif ne doit pas se connecter.

### 11.2 Magic links
- lien signé par HMAC ;
- jeton stocké hashé en base ;
- durée de vie de 30 jours ;
- renouvellement possible depuis le back-office ;
- le token doit être vérifié avant toute action sensible.

### 11.3 Upload logo
- types autorisés :
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/svg+xml`
- taille maximale : 2 Mo ;
- conversion / resize appliqué aux images raster ;
- SVG conservé tel quel.

### 11.4 Fiche adhérent
- le workflow de fiche est sécurisé ;
- les champs modifiables sont limités à ceux prévus par le formulaire ;
- la complétude du profil peut être suivie ;
- l’adhérent ne passe pas par un mot de passe classique.

### 11.5 Statuts et visibilité
- une fiche en attente n’est pas publiquement active tant qu’elle n’est pas validée ;
- le bureau peut approuver, refuser, désactiver, ou envoyer un magic link.

**Sources / preuves**
- `src/lib/auth/config.ts`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/components/fiche/profile-form.tsx`
- `src/components/admin/member-actions.tsx`
- `DECISIONS.md`
- `architecture.md`

---

## 12. Sécurité / permissions

### 12.1 Auth admin
- protection par Auth.js v5 ;
- stratégie JWT ;
- validation de schéma avant lookup DB ;
- comparaison bcrypt du mot de passe ;
- mise à jour de `lastLoginAt`.

### 12.2 Trust / host
- `trustHost: true` est activé dans la config Auth.js.

### 12.3 Magic token
- format signé par HMAC SHA-256 ;
- vérification en temps constant via `timingSafeEqual` ;
- hash SHA-256 du token pour la recherche en base ;
- expiration contrôlée côté serveur ;
- `usedAt` empêche la réutilisation si la logique l’exige.

### 12.4 Route upload logo
- refus si token invalide ;
- refus si token expiré ou absent ;
- validation type / taille ;
- accès public au blob, mais upload initial contrôlé.

### 12.5 Administration
- les pages admin doivent être réservées à la session admin ;
- les actions de validation / refus / désactivation / renvoi de lien doivent être serveur-side ;
- aucun secret ne doit transiter côté client.

### 12.6 Non-divulgation
- ne pas exposer le hash du token ;
- ne pas exposer le mot de passe hashé ;
- ne pas exposer les secrets d’environnement.

**Sources / preuves**
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/components/admin/member-actions.tsx`
- `src/components/admin/admin-sidebar.tsx`

---

## 13. Recette

### 13.1 Connexion admin
- [ ] l’écran `/admin/login` s’affiche ;
- [ ] un admin actif avec bon mot de passe se connecte ;
- [ ] un compte inactif ne peut pas se connecter ;
- [ ] un mot de passe incorrect affiche une erreur ;
- [ ] `lastLoginAt` est mis à jour ;
- [ ] la session est visible dans l’interface admin.

### 13.2 Protection admin
- [ ] les routes admin ne sont pas accessibles sans session ;
- [ ] la déconnexion fonctionne ;
- [ ] le lien “Retour au site” reste accessible.

### 13.3 Magic link
- [ ] un lien valide ouvre `/fiche/[token]` ;
- [ ] un lien expiré est refusé ;
- [ ] un token mal formé est refusé ;
- [ ] un token non enregistré est refusé ;
- [ ] le formulaire affiche les données initiales.

### 13.4 Upload logo
- [ ] un JPG/PNG/WebP/SVG valide passe ;
- [ ] un fichier > 2 Mo est refusé ;
- [ ] un type non autorisé est refusé ;
- [ ] un token invalide bloque l’upload ;
- [ ] l’URL renvoyée est intégrée à la fiche.

### 13.5 Actions admin
- [ ] approuver une demande la fait quitter l’état soumis ;
- [ ] refuser une demande la retire du flux de validation ;
- [ ] envoyer un magic link déclenche l’email ;
- [ ] désactiver un membre le retire de la visibilité publique.

**Sources / preuves**
- `tests/unit/member-logo.test.ts`
- `tests/unit/seo.test.ts`
- `tests/unit/contact.test.ts`
- `tests/e2e/example.spec.ts`
- `src/components/admin/login-form.tsx`
- `src/components/admin/member-actions.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/app/api/upload/logo/route.ts`

---

## 14. Risques

### 14.1 Risque de dérive d’autorisation
Si les routes admin ne sont pas systématiquement gardées par la session, des pages sensibles peuvent être visibles.

### 14.2 Risque de réutilisation du magic link
Sans contrôle strict de hash, expiration et état d’usage, un lien volé pourrait être réutilisé.

### 14.3 Risque de révélation de secret
`MAGIC_LINK_SECRET`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN` et éventuels secrets d’auth doivent rester côté serveur.

### 14.4 Risque de faux positifs sur le token
Une validation trop laxiste du token pourrait accepter des payloads mal formés.

### 14.5 Risque de surcharge upload
Sans contrôle de taille / type, le blob storage et l’image processing peuvent être mis en défaut.

### 14.6 Risque de confusion métier
La coexistence de plusieurs parcours de fiche et d’adhésion peut être confondue avec un système de mot de passe, alors que le projet vise un accès par lien.

### 14.7 Risque d’absence d’audit
Le référentiel métier mentionne un audit log, mais il n’est pas confirmé dans les extraits du workflow auth ; manque de traçabilité potentiellement critique.

**Sources / preuves**
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `architecture.md`
- `DECISIONS.md`
- `src/components/admin/member-actions.tsx`

---

## 15. Questions ouvertes / Points à valider

1. **Le renouvellement d’un magic link est-il déjà implémenté en bout en bout ?**
   - Le besoin métier l’évoque, mais il faut valider le flux exact et son UI.

2. **Le champ `usedAt` est-il effectivement renseigné à la première utilisation ?**
   - Les extraits montrent la vérification de `isNull(usedAt)`, mais pas l’écriture systématique.

3. **L’audit log de toutes les actions admin est-il réellement branché ?**
   - La décision métier le demande, mais le périmètre de code fourni ne le montre pas de façon certaine.

4. **La 2FA optionnelle est-elle prévue ou seulement documentée ?**
   - Mentionnée dans les décisions, non visible dans les sources ciblées.

5. **Le formulaire admin/login bénéficie-t-il d’une protection anti-bruteforce ou rate limiting ?**
   - Aucun signal explicite dans les extraits.

6. **Les pages admin sont-elles protégées côté serveur partout, ou seulement par l’UX ?**
   - Le schéma de garde n’est pas entièrement visible dans le pack.

7. **Le format exact du mail magic link et ses variables finales sont-ils figés ?**
   - Le template existe, mais la version de production doit être validée.

8. **Le stockage du magic token en base est-il unique par membre et par émission ?**
   - À confirmer, notamment en cas de renvoi multiple.

9. **La page `/fiche/[token]` invalide-t-elle le lien après soumission complète ?**
   - Non confirmé dans les extraits.

10. **Le header `x-magic-token` est-il le seul mécanisme d’accès à l’upload logo ?**
   - À confirmer si d’autres actions annexes existent.

**Sources / preuves**
- `architecture.md`
- `DECISIONS.md`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/components/admin/member-actions.tsx`
- `src/components/fiche/profile-form.tsx`