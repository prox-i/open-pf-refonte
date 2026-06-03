# WORKFLOW_back-office de modération — Cahier de workflow fonctionnel et technique reconstitué

## 1. Objet

Le workflow couvre le **back-office de modération** des demandes d’adhésion et des fiches adhérents du projet OPEN PF, avec publication contrôlée dans l’annuaire public.

Périmètre métier reconstitué à partir des preuves :
- consultation de la liste des demandes en attente ;
- examen détaillé d’une demande ;
- validation / refus d’une demande ;
- consultation des adhérents actifs / inactifs ;
- consultation d’une fiche adhérent ;
- envoi d’un lien sécurisé de complétion de fiche ;
- désactivation d’un adhérent ;
- suivi des relances automatiques ;
- gestion de quelques paramètres institutionnels liés au site.

Sources principales :
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`
- `src/app/admin/relances/page.tsx`
- `src/app/admin/parametres/page.tsx`
- `src/lib/auth/config.ts`
- `src/auth.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/lib/email/templates/reminder.tsx`
- `src/lib/email/templates/magic-link.tsx`
- `DECISIONS.md`
- `architecture.md`
- `architecture-addendum.md`

---

## 2. Synthèse fonctionnelle

Le back-office est pensé comme un **centre de modération mono-administrateur / multi-membres du bureau** pour OPEN PF.

Il permet au bureau :
- de traiter les **demandes d’adhésion** déposées par les entreprises ;
- d’approuver ou de refuser une demande ;
- de faire passer une fiche du statut **submitted** vers **active** ;
- de maintenir un annuaire public fiable ;
- d’envoyer un **magic link** pour compléter ou mettre à jour une fiche adhérent ;
- de suivre les fiches incomplètes et les relances ;
- de piloter certains contenus institutionnels.

La règle centrale est la suivante :
- **aucune fiche ne doit être rendue publique sans validation du bureau** ;
- le statut de publication est distinct de l’état de saisie.

Les preuves montrent aussi une logique de cycle de vie :
- `draft` → `submitted` → `active` → `inactive`

Sources :
- `DECISIONS.md` section 5
- `architecture-addendum.md` section « Modération »
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`

---

## 3. Acteurs concernés

### 3.1 Administrateur du bureau
Rôle principal du workflow :
- se connecter au back-office ;
- consulter les demandes ;
- valider / refuser ;
- désactiver un adhérent ;
- envoyer le lien de complétion ;
- consulter les relances ;
- modifier certains paramètres.

Preuves :
- `src/app/admin/(auth)/login/page.tsx`
- `src/components/admin/login-form.tsx`
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/components/admin/member-actions.tsx`

### 3.2 Adhérent / entreprise membre
Acteur métier indirect :
- dépose une demande ;
- reçoit potentiellement un lien sécurisé ;
- complète sa fiche dans l’espace adhérent ;
- voit sa fiche apparaître après validation.

Preuves :
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/*`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/lib/auth/magic-link.ts`

### 3.3 Système d’automatisation
Acteur technique :
- déclenche les relances automatiques ;
- trace les envois ;
- alimente le journal des relances.

Preuves :
- `src/app/api/cron/reminders/route.ts`
- `src/app/admin/relances/page.tsx`
- `src/lib/email/templates/reminder.tsx`

### 3.4 Référentiels métier / contenus de paramétrage
Acteur de configuration :
- bureau ;
- frise chronologique ;
- chiffres clés ;
- contenus institutionnels.

Preuves :
- `src/app/admin/parametres/page.tsx`
- `src/components/admin/site-stats-form.tsx`
- `architecture-addendum.md`

---

## 4. Points d’entrée

### 4.1 Connexion admin
- `/admin/login`

Preuve :
- `src/app/admin/(auth)/login/page.tsx`

### 4.2 Tableau de bord admin
- `/admin`

Preuve :
- `src/app/admin/page.tsx`

### 4.3 Liste des demandes d’adhésion
- `/admin/demandes`

Preuve :
- `src/app/admin/demandes/page.tsx`

### 4.4 Détail d’une demande
- `/admin/demandes/[id]`

Preuve :
- `src/app/admin/demandes/[id]/page.tsx`

### 4.5 Liste des adhérents
- `/admin/adherents`

Preuve :
- `src/app/admin/adherents/page.tsx`

### 4.6 Détail d’un adhérent
- `/admin/adherents/[id]`

Preuve :
- `src/app/admin/adherents/[id]/page.tsx`

### 4.7 Fiches à valider
- `/admin/fiches`

Preuve :
- `src/app/admin/fiches/page.tsx`

### 4.8 Relances
- `/admin/relances`

Preuve :
- `src/app/admin/relances/page.tsx`

### 4.9 Paramètres
- `/admin/parametres`

Preuve :
- `src/app/admin/parametres/page.tsx`

### 4.10 Cron technique des relances
- `/api/cron/reminders`

Preuve :
- `src/app/api/cron/reminders/route.ts`

### 4.11 Uploads associés au parcours
- `/api/upload/logo`
- `/api/upload/news-image`

Même si ce n’est pas strictement le cœur du back-office de modération, cela impacte les fiches et contenus.

Preuves :
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`

---

## 5. Composants source

### Back-office admin
- `src/app/admin/page.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/admin/fiches/page.tsx`
- `src/app/admin/relances/page.tsx`
- `src/app/admin/parametres/page.tsx`

### Actions UI
- `src/components/admin/member-actions.tsx`
- `src/components/admin/login-form.tsx`
- `src/components/admin/site-stats-form.tsx`

### Auth
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/magic-link.ts`

### Parcours public de soumission / complétion
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`

### Relances et e-mails
- `src/app/api/cron/reminders/route.ts`
- `src/lib/email/templates/reminder.tsx`
- `src/lib/email/templates/magic-link.tsx`

### Référentiels et données
- `DECISIONS.md`
- `architecture.md`
- `architecture-addendum.md`
- `src/lib/data/referentials` via les composants de formulaire

---

## 6. Données principales

### 6.1 Entité `members`
Donnée centrale du workflow.

Champs observés dans les preuves :
- `id`
- `slug`
- `name`
- `status`
- `submittedAt`
- `reviewedAt`
- `tahitiNumber`
- `isMedefMember`
- `websiteUrl`
- `linkedinUrl`
- `address`
- `yearFounded`
- `employeeCount`
- `description`
- `logoUrl`

Preuves :
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`

### 6.2 Contacts adhérent
- `memberContacts`
- `name`
- `role`
- `email`
- `phone`
- `isPrimary`

Preuves :
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/fiche/profile-form.tsx`

### 6.3 Domaines d’activité
- `memberActivities`
- `activityDomains`

Preuves :
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/components/adhesion/step-activites.tsx`

### 6.4 Certifications / labels
- `memberCertifications`

Preuves :
- `src/app/admin/adherents/[id]/page.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/fiche/profile-form.tsx`

### 6.5 Journal des relances
- `reminderLogs`
- `type`
- `sentAt`
- `emailTo`
- `memberId`

Preuves :
- `src/app/api/cron/reminders/route.ts`
- `src/app/admin/relances/page.tsx`

### 6.6 Utilisateurs administrateurs
- `adminUsers`
- `email`
- `passwordHash`
- `name`
- `isActive`
- `lastLoginAt`

Preuves :
- `src/lib/auth/config.ts`
- `src/auth.ts`
- `drizzle/meta/0001_snapshot.json`
- `drizzle/meta/0002_snapshot.json`

### 6.7 Paramètres de site
- `siteStats.employeeCount`
- `teamMembers`
- `timelineEvents`

Preuves :
- `src/app/admin/parametres/page.tsx`
- `src/components/admin/site-stats-form.tsx`

### 6.8 Magic links
- token brut + HMAC
- hash SHA-256 stocké
- expiration
- `usedAt` / état d’usage

Preuves :
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `DECISIONS.md` section 6.1

---

## 7. Étapes nominales

### 7.1 Connexion à l’administration
1. L’administrateur ouvre `/admin/login`.
2. Il saisit email + mot de passe.
3. Le système authentifie via Credentials Provider.
4. Si l’utilisateur est actif et le mot de passe valide, la session est créée.
5. L’utilisateur est redirigé vers `/admin`.

Preuves :
- `src/components/admin/login-form.tsx`
- `src/lib/auth/config.ts`
- `src/auth.ts`

### 7.2 Consultation des demandes
1. L’administrateur ouvre `/admin/demandes`.
2. Il voit la liste des demandes avec :
   - entreprise,
   - numéro TAHITI,
   - indication MEDEF,
   - date de dépôt.
3. Il ouvre une demande via « Examiner ».

Preuves :
- `src/app/admin/demandes/page.tsx`

### 7.3 Examen d’une demande
1. L’administrateur ouvre le détail de la demande.
2. Il consulte les informations de l’entreprise.
3. Il consulte les contacts.
4. Il consulte les domaines d’activité.
5. Il peut approuver ou refuser la demande.
6. Il peut également envoyer le lien de fiche.

Preuves :
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`

### 7.4 Validation
1. L’administrateur approuve la demande.
2. Le statut de la fiche passe vers le statut de publication attendu.
3. La demande disparaît de la liste des demandes en attente.
4. L’élément devient visible dans la liste des adhérents actifs.

Preuves :
- `DECISIONS.md` section 5
- `src/components/admin/member-actions.tsx`
- `src/app/admin/adherents/page.tsx`

### 7.5 Refus
1. L’administrateur refuse la demande.
2. La demande quitte la file de traitement.
3. Le refus est reflété dans le statut / les vues de suivi.

Preuves :
- `src/components/admin/member-actions.tsx`
- `src/app/admin/adherents/page.tsx`

### 7.6 Envoi du lien fiche
1. Depuis une demande, un brouillon ou une fiche active, l’administrateur clique « Envoyer le lien fiche ».
2. Un magic link est généré ou renvoyé.
3. L’adhérent reçoit un e-mail de complétion.
4. Le lien permet l’accès sécurisé à `/fiche/[token]`.

Preuves :
- `src/components/admin/member-actions.tsx`
- `src/lib/auth/magic-link.ts`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/lib/email/templates/magic-link.tsx`

### 7.7 Complétion de la fiche par l’adhérent
1. L’adhérent ouvre son lien sécurisé.
2. Il accède à son espace de mise à jour.
3. Il renseigne les informations complémentaires.
4. Il sauvegarde un brouillon automatiquement.
5. Il soumet la fiche.
6. La fiche rejoint le cycle de modération.

Preuves :
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`

### 7.8 Relances automatiques
1. Le cron `/api/cron/reminders` liste les membres en statut `submitted`.
2. Il vérifie la date de soumission.
3. Il cherche le dernier envoi de relance de type `validation_pending`.
4. Si la règle temporelle est satisfaite, il envoie un e-mail à l’adresse admin configurée.
5. Il logge l’envoi dans `reminderLogs`.

Preuves :
- `src/app/api/cron/reminders/route.ts`
- `src/lib/email/templates/reminder.tsx`

### 7.9 Suivi des relances
1. L’administrateur consulte `/admin/relances`.
2. Il voit l’historique des relances envoyées.
3. Il identifie les adhérents concernés, le type et l’e-mail destinataire.

Preuves :
- `src/app/admin/relances/page.tsx`

### 7.10 Paramétrage
1. L’administrateur consulte `/admin/parametres`.
2. Il ajuste les chiffres clés manuels.
3. Il visualise le bureau et la frise chronologique.

Preuves :
- `src/app/admin/parametres/page.tsx`
- `src/components/admin/site-stats-form.tsx`

---

## 8. Variantes

### 8.1 Liste vide des demandes
- si aucune demande n’est en attente, la page affiche un état vide.

Preuve :
- `src/app/admin/demandes/page.tsx`

### 8.2 Aucun adhérent ou filtre sans résultat
- les vues d’annuaire affichent un état vide ou un message explicatif.

Preuves :
- `src/components/annuaire/member-grid.tsx`
- `src/app/(public)/adherents/page.tsx`

### 8.3 Demande déjà traitée
- un détail de demande n’est accessible que si le statut est `submitted`.
- sinon la page renvoie `notFound()`.

Preuve :
- `src/app/admin/demandes/[id]/page.tsx`

### 8.4 Fiche adhérent sans données complètes
- certaines sections sont masquées si les données ne sont pas présentes ;
- l’interface tolère les champs manquants.

Preuves :
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/components/annuaire/member-presentation-card.tsx`

### 8.5 Envoi du lien sur statut draft / submitted / active
- le bouton est visible sur plusieurs états, pas uniquement en attente.

Preuve :
- `src/components/admin/member-actions.tsx`

### 8.6 Relance non envoyée si délai insuffisant
- J+3 puis tous les 7 jours seulement ;
- les cas trop récents sont ignorés.

Preuve :
- `src/app/api/cron/reminders/route.ts`

---

## 9. Cas d’erreur

### 9.1 Échec d’authentification admin
- email/mot de passe invalides ;
- compte inactif ;
- validation schéma invalide.

Preuves :
- `src/lib/auth/config.ts`
- `src/auth.ts`
- `src/components/admin/login-form.tsx`

### 9.2 Demande introuvable
- l’ID n’existe pas ;
- ou le statut n’est pas `submitted`.

Preuve :
- `src/app/admin/demandes/[id]/page.tsx`

### 9.3 Fiche adhérent introuvable
- `notFound()` sur `/admin/adherents/[id]`.

Preuve :
- `src/app/admin/adherents/[id]/page.tsx`

### 9.4 Envoi de magic link en échec
- si l’action backend renvoie une erreur, le composant affiche un message.

Preuve :
- `src/components/admin/member-actions.tsx`

### 9.5 Relance e-mail en échec
- erreur capturée, log console, incrément de `skipped`.

Preuve :
- `src/app/api/cron/reminders/route.ts`

### 9.6 Cron non autorisé
- absence ou invalidité du [REDACTED]

Preuve :
- `src/app/api/cron/reminders/route.ts`

### 9.7 Upload logo / image non conforme
- mauvais type MIME ;
- taille excessive ;
- absence de fichier ;
- token invalide pour logo.

Preuves :
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`

### 9.8 Données de formulaire invalides
- schémas Zod refusent les champs invalides.

Preuves :
- `src/components/admin/login-form.tsx`
- `src/components/admin/news-form.tsx`
- `src/components/admin/job-form.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/public/contact-form.tsx`

---

## 10. Documents / emails / effets de bord

### 10.1 E-mail de magic link
Effet de bord attendu :
- e-mail transactionnel envoyé à l’adhérent ;
- contient un lien de complétion ;
- durée de validité indiquée.

Preuve :
- `src/lib/email/templates/magic-link.tsx`

### 10.2 E-mail de relance
Effet de bord attendu :
- e-mail envoyé à l’adresse admin ;
- contient le nom de l’adhérent, la date de soumission et un lien vers le BO.

Preuve :
- `src/lib/email/templates/reminder.tsx`

### 10.3 Journal des relances
Effet de bord :
- insertion d’un enregistrement dans `reminderLogs`.

Preuve :
- `src/app/api/cron/reminders/route.ts`

### 10.4 Mise à jour du `lastLoginAt`
Effet de bord :
- à la connexion admin réussie, `adminUsers.lastLoginAt` est mis à jour.

Preuves :
- `src/lib/auth/config.ts`
- `src/auth.ts`

### 10.5 Upload fichiers
Effets de bord :
- téléversement sur Vercel Blob ;
- resize / conversion image ;
- URL publique retournée.

Preuves :
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`

### 10.6 Brouillon automatique de fiche
Effet de bord :
- autosave local / serveur pour l’espace fiche adhérent.

Preuve :
- `src/components/fiche/profile-form.tsx`

---

## 11. Règles métier

### 11.1 Validation avant publication
La publication dans l’annuaire public est soumise à **validation par le bureau**.

Preuves :
- `DECISIONS.md` section 5
- `architecture-addendum.md`
- `src/app/admin/demandes/[id]/page.tsx`

### 11.2 Cycle de vie de fiche
États métier observés :
- `draft`
- `submitted`
- `active`
- `inactive`

Preuve :
- `DECISIONS.md` section 5

### 11.3 Magic link
- durée de vie : **30 jours**
- renouvellement possible
- token signé HMAC + hashé en base

Preuves :
- `DECISIONS.md` section 6.1
- `src/lib/auth/magic-link.ts`

### 11.4 Relances automatiques
- première relance à **J+3**
- relance répétée tous les **7 jours**
- arrêt après **10 envois**
- arrêt manuel possible

Preuves :
- `DECISIONS.md` section 6.2
- `architecture-addendum.md`
- `src/app/api/cron/reminders/route.ts`

### 11.5 Authentification admin
- Auth.js v5
- credentials provider
- sessions JWT
- 1 compte par membre du bureau
- 2FA évoquée dans l’architecture mais non prouvée dans le code consulté

Preuves :
- `DECISIONS.md` section 6.3
- `src/lib/auth/config.ts`
- `src/auth.ts`

### 11.6 Chiffres clés
Le nombre d’adhérents affiché est calculé automatiquement, pas saisi manuellement.

Preuves :
- `DECISIONS.md` section 4
- `architecture-addendum.md`
- `src/app/admin/parametres/page.tsx`
- `src/components/admin/site-stats-form.tsx`
- `src/app/(public)/adherents/page.tsx`

### 11.7 Données publiques d’annuaire
L’annuaire public affiche :
- nom ;
- logo ;
- description ;
- domaine principal ;
- informations de contact / présentation.

Preuves :
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/components/annuaire/member-card.tsx`
- `src/components/annuaire/member-contact-card.tsx`

### 11.8 Référentiels fermés
Les domaines d’activité / compétences / certifications doivent provenir de listes fermées, et non de valeurs libres.

Preuves :
- `architecture-addendum.md`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`

### 11.9 Cohérence des listes
Les filtres annuaire et les formulaires s’appuient sur les mêmes référentiels métier.

Preuves :
- `src/components/adhesion/step-activites.tsx`
- `src/components/annuaire/member-filters.tsx`

---

## 12. Sécurité / permissions

### 12.1 Authentification admin obligatoire
Les pages admin supposent une session authentifiée.

Preuves :
- `src/auth.ts`
- `src/lib/auth/session.ts`
- `src/app/admin/page.tsx`

### 12.2 Compte admin actif requis
Un utilisateur inactif ne peut pas se connecter.

Preuve :
- `src/lib/auth/config.ts`
- `src/auth.ts`

### 12.3 Secret Cron obligatoire
Le endpoint `/api/cron/reminders` exige :
- `authorization: Bearer ${CRON_SECRET}`

Preuve :
- `src/app/api/cron/reminders/route.ts`

### 12.4 Magic link vérifié cryptographiquement
Le lien d’accès fiche :
- contient un payload signé ;
- est vérifié par HMAC ;
- est stocké hashé ;
- expire ;
- est vérifié contre `usedAt` côté base.

Preuves :
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`

### 12.5 Téléversement logo protégé par token magique
L’upload logo exige un header `x-magic-token` valide.

Preuve :
- `src/app/api/upload/logo/route.ts`

### 12.6 Téléversement image actualité protégé par session
L’upload news-image exige une session authentifiée.

Preuve :
- `src/app/api/upload/news-image/route.ts`

### 12.7 Réduction de surface d’attaque
Les formulaires sont validés par Zod côté client et côté logique métier.

Preuves :
- `src/components/admin/login-form.tsx`
- `src/components/public/contact-form.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/admin/job-form.tsx`
- `src/components/admin/news-form.tsx`

### 12.8 Limitation des droits
Le modèle décrit un **mono-admin / bureau** sans rôles fins détaillés visibles dans le code consulté.

Preuves :
- `architecture.md`
- `DECISIONS.md`

---

## 13. Recette

### 13.1 Connexion admin
- [ ] un compte actif peut se connecter ;
- [ ] un mot de passe invalide est refusé ;
- [ ] un compte inactif est refusé ;
- [ ] la session redirige vers `/admin`.

### 13.2 Liste des demandes
- [ ] les demandes `submitted` apparaissent ;
- [ ] le compteur correspond au nombre de lignes ;
- [ ] une demande ouvre la page de détail ;
- [ ] une demande absente ou non `submitted` renvoie 404.

### 13.3 Validation / refus
- [ ] le bouton d’approbation est visible pour une demande `submitted` ;
- [ ] le bouton de refus est visible ;
- [ ] l’action modifie l’état métier attendu ;
- [ ] la liste des demandes se met à jour après action.

### 13.4 Envoi du lien fiche
- [ ] le bouton est disponible sur les statuts attendus ;
- [ ] l’action renvoie une erreur lisible si elle échoue ;
- [ ] le magic link est utilisable sur `/fiche/[token]`.

### 13.5 Relances
- [ ] le cron refuse un appel sans secret ;
- [ ] les relances sont envoyées seulement après le délai métier ;
- [ ] les logs sont enregistrés ;
- [ ] l’écran `/admin/relances` reflète le journal.

### 13.6 Paramètres
- [ ] le nombre d’adhérents est affiché comme auto/calculé ;
- [ ] la saisie manuelle des salariés fonctionne ;
- [ ] la frise et le bureau s’affichent.

### 13.7 Sécurité
- [ ] upload logo refusé sans token valide ;
- [ ] upload news-image refusé sans session ;
- [ ] listes et pages admin non accessibles sans auth ;
- [ ] formulaires invalides refusés par validation.

Preuves de couverture existante :
- `tests/unit/contact.test.ts`
- `tests/unit/member-card.test.tsx`
- `tests/unit/member-logo.test.ts`
- `tests/unit/member-showcase.test.tsx`
- `tests/unit/seeded-shuffle.test.ts`
- `tests/unit/seo.test.ts`
- `tests/e2e/example.spec.ts`

---

## 14. Risques

### 14.1 Ambiguïté sur le flux exact de modération
Les preuves montrent des statuts et des actions, mais le détail exact du passage `submitted` → `active` vs autres effets de bord n’est pas entièrement visible.

Risque :
- incohérence entre les écrans admin, les actions backend et les attentes métier.

### 14.2 Règles d’arrêt des relances non totalement alignées
Le code de cron visible ne montre pas explicitement l’arrêt après 10 envois ni le stop manuel, alors que la documentation le mentionne.

Risque :
- relances trop longues ou non stoppées conformément au besoin.

### 14.3 2FA annoncée mais non prouvée
L’architecture mentionne une 2FA optionnelle, mais aucun flux concret n’est visible dans les extraits.

Risque :
- mention fonctionnelle non implémentée ou non finalisée.

### 14.4 Audit log annoncé
L’architecture mentionne un audit log, mais le flux de journalisation des actions de modération n’est pas visible dans les composants examinés.

Risque :
- manque de traçabilité des décisions du bureau.

### 14.5 Référentiels fermés non visibles dans les extraits
Les listes fermées sont requises, mais leur source canonique n’est pas entièrement exposée dans le pack.

Risque :
- divergence entre formulaire d’adhésion, fiche adhérent et filtres de l’annuaire.

### 14.6 Cohérence multi-vues
La même donnée est affichée sur :
- demandes,
- adhérents,
- fiche publique,
- admin paramètres.

Risque :
- écarts d’état ou de représentation si les mises à jour ne sont pas parfaitement synchronisées.

### 14.7 Sécurité du lien fiche
Le magic link dépend d’une implémentation custom, avec un bon niveau de sécurité visible, mais son cycle complet d’usage / marquage `usedAt` / renouvellement n’est pas entièrement visible.

Risque :
- réutilisation non prévue ou expiration mal gérée.

---

## 15. Questions ouvertes

1. **Quel est le statut exact après approbation ?**
   - `submitted` passe-t-il directement à `active` ?
   - ou existe-t-il un état intermédiaire non visible ?

2. **Le refus conserve-t-il l’historique dans la fiche ?**
   - le statut devient-il `inactive` ou une valeur spécifique de rejet ?

3. **Quel est le mécanisme réel de “stopper les relances” ?**
   - le bouton existe dans le mockup, mais l’implémentation visible n’expose pas le flux complet.

4. **L’arrêt après 10 relances est-il bien codé ?**
   - la doc l’indique, mais le cron consulté ne le montre pas.

5. **Audit log : où sont enregistrées les actions de modération ?**
   - validation, refus, désactivation, renvoi de lien, relances.

6. **2FA admin : est-elle en production ou seulement planifiée ?**
   - aucune preuve directe dans les extraits lus.

7. **Quel est le contrat fonctionnel exact du magic link ?**
   - durée de vie ;
   - renouvellement ;
   - invalidation après usage ;
   - nombre d’usages autorisés.

8. **Le bureau peut-il modifier les référentiels fermés ?**
   - domaines, compétences, certifications, statuts juridiques.

9. **Le BO permet-il la réactivation d’un adhérent inactif ?**
   - la preuve montre la désactivation, pas la réactivation.

10. **Quelles notifications sont envoyées à l’adhérent lors d’une validation ou d’un refus ?**
    - aucune preuve explicite d’e-mail métier dédié à ces transitions.

11. **Le détail admin de demande et le détail admin d’adhérent sont-ils deux vues distinctes ou deux états du même objet ?**
    - la donnée semble commune, mais l’intention UX exacte doit être clarifiée.

12. **Les formulaires de modération ont-ils des filtres, recherches et exports “production” complets ?**
    - le mockup montre des exemples, mais l’implémentation visible n’est partielle.

13. **Le cycle d’autosave de la fiche adhérent est-il robuste en cas de concurrence ou rafraîchissement ?**
    - la preuve montre un autosave, mais pas le verrouillage / résolution de conflits.

14. **Les champs affichés en admin sont-ils tous éditables ou certains sont-ils en lecture seule ?**
    - notamment `N° TAHITI`, `MEDEF`, `statut`, `date de dépôt`, `date de validation`.

15. **Les règles de modération s’appliquent-elles aussi aux offres d’emploi et actualités, ou uniquement aux fiches adhérents ?**
    - les pages admin de contenus existent, mais le workflow métier de validation n’est pas documenté ici.

Sources de cette section :
- `DECISIONS.md`
- `architecture.md`
- `architecture-addendum.md`
- `src/app/admin/*`
- `src/components/admin/member-actions.tsx`
- `src/app/api/cron/reminders/route.ts`