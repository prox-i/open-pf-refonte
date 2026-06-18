# WORKFLOW_RELANCE_AUTOMATIQUE — Relances automatiques de validation (cron)

## Classification
- **Type** : scheduled_flow
- **Sous-type** : cron job de surveillance d'état + envoi email transactionnel
- **Visibilité** : system
- **Acteur principal** : Système (cron Vercel)
- **Acteurs** : Scheduler Vercel (déclencheur), endpoint API Next.js, base de données PostgreSQL, API Brevo (email), admin (destinataire des emails)
- **Criticité** : Moyenne — améliore la réactivité de l'admin mais ne bloque pas le fonctionnement du système si le cron échoue
- **Confiance** : high
- **Justification** : L'endpoint `src/app/api/cron/reminders/route.ts` a été lu en intégralité. La logique de seuils J+3/+7j, la vérification d'authentification par secret, et l'enregistrement dans `reminderLogs` sont entièrement tracés.

## Objectif

Alerter automatiquement l'administrateur par email lorsque des demandes d'adhésion (`status: 'submitted'`) restent en attente sans traitement. La première relance est envoyée 3 jours après la soumission, puis toutes les 7 jours tant que la demande n'est pas traitée. Chaque envoi est enregistré dans `reminderLogs` pour éviter les doublons et permettre la consultation dans le journal admin.

## Acteurs
- **Scheduler Vercel** : déclenche `GET /api/cron/reminders` selon une planification externe (vercel.json ou dashboard Vercel — non lu dans cette analyse)
- **Endpoint API** (`src/app/api/cron/reminders/route.ts`) : contient toute la logique
- **Base de données PostgreSQL** : lecture de `members` + lecture/écriture de `reminderLogs`
- **API Brevo** : envoi de l'email de relance à l'admin
- **Admin** : destinataire unique des emails de relance

## Points d'entrée
- `src/app/api/cron/reminders/route.ts` — handler `GET /api/cron/reminders`

## Étapes principales

1. **Déclenchement** — Le scheduler Vercel envoie une requête `GET /api/cron/reminders` avec l'en-tête `Authorization: Bearer <CRON_SECRET>`.

2. **Vérification d'authentification** — L'endpoint compare `request.headers.get('authorization')` à `Bearer ${env.CRON_SECRET}`. Si différent : `401 'Unauthorized'`. Pas d'auth Admin.js.

3. **Récupération des demandes en attente** — `SELECT id, name, submittedAt FROM members WHERE status='submitted'`.

4. **Traitement de chaque demande** — Pour chaque membre :

   a. **Vérification de `submittedAt`** — Si `submittedAt` est `null` : `skipped++`, passage au suivant.

   b. **Lecture du dernier log de relance** — `SELECT sentAt FROM reminder_logs WHERE memberId=member.id AND type='validation_pending' ORDER BY sentAt DESC LIMIT 1`.

   c. **Calcul du délai** :
      - Si **aucun log** : relance si `daysBetween(submittedAt, now) >= 3` (`FIRST_REMINDER_DAYS = 3`)
      - Si **log existant** : relance si `daysBetween(latestLog.sentAt, now) >= 7` (`REPEAT_REMINDER_DAYS = 7`)
      - Sinon : `skipped++`, passage au suivant

   d. **Envoi de l'email** — `sendReminderEmail({ to: env.ADMIN_NOTIFICATION_EMAIL, memberName, submittedAt, adminUrl })` (`src/lib/email/client.tsx`) :
      - Render HTML via `ReminderEmail` template
      - `adminUrl = "${env.AUTH_URL}/admin/demandes/${member.id}"` — lien direct vers la demande
      - POST à `https://api.brevo.com/v3/smtp/email`
      - Objet : `"[OPEN PF] Demande en attente — ${memberName}"`

   e. **Enregistrement du log** — `INSERT INTO reminder_logs (memberId, type='validation_pending', emailTo=adminEmail)`. Si l'envoi email échoue, ce log n'est PAS inséré (le `catch` incrémente `skipped`).

5. **Retour** — `200 { ok: true, sent, skipped, processedAt: now.toISOString() }`.

## Règles métier

- **Authentification par secret** : en-tête `Authorization: Bearer CRON_SECRET` obligatoire — `src/app/api/cron/reminders/route.ts`
- **Type de relance `validation_pending`** : seul ce type est géré par le cron. Les types `submission_reminder`, `renewal_reminder`, `profile_incomplete` sont définis dans le schéma mais aucune logique ne les implémente dans le code lu — `src/lib/db/schema.ts`
- **Première relance à J+3** : `FIRST_REMINDER_DAYS = 3`, `daysBetween(submittedAt, now) >= 3` — `src/app/api/cron/reminders/route.ts`
- **Relances suivantes toutes les 7 jours** : `REPEAT_REMINDER_DAYS = 7`, `daysBetween(latestLog.sentAt, now) >= 7` — `src/app/api/cron/reminders/route.ts`
- **Un log par envoi** : chaque email envoyé génère une entrée dans `reminderLogs` — `src/app/api/cron/reminders/route.ts`
- **Log non inséré si email échoue** : le `catch` autour de l'envoi n'insère pas de log, donc la prochaine exécution du cron re-tentera l'envoi pour ce membre — `src/app/api/cron/reminders/route.ts`
- **Destinataire unique** : l'email est envoyé à `env.ADMIN_NOTIFICATION_EMAIL` (adresse unique configurée en variable d'environnement)

## Données

- **`members`** (lecture) : `id`, `name`, `submittedAt`, filtrés sur `status='submitted'` — `src/lib/db/schema.ts`
- **`reminderLogs`** (lecture + écriture) : `memberId`, `type`, `sentAt`, `emailTo` — lecture pour calculer le délai, écriture après envoi — `src/lib/db/schema.ts`
- **`env.CRON_SECRET`** : secret d'authentification du cron — `src/lib/env.ts`
- **`env.ADMIN_NOTIFICATION_EMAIL`** : adresse email de l'admin destinataire — `src/lib/env.ts`
- **`env.AUTH_URL`** : pour construire l'URL `adminUrl` dans l'email — `src/lib/env.ts`

## Intégrations

- **Brevo (API REST)** : `POST https://api.brevo.com/v3/smtp/email` — envoi de l'email de relance à l'admin. Sens : écriture (sortant). Les erreurs HTTP non-2xx lèvent une exception capturée dans le `catch` — `src/lib/email/client.tsx`
- **Scheduler Vercel** : planification du cron (non visible dans les fichiers lus — probablement dans `vercel.json`)

## Risques

- **Pas d'atomicité email/log** : si `sendReminderEmail()` réussit mais que l'insertion dans `reminderLogs` échoue (rare mais possible sur Neon), un email sera ré-envoyé à la prochaine exécution — `src/app/api/cron/reminders/route.ts`. L'inverse (log sans email) est impossible.
- **Boucle synchrone sans batch** : le cron traite les membres **un par un** dans une boucle `for...of`, avec deux requêtes DB par membre (lecture log + envoi + insertion log). Avec 50 membres, c'est acceptable, mais ce n'est pas conçu pour de grands volumes.
- **Absence de limite de fréquence** : rien n'empêche d'appeler l'endpoint plusieurs fois par jour manuellement (avec le CRON_SECRET). Une double exécution le même jour n'enverrait pas de doublon (le `daysBetween` le bloquerait), mais c'est une surface d'abus potentielle.
- **Types de relance non implémentés** : `submission_reminder`, `renewal_reminder`, `profile_incomplete` sont définis dans `reminderTypeEnum` mais aucune logique ne les déclenche dans le code vu. Ces emails ne sont pas envoyés.

## Questions ouvertes

- **Planification Vercel** : à quelle heure et à quelle fréquence le cron est-il déclenché ? `vercel.json` n'a pas été lu.
- **Relances post-rejet ou post-profil-incomplet** : les types `renewal_reminder` et `profile_incomplete` dans l'enum suggèrent des fonctionnalités à venir. Quand et par qui seront-elles déclenchées ?
- **Journal admin** : `src/app/admin/relances/page.tsx` affiche les relances envoyées. Cette page n'a pas été lue — elle lit probablement `reminderLogs` directement.

## Preuves
- `src/app/api/cron/reminders/route.ts`
- `src/lib/email/client.tsx`
- `src/lib/db/schema.ts`
