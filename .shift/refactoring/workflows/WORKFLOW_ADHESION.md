# WORKFLOW_parcours d'adhésion — Cahier de workflow fonctionnel et technique reconstitué

## 1. Objet

Ce document reconstitue le cahier de workflow du **parcours d’adhésion** du projet **open-pf-refonte**, à partir des preuves fournies dans le pack.  
Il décrit le **parcours métier**, les **données manipulées**, les **règles de gestion**, les **erreurs**, les **effets de bord** et les **points à valider** autour de la demande d’adhésion OPEN PF.

**Périmètre couvert :**
- page d’adhésion publique ;
- formulaire d’adhésion en modale et en pleine page ;
- soumission de la demande ;
- validation / refus par le bureau ;
- envoi de lien magic link pour compléter la fiche adhérent ;
- relances automatiques ;
- publication de l’adhérent dans l’annuaire après validation.

**Sources principales :**
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`
- `src/components/layout/site-header.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`
- `src/app/api/upload/logo/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/lib/auth/magic-link.ts`
- `src/lib/email/templates/magic-link.tsx`
- `src/lib/email/templates/reminder.tsx`
- `DECISIONS.md`
- `architecture.md`

---

## 2. Synthèse fonctionnelle

Le parcours d’adhésion OPEN PF est un **formulaire en 5 étapes** côté UI dans la version observée du code, destiné à collecter les informations d’une entreprise souhaitant rejoindre le réseau.

Le flux attendu est le suivant :
1. le visiteur clique sur **Adhérer** ;
2. le formulaire s’ouvre en **modale** depuis l’en-tête, ou en **page complète** sur `/adhesion` ;
3. le visiteur renseigne les informations de l’entreprise ;
4. il ajoute un ou plusieurs contacts ;
5. il sélectionne les domaines d’activité ;
6. il peut optionnellement ajouter des certifications ;
7. il relit le récapitulatif, accepte le RGPD et envoie la demande ;
8. la demande apparaît en back-office dans les demandes à traiter ;
9. le bureau peut **approuver**, **refuser** ou **envoyer un lien de fiche** ;
10. si la demande est approuvée, l’entreprise devient visible dans l’annuaire après validation du cycle métier ;
11. un **magic link** permet ensuite à l’adhérent de compléter sa fiche sécurisée ;
12. des **relances automatiques** sont envoyées tant que la fiche n’est pas finalisée.

**Point notable :**  
Les décisions documentaires précisent que le parcours d’adhésion métier est censé être en **3 étapes** :
- Informations entreprise ;
- Domaines d’activité ;
- Coordonnées.

Mais le code observé expose un parcours UI en **5 étapes** avec :
- Entreprise ;
- Contacts ;
- Activités ;
- Certifications ;
- Récapitulatif.

Cela doit être considéré comme une divergence importante à valider.

**Sources :**
- `DECISIONS.md`
- `architecture-addendum.md`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/step-*.tsx`

---

## 3. Acteurs concernés

### 3.1 Visiteur / candidat à l’adhésion
- Consulte la page d’adhésion.
- Remplit les informations de son entreprise.
- Soumet la demande.
- Reçoit éventuellement des communications liées à la finalisation.

### 3.2 Bureau / administrateur
- Consulte la liste des demandes.
- Examine chaque demande.
- Approuve ou refuse.
- Peut envoyer un lien de fiche.
- Suit les relances.
- Gère les contenus associés au site et les paramètres.

### 3.3 Adhérent déjà enregistré
- Reçoit un lien sécurisé par magic link.
- Complète sa fiche dans l’espace adhérent.
- Téléverse éventuellement un logo.

### 3.4 Système
- Valide les données.
- Enregistre la demande.
- Gère les relances automatiques.
- Envoie les emails transactionnels.
- Stocke les fichiers téléversés.
- Alimente l’annuaire public après validation.

**Sources :**
- `src/components/admin/member-actions.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/upload/logo/route.ts`
- `src/lib/email/templates/magic-link.tsx`
- `src/lib/email/templates/reminder.tsx`

---

## 4. Points d’entrée

### 4.1 Entrées publiques
- `/adhesion` : page d’adhésion.
- bouton **Adhérer** dans le header.
- bouton **Adhérer à OPEN** dans les CTA.
- éventuellement ouverture en **modale** via l’en-tête.

### 4.2 Entrées back-office
- `/admin/demandes`
- `/admin/demandes/[id]`
- `/admin/adherents`
- `/admin/fiches`
- `/admin/relances`

### 4.3 Entrées techniques
- `/api/upload/logo`
- `/api/upload/news-image`
- `/api/cron/reminders`
- route NextAuth : `/api/auth/[...nextauth]`

**Sources :**
- `src/components/layout/site-header.tsx`
- `src/components/public/cta-band.tsx`
- `src/app/(public)/adhesion/page.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/api/upload/logo/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`

---

## 5. Composants source

### 5.1 Interface publique
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/components/adhesion/adhesion-progress-sidebar.tsx`
- `src/components/adhesion/stepper.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`

### 5.2 Back-office
- `src/components/admin/admin-sidebar.tsx`
- `src/components/admin/member-actions.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/admin/fiches/page.tsx`
- `src/app/admin/relances/page.tsx`

### 5.3 Services métiers
- `src/lib/actions/adhesion`
- `src/lib/actions/admin/members`
- `src/lib/actions/member-profile`
- `src/lib/auth/magic-link.ts`
- `src/lib/email/client`
- `src/lib/email/templates/magic-link.tsx`
- `src/lib/email/templates/reminder.tsx`

### 5.4 Référentiels / validations
- `src/lib/data/referentials`
- `src/lib/validations/adhesion`
- `src/lib/validations/member-profile`
- `src/lib/validations/admin`

**Sources complémentaires :**
- `DECISIONS.md`
- `architecture.md`

---

## 6. Données principales

### 6.1 Données d’adhésion
Les preuves montrent que la demande collecte au minimum :

#### Entreprise
- raison sociale ;
- statut juridique ;
- numéro TAHITI ;
- site web ;
- description ;
- année de création ;
- nombre de salariés ;
- adhésion MEDEF PF oui/non.

#### Contacts
- nom complet ;
- fonction ;
- email ;
- téléphone ;
- notion de contact principal.

#### Activités
- liste de domaines d’activité sélectionnés.

#### Certifications
- liste de certifications / labels ;
- champ optionnel ;
- autre libellé possible côté fiche adhérent.

#### Consentement
- RGPD / consentement obligatoire à l’envoi.

### 6.2 Données de traitement
Côté back-office et annuaire :
- statut de la demande / fiche ;
- dates de soumission, validation, mise à jour ;
- contacts ;
- domaines ;
- certifications ;
- logo ;
- URL du site ;
- adresse ;
- LinkedIn ;
- année de création ;
- effectif.

### 6.3 Modèle de cycle de vie
Les décisions métier mentionnent le cycle :
- `draft`
- `submitted`
- `active`
- `inactive`

Les vues admin confirment l’existence de statuts métiers autour de la soumission et de la validation.

### 6.4 Tables / structures visibles dans les preuves
- `members`
- `memberContacts`
- `memberActivities`
- `memberCertifications`
- `activityDomains`
- `memberTokens`
- `reminderLogs`
- `adminUsers`
- `siteStats`

**Sources :**
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `DECISIONS.md`

---

## 7. Étapes nominales

### 7.1 Accès au parcours
1. L’utilisateur arrive sur le site.
2. Il clique sur **Adhérer**.
3. Le parcours s’ouvre :
   - soit en **modale** via l’en-tête ;
   - soit en **page dédiée** `/adhesion`.

**Preuves :**
- `src/components/layout/site-header.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/app/(public)/adhesion/page.tsx`

### 7.2 Remplissage de l’étape entreprise
4. L’utilisateur saisit la raison sociale.
5. Il choisit le statut juridique.
6. Il saisit le n° TAHITI.
7. Il peut renseigner un site web, une année de création, un nombre de salariés, une description.
8. Il précise s’il est déjà adhérent MEDEF PF.

**Preuves :**
- `src/components/adhesion/step-entreprise.tsx`

### 7.3 Remplissage des contacts
9. L’utilisateur ajoute un ou plusieurs contacts.
10. Il désigne un contact principal.
11. Il renseigne nom, fonction, email, téléphone.

**Preuves :**
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/adhesion-form.tsx`

### 7.4 Sélection des activités
12. L’utilisateur sélectionne un ou plusieurs domaines d’activité parmi une liste fermée.

**Preuves :**
- `src/components/adhesion/step-activites.tsx`
- `src/lib/data/referentials`

### 7.5 Sélection des certifications
13. L’utilisateur peut sélectionner des certifications / labels, si applicable.

**Preuves :**
- `src/components/adhesion/step-certifications.tsx`

### 7.6 Récapitulatif et consentement
14. Le système affiche un récapitulatif.
15. L’utilisateur vérifie les données.
16. Il accepte le consentement RGPD.
17. Il soumet la demande.

**Preuves :**
- `src/components/adhesion/step-recap.tsx`
- `src/components/adhesion/adhesion-form.tsx`

### 7.7 Traitement administratif
18. La demande apparaît dans le back-office.
19. Le bureau l’examine.
20. Il peut approuver ou refuser.
21. Il peut envoyer un lien de fiche.

**Preuves :**
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`

### 7.8 Finalisation de la fiche
22. Si un lien est envoyé, l’adhérent complète la fiche sécurisée.
23. Il peut téléverser un logo.
24. Il sauvegarde et soumet sa fiche.
25. La fiche peut être publiée après validation.

**Preuves :**
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/app/api/upload/logo/route.ts`

---

## 8. Variantes

### 8.1 Ouverture en modale ou en pleine page
Le parcours d’adhésion est conçu pour fonctionner :
- en **modale overlay** ;
- en **page SSR complète**.

**Preuves :**
- `src/components/layout/site-header.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/app/(public)/adhesion/page.tsx`
- `architecture-addendum.md`
- `DECISIONS.md`

### 8.2 Plusieurs contacts
Le formulaire autorise plusieurs contacts, avec obligation d’en désigner un principal.

**Preuves :**
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/adhesion-form.tsx`

### 8.3 Certifications optionnelles
Les certifications sont optionnelles dans le flux observé.

**Preuves :**
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/adhesion-form.tsx`

### 8.4 Téléversement de logo
Dans la fiche sécurisée, le logo peut être téléversé après validation d’un token magique.

**Preuves :**
- `src/app/api/upload/logo/route.ts`
- `src/components/fiche/profile-form.tsx`

### 8.5 Relance J+3 puis récurrente
Le système de relance applique :
- première relance après 3 jours ;
- relance récurrente tous les 7 jours.

**Preuves :**
- `src/app/api/cron/reminders/route.ts`
- `DECISIONS.md`

---

## 9. Cas d’erreur

### 9.1 Données de formulaire invalides
Le formulaire embarque une validation Zod / react-hook-form :
- champs requis manquants ;
- email invalide ;
- URL invalide ;
- N° TAHITI invalide ;
- absence de contact principal ;
- consentement RGPD absent.

**Preuves :**
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-recap.tsx`

### 9.2 Erreur serveur à la soumission
Le composant prévoit un message générique :
- “Une erreur est survenue. Réessayez.”
- “Veuillez réessayer dans quelques instants.”

**Preuves :**
- `src/components/adhesion/adhesion-form.tsx`

### 9.3 Fichier de logo invalide
L’API logo refuse :
- l’absence de fichier ;
- un type MIME non supporté ;
- un fichier trop volumineux ;
- un token magic invalide ou expiré.

**Preuves :**
- `src/app/api/upload/logo/route.ts`

### 9.4 Token magic invalide ou expiré
La fiche sécurisée et l’upload logo sont protégés par un token signé / vérifié.

**Preuves :**
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/app/(public)/fiche/[token]/page.tsx`

### 9.5 Autorisation cron invalide
La route de relance refuse tout appel sans [REDACTED] attendu.

**Preuves :**
- `src/app/api/cron/reminders/route.ts`

### 9.6 Demande introuvable ou mauvais statut
Les pages admin de détail renvoient un `notFound()` si :
- l’adhérent n’existe pas ;
- le statut ne correspond pas à la vue demandée.

**Preuves :**
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`

---

## 10. Documents / emails / effets de bord

### 10.1 Emails transactionnels
Deux emails sont explicitement présents :
- **Magic link** pour compléter la fiche ;
- **Reminder** pour signaler une demande en attente.

**Preuves :**
- `src/lib/email/templates/magic-link.tsx`
- `src/lib/email/templates/reminder.tsx`

### 10.2 Effets de bord métier
- création ou mise à jour d’une demande ;
- insertion de logs de relance ;
- mise à jour de `lastLoginAt` pour l’admin ;
- éventuel upload de logo ;
- publication dans l’annuaire après validation ;
- calcul des statistiques du site.

**Preuves :**
- `src/app/api/cron/reminders/route.ts`
- `src/lib/auth/config.ts`
- `src/app/api/upload/logo/route.ts`
- `src/app/(public)/adherents/page.tsx`
- `src/app/admin/parametres/page.tsx`

### 10.3 Documents associés
- politique de confidentialité ;
- mentions légales ;
- architecture / décisions ;
- références de référentiels métier ;
- emails templates.

**Preuves :**
- `src/app/(public)/confidentialite/page.tsx`
- `src/app/(public)/mentions-legales/page.tsx`
- `DECISIONS.md`
- `architecture.md`
- `architecture-addendum.md`

---

## 11. Règles métier

### 11.1 Parcours d’adhésion
- Le parcours doit permettre la collecte d’une demande d’adhésion complète.
- La demande repose sur les informations d’entreprise, les contacts et les domaines d’activité.
- Le consentement RGPD est obligatoire pour l’envoi.
- Les certifications apparaissent dans le code comme optionnelles, alors que les décisions disent qu’elles ne devraient pas faire partie du formulaire d’adhésion initial.

### 11.2 Référentiels fermés
- Les domaines d’activité doivent provenir d’une liste fermée.
- Les statuts juridiques proviennent aussi d’un référentiel.
- Les certifications suivent un référentiel dédié.

**Preuves :**
- `src/lib/data/referentials`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `DECISIONS.md`
- `architecture-addendum.md`

### 11.3 Magic link
- Durée de validité : 30 jours.
- Format : UUID + HMAC.
- Stockage hashé en base.
- Renouvellement possible.

**Preuves :**
- `src/lib/auth/magic-link.ts`
- `DECISIONS.md`

### 11.4 Relances
- Première relance à J+3.
- Puis toutes les 7 jours.
- Arrêt automatique après 10 envois.
- Arrêt manuel possible.

**Preuves :**
- `src/app/api/cron/reminders/route.ts`
- `DECISIONS.md`

### 11.5 Validation avant publication
- Les fiches ne sont publiées qu’après validation par le bureau.

**Preuves :**
- `DECISIONS.md`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`

### 11.6 Statut des chiffres clés
- Le nombre d’adhérents est calculé automatiquement.
- Les autres chiffres peuvent être saisis / gérés séparément selon les vues admin.

**Preuves :**
- `architecture-addendum.md`
- `DECISIONS.md`
- `src/app/(public)/adherents/page.tsx`
- `src/app/admin/parametres/page.tsx`

---

## 12. Sécurité / permissions

### 12.1 Administration protégée
L’administration utilise Auth.js v5 en mode credentials :
- email + mot de passe ;
- session JWT ;
- compte actif obligatoire.

**Preuves :**
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/app/admin/(auth)/login/page.tsx`

### 12.2 Magic link sécurisé
Le lien de fiche n’utilise pas de mot de passe.
Il repose sur :
- un token signé HMAC ;
- une vérification en base ;
- un TTL.

**Preuves :**
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`

### 12.3 Upload protégé
L’upload logo requiert un token magique valide.

**Preuves :**
- `src/app/api/upload/logo/route.ts`

### 12.4 Cron protégé
La route cron exige un [REDACTED] de secret.

**Preuves :**
- `src/app/api/cron/reminders/route.ts`

### 12.5 Modération avant publication
La publication dans l’annuaire n’est pas automatique côté métier ; elle passe par validation.

**Preuves :**
- `DECISIONS.md`
- `src/app/admin/demandes/[id]/page.tsx`

### 12.6 Point de vigilance
Le code montre des protections fonctionnelles correctes, mais la conformité RGPD, la stratégie d’audit, la limitation de tentatives de connexion et le durcissement des secrets ne sont pas entièrement documentés dans les extraits fournis.

---

## 13. Recette

### 13.1 Recette fonctionnelle
1. Ouvrir la page d’adhésion.
2. Vérifier l’accès en page complète et l’ouverture en modale.
3. Renseigner une entreprise valide.
4. Ajouter au moins un contact principal.
5. Sélectionner un ou plusieurs domaines.
6. Tester l’étape certifications.
7. Vérifier le récapitulatif.
8. Soumettre.
9. Contrôler l’apparition de la demande dans le back-office.
10. Approuver la demande.
11. Vérifier l’accès au lien de fiche.
12. Compléter la fiche sécurisée.
13. Tester le téléversement de logo.
14. Vérifier l’annuaire public après validation.
15. Contrôler le déclenchement / journal des relances.

### 13.2 Recette de non-régression
- accès mobile au parcours ;
- fermeture de modale ;
- validation des champs obligatoires ;
- persistance du draft local ;
- statuts administratifs cohérents ;
- refus des uploads invalides ;
- protection des routes privées.

### 13.3 Tests déjà visibles dans le repo
- tests UI et accessibilité sur la home ;
- tests unitaires sur les validateurs et composants d’annuaire ;
- tests SEO et utilitaires.

**Preuves :**
- `tests/e2e/example.spec.ts`
- `tests/unit/contact.test.ts`
- `tests/unit/member-card.test.tsx`
- `tests/unit/member-showcase.test.tsx`
- `tests/unit/seo.test.ts`
- `tests/unit/utils.test.ts`

---

## 14. Risques

### 14.1 Divergence entre décisions métier et implémentation
Le plus gros risque visible est la **discordance entre le parcours décidé à 3 étapes** et le **formulaire codé à 5 étapes**.

**Impact :**
- incohérence produit ;
- surcharge utilisateur ;
- risque de non-conformité au cadrage validé.

### 14.2 Référentiels non stabilisés
Les listes fermées de domaines, statuts juridiques et certifications sont critiques mais semblent encore sujettes à validation.

**Impact :**
- saisie imprécise ;
- données hétérogènes ;
- difficulté d’indexation et de filtrage.

### 14.3 Relances potentiellement insuffisamment bornées
Le cron montre une logique J+3 / +7 mais la limite d’arrêt après N envois n’apparaît pas dans l’extrait du code.

**Impact :**
- risque de relances excessives ;
- risque de bruit opérationnel.

### 14.4 Sécurisation incomplète des parcours sensibles
La présence d’un magic link et d’upload protégé est bonne, mais il faut confirmer :
- gestion de l’expiration ;
- révocation ;
- rotation des secrets ;
- audit des accès.

### 14.5 Données métier et contenu éditorial
Le projet dépend de contenus institutionnels et listes métiers encore incomplets dans les addenda.

**Impact :**
- réécritures manuelles ;
- incohérences publiques ;
- blocage de mise en production.

### 14.6 Cohérence du cycle de vie
Les vues admin suggèrent des usages opérationnels proches de `submitted`, `active`, `inactive`, mais le workflow de transition exact n’est pas entièrement tracé dans les extraits.

---

## 15. Questions ouvertes

### Questions ouvertes / Points à valider

1. **Le parcours d’adhésion doit-il rester en 3 étapes ou en 5 étapes ?**  
   - Les décisions validées mentionnent 3 étapes.
   - Le code implémente 5 étapes avec certifications.
   - **À valider impérativement.**

2. **Les certifications doivent-elles faire partie du formulaire initial d’adhésion ?**  
   - Les décisions disent non.
   - Le code dit oui, étape optionnelle.
   - **Hypothèse :** elles ont été réintroduites par erreur ou par évolution non arbitrée.

3. **Quels sont les référentiels officiels fermés ?**
   - domaines d’activité ;
   - statuts juridiques ;
   - certifications / agréments.
   - **À valider avant production.**

4. **Quelle est la règle exacte de clôture des relances ?**
   - les décisions mentionnent arrêt après 10 envois ;
   - le cron extrait montre J+3 / +7 mais pas la limite d’arrêt dans l’extrait.
   - **À confirmer.**

5. **L’envoi du magic link doit-il s’appliquer à la demande d’adhésion ou à la fiche adhérent uniquement ?**
   - le code admin propose “envoyer le lien fiche” ;
   - le scope exact du déclenchement mérite confirmation.
   - **À valider.**

6. **Quelle est la source de vérité pour le statut d’un membre : `draft/submitted/active/inactive` ou une variante plus riche ?**
   - les vues admin utilisent plusieurs états ;
   - le workflow exact de transition n’est pas totalement documenté.
   - **À clarifier.**

7. **Le stockage des fichiers logo doit-il rester sur Vercel Blob ou être migré vers une autre solution UE ?**
   - architecture mentionne Vercel Blob ou Scaleway ;
   - le code utilise Vercel Blob.
   - **À confirmer selon la politique infra.**

8. **Quelles notifications sont envoyées au candidat après soumission ?**
   - email de confirmation candidat non visible dans les extraits ;
   - seul le lien de fiche et les relances admin sont explicitement présents.
   - **À préciser.**

9. **Les contacts multiples sont-ils autorisés dès l’adhésion initiale ou seulement dans la fiche adhérent ?**
   - le code accepte plusieurs contacts ;
   - le texte de décision est moins explicite.
   - **À valider.**

10. **Le parcours modale doit-il être la version principale, ou seulement une variante UX ?**
    - l’architecture l’impose comme pattern retenu ;
    - il faut confirmer la priorité sur la page pleine.
    - **À confirmer.**

**Sources pour validation :**
- `DECISIONS.md`
- `architecture-addendum.md`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/app/api/cron/reminders/route.ts`
- `src/lib/auth/magic-link.ts`