# Cahier des charges technique — open-pf-refonte

## 1. Objet

Ce document formalise les exigences techniques du projet **open-pf-refonte** à partir des preuves code et documentation fournies.

Le projet est une **application Next.js** destinée à :
- exposer un site public institutionnel pour OPEN PF ;
- proposer un **annuaire des adhérents** avec recherche et fiches publiques ;
- gérer un **parcours d’adhésion** ;
- fournir un **espace adhérent sécurisé** via magic link ;
- permettre un **back-office** mono-administrateur ;
- automatiser certaines tâches métier : relances e-mail, publication, médias, contenus éditoriaux.

**Sources principales**
- `architecture.md`
- `architecture-addendum.md`
- `DECISIONS.md`
- `README.md`
- `src/app/(public)/*`
- `src/app/admin/*`
- `src/app/api/*`
- `src/components/*`
- `src/lib/*`
- `tests/*`

---

## 2. Synthèse technique

L’architecture observée est cohérente avec une **application Next.js 15 App Router** orientée SSR/ISR, avec :
- **TypeScript** ;
- **React 19** ;
- **Drizzle ORM** sur PostgreSQL/Neon ;
- **Auth.js v5** pour l’administration ;
- **Vercel Blob** pour l’hébergement des médias ;
- **React Email / Brevo** pour les notifications ;
- **Playwright + Vitest** pour la qualité ;
- une forte attention au **SEO**, à l’accessibilité et à la maintenabilité.

Le projet met en œuvre :
- des pages publiques indexables avec métadonnées, JSON-LD et contenu éditorial ;
- un annuaire avec filtrage par domaine et profils détaillés ;
- un parcours d’adhésion multi-étapes avec sauvegarde locale ;
- un espace sécurisé de complétion de fiche ;
- un back-office éditorial et de modération ;
- des routes API pour upload et tâches cron.

**Points saillants**
- le produit est très orienté **contenu + relation adhérent** ;
- le modèle métier combine **demande d’adhésion**, **validation**, **fiche enrichie**, **publication** ;
- la gestion des fichiers et e-mails est externalisée ;
- le niveau de qualité recherché est élevé sur l’accessibilité, le SEO, et les Core Web Vitals.

---

## 3. Stack

### 3.1 Stack observée
- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript strict
- **UI** : React 19, composants maison, éléments shadcn/radix-like
- **Style** : Tailwind CSS v4
- **Formulaires** : react-hook-form + Zod
- **Base de données** : PostgreSQL via Neon
- **ORM** : Drizzle ORM
- **Auth admin** : Auth.js v5 / next-auth beta
- **Upload fichiers** : Vercel Blob + sharp
- **Emails** : React Email + Brevo
- **Tests** : Vitest, Playwright, axe-core
- **CI/CD** : GitHub Actions, Vercel

### 3.2 Preuves
- `package.json`
- `architecture.md`
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `tests/e2e/example.spec.ts`
- `tests/unit/*.test.ts(x)`

### 3.3 Lecture produit
La stack est adaptée à :
- un site à fort contenu ;
- un annuaire avec recherche ;
- des workflows de validation ;
- une partie administration sobre mais sensible ;
- une logique de SEO institutionnel.

---

## 4. Architecture

### 4.1 Organisation générale
L’application repose sur le pattern Next.js App Router avec séparation entre :
- **site public** ;
- **back-office admin** ;
- **routes API** ;
- **actions serveur** ;
- **composants réutilisables** ;
- **librairies métier** (validation, SEO, email, auth, queries, randomisation).

### 4.2 Découpage fonctionnel
#### Public
Pages observées :
- `/`
- `/reseau`
- `/adherents`
- `/adherents/[slug]`
- `/adhesion`
- `/actualites`
- `/actualites/[slug]`
- `/offres-emploi`
- `/offres-emploi/[slug]`
- `/contact`
- `/documents-utiles`
- `/mentions-legales`
- `/confidentialite`

#### Admin
- `/admin`
- `/admin/login`
- `/admin/demandes`
- `/admin/demandes/[id]`
- `/admin/adherents`
- `/admin/adherents/[id]`
- `/admin/fiches`
- `/admin/actualites`
- `/admin/actualites/new`
- `/admin/actualites/[id]`
- `/admin/offres-emploi`
- `/admin/offres-emploi/new`
- `/admin/offres-emploi/[id]`
- `/admin/relances`
- `/admin/parametres`

#### API
- `/api/auth/[...nextauth]`
- `/api/upload/logo`
- `/api/upload/news-image`
- `/api/cron/reminders`
- `/api/webhooks/brevo`

### 4.3 Rendu et stratégie cache
Le projet combine :
- pages statiques ou partiellement statiques ;
- `revalidate = 3600` sur certaines vues ;
- `dynamic = 'force-dynamic'` sur les pages dépendantes des données temps réel ;
- usage de **Suspense** pour différer les blocs data-driven.

### 4.4 Preuves
- `src/app/(public)/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/layout.tsx`
- `src/components/layout/site-header.tsx`
- `src/components/layout/site-footer.tsx`

---

## 5. Arborescence

### 5.1 Structure fonctionnelle observée
- `src/app/` : routes App Router
- `src/components/` : UI et modules métier
- `src/lib/` : auth, DB, queries, validation, email, SEO, data
- `drizzle/` : migrations et snapshots
- `tests/` : unitaires et e2e
- `scripts/` : import/migration/maintenance
- `mockup/` : référence UX
- `seeds/` : référentiels et données initiales

### 5.2 Points notables
Le code est organisé par **domaines métiers** plutôt que par couches techniques abstraites, ce qui facilite :
- la lisibilité ;
- la maintenance ;
- les évolutions par feature ;
- le test ciblé.

### 5.3 Preuves
- `architecture.md`
- `src/app/(public)/*`
- `src/app/admin/*`
- `src/components/adhesion/*`
- `src/components/annuaire/*`
- `src/components/admin/*`
- `src/lib/*`
- `scripts/import-openpf/*`
- `drizzle/*`

---

## 6. Modules techniques

### 6.1 Site public et SEO
Fonctions observées :
- métadonnées par page ;
- Open Graph / Twitter cards ;
- JSON-LD pour Organisation, Website, Breadcrumb, Article, JobPosting, Member ;
- navigation et footer institutionnels ;
- maillage interne vers adhésion, annuaire, actualités, offres d’emploi.

**Preuves**
- `src/app/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/lib/seo.ts` via tests `tests/unit/seo.test.ts`

### 6.2 Annuaire des adhérents
Fonctions observées :
- recherche textuelle ;
- filtre par domaine ;
- compteur de statistiques ;
- cartes adhérents ;
- fiche publique détaillée ;
- membres associés ;
- fallback visuel pour les logos.

**Preuves**
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/components/annuaire/*`
- `tests/unit/member-card.test.tsx`
- `tests/unit/member-showcase.test.tsx`
- `tests/unit/member-logo.test.ts`

### 6.3 Parcours d’adhésion
Le formulaire d’adhésion est un parcours multi-étapes avec :
- stockage de brouillon local ;
- validation progressive ;
- consentement RGPD ;
- recapitulatif avant envoi ;
- modale d’ouverture depuis le site.

**Preuves**
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`
- `src/components/adhesion/stepper.tsx`

### 6.4 Espace adhérent sécurisé
Le lien magic permet :
- d’identifier un adhérent sans mot de passe ;
- d’accéder à sa fiche ;
- d’éditer les champs autorisés ;
- d’uploader le logo ;
- d’autosauvegarder un brouillon ;
- de soumettre la fiche.

**Preuves**
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`

### 6.5 Administration
Le back-office couvre :
- demandes d’adhésion ;
- validation / rejet ;
- gestion des adhérents ;
- fiches à valider ;
- actualités ;
- offres d’emploi ;
- relances ;
- paramètres ;
- connexion admin.

**Preuves**
- `src/app/admin/page.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/admin/fiches/page.tsx`
- `src/app/admin/actualites/page.tsx`
- `src/app/admin/relances/page.tsx`
- `src/app/admin/parametres/page.tsx`
- `src/app/admin/(auth)/login/page.tsx`
- `src/components/admin/*`

### 6.6 Médias et uploads
Deux routes d’upload sont mises en place :
- logo adhérent via magic link ;
- image d’actualité via admin.

Traitements :
- contrôle du type MIME ;
- limite de taille ;
- conversion WebP pour les images raster ;
- stockage public sur Vercel Blob.

**Preuves**
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`

### 6.7 Mails et relances
Le projet inclut :
- templates e-mail transactionnels ;
- relance admin à J+3 puis périodique ;
- journal des envois ;
- base Brevo.

**Preuves**
- `src/app/api/cron/reminders/route.ts`
- `src/lib/email/templates/contact.tsx`
- `src/lib/email/templates/magic-link.tsx`
- `src/lib/email/templates/reminder.tsx`
- `src/app/api/webhooks/brevo/route.ts`

---

## 7. Services critiques

### 7.1 Base de données
La base PostgreSQL porte les données cœur :
- membres ;
- contacts ;
- domaines ;
- certifications ;
- news ;
- job offers ;
- site stats ;
- admin users ;
- reminder logs ;
- audit log ;
- token magic link.

**Risques**
- cohérence entre schéma, seeds et pages admin ;
- modèles incomplets si certains référentiels métier manquent ;
- dépendance forte à Neon et à Drizzle.

**Preuves**
- `drizzle/meta/0001_snapshot.json`
- `drizzle/meta/0002_snapshot.json`
- `drizzle/0001_keen_the_executioner.sql`
- `src/lib/db/schema`
- `src/app/admin/*`
- `src/app/(public)/adherents/*`

### 7.2 Authentification admin
Auth.js v5 en mode credentials, avec :
- login par email / mot de passe ;
- bcrypt ;
- session JWT ;
- mise à jour du `lastLoginAt`.

**Preuves**
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/app/admin/(auth)/login/page.tsx`

### 7.3 Magic link / fiche sécurisée
Le lien est basé sur :
- UUID + HMAC ;
- hash SHA-256 en base ;
- TTL 30 jours ;
- vérification serveur avant accès aux données sensibles.

**Preuves**
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`

### 7.4 Cron des relances
Le cron examine les membres soumis et :
- vérifie le délai depuis soumission ou dernière relance ;
- envoie un e-mail de rappel ;
- enregistre le log ;
- tolère les échecs par item.

**Preuves**
- `src/app/api/cron/reminders/route.ts`
- `src/lib/email/templates/reminder.tsx`
- `src/app/admin/relances/page.tsx`

---

## 8. Flux de données

### 8.1 Flux adhésion
1. L’utilisateur ouvre `/adhesion`.
2. Il remplit les étapes du formulaire.
3. Le brouillon est sauvegardé localement.
4. La soumission appelle une action serveur.
5. La demande passe en état métier de type `submitted`.
6. Le back-office la consulte et la valide/refuse.
7. Un magic link peut ensuite être envoyé pour compléter la fiche.

**Preuves**
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/admin/member-actions.tsx`
- `src/app/admin/demandes/*`
- `src/app/admin/fiches/page.tsx`

### 8.2 Flux fiche adhérent
1. L’adhérent reçoit un lien sécurisé.
2. Il ouvre `/fiche/[token]`.
3. La page charge les données initiales.
4. Le formulaire autosauvegarde un brouillon.
5. Le logo peut être téléversé.
6. La fiche est soumise pour validation.

**Preuves**
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/app/api/upload/logo/route.ts`

### 8.3 Flux annuaire public
1. `GET /adherents`
2. Récupération des stats, domaines et membres.
3. Rendu SSR avec recherche et filtre.
4. Les pages de profil chargent contacts, domaines et contenu associé.

**Preuves**
- `src/app/(public)/adherents/page.tsx`
- `src/lib/db/queries/members`
- `src/lib/db/queries/stats`
- `src/app/(public)/adherents/[slug]/page.tsx`

### 8.4 Flux actualités / offres
- les contenus sont consultés côté public ;
- créés et édités en admin ;
- enrichis avec image, résumé, statut de publication.

**Preuves**
- `src/app/(public)/actualites/*`
- `src/app/(public)/offres-emploi/*`
- `src/app/admin/actualites/*`
- `src/app/admin/offres-emploi/*`

---

## 9. Dépendances externes

### 9.1 Dépendances techniques externes
- **Vercel**
- **Neon PostgreSQL**
- **Vercel Blob**
- **Brevo**
- **Auth.js / next-auth**
- **Playwright**
- **Vitest**
- **Sentry** mentionné dans l’architecture
- **Plausible** mentionné dans l’architecture
- **Sharp**

### 9.2 Risques liés aux dépendances
- exposition à la disponibilité du fournisseur ;
- changements d’API sur services bêta ou externes ;
- configuration e-mail dépendante du DNS ;
- uploads dépendants de clés et quotas Blob ;
- cron dépendant de l’orchestration Vercel.

### 9.3 Preuves
- `architecture.md`
- `DECISIONS.md`
- `README.md`
- `package.json`
- `src/app/api/upload/*`
- `src/app/api/cron/reminders/route.ts`

---

## 10. Sécurité

### 10.1 Authentification
Le back-office utilise :
- credentials provider ;
- bcrypt ;
- sessions JWT ;
- protection par route admin.

**Attention**
- `trustHost: true` est activé dans la config Auth ; cela demande une maîtrise stricte de l’environnement de déploiement et des headers entrants.

**Preuves**
- `src/lib/auth/config.ts`
- `src/auth.ts`

### 10.2 Magic links
Le mécanisme est raisonnablement robuste :
- signature HMAC ;
- token hashé en base ;
- comparaison temporelle sûre ;
- expiration limitée.

**Preuves**
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`

### 10.3 Upload fichiers
Les uploads sont protégés par :
- contrôle de session ou token ;
- whitelist MIME ;
- taille maximale ;
- conversion d’image ;
- stockage public contrôlé par token Blob.

**Preuves**
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`

### 10.4 Risques
- validation MIME seule insuffisante contre certains fichiers déguisés ;
- SVG public = risque potentiel si contenu non sanitizé ;
- webhooks Brevo non traités ;
- cron exposé à un secret partagé ;
- absence visible, dans les extraits fournis, d’un audit log effectif côté action admin ;
- la 2FA est mentionnée dans les décisions, mais non visible dans le code extrait.

**Preuves**
- `src/app/api/upload/logo/route.ts`
- `src/app/api/webhooks/brevo/route.ts`
- `DECISIONS.md`
- `drizzle/meta/*`

---

## 11. Performance

### 11.1 Choix favorables
- ISR / revalidation sur pages peu volatiles ;
- `Suspense` pour différer les données de l’annuaire ;
- `seededShuffle` pour stabiliser certains affichages ;
- images optimisées via `next/image` ;
- transformation WebP des uploads raster ;
- requêtes ciblées via Drizzle.

**Preuves**
- `src/app/(public)/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/components/public/member-logo.tsx`
- `src/app/api/upload/news-image/route.ts`
- `src/lib/random/seeded-shuffle.ts`
- `tests/unit/seeded-shuffle.test.ts`

### 11.2 Points de vigilance
- les listes administratives peuvent croître si les contenus augmentent ;
- les requêtes d’annuaire doivent rester indexées ;
- les traitements d’image en runtime coûtent du CPU ;
- le cron de relance fait des boucles séquentielles ;
- la recherche pourrait nécessiter un index full-text si le volume augmente.

**Preuves**
- `src/app/(public)/adherents/page.tsx`
- `src/app/api/cron/reminders/route.ts`
- `architecture.md`

---

## 12. Observabilité

### 12.1 Ce qui existe
- journal des relances accessible dans l’admin ;
- chronologie des actions métier via `reminderLogs` ;
- mentions Sentry dans l’architecture de référence ;
- tests e2e avec axe.

**Preuves**
- `src/app/admin/relances/page.tsx`
- `src/app/api/cron/reminders/route.ts`
- `architecture.md`
- `tests/e2e/example.spec.ts`

### 12.2 Manques potentiels
- la présence concrète de Sentry n’est pas visible dans les extraits de code ;
- le webhook Brevo est un stub ;
- l’audit log est mentionné comme décision, mais pas clairement visible dans les actions critiques fournies ;
- pas de preuve d’un dashboard opérationnel sur les erreurs API.

### 12.3 Recommandation
L’observabilité doit couvrir :
- erreurs serveur ;
- échecs d’upload ;
- échecs de cron ;
- échecs d’envoi e-mail ;
- échecs de soumission de formulaires ;
- ruptures de flux d’authentification.

---

## 13. Risques techniques

### 13.1 Risque de dérive métier
Le projet dépend de référentiels métier fermés :
- domaines d’activité ;
- compétences ;
- certifications ;
- statuts juridiques.

Si ces listes ne sont pas figées, le système peut diverger du besoin réel.

**Preuves**
- `architecture-addendum.md`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/fiche/profile-form.tsx`

### 13.2 Risque sécurité
- SVG public non sanitizé ;
- absence visible de protection CSRF explicite sur certaines routes ;
- webhook Brevo non implémenté ;
- 2FA non confirmée en code.

### 13.3 Risque de cohérence produit
Les décisions projet et certains extraits UI montrent des écarts potentiels :
- adhésion en **3 étapes** ;
- fiche adhérent avec davantage d’étapes ;
- certains écrans admin encore très “mockup-driven”.

**Preuves**
- `DECISIONS.md`
- `architecture-addendum.md`
- `src/components/adhesion/*`
- `mockup/open_pf_site_8_5/*`

### 13.4 Risque d’intégration
- dépendance au bon paramétrage DNS pour e-mails ;
- dépendance à Blob pour médias ;
- dépendance à la base pour parcours sensibles ;
- cron potentiellement fragile si les volumes augmentent.

---

## 14. Recommandations

### 14.1 Priorités techniques
1. **Finaliser les référentiels métier fermés**  
   Domaines, compétences, certifications, statuts juridiques.

2. **Vérifier la couverture sécurité des médias**
   - sanitizer SVG ;
   - renforcer les validations de fichiers ;
   - tracer les uploads.

3. **Clarifier la politique d’authentification admin**
   - confirmer ou implémenter la 2FA ;
   - formaliser l’audit log ;
   - vérifier les dépendances à `trustHost`.

4. **Rendre le webhook Brevo opérationnel**
   - réception delivery/bounce ;
   - mise à jour du statut de délivrabilité ;
   - corrélation avec les logs.

5. **Stabiliser l’observabilité**
   - logs structurés ;
   - alerting sur cron et e-mails ;
   - corrélation des actions admin.

### 14.2 Recommandations de maintenabilité
- centraliser les règles métier dans des modules de validation et de référentiel ;
- éviter la duplication entre mockup, décisions et code ;
- documenter les états métier de `members` et des demandes ;
- isoler les accès DB par couche de query métier ;
- conserver les tests de non-régression sur les composants critiques.

### 14.3 Recommandations de performance
- surveiller les temps de réponse des requêtes d’annuaire ;
- indexer les colonnes de recherche si le volume augmente ;
- conserver l’ISR sur les pages peu sensibles au temps réel ;
- limiter les traitements d’images lourds en chemin critique.

---

## Questions ouvertes / Points à valider

1. **Référentiels métier**
   - Quelle est la liste finale des domaines d’activité ?
   - Quelle liste définitive pour les compétences ?
   - Quelles certifications/agréments doivent être proposées ?
   - Quelle liste des statuts juridiques est retenue ?

2. **Sécurité**
   - La **2FA** admin est-elle à livrer dans ce périmètre ?
   - Un **audit log** opérationnel est-il exigé dès la version initiale ?
   - Le traitement des **SVG** doit-il être sanitizé avant stockage public ?

3. **Emails**
   - Quelle adresse d’expéditeur est définitivement validée ?
   - Le DNS est-il prêt pour SPF / DKIM / DMARC ?
   - Le webhook Brevo doit-il gérer bounce / complaint / delivered ?

4. **Relances**
   - Le plafond des relances est-il bien de **10 envois** ?
   - Faut-il un arrêt manuel depuis l’admin sur tous les cas ?

5. **Hébergement**
   - Vercel est-il confirmé ou faut-il prévoir une alternative UE self-hosted ?
   - La région de calcul et celle de la base sont-elles définitivement alignées ?

6. **Produit**
   - Le parcours d’adhésion reste-t-il bien en **3 étapes** ?
   - L’espace adhérent conserve-t-il le découpage actuel entre adhésion et complétion ?
   - Quels contenus institutionnels sont prioritaires pour la mise en ligne ?

---

## Sources et preuves citées

- `architecture.md`
- `architecture-addendum.md`
- `DECISIONS.md`
- `README.md`
- `package.json`
- `src/app/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/(public)/adhesion/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/app/admin/*`
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/webhooks/brevo/route.ts`
- `src/auth.ts`
- `src/lib/auth/*`
- `src/components/*`
- `drizzle/*`
- `tests/*`