# WORKFLOW_espace adhérent et fiche sécurisée — Cahier de workflow fonctionnel et technique reconstitué

## 1. Objet

Reconstituer le workflow de gestion d’adhésion OPEN PF côté public et côté “espace adhérent”, avec :

- un parcours d’adhésion en 3 étapes ;
- une génération et un usage de magic link pour compléter la fiche sécurisée ;
- une saisie / autosauvegarde de la fiche publique de l’adhérent ;
- une validation par le bureau avant publication dans l’annuaire ;
- des relances automatiques en cas de fiche incomplète ou de demande en attente ;
- la gestion du logo adhérent via upload sécurisé.

Sources principales :  
`src/app/(public)/adhesion/page.tsx`, `src/components/adhesion/*`, `src/app/(public)/fiche/[token]/page.tsx`, `src/components/fiche/profile-form.tsx`, `src/app/api/upload/logo/route.ts`, `src/lib/auth/magic-link.ts`, `src/app/admin/*`, `src/app/api/cron/reminders/route.ts`.

---

## 2. Synthèse fonctionnelle

Le site OPEN PF permet à une entreprise :

1. de soumettre une demande d’adhésion via un formulaire public ;
2. d’être examinée par le bureau ;
3. de recevoir un lien sécurisé permettant de compléter sa fiche adhérent ;
4. de remplir les informations qui seront publiées dans l’annuaire ;
5. de téléverser un logo ;
6. de voir sa fiche validée puis visible publiquement.

Le système prévoit aussi :

- des statuts de cycle de vie de la demande / fiche ;
- une autosauvegarde côté espace adhérent ;
- un upload d’image limité et transformé ;
- des relances automatiques aux administrateurs si une fiche reste en attente.

---

## 3. Acteurs concernés

### 3.1 Visiteur / futur adhérent
- remplit la demande d’adhésion ;
- consulte éventuellement le formulaire en page dédiée ;
- ne doit pas avoir accès à l’espace sécurisé sans token.

### 3.2 Adhérent / contact de l’entreprise
- reçoit un magic link ;
- complète sa fiche ;
- téléverse le logo ;
- sauvegarde les brouillons ;
- soumet la fiche.

### 3.3 Bureau / administrateur
- se connecte à l’admin ;
- approuve / refuse une demande ;
- envoie ou renvoie un magic link ;
- active / désactive un membre ;
- consulte le journal des relances ;
- valide les fiches avant publication.

### 3.4 Système automatisé
- envoie les relances planifiées ;
- journalise les envois ;
- protège l’accès au token ;
- stocke les fichiers dans Vercel Blob.

---

## 4. Points d’entrée

### 4.1 Public
- `/adhesion` : formulaire d’adhésion
- `/fiche/[token]` : espace adhérent sécurisé
- `/adherents` : annuaire public
- `/adherents/[slug]` : fiche publique
- `/contact` : contact institutionnel

### 4.2 Administration
- `/admin/login`
- `/admin`
- `/admin/demandes`
- `/admin/demandes/[id]`
- `/admin/adherents`
- `/admin/adherents/[id]`
- `/admin/fiches`
- `/admin/relances`
- `/admin/parametres`

### 4.3 API
- `POST /api/upload/logo`
- `POST /api/upload/news-image` — même mécanisme de téléversement, hors périmètre métier principal
- `GET /api/cron/reminders`
- `POST /api/auth/[...nextauth]`

---

## 5. Composants source

### 5.1 Côté parcours d’adhésion
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/components/adhesion/adhesion-progress-sidebar.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`
- `src/components/adhesion/stepper.tsx`

### 5.2 Côté espace adhérent
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`

### 5.3 Sécurité / token
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/lib/actions/member-profile`
- `src/lib/actions/admin/members`

### 5.4 Administration / validation
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/admin/fiches/page.tsx`
- `src/components/admin/member-actions.tsx`

### 5.5 Relances
- `src/app/api/cron/reminders/route.ts`
- `src/app/admin/relances/page.tsx`
- `src/lib/email/templates/reminder.tsx`

---

## 6. Données principales

### 6.1 Demande / fiche membre
D’après les pages admin et les formulaires :

- `name` : raison sociale
- `legalStatus` / `legal status` : statut juridique
- `tahitiNumber` : numéro TAHITI
- `websiteUrl`
- `description`
- `isMedefMember`
- `yearFounded`
- `employeeCount`
- `logoUrl`
- `linkedinUrl`
- `address`
- `activityDomains`
- `certifications`
- `certificationOtherLabel`
- `contacts[]`
- `rgpdConsent`

### 6.2 Contacts
Un membre peut avoir un ou plusieurs contacts :

- `name`
- `role`
- `email`
- `phone`
- `isPrimary`

### 6.3 Cycle de vie du membre
Le code montre les statuts :

- `draft`
- `submitted`
- `active`
- `inactive`

### 6.4 Token magique
`src/lib/auth/magic-link.ts` montre :

- génération d’un token raw de type `uuid.hmac`
- hash SHA-256 stocké en base
- TTL de 30 jours

### 6.5 Téléversement logo
`src/app/api/upload/logo/route.ts` traite :

- fichier `File`
- types autorisés : JPEG, PNG, WebP, SVG
- taille max : 2 Mo
- conversion en WebP sauf SVG
- stockage public sur Vercel Blob

### 6.6 Relances
`src/app/api/cron/reminders/route.ts` utilise :

- `FIRST_REMINDER_DAYS = 3`
- `REPEAT_REMINDER_DAYS = 7`
- table `reminderLogs`
- e-mail admin de notification
- lien admin vers la demande concernée

---

## 7. Étapes nominales

### 7.1 Soumission de la demande d’adhésion
1. L’utilisateur ouvre `/adhesion`.
2. Le formulaire affiche un parcours en plusieurs étapes.
3. Il saisit les informations entreprise.
4. Il saisit les contacts.
5. Il choisit les domaines d’activité.
6. Il ajoute éventuellement des certifications.
7. Il consulte le récapitulatif.
8. Il accepte le consentement RGPD.
9. Il soumet le formulaire.

Preuves :
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/step-*.tsx`

### 7.2 Validation côté bureau
1. L’admin consulte `/admin/demandes`.
2. Il ouvre `/admin/demandes/[id]`.
3. Il examine les données.
4. Il peut approuver ou refuser.
5. Il peut aussi envoyer le lien de fiche.

Preuves :
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`

### 7.3 Complétion de fiche sécurisée
1. L’adhérent reçoit un lien sécurisé.
2. Il ouvre `/fiche/[token]`.
3. Le serveur récupère les données initiales par token.
4. Le formulaire s’affiche avec les champs éditables.
5. Les modifications sont autosauvegardées.
6. L’utilisateur peut téléverser le logo.
7. Il soumet la fiche.
8. La fiche passe au statut soumis / en attente de validation.

Preuves :
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/app/api/upload/logo/route.ts`
- `src/lib/actions/member-profile`

### 7.4 Publication
1. Le bureau valide la fiche.
2. La fiche devient active.
3. Elle apparaît dans l’annuaire public.

Preuves :
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/admin/fiches/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`

### 7.5 Relances automatiques
1. Le cron s’exécute.
2. Il sélectionne les membres au statut `submitted`.
3. Il calcule l’éligibilité selon la date de soumission ou la dernière relance.
4. Il envoie un mail au bureau.
5. Il journalise l’envoi dans `reminderLogs`.

Preuves :
- `src/app/api/cron/reminders/route.ts`
- `src/lib/email/templates/reminder.tsx`
- `src/app/admin/relances/page.tsx`

---

## 8. Variantes

### 8.1 Ouverture directe de `/adhesion`
Le parcours est disponible en page complète, avec SEO et partage.

### 8.2 Ouverture de la modale d’adhésion
Le header déclenche une modale d’adhésion sans quitter la page courante.

Preuves :
- `src/components/layout/site-header.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/app/(public)/adhesion/page.tsx`

### 8.3 Profil incomplet
Le profil peut être enregistré en brouillon et autosauvegardé avant soumission.

Preuves :
- `src/components/fiche/profile-form.tsx`

### 8.4 Logo absent
Si aucun logo n’est fourni, l’interface doit rester fonctionnelle avec un fallback visuel.

Preuves :
- `src/components/public/member-logo.tsx`
- `src/components/annuaire/member-contact-card.tsx`

### 8.5 Relance récurrente
Après la première relance, les envois se répètent tous les 7 jours.

Preuves :
- `src/app/api/cron/reminders/route.ts`

---

## 9. Cas d’erreur

### 9.1 Token invalide ou absent
- retour `401`
- message : `Token invalide`

Preuve :
- `src/app/api/upload/logo/route.ts`

### 9.2 Token expiré ou déjà consommé
- retour `401`
- message : `Token expiré ou invalide`

Preuve :
- `src/app/api/upload/logo/route.ts`

### 9.3 Fichier manquant
- retour `400`
- message : `Aucun fichier reçu`

### 9.4 Type MIME non autorisé
- retour `400`
- message de format non supporté

### 9.5 Fichier trop volumineux
- retour `400`
- message spécifique selon la route

### 9.6 Echec d’envoi de relance
- log console
- compteur `skipped` incrémenté

Preuve :
- `src/app/api/cron/reminders/route.ts`

### 9.7 Erreur de validation formulaire
- affichage d’un message serveur ou champ par champ

Preuves :
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/components/public/contact-form.tsx`

---

## 10. Documents / emails / effets de bord

### 10.1 E-mail de magic link
Template dédié :
- `src/lib/email/templates/magic-link.tsx`

Contenu :
- invitation à compléter la fiche ;
- lien sécurisé ;
- durée de validité annoncée : 30 jours.

### 10.2 E-mail de relance
Template dédié :
- `src/lib/email/templates/reminder.tsx`

Contenu :
- demande d’adhésion en attente ;
- lien vers l’admin ;
- rappel de la date de dépôt.

### 10.3 Effets de bord lors de la soumission
- suppression du draft local côté formulaire d’adhésion ;
- journalisation potentielle côté backend ;
- passage de statut ;
- déclenchement possible d’une relance ultérieure si la fiche reste en attente.

### 10.4 Effets de bord lors de l’upload logo
- transformation image ;
- stockage sur Blob public ;
- mise à jour du champ `logoUrl`.

### 10.5 Effets de bord lors de la relance cron
- écriture en `reminderLogs`
- préparation du tableau de suivi admin

---

## 11. Règles métier

### 11.1 Adhésion en 3 étapes
D’après `DECISIONS.md`, `architecture-addendum.md` et les composants :

1. Informations entreprise
2. Contacts
3. Domaines d’activité
4. Certifications : présentes dans l’implémentation, mais décrites comme optionnelles / secondaires
5. Récapitulatif / consentement

Point à noter : le code actuel expose 5 étapes dans l’UI, alors que la décision projet mentionne 3 étapes pour l’adhésion initiale. Cela mérite validation.

### 11.2 Statut juridique obligatoire
Le formulaire d’adhésion impose un statut juridique.

### 11.3 Un contact principal obligatoire
Dans le formulaire d’adhésion, au moins un contact principal doit être désigné.

### 11.4 N° TAHITI optionnel ou obligatoire selon contexte
Les extraits montrent le champ dans plusieurs vues, mais le caractère obligatoire n’est pas uniformément visible.

### 11.5 Magic link
- token signé par HMAC ;
- hashé avant stockage ;
- TTL 30 jours ;
- renouvellement possible via BO.

### 11.6 Publication soumise à validation
La fiche n’est pas visible publiquement tant qu’elle n’est pas validée.

### 11.7 Relances
- première relance à J+3 ;
- ensuite tous les 7 jours ;
- le code cron actuel ne montre pas l’arrêt après N envois, bien que la documentation projet l’évoque.

### 11.8 Upload logo
- types acceptés : JPEG, PNG, WebP, SVG ;
- limite : 2 Mo ;
- conversion en WebP pour les raster images ;
- stockage public.

### 11.9 Annuaire public
Les fiches visibles correspondent aux membres actifs.

---

## 12. Sécurité / permissions

### 12.1 Accès à l’espace adhérent
- dépend d’un token valide transmis à la route `/fiche/[token]`
- la route upload logo vérifie aussi ce token via header `x-magic-token`
- les tokens expirés / utilisés sont refusés

### 12.2 Administrateur
- authentification via NextAuth credentials
- session JWT
- accès réservé aux comptes actifs

Preuves :
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/app/admin/(auth)/login/page.tsx`

### 12.3 Cron protégé
- `GET /api/cron/reminders` nécessite `Authorization: Bearer <CRON_SECRET>`

Preuve :
- `src/app/api/cron/reminders/route.ts`

### 12.4 Upload logo
- autorisé uniquement avec token magique valide ;
- pas d’accès anonyme.

### 12.5 Sécurité des fichiers
- pas d’upload libre sans contrôle ;
- transformation d’image pour réduire les surfaces d’attaque ;
- mais le support SVG public mérite attention spécifique.

### 12.6 Journalisation
- les relances sont tracées ;
- un audit log existe dans le schéma projet, mais sa couverture fonctionnelle n’est pas visible ici.

---

## 13. Recette

### 13.1 Parcours adhésion
- ouvrir `/adhesion`
- vérifier l’affichage des étapes
- saisir une demande complète
- vérifier qu’un contact principal est requis
- soumettre et contrôler le comportement de succès

### 13.2 Validation admin
- se connecter via `/admin/login`
- ouvrir une demande
- approuver / refuser
- vérifier retour à la liste

### 13.3 Magic link
- générer / envoyer un lien
- ouvrir `/fiche/[token]`
- vérifier l’accès
- vérifier qu’un token falsifié est rejeté

### 13.4 Autosave
- modifier un champ
- attendre le debounce
- constater l’enregistrement de brouillon

### 13.5 Upload logo
- envoyer un PNG/JPEG/WebP/SVG de moins de 2 Mo
- vérifier la réponse JSON contenant l’URL

### 13.6 Relances
- exécuter le cron avec le bon secret
- vérifier la production du nombre `sent/skipped`
- vérifier la création en base dans `reminderLogs`

### 13.7 Publication
- valider un membre
- vérifier sa présence dans `/adherents` et `/adherents/[slug]`

---

## 14. Risques

### 14.1 Divergence entre décision métier et implémentation
La documentation projet parle d’adhésion en 3 étapes, tandis que le code montre un parcours enrichi avec certifications et récapitulatif. Risque de dette fonctionnelle ou de confusion UX.

### 14.2 Arrêt des relances non implémenté
La règle “arrêt après N envois” est documentée côté architecture, mais le cron visible ne l’applique pas.

### 14.3 SVG en upload public
Autoriser le SVG est pratique pour les logos, mais augmente le besoin de contrôle de sécurité et de politique de sanitisation.

### 14.4 Dépendance au token magique
Si le token est perdu ou mal géré, l’adhérent peut bloquer sa complétion.

### 14.5 Cohérence des statuts
Plusieurs écrans supposent des statuts précis ; tout écart de schéma ou d’action backend peut créer des incohérences d’affichage.

### 14.6 Données sensibles / RGPD
Le formulaire collecte contact, téléphone, e-mail, logo, statut, activité. Il faut s’assurer de la base légale, du consentement et de la durée de conservation.

### 14.7 Concurrence / double soumission
Aucune protection explicite visible ici contre les doubles envois ou les ouvertures multiples du formulaire.

---

## 15. Questions ouvertes / Points à valider

1. **Le parcours d’adhésion doit-il rester à 3 étapes, ou le modèle actuel en 5 étapes est-il validé ?**  
   Sources : `DECISIONS.md`, `architecture-addendum.md`, `src/components/adhesion/adhesion-form.tsx`.

2. **Les certifications doivent-elles être dans l’adhésion initiale ou uniquement dans la fiche sécurisée ?**  
   Les arbitrages indiquent que les certifications relèvent de la fiche adhérent, mais l’UI d’adhésion les affiche déjà.

3. **La règle d’arrêt des relances après N envois doit-elle être implémentée à 10, comme indiqué dans la décision ?**  
   `src/app/api/cron/reminders/route.ts` ne montre pas cette limite.

4. **Le N° TAHITI est-il obligatoire à l’adhésion ?**  
   L’interface le suggère par endroits, mais les preuves ne sont pas uniformes.

5. **Le logo SVG est-il définitivement autorisé en production ?**  
   Si oui, faut-il imposer une sanitisation ou restreindre certains contenus SVG ?

6. **Le token magique est-il unique par demande ou renouvelable avec invalidation de l’ancien ?**  
   Le code montre un token hashé avec TTL, mais le cycle de renouvellement du BO n’est pas visible ici.

7. **Quel est le statut exact de transition après soumission de la fiche : `submitted` ou autre ?**  
   Les vues admin utilisent `submitted`, mais l’action serveur n’est pas visible dans les extraits.

8. **Le workflow de relance doit-il aussi couvrir les profils “draft” ou uniquement les “submitted” ?**  
   Le cron visible cible seulement `submitted`.

9. **Quelle politique de conservation des données est attendue pour les fiches refusées / inactives ?**

10. **Le lien de fiche doit-il être utilisable depuis un seul appareil / une seule session, ou partageable ?**  
    Les preuves montrent une logique de token, mais pas la politique de partage.

11. **Le public doit-il voir une fiche partiellement remplie avant validation, ou uniquement après passage en `active` ?**

12. **L’audit log métier est-il déjà branché sur les actions de validation/désactivation ?**  
    Le schéma comporte `audit_log`, mais aucun flux visible dans les extraits ne le renseigne.

Sources additionnelles à relire pour arbitrage :
- `DECISIONS.md`
- `architecture-addendum.md`
- `src/lib/actions/member-profile`
- `src/lib/actions/admin/members`
- `src/lib/db/schema`
- `src/lib/email/client`