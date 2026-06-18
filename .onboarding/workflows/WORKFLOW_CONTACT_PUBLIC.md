# WORKFLOW_CONTACT_PUBLIC — Formulaire de contact public

## Classification
- **Type** : user_journey
- **Sous-type** : formulaire de contact avec protection anti-bot + envoi email transactionnel
- **Visibilité** : external_user
- **Acteur principal** : Visiteur anonyme du site
- **Acteurs** : Visiteur (navigateur), serveur Next.js (Server Action), API Brevo (email), admin (destinataire)
- **Criticité** : Basse — canal de communication secondaire, le site fonctionne sans lui
- **Confiance** : high
- **Justification** : Server Action `submitContact()` et `sendContactEmail()` lues en intégralité. Validation Zod, honeypot anti-bot, et envoi Brevo entièrement tracés.

## Objectif

Permettre à tout visiteur du site d'envoyer un message à l'équipe OPEN PF via un formulaire. Le message est transmis par email à l'adresse admin configurée en variable d'environnement. Aucune trace n'est conservée en base de données. Un honeypot protège contre les bots.

## Acteurs
- **Visiteur anonyme** : aucune authentification requise
- **Serveur Next.js** : exécute `submitContact()`, valide les données, décide d'envoyer ou non
- **API Brevo** : service d'envoi de l'email de contact
- **Admin** : destinataire unique de tous les messages de contact

## Points d'entrée
- `src/app/(public)/contact/page.tsx` — page publique avec le formulaire (non lue directement)
- `src/components/public/contact-form.tsx` — composant du formulaire (non lu directement)
- `src/lib/actions/contact.ts` — Server Action `submitContact(raw)`

## Étapes principales

1. **Accès à la page** — Le visiteur accède à `/contact`. Aucune protection par middleware.

2. **Saisie du formulaire** — Le visiteur remplit : nom, email, sujet, message. Le formulaire contient également un champ caché `company` (honeypot, invisible pour l'utilisateur humain).

3. **Soumission** — Appel à `submitContact(raw)` — `src/lib/actions/contact.ts`.

4. **Validation Zod** — `contactSchema.safeParse(raw)` (`src/lib/validations/contact.ts` — non lu directement) : si invalide, retourne `{ success: false, errors }`.

5. **Détection bot (honeypot)** — `if (company) return { success: true }` : si le champ `company` est renseigné (un bot l'a rempli), l'action retourne un succès silencieux sans envoyer d'email. Le bot n'est pas informé du blocage.

6. **Envoi de l'email** — `sendContactEmail({ to: env.ADMIN_NOTIFICATION_EMAIL, name, email, subject, message })` (`src/lib/email/client.tsx`) :
   - Render HTML via `ContactEmail` template
   - POST à `https://api.brevo.com/v3/smtp/email`
   - Objet : `"[Contact OPEN PF] ${subject} — ${name}"`
   - `replyTo: { email, name }` — l'admin peut répondre directement au visiteur

7. **Retour** — En cas de succès : `{ success: true }`. Si `sendContactEmail()` lève une erreur : `{ success: false, message: "L'envoi a échoué. Réessayez ou écrivez-nous directement à contact@open.pf." }`.

## Règles métier

- **Validation Zod des champs** : champs obligatoires (nom, email, sujet, message) validés via `contactSchema` — `src/lib/actions/contact.ts`
- **Honeypot anti-bot** : champ `company` caché ; si renseigné → succès silencieux sans envoi — `src/lib/actions/contact.ts`
- **Pas de persistance en DB** : aucune trace du message n'est enregistrée — `src/lib/actions/contact.ts`
- **Destinataire unique** : `env.ADMIN_NOTIFICATION_EMAIL` — `src/lib/actions/contact.ts`
- **Reply-To dynamique** : l'email de réponse est celui du visiteur, permettant une réponse directe — `src/lib/email/client.tsx`

## Données

- **Aucune entité DB écrite** : le message transite uniquement par email, sans persistance
- **`env.ADMIN_NOTIFICATION_EMAIL`** : adresse email de destination — `src/lib/env.ts`
- **`env.BREVO_API_KEY`** : clé API Brevo — `src/lib/env.ts`

## Intégrations

- **Brevo (API REST)** : `POST https://api.brevo.com/v3/smtp/email` — envoi du message à l'admin. Sens : écriture (sortant). Erreur HTTP non-2xx lève une exception — `src/lib/email/client.tsx`

## Risques

- **Aucune trace en cas de litige** : si un visiteur prétend avoir contacté le bureau et que l'email Brevo est perdu (bounce, filtre spam), il n'y a aucune trace en DB pour vérifier — `src/lib/actions/contact.ts`
- **Pas de rate limiting** : un acteur malveillant peut appeler `submitContact()` en boucle pour spammer l'admin ou consommer des quotas Brevo. Le honeypot ne protège pas contre les appels directs à la Server Action.
- **Honeypot CSS-dépendant** : l'efficacité du honeypot dépend de l'invisibilité du champ `company` via CSS. Si le CSS ne charge pas, un humain peut voir et remplir ce champ, bloquant son propre message silencieusement.
- **Pas de confirmation à l'expéditeur** : le visiteur reçoit un message de succès à l'écran mais aucun email de confirmation. S'il a fait une faute dans son adresse email, il ne le saura jamais.

## Questions ouvertes

- **`contactSchema`** (`src/lib/validations/contact.ts`) : non lu directement. Les contraintes exactes sur les champs (longueur min/max, format du sujet) sont supposées cohérentes avec l'UX mais non vérifiées.
- **Composant `ContactForm`** (`src/components/public/contact-form.tsx`) : non lu directement. Le formulaire utilise-t-il `react-hook-form` comme les autres formulaires ? Le champ `company` est-il effectivement masqué via CSS ou `type="hidden"` ?

## Preuves
- `src/lib/actions/contact.ts`
- `src/lib/email/client.tsx`
- `src/lib/db/schema.ts`
