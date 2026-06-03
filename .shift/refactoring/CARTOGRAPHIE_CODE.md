# Cartographie code — open-pf-refonte

## 1. Périmètre fonctionnel observé

Le repo porte une application **Next.js 15 / React 19** pour OPEN PF avec deux grands axes métier :

- **site vitrine public** : accueil, réseau, adhérents, actualités, offres d’emploi, contact, documents, mentions légales ;
- **back-office** : demandes d’adhésion, validation de fiches, gestion de contenus, paramètres, relances, authentification admin.

Le flux le plus structurant est l’**adhésion en 3 étapes** avec :
1. identité entreprise,
2. contacts,
3. domaines d’activité,
puis un espace sécurisé de **fiche adhérent** via **magic link** pour compléter les données publiques.

### Sources principales
- `architecture.md`
- `architecture-addendum.md`
- `DECISIONS.md`
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/parametres/page.tsx`

---

## 2. Cartographie des modules critiques

### 2.1 Public site / SEO / contenu éditorial
Routes et pages observées :
- `src/app/(public)/page.tsx`
- `src/app/(public)/reseau/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/app/(public)/documents-utiles/page.tsx`
- `src/app/(public)/mentions-legales/page.tsx`
- `src/app/(public)/confidentialite/page.tsx`

### Observations
- Le SEO est traité sérieusement : metadata, OpenGraph, JSON-LD, canonical, indexation contrôlée.
- Les pages dynamiques utilisent `generateMetadata` et des schémas JSON-LD via `src/lib/seo`.
- L’annuaire est pensé comme produit cœur : recherche, filtres, fiches détaillées, suggestions de membres.

### Points sensibles
- `src/app/(public)/adherents/page.tsx` est dynamique côté données mais conserve une logique de cache/revalidation.
- Les pages article et offre sont `force-dynamic`, ce qui réduit les risques d’obsolescence mais augmente la charge serveur.

### Recommandation
Prioriser la robustesse SEO et la stabilité des données de l’annuaire avant d’élargir le contenu éditorial.

---

### 2.2 Authentification admin
Fichiers clés :
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/app/admin/(auth)/login/page.tsx`
- `src/components/admin/login-form.tsx`
- `src/lib/actions/login`

### Fonctionnement observé
- Auth.js v5 / credentials provider.
- Vérification contre `adminUsers` via Drizzle.
- Mot de passe hashé.
- Session JWT.
- `trustHost: true`.
- Mise à jour de `lastLoginAt` au login.

### Risques
- **Surface d’attaque credentials** classique : brute force, enumeration, absence visible de rate limiting.
- `trustHost: true` peut être acceptable mais doit être aligné sur l’infra réelle.
- Le repo mentionne dans la doc une **2FA optionnelle** et un **audit log**, mais les preuves montrées ne confirment pas une implémentation complète côté code exposé.

### Recommandation
Sécuriser le login admin avec :
- limitation de tentatives,
- journalisation de sécurité,
- contrôle explicite des sessions/claims,
- validation de l’audit log fonctionnel.

---

### 2.3 Adhésion + demandes + validation
Fichiers clés :
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/fiches/page.tsx`
- `src/components/admin/member-actions.tsx`

### Parcours métier observé
- L’utilisateur démarre une demande d’adhésion.
- Il renseigne l’entreprise.
- Il ajoute des contacts.
- Il choisit des domaines.
- Il peut ajouter des certifications.
- Il valide le récapitulatif et consentement.
- Le bureau traite la demande depuis le back-office.
- La fiche peut être approuvée, refusée, désactivée.
- Un lien magique peut être renvoyé.

### Données manipulées
- nom / raison sociale
- statut juridique
- numéro TAHITI
- site web
- année de création
- effectif
- description
- activités
- certifications
- contacts, email, téléphone
- consentement RGPD

### Risques métier / produit
- La documentation d’architecture valide 3 étapes d’adhésion, mais le composant `adhesion-form.tsx` contient 5 étapes avec certification + récapitulatif. Cela suggère un **écart entre doc de référence et implémentation**.
- `step-certifications` existe alors que l’addendum indique que compétences/certifications ne doivent pas figurer dans le formulaire initial.
- Le front et les règles métier ne sont donc pas totalement alignés.

### Recommandation
Valider le **contrat métier exact** du formulaire d’adhésion avant d’étendre les écrans ou l’import de données.

---

### 2.4 Fiche adhérent sécurisée / magic link
Fichiers clés :
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`
- `src/lib/actions/member-profile`
- `src/lib/email/templates/magic-link.tsx`

### Parcours observé
- Un token donne accès à l’espace sécurisé de complétion.
- Le profil peut être sauvegardé en brouillon.
- Upload de logo autorisé via token magique.
- Soumission finale vers publication après validation bureau.

### Risques
- La sécurité repose sur un token custom HMAC + hash DB ; concept solide mais sensible à :
  - fuite du token brut,
  - mauvaise invalidation,
  - réutilisation non maîtrisée,
  - dérive de TTL.
- L’upload logo accepte plusieurs formats, y compris SVG, ce qui demande une vigilance renforcée sur la sécurité de contenu et la chaîne de stockage publique.
- `src/app/api/upload/logo/route.ts` utilise un token magique côté header : cela doit être protégé contre réutilisation et abus.
- `profile-form.tsx` inclut autosave local et upload fichier : risque de complexité fonctionnelle et de bugs UX.

### Recommandation
Audit spécifique sur :
- cycle de vie du token,
- invalidation après usage,
- traçabilité des accès,
- politique de fichiers SVG publics.

---

### 2.5 Relances automatiques / cron
Fichiers clés :
- `src/app/api/cron/reminders/route.ts`
- `src/lib/email/templates/reminder.tsx`
- `src/app/admin/relances/page.tsx`
- `architecture.md`
- `DECISIONS.md`

### Parcours observé
- Cron protégé par `CRON_SECRET`.
- Sélection des membres en `submitted`.
- Relance à J+3 puis tous les 7 jours.
- Journalisation dans `reminderLogs`.
- Envoi email vers admin.

### Écart important
- La doc canonique parle d’**arrêt après 10 envois** et d’un **arrêt manuel**.
- Le code du cron montré ne reflète pas clairement cette limite dans l’extrait.
- Cela indique une possible divergence ou un fragment incomplet.

### Risques
- boucle de relance excessive,
- doublons d’envoi,
- sur-notification admin,
- charge DB si le volume augmente.

### Recommandation
Confirmer la règle de stop automatique et sa persistance en base avant mise en production.

---

### 2.6 Uploads / médias / stockage externe
Fichiers clés :
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`
- `src/components/admin/news-form.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/lib/env`

### Observations
- Stockage via `@vercel/blob`.
- Transcodage image avec `sharp`.
- Limites de taille et types MIME contrôlés.
- Les URLs sont publiques.

### Risques
- Absence de scan malware et validation de contenu avancée.
- SVG public pour le logo : vecteur potentiel si mal filtré.
- Token de stockage `BLOB_READ_WRITE_TOKEN` critique mais non exposé dans les extraits.

### Recommandation
Renforcer la politique d’upload :
- whitelist stricte,
- contrôle du contenu réellement servi,
- séparation éventuelle des flux SVG vs bitmap.

---

### 2.7 Contenu éditorial back-office
Fichiers clés :
- `src/app/admin/actualites/page.tsx`
- `src/app/admin/actualites/new/page.tsx`
- `src/app/admin/actualites/[id]/page.tsx`
- `src/components/admin/news-form.tsx`
- `src/app/admin/offres-emploi/page.tsx`
- `src/app/admin/offres-emploi/new/page.tsx`
- `src/app/admin/offres-emploi/[id]/page.tsx`
- `src/components/admin/job-form.tsx`
- `src/app/admin/parametres/page.tsx`
- `src/components/admin/site-stats-form.tsx`

### Observations
- Le contenu est éditable depuis le BO.
- Les offres d’emploi et actualités ont des formulaires dédiés.
- Les paramètres gèrent chiffres clés, bureau, frise chronologique.

### Risques
- Les règles de validation métier ne sont pas uniformes : certaines formes utilisent une validation légère, d’autres plus structurée.
- La gestion du contenu semble puissante mais sensible aux incohérences éditoriales si la gouvernance n’est pas claire.

### Recommandation
Introduire des garde-fous de contenu :
- validations de champs plus strictes,
- publication en brouillon par défaut,
- revue des formulaires de contenu.

---

## 3. Fichiers critiques à forte sensibilité

### Critiques sécurité / accès
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`

### Critiques métier / publication
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`
- `src/app/admin/parametres/page.tsx`

### Critiques SEO / parcours principal
- `src/app/(public)/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`

---

## 4. Zones dangereuses / dette de cohérence

### 4.1 Désalignement documentation ↔ code
La documentation d’architecture et les décisions validées ne semblent pas toujours reflétées à l’identique dans le code observé :
- nombre d’étapes du formulaire d’adhésion,
- place des certifications,
- limite des relances,
- éventuelle 2FA/audit log.

### 4.2 Logique métier répartie
Les règles de statut membre, validation, rappel, publication sont dispersées entre :
- pages admin,
- actions serveur,
- cron,
- templates email,
- composants de parcours.

Risque : divergence de règles entre UI, back-office et processus automatiques.

### 4.3 Contenu semi-structuré
Le site combine :
- contenu éditorial,
- données relationnelles,
- import de profils depuis l’ancien site,
- saisie manuelle BO.

Sans gouvernance stricte, cela peut créer des incohérences de données publiques.

### 4.4 Dépendance à des intégrations externes
- Auth.js / NextAuth
- Vercel Blob
- Brevo
- Neon
- Vercel Cron
- Sharp
- React Email

Ces dépendances sont raisonnables mais augmentent la surface d’exploitation.

---

## 5. Liens explicites avec les workflows détectés

### Authentification & sécurité
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/app/admin/(auth)/login/page.tsx`
- `src/components/admin/login-form.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`

### Documents / PDF
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`
- `src/components/admin/news-form.tsx`
- `src/components/fiche/profile-form.tsx`

### API Tahiti Ingénierie / import / référentiels
- `scripts/import-openpf/extract-member-urls.ts`
- `scripts/import-openpf/compare-members.ts`
- `scripts/import-openpf/lib/types.ts`
- `scripts/seed-data.mjs`
- `seeds/adherents.csv`

### Paiement
Aucun vrai flux de paiement n’apparaît dans les extraits opérationnels. La documentation précise d’ailleurs : **pas de paiement en ligne**.

---

## 6. Recommandations d’intervention prioritaires

### Priorité 1 — cohérence métier
1. Aligner le formulaire d’adhésion sur la décision canonique.
2. Clarifier la présence/absence de certifications dans le parcours initial.
3. Valider le cycle exact des relances automatiques.
4. Confirmer les statuts de vie d’une fiche et les transitions permises.

### Priorité 2 — sécurité
1. Ajouter protection anti-bruteforce sur login admin.
2. Vérifier la robustesse du magic link, son TTL et son invalidation.
3. Revoir l’exposition des uploads SVG publics.
4. S’assurer que les cron endpoints sont inaccessibles hors secret.

### Priorité 3 — gouvernance de contenu
1. Stabiliser les référentiels fermés : domaines, compétences, certifications, statuts juridiques.
2. Formaliser qui peut publier quoi dans le BO.
3. Unifier les règles de validation serveur.

### Priorité 4 — exploitation
1. Ajouter observabilité / logs d’erreurs sur les parcours critiques.
2. Vérifier les comportements de cache et revalidation.
3. Tester les parcours admin-public end-to-end.

---

## 7. Sources et preuves observées

### Docs de référence
- `architecture.md`
- `architecture-addendum.md`
- `DECISIONS.md`
- `README.md`

### Route / pages clés
- `src/app/(public)/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/(public)/adhesion/page.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/relances/page.tsx`
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`
- `src/app/api/webhooks/brevo/route.ts`

### Composants métier
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/components/admin/member-actions.tsx`
- `src/components/admin/news-form.tsx`
- `src/components/admin/job-form.tsx`
- `src/components/admin/site-stats-form.tsx`

### Templates email
- `src/lib/email/templates/contact.tsx`
- `src/lib/email/templates/magic-link.tsx`
- `src/lib/email/templates/reminder.tsx`

### Tests utiles pour valider les invariants
- `tests/unit/seo.test.ts`
- `tests/unit/member-card.test.tsx`
- `tests/unit/member-showcase.test.tsx`
- `tests/unit/member-logo.test.ts`
- `tests/unit/contact.test.ts`
- `tests/unit/utils.test.ts`
- `tests/e2e/example.spec.ts`

---

## 8. Questions ouvertes / points à valider

1. **Le formulaire d’adhésion doit-il rester en 3 étapes ou en 5 étapes ?**  
   La documentation validée parle de 3 étapes, mais le composant courant en expose 5.

2. **Les certifications doivent-elles être collectées dans l’adhésion initiale ou uniquement dans la fiche magic link ?**  
   Le code et l’addendum ne racontent pas exactement la même chose.

3. **La règle de relance automatique s’arrête-t-elle bien après 10 envois ?**  
   L’architecture le demande, mais l’extrait de cron ne le montre pas clairement.

4. **Existe-t-il déjà un audit log fonctionnel pour les actions admin ?**  
   La décision le mentionne, mais les preuves visibles restent partielles.

5. **Une 2FA admin est-elle réellement prévue à court terme ou seulement souhaitée ?**

6. **Le SVG uploadé comme logo doit-il rester autorisé en public ?**  
   C’est pratique, mais c’est la zone la plus sensible côté contenu média.

7. **Les référentiels fermés sont-ils déjà stabilisés ?**  
   Domaines d’activité, compétences, certifications, statuts juridiques sont signalés comme bloquants par la doc.

8. **Le workflow d’import OPEN PF est-il encore utilisé en production ou seulement en migration initiale ?**  
   Les scripts sont solides, mais il faut confirmer leur rôle opérationnel.

9. **Quel est le niveau de priorité du webhook Brevo ?**  
   `src/app/api/webhooks/brevo/route.ts` est encore un stub ; faut-il le traiter maintenant ?

10. **La source de vérité pour les chiffres clés est-elle l’auto-calcul ou la saisie BO selon l’indicateur ?**  
    La règle est mixte et doit être explicitée pour éviter les écarts.