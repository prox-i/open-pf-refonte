# Cahier fonctionnel reconstitué — open-pf-refonte

## 1. Objet du document

Ce document reconstitue le cahier fonctionnel du projet **open-pf-refonte** à partir des preuves disponibles dans le pack de preuves fonctionnelles, ainsi que des décisions d’architecture et du mockup.

Il décrit :
- les objectifs métier ;
- les typologies d’utilisateurs ;
- le périmètre fonctionnel ;
- les modules fonctionnels ;
- les parcours ;
- les règles métier observées ;
- les objets de données ;
- les états et transitions ;
- les emails et notifications ;
- les intégrations fonctionnelles ;
- les risques, questions ouvertes et points à valider.

**Sources principales :**
- `RequirementsEvidencePack`
- `architecture.md`
- `DECISIONS.md`
- `mockup/open_pf_site_8_5/*.html`
- extraits applicatifs : `src/app/...`, `src/components/...`, `src/lib/...`

---

## 2. Niveau de confiance

**Niveau de confiance global : moyen à élevé.**

### Raisons
- Le périmètre global est bien corroboré par `architecture.md`, `DECISIONS.md` et les pages mockup.
- Plusieurs règles métier sont confirmées par le code applicatif.
- Certains points restent ambigus ou en contradiction partielle entre mockup, architecture et implémentation.

### Points de confiance élevés
- annuaire des adhérents ;
- adhésion en plusieurs étapes ;
- magic link pour compléter la fiche ;
- relances automatiques ;
- back-office de validation ;
- contenus publics institutionnels ;
- actualités et offres d’emploi ;
- gestion d’upload d’images/logos.

### Points de confiance moyens
- liste exacte des champs métier dans certaines fiches ;
- nombre exact d’étapes selon les modules ;
- gestion des compétences/certifications ;
- limites de relance et conditions d’arrêt ;
- périmètre exact des notifications admin.

---

## 3. Vue d’ensemble du projet

Le projet est une **refonte du site OPEN Polynésie française** :
- site vitrine institutionnel ;
- annuaire des adhérents ;
- formulaire d’adhésion ;
- espace sécurisé de complétion de fiche adhérent ;
- back-office mono-administrateur ;
- contenus éditoriaux : actualités, offres d’emploi, documents utiles, contact, mentions légales, confidentialité.

### Objectif métier
L’association OPEN veut :
- valoriser la filière numérique en Polynésie française ;
- représenter les entreprises du secteur ;
- rendre visible les adhérents ;
- fluidifier la collecte d’adhésions ;
- permettre la complétion des fiches par lien sécurisé sans mot de passe ;
- industrialiser les validations et relances.

**Sources :**
- `architecture.md` section 1 ;
- `DECISIONS.md` sections 2, 3, 5, 6 ;
- `src/app/(public)/page.tsx`
- `src/app/(public)/reseau/page.tsx`
- `mockup/open_pf_site_8_5/index.html`

---

## 4. Typologie des utilisateurs

### 4.1 Visiteur public
Peut :
- consulter l’accueil ;
- parcourir le réseau ;
- rechercher des adhérents ;
- consulter une fiche adhérent ;
- lire les actualités ;
- consulter les offres d’emploi ;
- contacter l’association ;
- initier une demande d’adhésion.

**Preuves :**
- `src/app/(public)/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/app/(public)/adhesion/page.tsx`

### 4.2 Candidat à l’adhésion / entreprise demandeuse
Peut :
- remplir un formulaire d’adhésion ;
- sauvegarder sa saisie ;
- soumettre une demande ;
- recevoir ou utiliser un magic link pour compléter sa fiche.

**Preuves :**
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/app/(public)/adhesion/page.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`

### 4.3 Administrateur
Peut :
- se connecter ;
- consulter les demandes ;
- valider / refuser / désactiver ;
- envoyer un magic link ;
- consulter / piloter les relances ;
- gérer les actualités ;
- gérer les offres d’emploi ;
- piloter les paramètres du site.

**Preuves :**
- `src/app/admin/(auth)/login/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/admin/relances/page.tsx`
- `src/app/admin/parametres/page.tsx`
- `src/app/admin/actualites/*`
- `src/app/admin/offres-emploi/*`

---

## 5. Périmètre fonctionnel

### 5.1 Inclus
- site vitrine institutionnel ;
- accueil avec KPI ;
- annuaire des adhérents ;
- recherche et filtres par domaine ;
- fiche adhérent publique ;
- formulaire d’adhésion ;
- mode modale + page dédiée pour l’adhésion ;
- espace adhérent sécurisé via magic link ;
- back-office admin ;
- validation des demandes ;
- relances automatiques ;
- gestion des contenus éditoriaux (actualités, offres d’emploi, paramètres) ;
- uploads de logos et d’images ;
- SEO / données structurées / métadonnées.

### 5.2 Exclu ou non confirmé
- paiement en ligne ;
- multi-rôles admin avancés ;
- workflow de modération complexe ;
- commentaires / interactions sociales ;
- espace membre avec mot de passe côté adhérent ;
- analytics détaillées côté métier.

**Source :**
- `architecture.md` section 1 précise explicitement : « Pas de paiement en ligne ».

---

## 6. Modules fonctionnels détaillés

## 6.1 Site public institutionnel

### Parcours
Le visiteur arrive sur l’accueil, découvre :
- la mission de l’association ;
- les chiffres clés ;
- une vitrine d’adhérents ;
- des actualités ;
- des CTA vers adhésion et annuaire.

### Règles observées
- SEO actif via metadata et JSON-LD ;
- accès direct aux pages principales ;
- navigation principale et footer ;
- quickbar mobile.

### Données
- stats site ;
- membres vedettes ;
- actualités récentes.

**Preuves :**
- `src/app/(public)/page.tsx`
- `src/components/layout/site-header.tsx`
- `src/components/layout/site-footer.tsx`
- `src/components/layout/quickbar.tsx`
- `src/lib/seo.ts`
- `mockup/open_pf_site_8_5/index.html`

---

## 6.2 Annuaire des adhérents

### Parcours
- recherche par nom / mot-clé ;
- filtre par domaine ;
- affichage d’un résultat ou d’une liste ;
- accès à une fiche détaillée.

### Données
- nom ;
- logo ;
- description ;
- domaine principal ;
- domaines d’activité ;
- contact principal ;
- site web ;
- adresse ;
- LinkedIn ;
- année de création ;
- effectif ;
- statut MEDEF.

### Critères d’ergonomie
- carte lisible ;
- filtres cliquables ;
- état vide explicite ;
- liens partageables.

**Preuves :**
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/components/annuaire/member-search.tsx`
- `src/components/annuaire/member-filters.tsx`
- `src/components/annuaire/member-grid.tsx`
- `src/components/annuaire/member-card.tsx`
- `src/components/annuaire/member-profile-hero.tsx`
- `src/components/annuaire/member-contact-card.tsx`
- `src/components/annuaire/member-presentation-card.tsx`
- `mockup/open_pf_site_8_5/adherents.html`
- `mockup/open_pf_site_8_5/fiche-onati.html`

---

## 6.3 Formulaire d’adhésion

### Parcours
Le candidat :
1. saisit les informations de l’entreprise ;
2. ajoute des contacts ;
3. choisit les domaines d’activité ;
4. sélectionne éventuellement des certifications ;
5. relit un récapitulatif ;
6. accepte le consentement RGPD ;
7. soumet sa demande.

### Réserve de cohérence
Les décisions documents disent que le formulaire est en **3 étapes** :
1. Informations entreprise ;
2. Domaines d’activité ;
3. Coordonnées.

Mais le code UI actuel montre un flux en **5 étapes** :
- Entreprise ;
- Contacts ;
- Activités ;
- Certifications ;
- Récapitulatif.

**Cela constitue un point de divergence à valider.**

### Données
- raison sociale ;
- statut juridique ;
- numéro TAHITI ;
- site web ;
- année de création ;
- effectif ;
- logo ;
- description ;
- adhésion MEDEF ;
- contacts ;
- domaines ;
- certifications ;
- consentement RGPD.

**Preuves :**
- `DECISIONS.md` section 2 ;
- `architecture-addendum.md` section “Formulaire d’adhésion : 3 étapes” ;
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`
- `mockup/open_pf_site_8_5/adhesion.html`

---

## 6.4 Espace adhérent sécurisé via magic link

### Parcours
- un membre reçoit un lien unique ;
- il ouvre `/fiche/[token]` ;
- il complète sa fiche publique ;
- la saisie peut être enregistrée en brouillon ;
- la soumission finalise la fiche pour validation.

### Règles observées
- pas de mot de passe côté adhérent ;
- token signé + hashé ;
- durée de vie annoncée : 30 jours ;
- token vérifié par HMAC ;
- le lien est distinct de la connexion admin.

### Données
- description ;
- site web ;
- LinkedIn ;
- adresse ;
- année de création ;
- effectif ;
- logo ;
- domaines d’activité ;
- certifications ;
- label autre certification.

**Preuves :**
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/lib/auth/magic-link.ts`
- `src/lib/email/templates/magic-link.tsx`
- `DECISIONS.md` section 6.1
- `mockup/open_pf_site_8_5/espace-adherent.html`

---

## 6.5 Back-office admin

### Parcours
L’admin se connecte puis peut :
- voir un dashboard ;
- traiter les demandes ;
- gérer les adhérents ;
- consulter les relances ;
- gérer les actualités ;
- gérer les offres d’emploi ;
- modifier les paramètres institutionnels.

### Données affichées
- demandes en attente ;
- total adhérents ;
- adhérents actifs/inactifs ;
- relances récentes ;
- contenus récents.

**Preuves :**
- `src/app/admin/page.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/relances/page.tsx`
- `src/app/admin/actualites/page.tsx`
- `src/app/admin/offres-emploi/page.tsx`
- `src/app/admin/parametres/page.tsx`
- `src/components/admin/admin-sidebar.tsx`

---

## 6.6 Actualités

### Parcours
- le public consulte la liste paginée ;
- ouvre un article ;
- l’admin crée / édite / publie un article.

### Données
- titre ;
- extrait ;
- contenu ;
- auteur ;
- image ;
- méta-description ;
- statut ;
- date de publication.

**Preuves :**
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/app/admin/actualites/page.tsx`
- `src/app/admin/actualites/new/page.tsx`
- `src/app/admin/actualites/[id]/page.tsx`
- `src/components/admin/news-form.tsx`
- `src/app/api/upload/news-image/route.ts`
- `mockup/open_pf_site_8_5/actualites.html`

---

## 6.7 Offres d’emploi

### Parcours
- le public consulte les offres publiées ;
- ouvre le détail ;
- suit un lien de candidature si fourni ;
- l’admin crée / édite les offres.

### Données
- intitulé ;
- description ;
- localisation ;
- contrat ;
- rémunération ;
- URL/email de candidature ;
- statut ;
- date de publication.

**Preuves :**
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/app/admin/offres-emploi/page.tsx`
- `src/app/admin/offres-emploi/new/page.tsx`
- `src/app/admin/offres-emploi/[id]/page.tsx`
- `src/components/admin/job-form.tsx`
- `mockup/open_pf_site_8_5/offres-emploi.html`

---

## 6.8 Contact

### Parcours
- formulaire de contact ;
- soumission avec contrôle anti-bot (honeypot) ;
- confirmation de succès.

### Données
- nom ;
- email ;
- sujet ;
- message ;
- company honeypot.

**Preuves :**
- `src/app/(public)/contact/page.tsx`
- `src/components/public/contact-form.tsx`
- `src/lib/validations/contact`
- `src/lib/email/templates/contact.tsx`
- `mockup/open_pf_site_8_5/contact.html`

---

## 6.9 Documents utiles

### Parcours
- page publique en préparation ;
- état vide temporaire.

**Preuves :**
- `src/app/(public)/documents-utiles/page.tsx`
- `mockup/open_pf_site_8_5/index.html` et menu de navigation

---

## 7. Parcours utilisateurs

## 7.1 Visiteur → adhésion
1. arrive sur l’accueil ;
2. clique « Adhérer » ;
3. le parcours s’ouvre en modale ;
4. remplit les champs ;
5. soumet la demande ;
6. son dossier est transmis à l’admin.

**Preuves :**
- `src/components/layout/site-header.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/components/adhesion/adhesion-form.tsx`

## 7.2 Visiteur → annuaire → fiche
1. visite l’annuaire ;
2. recherche ou filtre ;
3. ouvre une fiche ;
4. consulte contact, domaines et présentation.

**Preuves :**
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`

## 7.3 Admin → validation demande
1. se connecte ;
2. ouvre la liste des demandes ;
3. consulte le détail ;
4. approuve ou refuse ;
5. éventuellement désactive un adhérent actif.

**Preuves :**
- `src/app/admin/(auth)/login/page.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`

## 7.4 Admin → envoi magic link
1. consulte une demande ou fiche ;
2. clique « Envoyer le lien fiche » ;
3. le lien permet à l’entreprise de compléter sa fiche.

**Preuves :**
- `src/components/admin/member-actions.tsx`
- `src/lib/actions/admin/members`
- `src/lib/email/templates/magic-link.tsx`

## 7.5 Cron → relances
1. le cron quotidien démarre ;
2. il cherche les membres au statut `submitted` ;
3. il décide d’envoyer une relance ou non ;
4. il journalise l’envoi ;
5. il recommence selon la périodicité.

**Preuves :**
- `src/app/api/cron/reminders/route.ts`
- `src/app/admin/relances/page.tsx`
- `README.md`

---

## 8. Règles métier observées

## 8.1 Formulaire d’adhésion
- les compétences et certifications ne devraient pas figurer dans l’adhésion initiale selon les décisions validées ;
- le mockup actuel les montre toutefois dans le flux ;
- le formulaire demande au moins une entreprise, des contacts et des domaines ;
- un contact principal doit être défini.

**Preuves :**
- `DECISIONS.md` section 2 ;
- `architecture-addendum.md` ;
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/step-contacts.tsx`

## 8.2 Magic link
- token avec UUID + HMAC ;
- token hashé en base ;
- validité 30 jours ;
- vérification anti-falsification.

**Preuves :**
- `src/lib/auth/magic-link.ts`
- `DECISIONS.md` section 6.1

## 8.3 Relances
- J+3 pour la première relance ;
- puis tous les 7 jours ;
- arrêt annoncé à 10 envois dans `DECISIONS.md`.

**Mais**
- le code de cron montré n’implémente pas visiblement la limite des 10 envois ;
- il n’exprime pas non plus l’arrêt manuel.

**Preuves :**
- `DECISIONS.md` section 6.2 ;
- `src/app/api/cron/reminders/route.ts`

## 8.4 Publication de l’annuaire
- une demande devient `submitted` ;
- elle doit être validée par le bureau avant publication ;
- une fois active, la fiche est visible publiquement ;
- l’inactive conserve l’historique.

**Preuves :**
- `DECISIONS.md` section 5 ;
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`

## 8.5 Stats du site
- le nombre d’adhérents doit être calculé automatiquement ;
- les autres chiffres peuvent être saisis manuellement ;
- la légende est éditable.

**Preuves :**
- `DECISIONS.md` section 4 ;
- `architecture-addendum.md`
- `src/app/admin/parametres/page.tsx`
- `src/components/admin/site-stats-form.tsx`

---

## 9. Données et objets métier

## 9.1 Entités principales

### Member / Adhérent
Champs observés :
- id ;
- slug ;
- name ;
- logoUrl ;
- description ;
- websiteUrl ;
- address ;
- linkedinUrl ;
- tahitiNumber ;
- yearFounded ;
- employeeCount ;
- isMedefMember ;
- status ;
- submittedAt ;
- reviewedAt ;
- createdAt ;
- updatedAt.

**Preuves :**
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `drizzle/0001_keen_the_executioner.sql`
- `scripts/import-openpf/lib/types.ts`

### Contact membre
- name ;
- role ;
- email ;
- phone ;
- isPrimary.

**Preuves :**
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/components/adhesion/step-contacts.tsx`

### Domaines d’activité
- id ;
- label ;
- sort_order.

**Preuves :**
- `drizzle/meta/0001_snapshot.json`
- `src/components/adhesion/step-activites.tsx`
- `src/components/annuaire/member-filters.tsx`

### Certifications
- utilisées dans la fiche adhérent et potentiellement l’adhésion ;
- liste fermée via référentiels.

**Preuves :**
- `src/components/adhesion/step-certifications.tsx`
- `src/components/fiche/profile-form.tsx`
- `architecture-addendum.md`

### Admin user
- email ;
- password_hash ;
- name ;
- is_active ;
- last_login_at.

**Preuves :**
- `src/lib/auth/config.ts`
- `src/auth.ts`
- `drizzle/meta/0001_snapshot.json`

### News / actualités
- title ;
- excerpt ;
- content ;
- authorName ;
- imageUrl ;
- metaDescription ;
- status ;
- publishedAt.

**Preuves :**
- `src/components/admin/news-form.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`

### JobOffer / offres d’emploi
- title ;
- description ;
- location ;
- contractType ;
- salary ;
- applicationUrl ;
- applicationEmail ;
- status ;
- publishedAt.

**Preuves :**
- `src/components/admin/job-form.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`

### ReminderLog / journal de relances
- memberId ;
- type ;
- emailTo ;
- sentAt.

**Preuves :**
- `src/app/api/cron/reminders/route.ts`
- `src/app/admin/relances/page.tsx`

### Site stats
- employeeCount ;
- legend.

**Preuves :**
- `src/app/admin/parametres/page.tsx`
- `src/components/admin/site-stats-form.tsx`
- `architecture-addendum.md`

---

## 10. États / statuts / transitions

## 10.1 Adhérent
Cycle métier attendu :
- `draft`
- `submitted`
- `active`
- `inactive`

**Transitions observées :**
- brouillon → soumis ;
- soumis → actif via validation ;
- soumis → refus possible ;
- actif → inactif via désactivation.

**Preuves :**
- `DECISIONS.md` section 5 ;
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`

## 10.2 Actualités
- `draft`
- `published`

**Preuves :**
- `src/components/admin/news-form.tsx`
- `src/app/admin/actualites/page.tsx`

## 10.3 Offres d’emploi
- `draft`
- `published`
- `closed`

**Preuves :**
- `src/components/admin/job-form.tsx`
- `src/app/admin/offres-emploi/page.tsx`

## 10.4 Relances
Types observés :
- `submission_reminder`
- `validation_pending`
- `renewal_reminder`
- `profile_incomplete`

**Preuves :**
- `src/app/admin/relances/page.tsx`
- `src/app/api/cron/reminders/route.ts`

## 10.5 Magic link
- actif pendant une période limitée ;
- peut devenir invalide par expiration ou usage.

**Preuves :**
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`

---

## 11. Documents / emails / notifications

## 11.1 Email de contact
- objet : nouveau message contact ;
- contenu : nom, email, sujet, message.

**Preuves :**
- `src/lib/email/templates/contact.tsx`
- `src/components/public/contact-form.tsx`

## 11.2 Email magic link
- usage : compléter la fiche adhérent ;
- contient un bouton vers le lien sécurisé ;
- délai de validité indiqué ;
- expéditeur mentionné dans le template : contact@open.pf.

**Preuves :**
- `src/lib/email/templates/magic-link.tsx`
- `src/components/admin/member-actions.tsx`

## 11.3 Email de relance admin
- usage : signaler une demande en attente ;
- lien vers l’admin ;
- date de dépôt visible.

**Preuves :**
- `src/lib/email/templates/reminder.tsx`
- `src/app/api/cron/reminders/route.ts`

## 11.4 Notifications / retours UI
- formulaire contact : état de succès ;
- adhésion : progression et validation d’étapes ;
- fiche adhérent : autosave, erreurs, succès ;
- admin : messages d’action sur approbation/refus/envoi.

**Preuves :**
- `src/components/public/contact-form.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/components/admin/member-actions.tsx`

---

## 12. Intégrations fonctionnelles

## 12.1 Auth.js v5
- connexion admin par credentials ;
- session JWT ;
- redirection vers `/admin/login`.

**Preuves :**
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/app/admin/(auth)/login/page.tsx`

## 12.2 Base de données PostgreSQL + Drizzle
- lecture/écriture des entités métier ;
- migrations versionnées.

**Preuves :**
- `package.json`
- `drizzle/*`
- `README.md`

## 12.3 Vercel Blob
- stockage des logos adhérents ;
- stockage des images d’actualités.

**Preuves :**
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`

## 12.4 Sharp
- redimensionnement et conversion des images.

**Preuves :**
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`

## 12.5 Brevo
- service transactionnel annoncé pour les emails.

**Preuves :**
- `architecture.md`
- `DECISIONS.md`
- `src/lib/email/templates/*`

## 12.6 Cron scheduler
- route cron quotidienne pour relances.

**Preuves :**
- `src/app/api/cron/reminders/route.ts`
- `README.md`

---

## 13. Risques fonctionnels

## 13.1 Divergence entre documents de référence et UI réelle
Le nombre d’étapes du formulaire d’adhésion diffère :
- décisions validées : 3 étapes ;
- code UI : 5 étapes.

**Risque :** incohérence métier et rework UX.  
**Preuves :**
- `DECISIONS.md`
- `architecture-addendum.md`
- `src/components/adhesion/adhesion-form.tsx`

## 13.2 Relances automatiques incomplètes
La règle “arrêt après 10 envois” est documentée, mais non visible dans la route cron observée.

**Risque :** sur-relance des administrateurs et non-conformité métier.  
**Preuves :**
- `DECISIONS.md` section 6.2
- `src/app/api/cron/reminders/route.ts`

## 13.3 Champs métier encore à arbitrer
Les référentiels fermés ne sont pas tous fournis :
- domaines d’activité ;
- compétences ;
- certifications/agréments ;
- statuts juridiques.

**Risque :** saisie non homogène et mauvaise qualité d’annuaire.  
**Preuves :**
- `architecture-addendum.md` blocages restants

## 13.4 Contenus institutionnels incomplets
Sont encore à fournir :
- membres du bureau ;
- frise chronologique ;
- partenaires ;
- manifeste.

**Risque :** pages institutionnelles incomplètes ou génériques.  
**Preuves :**
- `architecture-addendum.md`

## 13.5 Notifications email et DNS
Les décisions mentionnent expéditeur, reply-to, DNS SPF/DKIM/DMARC ; ces éléments ne sont pas confirmés dans le code montré.

**Risque :** délivrabilité insuffisante.  
**Preuves :**
- `DECISIONS.md` section 6.4
- `architecture-addendum.md`

---

## 14. Questions ouvertes

1. Le formulaire d’adhésion doit-il rester en **3 étapes** comme les décisions validées, ou le flux actuel en **5 étapes** est-il désormais la référence ?
2. Les **compétences** et **certifications** doivent-elles être totalement exclues de l’adhésion initiale et réservées à la fiche magic link ?
3. Quelle est la **liste fermée officielle des domaines d’activité** ?
4. Quelle est la **liste fermée officielle des compétences** ?
5. Quelle est la **liste fermée officielle des certifications / agréments** ?
6. Quelle est la **liste validée des statuts juridiques** pour le formulaire d’adhésion ?
7. La limite des relances est-elle bien **10 envois**, et faut-il l’arrêter côté cron ou côté back-office ?
8. Faut-il prévoir l’**arrêt manuel** des relances depuis l’admin ?
9. Le magic link doit-il rester à **30 jours** ou cette durée est-elle à confirmer ?
10. Les emails transactionnels doivent-ils partir de `noreply@open.pf` ou d’un autre expéditeur validé ?
11. Le `reply-to` doit-il être `contact@open.pf` systématiquement ?
12. Les paramètres publics “bureau / frise / partenaires” ont-ils déjà les contenus finaux ?

---

## 15. Points à valider

### 15.1 Cohérence du formulaire d’adhésion
Valider la version fonctionnelle officielle :
- 3 étapes ou 5 étapes ;
- présence ou non des certifications dans l’adhésion ;
- présence ou non d’un écran récapitulatif obligatoire.

### 15.2 Référentiels fermés
Valider et livrer :
- domaines d’activité ;
- compétences ;
- certifications ;
- statuts juridiques.

### 15.3 Relances
Valider :
- J+3 puis +7 jours ;
- plafond d’envoi ;
- arrêt manuel ;
- statut de journalisation.

### 15.4 Emails
Valider :
- expéditeur final ;
- reply-to ;
- templates finaux ;
- configuration DNS.

### 15.5 Back-office
Valider :
- compte unique ou comptes multiples ;
- éventuelle 2FA ;
- audit log ;
- droits exacts des membres du bureau.

### 15.6 Contenus institutionnels
Valider et fournir :
- bureau ;
- frise historique ;
- partenaires ;
- texte d’accueil / manifeste.

### 15.7 Annuaire
Valider :
- affichage des compétences/certifications dans la fiche publique ;
- règles de visibilité des fiches actives/inactives ;
- traitement des membres MEDEF.

**Sources utiles :**
- `DECISIONS.md`
- `architecture-addendum.md`
- `mockup/open_pf_site_8_5/admin-parametres.html`
- `mockup/open_pf_site_8_5/admin-demande-detail.html`
- `src/app/admin/parametres/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`