# CAHIER_RECETTE.md — Base de recette OPEN PF

> Produit par l'agent Rédacteur (ONBAAA-50) le 2026-06-18.  
> Dérivé des workflows WORKFLOW_*.md, de RELECTURE_WORKFLOWS.md, et de tous les audits *_AUDIT.md.  
> Chaque point de contrôle est sourcé sur un ou plusieurs workflows ou audits.  
> **Zones à faible confiance signalées** : certains composants n'ont pas été lus directement par les agents amont — les points correspondants sont marqués ⚠ INCERTAIN.

---

## Mode d'emploi

Ce document est la référence de validation fonctionnelle. Il répond à la question : **« Comment prouver qu'une fonctionnalité livrée fait ce qu'elle doit faire ? »**

Organisation :
- **Section 1** : checklists par domaine fonctionnel
- **Section 2** : cas de test prioritaires issus des 12 workflows
- **Section 3** : points de régression issus des audits — à revérifier lors de chaque modification des fichiers concernés

---

## Section 1 — Checklists par domaine

---

### 1.1 Adhésion (cœur)

Sources : WORKFLOW_SOUMISSION_ADHESION.md, WORKFLOW_VALIDATION_ADMIN_DEMANDE.md, DB_AUDIT.md, FORMS_AUDIT.md

#### Ce qui doit fonctionner

- [ ] Le formulaire `/adhesion` s'affiche sans authentification
- [ ] L'étape 1 (identité) valide : raison sociale obligatoire (≥ 2 chars), statut juridique obligatoire, n° TAHITI format `/^[0-9]{6}[A-Z]?$/` si renseigné, description ≤ 500 chars, URL du site format URL si renseignée
- [ ] L'étape 2 (contacts) exige au moins 1 contact avec `isPrimary: true`
- [ ] L'étape 3 (domaines) exige au moins 1 domaine sélectionné
- [ ] L'étape 4 (certifications) est optionnelle et ne bloque pas la navigation
- [ ] L'étape 5 (récapitulatif) exige le consentement RGPD coché
- [ ] Le brouillon est sauvegardé en continu dans `localStorage['adhesion-draft']` et restauré au rechargement
- [ ] La soumission crée un enregistrement `members` avec `status: 'submitted'` et un `slug` unique
- [ ] **[BUG À CORRIGER AVANT RECETTE]** Le statut juridique (`legalStatus`) est bien mappé vers `legalStatusId` en DB — vérifier que `members.legal_status_id` n'est plus `null` après soumission (bug B1, source : DB_AUDIT.md)
- [ ] Les contacts, domaines et certifications sont présents en DB après soumission (vérifier les 4 tables : `members`, `memberContacts`, `memberActivities`, `memberCertifications`)
- [ ] L'écran de confirmation s'affiche après soumission réussie
- [ ] La double soumission (appel direct à la Server Action) ne crée pas de membre dupliqué sur le même slug

#### Ce que l'admin peut faire

- [ ] La page `/admin/demandes` liste les membres `status: 'submitted'`
- [ ] La page `/admin/demandes/[id]` affiche les détails d'une demande `submitted` et retourne 404 pour les autres statuts
- [ ] L'approbation passe le membre en `active`, renseigne `reviewedAt` et `reviewedBy`, et écrit dans `auditLog`
- [ ] Le rejet passe le membre en `draft` (pas `inactive`), renseigne `reviewedAt` et `reviewedBy`, écrit dans `auditLog` avec le motif si fourni
- [ ] La désactivation passe le membre en `inactive`, écrit dans `auditLog`
- [ ] **[BUG À CORRIGER AVANT RECETTE]** Une modale de confirmation s'affiche avant le rejet irréversible (bug B13, source : WORKFLOW_VALIDATION_ADMIN_DEMANDE.md)
- [ ] Après approbation, le membre apparaît dans l'annuaire public (`/adherents`) immédiatement — vérifier que `revalidatePath('/adherents')` est appelé (bug B4, source : PERF_AUDIT.md)

---

### 1.2 Annuaire public et fiche adhérent (cœur)

Sources : WORKFLOW_ANNUAIRE_PUBLIC.md, WORKFLOW_EDITION_FICHE_ADHERENT.md, WORKFLOW_UPLOAD_LOGO.md, PERF_AUDIT.md

#### Annuaire public

- [ ] `/adherents` n'affiche que les membres `status: 'active'`
- [ ] La recherche textuelle (`?q=`) filtre sur `name` et `description` (ILIKE insensible à la casse)
- [ ] Le filtre par domaine (`?domaine=`) restreint les résultats aux membres du domaine sélectionné
- [ ] Les pages filtrées (`?q=` ou `?domaine=` renseignés) ont `robots: { index: false }` dans les métadonnées
- [ ] La fiche publique `/adherents/[slug]` affiche un 404 si le membre n'existe pas ou n'est pas `active`
- [ ] Les chiffres clés (`siteStats`) s'affichent en en-tête de l'annuaire
- [ ] `generateMetadata` est présent sur `/adherents` et `/adherents/[slug]` avec titre, description, OpenGraph et canonical

#### Magic link et édition de fiche

- [ ] Accéder à `/fiche/{token invalide}` retourne 404
- [ ] Accéder à `/fiche/{token expiré}` retourne 404
- [ ] Accéder à `/fiche/{token valide}` affiche le formulaire pré-rempli avec les données existantes
- [ ] La sauvegarde brouillon (`saveMemberProfileDraft`) met à jour `members` sans marquer le token `usedAt`
- [ ] La soumission finale (`submitMemberProfile`) met à jour `members`, remplace intégralement les domaines et certifications, et marque le token `usedAt`
- [ ] Après soumission, le même token ne permet plus de modifier la fiche (sauvegarde/soumission retournent une erreur `Lien invalide ou expiré`)
- [ ] ⚠ INCERTAIN : `profile-form.tsx` non lu — vérifier manuellement le comportement post-soumission (redirection, message de confirmation)
- [ ] Téléverser un logo JPEG/PNG/WebP convertit en WebP (qualité 85, max 1200×1200)
- [ ] Téléverser un SVG conserve le format SVG
- [ ] Un fichier > 2 Mo est refusé avec un message d'erreur
- [ ] Un type de fichier non supporté (ex. PDF) est refusé
- [ ] Un logo uploadé avec un token expiré ou utilisé reçoit un 401

---

### 1.3 Contenu éditorial

Sources : WORKFLOW_GESTION_ACTUALITES.md, WORKFLOW_GESTION_OFFRES_EMPLOI.md, SEO_AUDIT.md

#### Actualités

- [ ] L'admin peut créer une actualité en `draft` — elle n'est pas visible sur `/actualites`
- [ ] L'admin peut publier une actualité — elle apparaît sur `/actualites` et `/actualites/[slug]`
- [ ] La publication déclenche `revalidatePath('/actualites')` ET `revalidatePath('/admin/actualites')`
- [ ] **[BUG À CORRIGER AVANT RECETTE]** La collision de slug (deux articles avec le même titre) est gérée proprement — message d'erreur visible pour l'admin, pas d'erreur DB non catchée (bug B11, source : WORKFLOW_GESTION_ACTUALITES.md)
- [ ] **[BUG À CORRIGER AVANT RECETTE]** `news.jsonLd` est alimenté avec le JSON-LD `Article` lors de la publication (bug B10, source : SEO_AUDIT.md)
- [ ] La suppression d'un article est irréversible — ⚠ INCERTAIN : vérifier si une confirmation UI est présente
- [ ] `generateMetadata` est présent sur `/actualites/[slug]` ⚠ INCERTAIN (page non lue par les agents amont)

#### Offres d'emploi

- [ ] L'admin peut créer/publier/clôturer une offre d'emploi
- [ ] **[BUG À CORRIGER AVANT RECETTE]** La publication/modification d'une offre existante déclenche `revalidatePath('/offres-emploi')` (bug B12, source : PERF_AUDIT.md)
- [ ] **[BUG À CORRIGER AVANT RECETTE]** `jobOffers.jsonLd` est alimenté avec le JSON-LD `JobPosting` lors de la publication (bug B10, source : SEO_AUDIT.md)
- [ ] Une offre liée à un membre (`memberId`) conserve le lien. Si le membre est supprimé, `memberId` passe à `null` sans erreur
- [ ] `generateMetadata` est présent sur `/offres-emploi/[slug]` ⚠ INCERTAIN

---

### 1.4 Institutionnel

Sources : WORKFLOW_CONTACT_PUBLIC.md, WORKFLOW_MISE_A_JOUR_PARAMETRES.md, ARCHITECTURE_AUDIT.md

#### Formulaire de contact

- [ ] Le formulaire `/contact` est accessible sans authentification
- [ ] Une soumission valide (nom, email, sujet, message) envoie un email à `ADMIN_NOTIFICATION_EMAIL` via Brevo
- [ ] Si le champ honeypot `company` est renseigné, l'action retourne `{ success: true }` sans envoi email
- [ ] En cas d'erreur Brevo, l'utilisateur voit le message de fallback avec l'adresse `contact@open.pf`
- [ ] Aucune trace du message n'est conservée en DB — comportement attendu documenté

#### Mise à jour des paramètres admin

- [ ] L'admin peut mettre à jour `employeeCount` depuis `/admin/parametres`
- [ ] La mise à jour déclenche `revalidatePath('/')` et `revalidatePath('/admin/parametres')`
- [ ] **[BUG À CORRIGER AVANT RECETTE]** La valeur reçue par `updateSiteStats` est validée par un schéma Zod côté serveur (violation CLAUDE.md §3 — source : FORMS_AUDIT.md)
- [ ] ⚠ INCERTAIN (confiance medium) : vérifier manuellement quels autres paramètres la page `/admin/parametres` gère (bureau, partenaires ?)
- [ ] ⚠ INCERTAIN : trancher la source de vérité entre `board-members.ts` et table `team_members` DB avant d'implémenter l'édition du bureau

---

### 1.5 Authentification

Sources : WORKFLOW_CONNEXION_ADMIN.md, WORKFLOW_MAGIC_LINK_ENVOI.md, AUTH_AUDIT.md

#### Connexion admin

- [ ] La page `/admin/login` est accessible sans session
- [ ] Un admin connecté sur `/admin/login` est redirigé vers `/admin`
- [ ] Toute route `/admin/*` (hors `/admin/login`) redirige vers `/admin/login?callbackUrl=...` si non connecté
- [ ] Un email/mot de passe valide établit une session et redirige vers `/admin`
- [ ] Un compte `isActive: false` ne peut pas se connecter
- [ ] Un mot de passe incorrect retourne un message d'erreur générique (sans révéler la raison exacte)
- [ ] `lastLoginAt` est mis à jour à chaque connexion réussie
- [ ] ⚠ INCERTAIN : vérifier la durée du cookie JWT — `session.maxAge` devrait être explicite dans `src/lib/auth/config.ts`
- [ ] **[RISQUE NON MITIGÉ]** Pas de rate limiting sur les tentatives de connexion — noter le risque en opérations (bug B6)

#### Magic link

- [ ] L'envoi d'un magic link depuis `/admin/demandes/[id]` ou `/admin/adherents/[id]` est disponible pour les statuts `submitted`, `active`, `draft` (pas `inactive`)
- [ ] L'email reçu par l'adhérent contient un lien `/fiche/{token}` fonctionnel
- [ ] **[BUG À CORRIGER AVANT RECETTE]** Lors d'un envoi de magic link, les anciens tokens non expirés du même membre sont invalidés avant l'insertion du nouveau (bug B9)
- [ ] **[BUG À CORRIGER AVANT RECETTE]** Le token n'est inséré en DB que si l'email Brevo a été envoyé avec succès (bug B8)
- [ ] L'envoi de magic link est tracé dans `auditLog` (incohérence actuelle — source : AUTH_AUDIT.md)

---

### 1.6 Relances automatiques

Sources : WORKFLOW_RELANCE_AUTOMATIQUE.md, DB_AUDIT.md

- [ ] L'endpoint `GET /api/cron/reminders` retourne 401 sans `Authorization: Bearer CRON_SECRET`
- [ ] Un membre `submitted` depuis ≥ 3 jours sans relance reçoit une première relance
- [ ] Un membre `submitted` ayant déjà reçu une relance il y a ≥ 7 jours en reçoit une nouvelle
- [ ] Chaque envoi crée une entrée dans `reminderLogs` avec `type: 'validation_pending'`
- [ ] Un membre `submitted` depuis 2 jours ne reçoit pas de relance
- [ ] L'email de relance contient un lien direct vers `/admin/demandes/{id}`
- [ ] La page `/admin/relances` affiche le journal des relances envoyées ⚠ INCERTAIN (page non lue)

---

## Section 2 — Cas de test prioritaires (happy path + edge cases)

---

### CT-01 : Adhésion complète du premier contact au membre actif (parcours intégral)

**Workflow** : SOUMISSION_ADHESION → VALIDATION_ADMIN_DEMANDE → MAGIC_LINK_ENVOI → EDITION_FICHE_ADHERENT

1. Remplir et soumettre le formulaire d'adhésion (toutes étapes, RGPD coché)
2. Vérifier en DB : `members.status = 'submitted'`, `submittedAt` renseigné, contacts + domaines présents
3. **[après correction bug B1]** Vérifier `members.legal_status_id` non null
4. Admin approuve la demande → vérifier `status = 'active'`, `reviewedAt`, `reviewedBy`, entrée `auditLog`
5. **[après correction bug B4]** Vérifier que le membre apparaît immédiatement dans `/adherents`
6. Admin envoie un magic link → vérifier email reçu, token en DB dans `memberTokens`
7. Adhérent clique sur le lien → formulaire pré-rempli s'affiche
8. Adhérent édite et soumet la fiche → vérifier mise à jour `members`, `memberActivities`, `memberCertifications`, token `usedAt` renseigné
9. Vérifier que le token ne fonctionne plus (accès à la page OK en lecture, sauvegarde/soumission retourne erreur)
10. Vérifier que la fiche publique `/adherents/[slug]` reflète les nouvelles données

**Criticité** : Haute — parcours métier principal du produit

---

### CT-02 : Relance automatique

**Workflow** : RELANCE_AUTOMATIQUE

1. Créer un membre `submitted` avec `submittedAt = now() - 4 jours`
2. Appeler `GET /api/cron/reminders` avec le bon `CRON_SECRET`
3. Vérifier : email envoyé à `ADMIN_NOTIFICATION_EMAIL`, entrée dans `reminderLogs`
4. Rappeler immédiatement → vérifier que la relance n'est PAS renvoyée (délai < 7j)
5. Modifier `reminderLogs.sentAt` à `now() - 8 jours` puis rappeler → vérifier deuxième envoi

**Criticité** : Moyenne — ne bloque pas le fonctionnement mais impacte la réactivité admin

---

### CT-03 : Sécurité — accès non authentifié au back-office

**Workflow** : CONNEXION_ADMIN

1. Accéder à `/admin/demandes` sans session → redirection vers `/admin/login?callbackUrl=/admin/demandes`
2. Accéder à `/admin/adherents/[id]` sans session → redirection vers login
3. Se connecter → redirection vers `/admin/demandes`
4. Appeler directement une Server Action admin (`approveMember`) sans session → erreur `'Non autorisé'`
5. Désactiver le compte admin (`isActive = false`) → nouvelle connexion impossible avec les mêmes credentials

**Criticité** : Haute — condition préalable à toute action admin

---

### CT-04 : Upload logo — validations et stockage

**Workflow** : UPLOAD_LOGO

1. Téléverser un JPEG valide (< 2 Mo) avec un token valide → réponse `{ url: "..." }`, vérifier URL Vercel Blob
2. Vérifier la conversion WebP : `Content-Type: image/webp`, dimensions max 1200×1200
3. Téléverser un SVG → vérifier qu'il est stocké tel quel (pas de conversion)
4. Téléverser un fichier > 2 Mo → réponse 400 `Fichier trop volumineux`
5. Téléverser avec un token expiré → réponse 401
6. Téléverser avec un token `usedAt IS NOT NULL` → réponse 401

**Criticité** : Moyenne — le logo est accessoire mais sa chaîne d'authentification est critique

---

### CT-05 : Publication d'actualité et SEO

**Workflow** : GESTION_ACTUALITES, SEO_AUDIT

1. Créer une actualité en `draft` → vérifier qu'elle n'apparaît pas sur `/actualites`
2. Publier l'actualité → vérifier apparition immédiate sur `/actualites` (revalidatePath testé)
3. **[après correction bug B10]** Vérifier `news.jsonLd` non null avec structure `{ "@type": "Article", ... }`
4. **[après correction bug B11]** Créer deux articles avec le même titre → vérifier message d'erreur admin, pas d'erreur DB non catchée
5. Vérifier `generateMetadata` sur `/actualites/[slug]` : title, description, canonical, OG ⚠ INCERTAIN

**Criticité** : Moyenne (SEO critique pour la visibilité des offres d'emploi)

---

### CT-06 : Formulaire de contact public

**Workflow** : CONTACT_PUBLIC

1. Soumettre un message valide → vérifier email reçu (nom, email, sujet, message, reply-to correct)
2. Renseigner le champ honeypot `company` → vérifier succès silencieux, pas d'email envoyé
3. Soumettre avec un email invalide → vérifier erreur de validation

**Criticité** : Basse

---

## Section 3 — Points de régression issus des audits

Ces points doivent être revérifiés à chaque modification des fichiers concernés. Ils représentent des bugs confirmés ou des règles métier non respectées au moment de l'audit.

---

### RG-01 : Revalidation du cache après approbation membre (B4)

**Fichier concerné** : `src/lib/actions/admin/members.ts` — `approveMember()`  
**Règle** : `revalidatePath('/adherents')` doit être appelé dans `approveMember()` pour que les membres nouvellement approuvés apparaissent immédiatement dans l'annuaire public.  
**Test** : Approuver un membre → vérifier immédiatement sur `/adherents` qu'il y est visible.  
(Source : PERF_AUDIT.md, WORKFLOW_ANNUAIRE_PUBLIC.md)

---

### RG-02 : Revalidation du cache après modification d'une offre d'emploi (B12)

**Fichier concerné** : `src/lib/actions/admin/content.ts` — `upsertJob()` branche UPDATE (ligne ~133)  
**Règle** : `revalidatePath('/offres-emploi')` doit être appelé dans la branche UPDATE **et** INSERT de `upsertJob()`.  
**Test** : Publier une offre existante en `draft` → vérifier immédiatement sur `/offres-emploi` qu'elle y est visible.  
(Source : PERF_AUDIT.md, WORKFLOW_GESTION_OFFRES_EMPLOI.md)

---

### RG-03 : Statut juridique persisté en DB (B1)

**Fichier concerné** : `src/lib/actions/adhesion.ts`  
**Règle** : La valeur `data.legalStatus` doit être résolue en `legalStatusId` (UUID de la table `legalStatuses`) avant insertion. `legalStatusId: null` en dur est un bug.  
**Test** : Soumettre une adhésion avec un statut juridique → vérifier `members.legal_status_id IS NOT NULL` en DB.  
(Source : DB_AUDIT.md, FORMS_AUDIT.md)

---

### RG-04 : JSON-LD alimenté sur news et offres (B10)

**Fichier concerné** : `src/lib/actions/admin/content.ts` — `upsertNews()` et `upsertJob()`  
**Règle** : `news.jsonLd` doit contenir un objet `{ "@context": "https://schema.org", "@type": "Article", ... }` et `jobOffers.jsonLd` un `JobPosting` lors de la publication.  
**Test** : Publier un article → vérifier `news.jsonLd IS NOT NULL` en DB et présence du script JSON-LD dans le HTML de la page.  
(Source : SEO_AUDIT.md, RELECTURE_WORKFLOWS.md)

---

### RG-05 : Ordre d'opération dans sendMagicLink (B8)

**Fichier concerné** : `src/lib/actions/admin/members.ts` — `sendMagicLink()`  
**Règle** : L'email Brevo doit être envoyé **avant** l'insertion du token en DB. Si Brevo échoue, aucun token ne doit être créé.  
**Test** : Simuler un échec Brevo (clé API invalide) → vérifier qu'aucun token n'est créé dans `memberTokens`.  
(Source : AUTH_AUDIT.md, WORKFLOW_MAGIC_LINK_ENVOI.md)

---

### RG-06 : Invalidation des anciens tokens (B9)

**Fichier concerné** : `src/lib/actions/admin/members.ts` — `sendMagicLink()`  
**Règle** : Avant d'insérer un nouveau token, les tokens non expirés et non consommés du même membre doivent être invalidés (`UPDATE member_tokens SET used_at = now() WHERE member_id = ? AND used_at IS NULL AND expires_at > now()`).  
**Test** : Envoyer 2 magic links successifs pour le même membre → vérifier que seul le dernier token est valide.  
(Source : AUTH_AUDIT.md, WORKFLOW_MAGIC_LINK_ENVOI.md)

---

### RG-07 : Validation Zod dans updateSiteStats (violation CLAUDE.md §3)

**Fichier concerné** : `src/lib/actions/admin/settings.ts` — `updateSiteStats()`  
**Règle** : Toute donnée externe doit passer par un schéma Zod avant traitement (ex. `z.object({ employeeCount: z.number().int().min(0).max(999999).nullable() })`).  
**Test** : Appeler la Server Action avec `employeeCount: -999` → vérifier erreur de validation retournée, pas d'insertion en DB.  
(Source : FORMS_AUDIT.md)

---

### RG-08 : Confirmation avant rejet irréversible (B13)

**Fichier concerné** : `src/components/admin/member-actions.tsx`  
**Règle** : Une modale de confirmation (et idéalement une saisie du motif) doit s'afficher avant l'appel à `rejectMember()`.  
**Test** : Cliquer sur « Refuser » → vérifier qu'une modale de confirmation s'affiche avant l'action.  
(Source : WORKFLOW_VALIDATION_ADMIN_DEMANDE.md, FORMS_AUDIT.md)

---

### RG-09 : Accessibilité — violations WCAG 2.1 AA

**Fichiers concernés** : `src/components/adhesion/adhesion-form.tsx`, `src/components/adhesion/step-*.tsx`, `src/components/annuaire/member-*.tsx`  
**Règle** : Les tests axe-core doivent passer avec `impact === 'critical'`. Les violations `serious` doivent également être vérifiées après extension du filtre (source : A11Y_AUDIT.md recommandation 1).  
**Points à vérifier manuellement** :
- Présence d'`aria-live` sur les transitions d'étapes du formulaire d'adhésion
- Présence d'`aria-describedby` sur les inputs en erreur
- Présence d'`aria-live="polite"` sur la zone de résultats de l'annuaire lors d'une recherche
(Source : A11Y_AUDIT.md)

---

### RG-10 : Comportement des Server Components après connexion admin (protection middleware)

**Fichier concerné** : `src/middleware.ts`  
**Règle** : Toute route `/admin/*` hors `/admin/login` doit être inaccessible sans session JWT valide.  
**Test** : Tenter d'accéder à `/admin/demandes` sans cookie de session → vérifier redirection vers `/admin/login?callbackUrl=/admin/demandes`.  
(Source : WORKFLOW_CONNEXION_ADMIN.md, AUTH_AUDIT.md)

---

## Annexe — Bugs bloquants à corriger avant toute recette complète

Les 15 points bloquants identifiés dans RELECTURE_WORKFLOWS.md, regroupés par priorité de correction :

| ID | Fichier principal | Problème | Priorité correction |
|---|---|---|---|
| B1 | `actions/adhesion.ts` | `legalStatusId: null` en dur — perte silencieuse du statut juridique | Haute (donnée métier perdue) |
| B4 | `actions/admin/members.ts` | `approveMember()` ne revalide pas `/adherents` | Haute (bug UX visible) |
| B8 | `actions/admin/members.ts` | Token inséré avant envoi email Brevo | Haute (sécurité) |
| B9 | `actions/admin/members.ts` | Anciens tokens non invalidés lors d'un renvoi | Haute (sécurité) |
| B10 | `actions/admin/content.ts` | `jsonLd` jamais alimenté pour news et jobOffers | Haute (SEO, CLAUDE.md §13) |
| B11 | `actions/admin/content.ts` | Collision de slug non gérée dans `upsertNews` | Haute (bug production) |
| B12 | `actions/admin/content.ts` | `revalidatePath('/offres-emploi')` absent en UPDATE | Haute (bug UX visible) |
| B13 | `components/admin/member-actions.tsx` | Rejet sans confirmation UI | Haute (risque opérationnel) |
| B2 | `actions/adhesion.ts` + `actions/member-profile.ts` | Insertions multi-tables sans transaction | Moyenne (risque incohérence) |
| B3 | `actions/adhesion.ts` | Email de confirmation promis mais non envoyé — à décider | Moyenne (décision métier) |
| B5 | `db/queries/members.ts` | Paramètre `q` sans limite de longueur (risque requête coûteuse) | Basse (à ~50 membres) |
| B6 | `middleware.ts` / login | Pas de rate limiting sur le login | Moyenne (sécurité) |
| B7 | `lib/auth/config.ts` | Session JWT persistante après désactivation admin | Basse (risque faible avec 1 admin) |
| B14 | `actions/admin/settings.ts` | `updateSiteStats()` sans Zod — violation CLAUDE.md §3 | Moyenne |
| B15 | `actions/member-profile.ts` | Comportement post-soumission de la fiche non documenté (UX) | Basse (à vérifier) |
