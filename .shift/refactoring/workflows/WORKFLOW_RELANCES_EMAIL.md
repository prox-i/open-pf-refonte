# WORKFLOW_relances automatiques et e-mails transactionnels — Cahier de workflow fonctionnel et technique reconstitué

## 1. Objet

Reconstituer le workflow métier et technique de **relances automatiques** et d’**e-mails transactionnels** du projet OPEN PF, en couvrant :

- les relances automatiques des demandes d’adhésion / fiches non complétées ;
- les e-mails transactionnels liés à la complétion de fiche via magic link ;
- le journal des envois et les interfaces de pilotage côté administration ;
- les dépendances techniques : cron, webhooks Brevo, templates e-mail, client d’envoi.

**Sources principales :**
- `src/app/api/cron/reminders/route.ts`
- `src/lib/email/templates/*`
- `src/lib/email/client`
- `src/app/api/webhooks/brevo/route.ts`
- `src/app/admin/relances/page.tsx`
- `src/components/admin/member-actions.tsx`
- `src/lib/actions/admin/members` via usages
- `DECISIONS.md`
- `architecture.md`
- `mockup/open_pf_site_8_5/admin-relances.html`
- `mockup/open_pf_site_8_5/admin-demande-detail.html`

---

## 2. Synthèse fonctionnelle

Le système OPEN PF met en place un **mécanisme de relance automatique** pour les demandes d’adhésion ou fiches en attente de complétion / validation.

Le flux attendu est le suivant :

1. un adhérent ou une entreprise soumet une demande ;
2. un lien sécurisé peut être envoyé pour compléter la fiche ;
3. si la demande reste en attente, des relances e-mail sont envoyées automatiquement ;
4. les relances suivent une cadence métier :
   - première relance à **J+3** ;
   - puis relances répétées toutes les **7 jours** ;
   - arrêt après un maximum de relances défini par la règle métier ;
5. chaque envoi est historisé dans `reminderLogs` ;
6. le back-office expose un journal des relances et des actions de pilotage.

Le périmètre d’e-mails transactionnels comprend aussi :
- les templates d’e-mail de **contact** ;
- les templates de **magic link** pour la complétion de fiche ;
- les templates de **rappel** pour le bureau / admin.

**Constat important :**
- le cron de relance existe et envoie déjà les relances “validation_pending” ;
- le webhook Brevo est encore en TODO ;
- le journal admin “Relances” est en lecture seule dans l’état observé.

---

## 3. Acteurs concernés

### 3.1 Bureau / administrateur
- reçoit les relances côté back-office ;
- valide, refuse ou désactive les demandes ;
- peut envoyer un magic link depuis la fiche demande ;
- consulte le journal des relances.

### 3.2 Adhérent / entreprise
- dépose une demande ;
- complète sa fiche via un lien sécurisé ;
- peut recevoir des e-mails transactionnels relatifs au processus.

### 3.3 Système de planification
- exécute le cron quotidien de relance ;
- décide des envois selon l’ancienneté et l’historique.

### 3.4 Service de messagerie transactionnelle
- Brevo est la cible déclarée ;
- le système doit gérer les retours de livraison via webhook.

---

## 4. Points d'entrée

### 4.1 Cron de relance
- `GET /api/cron/reminders`
- protégé par header `Authorization: Bearer <CRON_SECRET>`

### 4.2 Interface admin
- `/admin/relances`
- `/admin/demandes/[id]`
- boutons d’action dans la fiche demande (`approve`, `reject`, `sendMagicLink`, `deactivate`)

### 4.3 Webhook Brevo
- `POST /api/webhooks/brevo`
- actuellement non implémenté

### 4.4 Envoi d’e-mails transactionnels
- via `src/lib/email/client`
- templates React Email sous `src/lib/email/templates/`

---

## 5. Composants source

### 5.1 Cron de relance
**Fichier :** `src/app/api/cron/reminders/route.ts`

Rôle :
- authentifier l’appel cron ;
- lister les membres au statut `submitted` ;
- décider d’un envoi selon les délais ;
- appeler `sendReminderEmail(...)` ;
- écrire une ligne dans `reminderLogs`.

Points clés observés :
- `FIRST_REMINDER_DAYS = 3`
- `REPEAT_REMINDER_DAYS = 7`
- type de relance journalisé : `validation_pending`
- statistiques de sortie : `{ ok, sent, skipped, processedAt }`

### 5.2 Templates e-mail
**Fichiers :**
- `src/lib/email/templates/contact.tsx`
- `src/lib/email/templates/magic-link.tsx`
- `src/lib/email/templates/reminder.tsx`

Rôle :
- structurer les e-mails transactionnels ;
- porter le branding OPEN PF ;
- fournir des CTA clairs.

### 5.3 Client d’e-mail
**Fichier :** `src/lib/email/client`

Le contenu exact n’est pas affiché dans le pack, mais les usages montrent qu’il sert à :
- envoyer les relances (`sendReminderEmail`);
- probablement envoyer d’autres transactionnels (magic link, contact, etc.).

### 5.4 Webhook Brevo
**Fichier :** `src/app/api/webhooks/brevo/route.ts`

État :
- TODO, renvoie `{ ok: true }` sans traitement métier.

### 5.5 Journal admin des relances
**Fichier :** `src/app/admin/relances/page.tsx`

Rôle :
- afficher les enregistrements de `reminderLogs` ;
- joindre le nom de l’adhérent ;
- afficher type, destinataire, date d’envoi.

### 5.6 Actions admin sur les membres
**Fichier :** `src/components/admin/member-actions.tsx`

Rôle :
- déclencher `approveMember`, `rejectMember`, `deactivateMember`, `sendMagicLink`.

### 5.7 Templates / parcours liés à la complétion de fiche
**Fichiers :**
- `src/lib/email/templates/magic-link.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`

Rôle :
- permettre la complétion de la fiche via lien sécurisé ;
- autosave côté formulaire ;
- soumission finale au système.

---

## 6. Données principales

### 6.1 Table `members`
Champs visibles dans les extraits :
- `id`
- `name`
- `status`
- `submittedAt`
- `reviewedAt`
- `updatedAt`
- `tahitiNumber`
- `isMedefMember`
- `yearFounded`
- `employeeCount`
- `websiteUrl`
- `linkedinUrl`
- `address`
- `description`
- autres champs liés à la fiche

Statuts observés :
- `draft`
- `submitted`
- `active`
- `inactive`

### 6.2 Table `reminderLogs`
Utilisée par :
- `src/app/api/cron/reminders/route.ts`
- `src/app/admin/relances/page.tsx`

Champs visibles :
- `id`
- `memberId`
- `type`
- `sentAt`
- `emailTo`

Types observés dans le code UI :
- `submission_reminder`
- `validation_pending`
- `renewal_reminder`
- `profile_incomplete`

Le cron actuel écrit :
- `type: 'validation_pending'`

### 6.3 Templates transactionnels
Le template `MagicLinkEmail` prend :
- `memberName`
- `magicUrl`
- `expiresInDays` (défaut 30)

Le template `ReminderEmail` prend :
- `memberName`
- `submittedAt`
- `adminUrl`

Le template `ContactEmail` prend :
- `name`
- `email`
- `subject`
- `message`

### 6.4 Variables d’environnement impliquées
Visibles dans le code ou l’architecture :
- `CRON_SECRET`
- `AUTH_URL`
- `ADMIN_NOTIFICATION_EMAIL`
- `MAGIC_LINK_SECRET`
- `BLOB_READ_WRITE_TOKEN` n’est pas lié au mail, mais présent ailleurs
- paramètres Brevo non visibles dans l’extrait, à confirmer selon `src/lib/email/client`

---

## 7. Étapes nominales

### 7.1 Relance automatique d’une demande en attente

1. Le scheduler appelle `GET /api/cron/reminders`.
2. Le système vérifie l’en-tête `Authorization`.
3. Il charge les membres au statut `submitted`.
4. Pour chaque membre :
   - si `submittedAt` est absent, le membre est ignoré ;
   - il lit le dernier `reminderLogs` de type `validation_pending` ;
   - s’il n’existe pas, il compare `submittedAt` à la date courante ;
   - sinon, il compare `sentAt` à la date courante.
5. Si la règle de délai est atteinte :
   - construction de `adminEmail` ;
   - construction de `adminUrl` vers le BO ;
   - envoi de l’e-mail de relance ;
   - insertion d’un log de relance.
6. Le cron renvoie le nombre d’e-mails envoyés et ignorés.

### 7.2 Envoi d’un magic link depuis le BO

1. L’admin ouvre la fiche demande.
2. Il clique sur “Envoyer le lien fiche”.
3. L’action serveur génère / envoie un lien sécurisé.
4. L’adhérent reçoit l’e-mail `MagicLinkEmail`.
5. L’adhérent ouvre `/fiche/[token]`.
6. La fiche est chargée, autosauvée, puis soumise.

### 7.3 Consultation du journal des relances

1. L’admin va sur `/admin/relances`.
2. La page lit `reminderLogs` et joint le nom de membre.
3. Les relances sont affichées par ordre décroissant.
4. L’admin peut observer les envois, les destinataires et les dates.

---

## 8. Variantes

### 8.1 Première relance vs relance récurrente
- **Première relance** : aucun log précédent `validation_pending`, délai depuis `submittedAt`.
- **Relance récurrente** : au moins un log précédent, délai depuis `latestLog.sentAt`.

### 8.2 Demande déjà traitée
- si le membre n’est plus au statut `submitted`, il n’est pas concerné par le cron actuel.

### 8.3 Lien magic vs relance admin
- le magic link sert à l’utilisateur final pour compléter sa fiche ;
- la relance automatique s’adresse à l’administration/bureau pour traiter une demande en attente.

### 8.4 Échec d’envoi
- si `sendReminderEmail` échoue, le membre est compté dans `skipped` et aucun log n’est écrit.

### 8.5 E-mail transactionnel différent
- contact, magic link et reminder ne partagent pas le même template ;
- chaque cas a son contenu et sa cible.

---

## 9. Cas d’erreur

### 9.1 Cron non autorisé
- si `Authorization` ne correspond pas à `Bearer ${env.CRON_SECRET}`, la route retourne `401 Unauthorized`.

### 9.2 Membre sans date de soumission
- le membre est ignoré (`skipped++`).

### 9.3 Aucune demande à relancer
- la route retourne `ok: true` avec `sent: 0`.

### 9.4 Échec d’envoi e-mail
- erreur loggée dans la console ;
- membre compté comme `skipped`.

### 9.5 Webhook Brevo non traité
- la route répond `{ ok: true }` sans action ;
- les événements de livraison / bounce / spam ne sont pas exploités.

### 9.6 Template / client email défaillant
- non visible dans l’extrait, mais le point de fragilité est central car toute la chaîne dépend de `src/lib/email/client`.

### 9.7 Données de destination invalides
- si l’adresse admin ou les paramètres d’e-mail sont mal configurés, l’envoi échoue ;
- aucune logique de retry n’est visible dans l’extrait.

---

## 10. Documents / emails / effets de bord

### 10.1 E-mail de relance
**Template :** `src/lib/email/templates/reminder.tsx`

Contenu :
- mention du nom de l’adhérent ;
- date de dépôt ;
- CTA vers l’admin URL ;
- footer indiquant l’envoi automatique.

Effet de bord :
- insertion dans `reminderLogs`.

### 10.2 E-mail magic link
**Template :** `src/lib/email/templates/magic-link.tsx`

Contenu :
- explication du lien ;
- bouton “Compléter ma fiche” ;
- expiration explicite du lien ;
- mention contact.

Effets de bord attendus :
- stockage / mise à jour du token magic link côté DB ;
- éventuel log d’envoi si prévu par le client.

### 10.3 E-mail de contact
**Template :** `src/lib/email/templates/contact.tsx`

Contenu :
- identité du contact ;
- sujet ;
- message ;
- réponse attendue.

Effet de bord :
- non visible ici, mais typiquement transfert au bureau / support.

### 10.4 Journal de relances
**UI :** `src/app/admin/relances/page.tsx`

Affiche :
- adhérent ;
- type de relance ;
- destinataire ;
- date d’envoi.

### 10.5 Routes / pages associées
- `/admin/demandes/[id]` : actionner la vie de la demande ;
- `/fiche/[token]` : complétion via magic link ;
- `/api/cron/reminders` : automatisation ;
- `/api/webhooks/brevo` : retour Brevo, non encore exploité.

---

## 11. Règles métier

### 11.1 Délai de première relance
- première relance après **3 jours** de statut `submitted` sans traitement.

### 11.2 Délai de relance récurrente
- ensuite, relance tous les **7 jours**.

### 11.3 Cadence et limite
- l’architecture valide évoque un arrêt après **10 envois** ;
- le code du cron observé **ne montre pas encore** cette limitation.

### 11.4 Périmètre de déclenchement
- seules les demandes au statut `submitted` sont prises en compte par le cron actuel.

### 11.5 Cible de relance
- le cron envoie la relance à `env.ADMIN_NOTIFICATION_EMAIL` ;
- ce n’est pas un e-mail au membre final dans l’extrait observé.

### 11.6 Enregistrement obligatoire
- chaque succès d’envoi de relance doit créer une ligne dans `reminderLogs`.

### 11.7 Une seule relance par fenêtre
- la logique empêche l’envoi tant que le délai n’est pas atteint.

### 11.8 Magic link sécurisé
- le lien est signé par HMAC et hashé en base ;
- TTL de **30 jours** selon les décisions projet.

### 11.9 E-mails transactionnels éditables
- la documentation d’architecture indique que les e-mails devront être éditables depuis le BO après lancement.

**Sources :**
- `DECISIONS.md`
- `architecture.md`
- `src/lib/auth/magic-link.ts`
- `src/lib/email/templates/magic-link.tsx`
- `src/app/api/cron/reminders/route.ts`

---

## 12. Sécurité / permissions

### 12.1 Protection du cron
- vérification stricte du secret cron via header `Authorization`.

### 12.2 Authentification admin
- back-office protégé par Auth.js credentials ;
- sessions JWT ;
- seul un compte admin valide peut accéder aux fonctions BO.

### 12.3 Magic link
- le token est :
  - généré avec `crypto.randomUUID()`,
  - signé via HMAC avec `MAGIC_LINK_SECRET`,
  - stocké hashé en SHA-256 ;
- validation via `verifyMagicToken`.

### 12.4 Accès au BO des relances
- la page `/admin/relances` est une page admin, donc soumise au périmètre d’authentification global du BO.

### 12.5 Webhook Brevo
- aucune logique de sécurité n’est visible dans l’extrait ;
- à valider : signature webhook, secret, IP allowlist, ou autre mécanisme.

### 12.6 Données sensibles
- e-mail, nom, téléphone, date de dépôt, URL admin ;
- les templates doivent éviter de divulguer plus que nécessaire.

### 12.7 Risque de fuite de lien
- le magic link donne accès à une fiche sécurisée ; il doit rester non réutilisable ou à TTL contrôlé selon le modèle attendu.

---

## 13. Recette

### 13.1 Cron de relance
- déclencher `GET /api/cron/reminders` avec le bon [REDACTED] ;
- vérifier :
  - `401` sans secret ;
  - `ok: true` avec compteurs ;
  - création de logs pour les membres éligibles ;
  - absence d’envoi pour les membres récents.

### 13.2 Cas J+3
- créer une demande avec `submittedAt` à J-3 ou plus ;
- confirmer l’envoi ;
- vérifier `reminderLogs.type = validation_pending`.

### 13.3 Cas relance récurrente
- créer un log `validation_pending` ancien de plus de 7 jours ;
- confirmer qu’une nouvelle relance est envoyée.

### 13.4 Fiche sans `submittedAt`
- confirmer que la ligne est ignorée et que le compteur `skipped` augmente.

### 13.5 Échec d’envoi
- simuler une erreur dans le client e-mail ;
- confirmer :
  - pas d’insertion dans `reminderLogs`,
  - log console d’erreur,
  - `skipped` incrémenté.

### 13.6 Admin relances
- accéder à `/admin/relances` ;
- vérifier l’affichage des logs et des libellés de type.

### 13.7 Magic link
- envoyer un lien depuis la fiche admin ;
- ouvrir `/fiche/[token]` ;
- vérifier que le lien ouvre bien le formulaire sécurisé ;
- vérifier la durée de validité selon la règle métier.

### 13.8 Webhook Brevo
- envoyer un POST de test ;
- constater que la route répond `ok: true` mais ne traite rien ;
- à compléter par recette dès implémentation.

---

## 14. Risques

### 14.1 Risque fonctionnel : limite de relances incomplète
- la décision projet parle d’un arrêt après 10 envois, mais le cron montré n’implémente pas cette borne.

### 14.2 Risque de faux positifs / doublons
- si le log est mal écrit ou si le cron est rejoué, il peut y avoir doublon d’envois sans garde supplémentaire.

### 14.3 Risque de backlog webhooks
- le webhook Brevo étant TODO, les événements de bounce / delivered / complaint ne sont pas exploités.

### 14.4 Risque de configuration
- `ADMIN_NOTIFICATION_EMAIL`, `CRON_SECRET`, `AUTH_URL`, `MAGIC_LINK_SECRET` doivent être corrects ;
- un défaut de config bloque le workflow.

### 14.5 Risque de robustesse e-mail
- absence visible de retry, queue, ou idempotence fine.

### 14.6 Risque d’écart métier
- le code actif semble centré sur la validation de demande, alors que le back-office mockup parle aussi de fiches incomplètes et relances programmées.

### 14.7 Risque RGPD / contenu
- contenu des e-mails et logs doit rester limité aux besoins métier.

---

## 15. Questions ouvertes

1. **La limite de 10 relances est-elle bien à implémenter dans le cron actuel ?**  
   Le code ne la montre pas, mais la décision projet la mentionne.

2. **Le cron doit-il relancer uniquement les demandes `submitted`, ou aussi les fiches incomplètes en `draft` ?**  
   Le mockup “Relances” évoque plusieurs catégories.

3. **La cible des relances automatiques est-elle le bureau admin, le membre, ou les deux selon les cas ?**  
   Le cron observé envoie à `ADMIN_NOTIFICATION_EMAIL`.

4. **Le webhook Brevo doit-il journaliser les événements de délivrabilité ?**  
   Si oui, quelles tables et quels statuts doivent être alimentés ?

5. **Faut-il une action manuelle BO pour stopper les relances par dossier ?**  
   Le mockup le montre ; le code visible ne le confirme pas.

6. **Quel est le contrat exact du `src/lib/email/client` ?**  
   Le pack ne montre pas son implémentation.

7. **Les e-mails transactionnels doivent-ils être personnalisables depuis le BO dès maintenant ou seulement plus tard ?**  
   `DECISIONS.md` dit “éditables depuis le BO après lancement”.

8. **Le journal `reminderLogs` doit-il conserver aussi les échecs d’envoi ?**  
   Actuellement, seuls les succès sont insérés dans le cron observé.

9. **Le template “reminder” est-il envoyé à l’admin ou à l’adhérent ?**  
   Le composant `ReminderEmail` et le cron suggèrent une cible admin, à confirmer.

10. **La cadence “J+3 puis tous les 7 jours” s’applique-t-elle à toutes les catégories de relance ?**  
    Le back-office mentionne plusieurs types ; le cron actuel traite un seul type.

11. **Doit-on avoir une notification interne autre que l’e-mail, par exemple un badge BO ou une alerte dashboard ?**

12. **La signature du webhook Brevo doit-elle être validée côté serveur ?**  
    Aucune preuve de validation n’apparaît dans le code extrait.

---