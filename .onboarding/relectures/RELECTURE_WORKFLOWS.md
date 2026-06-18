# Relecture des workflows — open-pf (refonte)

> Produit par l'agent « Chef d'Onboarding » (ONBAAA-47) le 2026-06-18.  
> Fondée sur la lecture directe de tous les fichiers WORKFLOW_*.md et de CARTE_DES_DOMAINES.md.  
> **Ne pas modifier manuellement** — toute correction doit passer par une nouvelle exécution de l'étape 2b.

---

## Verdict global

**Acceptable avec réserves**

Les 12 workflows sont documentés avec soin, couvrent les domaines identifiés dans la carte, et atteignent un niveau de confiance `high` pour 11 d'entre eux. Plusieurs bugs réels sont correctement identifiés et transparents. Cependant, **deux problèmes bloquants transverses** doivent être résolus avant de passer à l'implémentation, et plusieurs lacunes mineures méritent correction pour garantir l'autonomie des fichiers.

---

## Workflows manquants

Par rapport à la carte des domaines :

- **Déconnexion admin** (`signOut()`) — mentionnée comme non tracée dans WORKFLOW_CONNEXION_ADMIN mais absente en tant que workflow autonome. La carte des domaines attendait « connexion admin » mais pas explicitement la déconnexion ; toutefois, un admin sans `signOut()` documenté est un trou de sécurité non couvert.
- **Consultation du tableau de bord admin** — le domaine `backoffice` liste « consultation du tableau de bord » comme workflow attendu (`admin/page.tsx`), mais aucun WORKFLOW_TABLEAU_DE_BORD.md n'existe. Acceptable en scope réduit mais à noter.
- **Consultation du journal des relances** (`admin/relances/page.tsx`) — mentionnée dans WORKFLOW_RELANCE_AUTOMATIQUE comme non lue, sans workflow dédié. Confiance partielle sur ce point.
- **Upload image d'actualité** (`api/upload/news-image/route.ts`) — la carte des domaines liste cet endpoint, WORKFLOW_GESTION_ACTUALITES le mentionne mais ne le trace pas. Aucun WORKFLOW_UPLOAD_NEWS_IMAGE.md n'existe.
- **Réactivation d'un membre désactivé** — `deactivateMember()` est tracée dans WORKFLOW_VALIDATION_ADMIN_DEMANDE, mais la procédure inverse (réactivation) n'est pas documentée, ni dans ce workflow ni ailleurs.

---

## Par workflow

---

### WORKFLOW_ANNUAIRE_PUBLIC

**Verdict** : Acceptable avec réserves

**Problèmes** :
- [BLOQUANT] Le risque d'injection SQL via `ILIKE` sans limite de longueur sur le paramètre `q` est identifié mais sans recommandation d'action. Ce point doit être résolu avant implémentation (ajout d'une validation Zod sur la longueur du paramètre).
- [BLOQUANT] `approveMember()` ne déclenche pas `revalidatePath('/adherents')` : les membres nouvellement approuvés sont invisibles dans l'annuaire pendant jusqu'à 1 heure. Le workflow le signale mais ne tranche pas sur la correction attendue.
- [MINEUR] La page `adherents/[slug]/page.tsx` est listée comme point d'entrée mais signalée comme « non lue directement » — le contenu de la fiche publique n'est pas tracé. Lacune d'autonomie.
- [MINEUR] Absence de pagination documentée comme risque, mais pas de recommandation chiffrée (seuil acceptable, `LIMIT` DB à prévoir).

---

### WORKFLOW_CONNEXION_ADMIN

**Verdict** : Acceptable avec réserves

**Problèmes** :
- [BLOQUANT] Absence totale de rate limiting / protection brute-force. Le workflow l'identifie mais sans proposer de solution. Pour un back-office avec un seul admin, c'est un vecteur d'attaque réel.
- [BLOQUANT] Admin désactivé (`isActive: false`) conserve sa session JWT jusqu'à expiration. Le middleware edge ne vérifie pas la DB. Ce comportement doit être documenté comme décision explicite (TTL court obligatoire) ou corrigé.
- [MINEUR] Flux de déconnexion (`signOut()`) non tracé. Le fichier le signale comme question ouverte mais sans workflow dédié.
- [MINEUR] Contraintes exactes de `adminLoginSchema` (longueur mot de passe, format email) non vérifiées.
- [MINEUR] Durée de la session JWT (`maxAge`) non tracée — information critique pour la sécurité.

---

### WORKFLOW_CONTACT_PUBLIC

**Verdict** : Bon

**Problèmes** :
- [MINEUR] Aucune trace en DB des messages de contact. Si l'email Brevo est perdu (quota épuisé, erreur réseau), le message disparaît sans recours. Le workflow l'identifie mais ne propose pas d'alternative (ex. table `contactMessages`).
- [MINEUR] Pas de rate limiting sur `submitContact()`. Le risque de spam / épuisement des quotas Brevo est réel mais pas priorisé.
- [MINEUR] Le champ honeypot anti-bot est CSS-dépendant : si le CSS ne charge pas, un humain légitime peut bloquer son message. Comportement edge-case non géré.

---

### WORKFLOW_EDITION_FICHE_ADHERENT

**Verdict** : Acceptable avec réserves

**Problèmes** :
- [BLOQUANT] Pas de transaction sur les insertions dans `members`, `memberActivities`, `memberCertifications` : incohérence DB possible en cas d'échec intermédiaire. Le workflow cite la limitation Neon HTTP driver mais ne documente pas le comportement attendu en cas de rollback partiel.
- [BLOQUANT] Comportement post-soumission non documenté : redirection vers la fiche publique ? Message de confirmation ? L'UX post-`submitMemberProfile()` est inconnue.
- [MINEUR] Token visible dans l'URL (logs, historique navigateur, en-têtes Referer). Le risque est signalé sans mitigation proposée.
- [MINEUR] Page accessible avec `usedAt` non null : UX dégradée sans explication claire à l'adhérent.
- [MINEUR] Composant `profile-form.tsx` non lu — la structure du formulaire d'édition est entièrement opaque.

---

### WORKFLOW_GESTION_ACTUALITES

**Verdict** : Acceptable avec réserves

**Problèmes** :
- [BLOQUANT] `jsonLd` non alimenté par `upsertNews()`. Les données structurées `Article` (SEO) sont absentes de toutes les actualités publiées. Le CLAUDE.md §13 impose `JSON-LD` sur les articles — c'est un manquement direct aux règles du projet.
- [BLOQUANT] Collision de slug non gérée : `toSlug(title)` sans vérification d'unicité → erreur DB (UNIQUE constraint) non catchée et non présentée à l'admin. Comportement indéfini en production.
- [MINEUR] `publishedAt` réécrit à `now()` à chaque sauvegarde si le statut reste `published`. Un article republié sans modification verra sa date de publication modifiée — comportement probablement non souhaité.
- [MINEUR] `deleteNews()` est immédiate et irréversible. Pas de soft-delete ni de confirmation UI documentée.

---

### WORKFLOW_GESTION_OFFRES_EMPLOI

**Verdict** : Acceptable avec réserves

**Problèmes** :
- [BLOQUANT] `revalidatePath('/offres-emploi')` absent dans `upsertJob()`. Les offres publiées restent invisibles en page publique jusqu'à la prochaine revalidation ISR. Bug fonctionnel confirmé.
- [BLOQUANT] `jsonLd` non alimenté : données structurées `JobPosting` absentes. Même constat que pour les actualités, même violation du CLAUDE.md §13.
- [MINEUR] `publishedAt` réécrit à `now()` à chaque sauvegarde si statut `published` — même problème que pour les actualités.
- [MINEUR] `expiresAt` non géré automatiquement. Les offres expirées restent publiées sans cron de clôture.

---

### WORKFLOW_MAGIC_LINK_ENVOI

**Verdict** : Acceptable avec réserves

**Problèmes** :
- [BLOQUANT] Token inséré en DB **avant** l'appel Brevo. Si Brevo échoue, un token valide existe en DB sans que l'adhérent ait reçu le lien. Comportement dangereux (token orphelin utilisable si l'URL est devinée).
- [BLOQUANT] Anciens tokens non invalidés lors d'un nouvel envoi. Plusieurs tokens actifs pour un même membre peuvent coexister, augmentant la surface d'attaque.
- [MINEUR] Aucune entrée dans `auditLog` pour l'envoi de magic link, contrairement à `approveMember()` et `rejectMember()`. Incohérence d'audit.
- [MINEUR] Pas de rate limit sur `sendMagicLink()` : l'admin peut générer des dizaines de tokens en boucle.

---

### WORKFLOW_MISE_A_JOUR_PARAMETRES

**Verdict** : À corriger

**Problèmes** :
- [BLOQUANT] Confiance `medium` auto-déclarée : la page `/admin/parametres` et le composant `site-stats-form.tsx` n'ont pas été lus. Le périmètre réel du workflow est inconnu (gère-t-il aussi bureau, partenaires, frise ?). Ce workflow est **incomplet** — il ne couvre que `updateSiteStats()`.
- [BLOQUANT] Ambiguïté non résolue entre `src/lib/data/board-members.ts` (fichier statique) et la table `team_members` en DB, signalée aussi dans la carte des domaines. Le workflow ne prend pas position.
- [BLOQUANT] Pas de validation Zod côté serveur sur `employeeCount`. La règle §3 du CLAUDE.md impose Zod sur **toute** donnée externe. Violation directe.
- [MINEUR] Pas d'audit log sur la mise à jour des paramètres — incohérence avec les autres actions admin.
- [MINEUR] `siteStats.memberCount` et `domainCount` : champs DB ou calculés ? Non résolu, alors que ces valeurs s'affichent en page d'accueil et dans l'annuaire.

---

### WORKFLOW_RELANCE_AUTOMATIQUE

**Verdict** : Bon

**Problèmes** :
- [MINEUR] Pas d'atomicité email/log : si l'insertion du log échoue après l'envoi réussi de l'email, la relance sera renvoyée au prochain cycle. Doublon possible. Le workflow l'identifie correctement.
- [MINEUR] `renewal_reminder`, `validation_pending`, `profile_incomplete` définis dans le schema enum mais non implémentés. Le workflow le signale sans indiquer qui doit les implémenter ni à quelle phase.
- [MINEUR] `vercel.json` non lu : la fréquence réelle du cron est inconnue.
- [MINEUR] La page `admin/relances/page.tsx` (journal des envois) n'a pas été lue.

---

### WORKFLOW_SOUMISSION_ADHESION

**Verdict** : Acceptable avec réserves

**Problèmes** :
- [BLOQUANT] `legalStatus` collecté comme champ obligatoire à l'étape 1 mais inséré comme `legalStatusId: null` en DB. La valeur est **silencieusement perdue**. Bug confirmé, non résolu dans le workflow.
- [BLOQUANT] Pas de transaction sur les insertions multi-tables (limitation Neon HTTP). Un membre peut se retrouver `submitted` en DB sans ses contacts, domaines ou certifications. Le workflow le signale correctement mais ne documente pas le comportement de récupération attendu.
- [BLOQUANT] Email de confirmation promis à l'entreprise dans l'UI (« Vous recevrez une confirmation par email sous 48 h ») mais aucun envoi email dans `submitAdhesion()`. Le workflow pose la question sans la résoudre — cela doit être tranché avant implémentation.
- [MINEUR] Double soumission possible via appel direct à la Server Action (protection client-side uniquement).
- [MINEUR] Brouillon corrompu dans `localStorage` ignoré silencieusement, sans message utilisateur.
- [MINEUR] Le chargement des référentiels (`activityDomains`, `certifications`, `legalStatuses`) n'est pas tracé — les composants d'étapes semblent les recevoir sans que la source soit documentée.

---

### WORKFLOW_UPLOAD_LOGO

**Verdict** : Bon

**Problèmes** :
- [MINEUR] Anciens logos non supprimés de Vercel Blob lors d'un remplacement. Accumulation de fichiers orphelins sans coût explicite documenté.
- [MINEUR] Logo non lié automatiquement à la fiche : l'URL retournée par l'endpoint doit être incluse dans la soumission du `ProfileForm` — si ce formulaire échoue séparément, le fichier est orphelin sur Blob.
- [MINEUR] Comportement de `ProfileForm` après retour de l'URL non tracé (composant non lu).

---

### WORKFLOW_VALIDATION_ADMIN_DEMANDE

**Verdict** : Acceptable avec réserves

**Problèmes** :
- [BLOQUANT] Pas de confirmation UI avant `rejectMember()`. L'action est irréversible (passage à `draft`) sans modale ni saisie du motif. Le workflow l'identifie comme TODO mais sans décision.
- [MINEUR] `deactivateMember()` ne renseigne pas `reviewedAt`/`reviewedBy` sur `members`. Incohérence avec `approveMember()` et `rejectMember()` qui le font.
- [MINEUR] La page de détail `/admin/demandes/[id]` est limitée aux membres au statut `submitted` via `notFound()`. Les membres `active` ou `draft` sont inaccessibles via cette route — potentiellement intentionnel mais non documenté.
- [MINEUR] Re-soumission d'un membre `draft` (rejeté) non tracée : risque de collision de slug si le même membre resoumet avec le même nom.

---

## Cohérence croisée

Les points suivants ont été vérifiés entre workflows :

| Point de cohérence | Verdict |
|---|---|
| `revalidatePath` après approbation membre | **Incohérent** : `approveMember()` ne revalide pas `/adherents` (identifié dans ANNUAIRE_PUBLIC) |
| `jsonLd` dans news et jobOffers | **Cohérent** : les deux workflows signalent le même problème — le champ est vide dans les deux cas |
| Token magic link : insertion avant vs après email | **Cohérent** : MAGIC_LINK_ENVOI et UPLOAD_LOGO utilisent le même mécanisme, même risque documenté dans les deux |
| Audit log : couverture des actions admin | **Incohérent** : `approveMember()`/`rejectMember()` → auditLog ✓, `sendMagicLink()` → auditLog ✗, `updateSiteStats()` → auditLog ✗ |
| Validation Zod côté serveur | **Incohérent** : présente dans toutes les actions sauf `updateSiteStats(employeeCount)` |
| Limitation Neon HTTP (pas de transactions) | **Cohérent** : signalée dans SOUMISSION_ADHESION et EDITION_FICHE_ADHERENT avec la même explication |

---

## Synthèse des points bloquants

| # | Workflow(s) | Problème |
|---|---|---|
| B1 | SOUMISSION_ADHESION | `legalStatusId: null` en DB malgré champ obligatoire |
| B2 | SOUMISSION_ADHESION, EDITION_FICHE_ADHERENT | Pas de transaction (Neon HTTP) — comportement de récupération non documenté |
| B3 | SOUMISSION_ADHESION | Email de confirmation promis dans l'UI mais non envoyé — à trancher |
| B4 | ANNUAIRE_PUBLIC | `approveMember()` ne revalide pas `/adherents` — membres invisibles 1h |
| B5 | ANNUAIRE_PUBLIC | Injection SQL via `ILIKE` sans limite de longueur sur `q` |
| B6 | CONNEXION_ADMIN | Pas de rate limiting / brute-force protection |
| B7 | CONNEXION_ADMIN | Session JWT persistante après désactivation admin (`isActive: false`) |
| B8 | MAGIC_LINK_ENVOI | Token inséré avant envoi email — token orphelin si Brevo échoue |
| B9 | MAGIC_LINK_ENVOI | Tokens anciens non invalidés — accumulation de tokens actifs |
| B10 | GESTION_ACTUALITES, GESTION_OFFRES_EMPLOI | `jsonLd` jamais alimenté — violation CLAUDE.md §13 |
| B11 | GESTION_ACTUALITES | Collision de slug non gérée — erreur DB non catchée |
| B12 | GESTION_OFFRES_EMPLOI | `revalidatePath('/offres-emploi')` absent — offres publiées invisibles |
| B13 | VALIDATION_ADMIN_DEMANDE | Pas de confirmation UI avant rejet irréversible |
| B14 | MISE_A_JOUR_PARAMETRES | Workflow incomplet (page et composant non lus) + Zod absent côté serveur |
| B15 | EDITION_FICHE_ADHERENT | Comportement post-soumission non documenté (UX inconnue) |
