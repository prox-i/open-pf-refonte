# WORKFLOW_VALIDATION_ADMIN_DEMANDE — Traitement d'une demande d'adhésion par l'admin

## Classification
- **Type** : backoffice_flow
- **Sous-type** : décision manuelle sur cycle de vie d'entité + audit trail
- **Visibilité** : internal_user
- **Acteur principal** : Administrateur OPEN PF
- **Acteurs** : Admin (navigateur), middleware Next.js (protection de route), serveur Next.js (Server Actions), base de données PostgreSQL, composant `MemberActions`
- **Criticité** : Haute — c'est la seule porte entre `submitted` et `active` ; sans ce workflow, aucun membre ne peut apparaître dans l'annuaire public
- **Confiance** : high
- **Justification** : L'ensemble du flux a été tracé depuis la page de détail admin jusqu'aux Server Actions, en passant par le composant d'actions et le schéma DB. Tous les fichiers cités ont été ouverts.

## Objectif

Permettre à l'administrateur de consulter une demande d'adhésion soumise (`status: 'submitted'`) et de prendre une décision : approuver (→ `active`), rejeter (→ `draft`), ou envoyer un magic link pour que l'adhérent complète sa fiche. Chaque action est tracée dans `auditLog`. La désactivation d'un adhérent déjà actif est également couverte dans ce même workflow.

## Acteurs
- **Admin** : unique utilisateur interne, authentifié via session JWT Auth.js
- **Middleware Next.js** (`src/middleware.ts`) : bloque l'accès si session absente, redirige vers `/admin/login`
- **Composant `MemberActions`** : UI client déclenchant les actions
- **Server Actions** : `approveMember()`, `rejectMember()`, `deactivateMember()`, `sendMagicLink()` — toutes dans `src/lib/actions/admin/members.ts`
- **Base de données PostgreSQL** : `members`, `auditLog`, `memberTokens`, `memberContacts`

## Points d'entrée
- `src/app/admin/demandes/page.tsx` — liste des demandes `submitted` (non lu directement)
- `src/app/admin/demandes/[id]/page.tsx` — page de détail d'une demande
- `src/components/admin/member-actions.tsx` — composant client avec les boutons d'action
- `src/lib/actions/admin/members.ts` — Server Actions `approveMember()`, `rejectMember()`, `deactivateMember()`, `sendMagicLink()`

## Étapes principales

### A. Consultation de la demande

1. **Accès à la liste** — L'admin navigue vers `/admin/demandes`. Le middleware `src/middleware.ts` vérifie la session JWT (`req.auth`). Si absente, redirection vers `/admin/login?callbackUrl=/admin/demandes`.

2. **Accès au détail** — L'admin clique sur une demande. La page `src/app/admin/demandes/[id]/page.tsx` charge le membre via `db.select().from(members).where(eq(members.id, id))`. Si le membre n'existe pas ou si `member.status !== 'submitted'`, la page retourne `notFound()`.

3. **Affichage des données** — La page affiche les informations du membre, ses contacts (`memberContacts`), et ses domaines d'activité (`memberActivities`). Le composant `MemberActions` est rendu avec `memberId` et `status`.

### B. Approbation

4. **Clic sur « Approuver »** — Visible uniquement quand `status === 'submitted'`. Appel à `approveMember(memberId)` (`src/lib/actions/admin/members.ts`).

5. **Vérification de session** — `requireAdmin()` appelle `auth()` et vérifie `session?.user?.id`. Lève une erreur `'Non autorisé'` si absent.

6. **Mise à jour du statut** — `UPDATE members SET status='active', reviewedAt=now(), reviewedBy=adminId WHERE id=memberId`.

7. **Écriture audit** — `INSERT INTO audit_log (adminId, action='member.approve', targetType='member', targetId=memberId)`.

8. **Invalidation du cache** — `revalidatePath('/admin/demandes')` et `revalidatePath('/admin/adherents')`.

9. **Redirection** — Le composant `MemberActions` redirige vers `/admin/demandes` après succès.

### C. Rejet

4b. **Clic sur « Refuser »** — Visible uniquement quand `status === 'submitted'`. Appel à `rejectMember(memberId, reason?)`.

5b. **Vérification de session** — Même logique que l'approbation.

6b. **Mise à jour du statut** — `UPDATE members SET status='draft', reviewedAt=now(), reviewedBy=adminId WHERE id=memberId`. Le membre repasse en `draft` (non `inactive` : il peut re-soumettre).

7b. **Écriture audit** — `INSERT INTO audit_log (..., action='member.reject', data={reason})` — le motif de refus est stocké dans `data JSONB` si fourni.

8b. **Invalidation du cache** — `revalidatePath('/admin/demandes')`.

### D. Désactivation

4c. **Clic sur « Désactiver »** — Visible uniquement quand `status === 'active'`. Appel à `deactivateMember(memberId)`.

6c. **Mise à jour du statut** — `UPDATE members SET status='inactive' WHERE id=memberId`. Aucun `reviewedAt`/`reviewedBy` écrit ici.

7c. **Écriture audit** — `INSERT INTO audit_log (..., action='member.deactivate', ...)`.

8c. **Invalidation du cache** — `revalidatePath('/admin/adherents')`.

### E. Envoi du magic link (depuis la même page)

Le bouton « Envoyer le lien fiche » est visible pour les statuts `submitted`, `active`, et `draft`. Ce flux est documenté en détail dans `WORKFLOW_MAGIC_LINK_ENVOI.md`.

## Règles métier

- **Session admin requise** : toute action appelle `requireAdmin()` qui vérifie `session?.user?.id` — `src/lib/actions/admin/members.ts`
- **Page de détail filtrée sur `submitted`** : `member.status !== 'submitted'` → `notFound()` sur la page de détail d'une demande — `src/app/admin/demandes/[id]/page.tsx`
- **Approbation → `active`** : `status` passe à `'active'`, `reviewedAt` et `reviewedBy` sont renseignés — `src/lib/actions/admin/members.ts`
- **Rejet → `draft`** (pas `inactive`) : le membre peut être re-soumis ultérieurement — `src/lib/actions/admin/members.ts`
- **Désactivation → `inactive`** (sans écriture de `reviewedAt`) : distinguée de l'approbation/rejet dans l'audit — `src/lib/actions/admin/members.ts`
- **Toute action admin est tracée** : chaque mutation écrit dans `auditLog` avec `action`, `targetType`, `targetId` — `src/lib/actions/admin/members.ts`
- **Motif de rejet optionnel** : `rejectMember(memberId, reason?)` — le motif est stocké en JSONB, `reason` est optionnel — `src/lib/actions/admin/members.ts`

## Données

- **`members`** (lecture + écriture) : `status`, `reviewedAt`, `reviewedBy` modifiés selon l'action — `src/lib/db/schema.ts`
- **`memberContacts`** (lecture) : contacts affichés sur la page de détail — `src/app/admin/demandes/[id]/page.tsx`
- **`memberActivities`** (lecture) : domaines d'activité affichés sur la page de détail — `src/app/admin/demandes/[id]/page.tsx`
- **`auditLog`** (écriture) : chaque action insère `adminId`, `action`, `targetType`, `targetId`, `data` optionnel — `src/lib/db/schema.ts`

## Intégrations

- **Magic link** : `sendMagicLink()` peut être déclenché depuis cette même page (voir `WORKFLOW_MAGIC_LINK_ENVOI.md`). Elle appelle `sendMagicLinkEmail()` qui contacte l'API Brevo.

## Risques

- **Pas de confirmation avant rejet** : le bouton « Refuser » dans `MemberActions` appelle directement `rejectMember()` sans modale de confirmation ni saisie de motif — `src/components/admin/member-actions.tsx`. Le motif de rejet (`reason?`) n'est pas collecté dans l'interface actuelle.
- **Pas de contrôle de double-action** : rien n'empêche deux administrateurs (si jamais plusieurs existaient) d'approuver ou rejeter simultanément. La dernière écriture gagne en silence.
- **`deactivateMember` ne renseigne pas `reviewedAt`/`reviewedBy`** : la traçabilité de la désactivation n'est qu'en `auditLog`, pas directement sur `members.reviewedAt` — `src/lib/actions/admin/members.ts`.
- **Page de détail limitée au statut `submitted`** : un membre `active` ou `draft` ne peut pas être consulté via `/admin/demandes/[id]` (→ `notFound()`). La page admin pour les membres actifs est `/admin/adherents/[id]` (non lue dans cette analyse).

## Questions ouvertes

- **Saisie du motif de rejet** : `rejectMember` accepte un `reason?` mais `MemberActions` ne collecte pas ce motif (pas de champ input visible). Est-ce un TODO UI manquant ?
- **Page `/admin/adherents/[id]`** : comment l'admin désactive-t-il un membre actif ? `MemberActions` est-il aussi utilisé sur cette page ?
- **Interface de ré-adhésion** : un membre `draft` (rejeté) peut-il re-soumettre depuis l'interface publique avec un nouveau formulaire, ou le slug existant crée-t-il une collision ?

## Preuves
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`
- `src/lib/actions/admin/members.ts`
- `src/lib/db/schema.ts`
- `src/middleware.ts`
