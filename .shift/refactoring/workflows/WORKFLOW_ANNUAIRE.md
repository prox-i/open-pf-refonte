# WORKFLOW_annuaire des adhérents — Cahier de workflow fonctionnel et technique reconstitué

## 1. Objet

Reconstituer le workflow métier et technique du **module annuaire des adhérents** d’OPEN PF, incluant :

- la consultation de l’annuaire public ;
- la consultation d’une fiche adhérent publique ;
- le parcours d’adhésion ;
- la validation/modération par le bureau ;
- l’espace sécurisé de complétion de fiche via **magic link** ;
- les mécanismes de relance et de publication.

Ce document se base sur les preuves du pack fourni, en transformant les signaux code en exigences métier et parcours opératoires.

---

## 2. Synthèse fonctionnelle

Le module permet à un visiteur de :

- rechercher des adhérents dans un annuaire public ;
- filtrer les résultats par domaine d’activité ;
- ouvrir une fiche détaillée d’adhérent ;
- initier une demande d’adhésion via un formulaire en 3 étapes ;
- recevoir ensuite un lien sécurisé pour compléter une fiche plus riche ;
- voir la fiche publiée après validation par le bureau.

Côté administration, le bureau peut :

- consulter les demandes en attente ;
- approuver, refuser ou désactiver un adhérent ;
- renvoyer un magic link ;
- piloter les relances automatiques ;
- consulter et mettre à jour certains contenus de paramètres.

Le système est fortement orienté :

- **SEO / pages indexables** pour l’annuaire et les fiches ;
- **sécurité** pour les accès admin et les liens de complétion ;
- **RGAA / accessibilité** sur les composants clés ;
- **maintenabilité** via Drizzle, Next.js App Router, Zod et composants dédiés.

---

## 3. Acteurs concernés

### 3.1 Visiteur public
- Consulte l’annuaire.
- Ouvre une fiche.
- Peut accéder au formulaire d’adhésion.

### 3.2 Entreprise adhérente / contact désigné
- Dépose une demande d’adhésion.
- Complète ensuite la fiche via un lien sécurisé.
- Peut téléverser un logo.
- Peut enregistrer un brouillon de fiche.

### 3.3 Bureau / administrateur
- Authentifié via compte admin.
- Valide ou refuse les demandes.
- Désactive des fiches actives.
- Envoie les magic links.
- Consulte les journaux de relances.
- Met à jour certains paramètres du site.

### 3.4 Système automatisé
- Tâche cron de relance.
- Envoi d’e-mails transactionnels.
- Génération et stockage de tokens.
- Calcul des indicateurs publics.

---

## 4. Points d’entrée

### 4.1 Pages publiques
- `/adherents`
- `/adherents/[slug]`
- `/adhesion`
- `/contact`
- `/reseau`
- `/offres-emploi`
- `/actualites`

### 4.2 Espace sécurisé adhérent
- `/fiche/[token]`

### 4.3 Espace administration
- `/admin/login`
- `/admin`
- `/admin/demandes`
- `/admin/demandes/[id]`
- `/admin/adherents`
- `/admin/adherents/[id]`
- `/admin/fiches`
- `/admin/relances`
- `/admin/parametres`

### 4.4 API / effets techniques liés
- `POST /api/upload/logo`
- `GET /api/cron/reminders`
- routes d’authentification NextAuth
- `POST /api/upload/news-image`

---

## 5. Composants source

### 5.1 Pages et composants publics
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/components/annuaire/*`
- `src/components/layout/site-header.tsx`
- `src/components/layout/site-footer.tsx`
- `src/components/layout/quickbar.tsx`
- `src/components/public/member-logo.tsx`
- `src/lib/seo`

### 5.2 Parcours adhésion / fiche
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`

### 5.3 Administration
- `src/app/admin/*`
- `src/components/admin/member-actions.tsx`
- `src/components/admin/login-form.tsx`
- `src/components/admin/site-stats-form.tsx`
- `src/lib/auth/config.ts`
- `src/auth.ts`

### 5.4 Données / requêtes / référentiels
- `src/lib/db/queries/members`
- `src/lib/db/queries/stats`
- `src/lib/data/referentials`
- `drizzle/meta/*.json`
- `drizzle/*.sql`

### 5.5 E-mails / relances / upload
- `src/lib/email/templates/magic-link.tsx`
- `src/lib/email/templates/reminder.tsx`
- `src/lib/email/templates/contact.tsx`
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/upload/logo/route.ts`

---

## 6. Données principales

### 6.1 Entité adhérent
Champs observés dans les pages publiques et admin :

- identifiant interne
- slug public
- nom / raison sociale
- logo URL
- description
- site web
- adresse
- LinkedIn
- numéro TAHITI
- année de création
- nombre de salariés
- indicateur “membre MEDEF PF”
- statut : `draft`, `submitted`, `active`, `inactive`
- date de soumission
- date de revue
- date de création / mise à jour

### 6.2 Contacts adhérent
- nom
- rôle / fonction
- e-mail
- téléphone
- statut “principal” ou non

### 6.3 Domaines d’activité
- liste fermée de domaines
- relation multiple entre adhérent et domaines
- utilisée pour :
  - le formulaire d’adhésion ;
  - la fiche adhérent ;
  - les filtres de l’annuaire ;
  - les chips de présentation.

### 6.4 Certifications / labels
- liste fermée de certifications
- utilisées dans l’espace magic link / fiche, pas dans le dépôt initial d’adhésion selon le CDC validé
- affichage public si renseigné.

### 6.5 Statistiques publiques
- nombre d’adhérents actifs
- nombre de domaines distincts couverts
- salariés représentés
- légende / note de contexte

### 6.6 Tokens et relances
- token magic link brut + hash
- expiration
- usage unique ou non utilisé
- journal de relance
- type de relance
- e-mail destinataire
- horodatage d’envoi

---

## 7. Étapes nominales

### 7.1 Consultation de l’annuaire
1. L’utilisateur ouvre `/adherents`.
2. La page charge :
   - statistiques ;
   - liste des domaines ;
   - résultats de recherche.
3. L’utilisateur recherche par nom ou mot-clé.
4. L’utilisateur filtre par domaine.
5. Les résultats se mettent à jour via paramètres d’URL.

**Preuves**
- `src/app/(public)/adherents/page.tsx`
- `src/components/annuaire/member-search.tsx`
- `src/components/annuaire/member-filters.tsx`
- `src/components/annuaire/member-grid.tsx`

### 7.2 Consultation d’une fiche adhérent
1. L’utilisateur ouvre `/adherents/[slug]`.
2. Le système charge :
   - la fiche ;
   - les contacts ;
   - les domaines ;
   - d’autres adhérents associés.
3. La page affiche :
   - logo ;
   - contact principal ;
   - adresse ;
   - site web ;
   - LinkedIn ;
   - présentation ;
   - attributs clés.

**Preuves**
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/components/annuaire/member-profile-hero.tsx`
- `src/components/annuaire/member-contact-card.tsx`
- `src/components/annuaire/member-domains-card.tsx`
- `src/components/annuaire/member-presentation-card.tsx`
- `src/components/annuaire/related-members.tsx`

### 7.3 Dépôt d’une demande d’adhésion
1. L’utilisateur ouvre `/adhesion`.
2. Le formulaire s’affiche en page complète ou en modale via le header.
3. L’utilisateur remplit :
   - informations entreprise ;
   - contacts ;
   - domaines d’activité ;
   - récapitulatif et consentement.
4. La demande est soumise.
5. Une suite de traitement côté back-office peut démarrer.

**Preuves**
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-recap.tsx`

### 7.4 Validation par le bureau
1. L’admin ouvre `/admin/demandes`.
2. Il consulte la liste des demandes soumises.
3. Il ouvre le détail d’une demande.
4. Il peut :
   - approuver ;
   - refuser ;
   - envoyer un magic link ;
   - désactiver selon statut.
5. La demande peut passer en `active`.

**Preuves**
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`

### 7.5 Complétion de fiche via magic link
1. Le bureau envoie un lien sécurisé.
2. Le destinataire reçoit un e-mail avec URL unique / token.
3. L’utilisateur ouvre `/fiche/[token]`.
4. Le système vérifie le token.
5. L’utilisateur complète la fiche et peut téléverser un logo.
6. Il enregistre un brouillon ou soumet la fiche complète.

**Preuves**
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`
- `src/lib/email/templates/magic-link.tsx`

### 7.6 Relances automatiques
1. Un cron interroge les demandes “submitted”.
2. Pour chaque fiche, le système décide s’il faut relancer :
   - J+3 pour la première relance ;
   - puis tous les 7 jours.
3. L’e-mail est envoyé au destinataire admin prévu.
4. Une ligne est ajoutée dans le journal des relances.

**Preuves**
- `src/app/api/cron/reminders/route.ts`
- `src/lib/email/templates/reminder.tsx`
- `src/app/admin/relances/page.tsx`

---

## 8. Variantes

### 8.1 Recherche et filtre combinés
- Recherche textuelle + filtre domaine peuvent coexister.
- Les filtres sont encodés en query string.
- Un état vide doit proposer un reset.

### 8.2 Page filtrée non indexable
- Lorsqu’un filtre est actif sur l’annuaire, la metadata indique `noindex, nofollow`.

**Preuve**
- `src/app/(public)/adherents/page.tsx`

### 8.3 Ouverture modale vs page complète
- Le parcours d’adhésion doit pouvoir s’ouvrir :
  - en modal depuis le header ;
  - en page complète directement via URL.

**Preuves**
- `src/components/layout/site-header.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/app/(public)/adhesion/page.tsx`

### 8.4 Fiche publique avec données partielles
- Si certaines données manquent :
  - la fiche affiche des valeurs de repli ;
  - les blocs absents sont masqués ou remplacés par un texte neutre.

**Preuves**
- `src/components/annuaire/member-contact-card.tsx`
- `src/components/annuaire/member-presentation-card.tsx`
- `src/components/public/member-logo.tsx`

### 8.5 Logo absent
- Si aucun logo n’est disponible, un fallback visuel avec initiales et couleur déterministe est affiché.

**Preuves**
- `src/components/public/member-logo.tsx`
- tests `tests/unit/member-logo.test.ts`

### 8.6 Fiche sans résultats similaires
- La section “Autres adhérents du réseau” n’est rendue que s’il existe des correspondances.

**Preuve**
- `src/app/(public)/adherents/[slug]/page.tsx`

---

## 9. Cas d’erreur

### 9.1 Annuaire vide
- Affichage d’un état vide avec appel à réinitialiser les filtres.

**Preuve**
- `src/components/annuaire/member-grid.tsx`

### 9.2 Fiche introuvable
- Si le slug ne correspond à aucun adhérent, la page renvoie un 404.

**Preuve**
- `src/app/(public)/adherents/[slug]/page.tsx`

### 9.3 Token magic link invalide ou expiré
- Accès refusé.
- Réponse 401.

**Preuves**
- `src/app/api/upload/logo/route.ts`
- `src/lib/auth/magic-link.ts`

### 9.4 Upload logo invalide
- Erreur si :
  - aucun fichier ;
  - type interdit ;
  - taille > 2 Mo.

**Preuve**
- `src/app/api/upload/logo/route.ts`

### 9.5 Relance non autorisée
- Le cron exige un header `Authorization: Bearer <CRON_SECRET>`.

**Preuve**
- `src/app/api/cron/reminders/route.ts`

### 9.6 Admin non authentifié
- L’accès à l’admin repose sur Auth.js / session.

**Preuves**
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/app/admin/(auth)/login/page.tsx`

### 9.7 Demande inexistante ou mauvais statut
- Une route de détail admin ne doit pas afficher une demande hors statut attendu.

**Preuve**
- `src/app/admin/demandes/[id]/page.tsx`

### 9.8 Erreurs de validation formulaire
- Les formulaires utilisent Zod et remontent les erreurs de champ.
- Le formulaire d’adhésion bloque l’absence de contact principal et le consentement requis.

**Preuves**
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/public/contact-form.tsx`
- `src/components/admin/login-form.tsx`
- `src/components/admin/news-form.tsx`
- `src/components/admin/job-form.tsx`

---

## 10. Documents / emails / effets de bord

### 10.1 E-mails transactionnels
- e-mail de magic link
- e-mail de relance
- e-mail de contact

**Preuves**
- `src/lib/email/templates/magic-link.tsx`
- `src/lib/email/templates/reminder.tsx`
- `src/lib/email/templates/contact.tsx`

### 10.2 Effets de bord techniques
- upload et stockage du logo en blob public ;
- journalisation d’une relance envoyée ;
- mise à jour de `lastLoginAt` en cas de connexion admin ;
- stockage / suppression du brouillon de formulaire côté navigateur.

**Preuves**
- `src/app/api/upload/logo/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/lib/auth/config.ts`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/fiche/profile-form.tsx`

### 10.3 Documents SEO / structurés
- JSON-LD Organization / WebSite / Breadcrumb / Article / JobPosting / Member.

**Preuves**
- `src/app/layout.tsx`
- `src/lib/seo`
- pages d’articles, offres, adhérents

---

## 11. Règles métier

### 11.1 Statuts de fiche
Cycle attendu :

- `draft` : en cours de saisie
- `submitted` : demande déposée, en attente de validation
- `active` : visible publiquement
- `inactive` : historisée, non visible

**Preuves**
- `DECISIONS.md`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/fiches/page.tsx`

### 11.2 Modération préalable
- Une fiche ne doit être visible publiquement qu’après validation du bureau.

**Preuves**
- `DECISIONS.md`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`

### 11.3 Formulaire d’adhésion en 3 étapes
Décision validée :

1. Informations entreprise
2. Domaines d’activité
3. Coordonnées

**Preuves**
- `DECISIONS.md`
- `architecture-addendum.md`

### 11.4 Compétences / certifications hors formulaire initial
- Les compétences et certifications ne doivent pas figurer dans le formulaire d’adhésion initial.
- Elles appartiennent à l’espace de fiche sécurisé via magic link.

**Preuves**
- `architecture-addendum.md`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/fiche/profile-form.tsx`

> Hypothèse importante : le code visible montre encore une étape “Certifications” dans le formulaire d’adhésion. Cela semble en tension avec l’arbitrage documenté. À valider.

### 11.5 Magic link
- Durée de vie : 30 jours.
- Signature HMAC + hash SHA-256 stocké.
- Renouvellement possible.

**Preuves**
- `DECISIONS.md`
- `src/lib/auth/magic-link.ts`

### 11.6 Relances automatiques
- J+3 puis tous les 7 jours.
- Arrêt automatique après 10 envois selon les décisions, mais le cron observé n’implémente pas cet arrêt.
- Arrêt manuel possible depuis le BO selon les décisions.

**Preuves**
- `DECISIONS.md`
- `src/app/api/cron/reminders/route.ts`
- `src/app/admin/relances/page.tsx`

### 11.7 Calcul des statistiques
- Nombre d’adhérents : calculé automatiquement.
- Domaines de compétences : calculé automatiquement.
- Salariés représentés : valeur manuelle.
- Légende : valeur manuelle.

**Preuves**
- `DECISIONS.md`
- `architecture-addendum.md`
- `src/app/(public)/adherents/page.tsx`
- `src/components/annuaire/directory-stats.tsx`
- `src/components/admin/site-stats-form.tsx`

### 11.8 Recherche annuaire et indexation
- Un annuaire filtré ne doit pas être indexé.
- La page non filtrée peut l’être.

**Preuve**
- `src/app/(public)/adherents/page.tsx`

### 11.9 SEO des fiches
- Canonical par fiche.
- JSON-LD Organization avec fallback URL canonique.
- OpenGraph et Twitter Card sont générés.

**Preuve**
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/lib/seo`

### 11.10 Fallback visuel des logos
- Afficher une identité visuelle générée si logo absent.

**Preuve**
- `src/components/public/member-logo.tsx`

---

## 12. Sécurité / permissions

### 12.1 Auth admin
- Auth.js v5 avec credentials provider.
- Session JWT.
- Redirection vers `/admin/login`.

**Preuves**
- `src/auth.ts`
- `src/lib/auth/config.ts`

### 12.2 Contrôle d’activité du compte admin
- Un compte inactif ne peut pas se connecter.

**Preuve**
- `src/lib/auth/config.ts`

### 12.3 Mises à jour de `lastLoginAt`
- À chaque connexion admin valide.

**Preuve**
- `src/lib/auth/config.ts`

### 12.4 Magic link protégé
- Vérification HMAC.
- Comparaison timing-safe.
- Vérification de non-expiration et d’absence d’usage.

**Preuves**
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/logo/route.ts`

### 12.5 Upload logo protégé par token
- L’upload logo exige un header `x-magic-token`.
- Il doit correspondre à un token valide lié au membre.

**Preuve**
- `src/app/api/upload/logo/route.ts`

### 12.6 Cron protégé
- Le cron exige un secret d’autorisation.

**Preuve**
- `src/app/api/cron/reminders/route.ts`

### 12.7 Protection des pages d’admin
- Les pages admin supposent un contexte de session authentifiée.

**Preuves**
- `src/app/admin/page.tsx`
- `src/components/admin/login-form.tsx`
- `src/auth.ts`

### 12.8 Données sensibles / RGPD
- La politique de confidentialité limite la collecte aux besoins de gestion des adhésions et de communication.
- Le consentement conditionne l’affichage public de certaines données.

**Preuve**
- `src/app/(public)/confidentialite/page.tsx`

---

## 13. Recette

### 13.1 Annuaire public
- Ouvrir `/adherents`.
- Vérifier :
  - présence du titre ;
  - cartes d’adhérents ;
  - filtres par domaine ;
  - recherche fonctionnelle ;
  - compteur d’adhérents ;
  - état vide avec reset.

### 13.2 Fiche publique
- Ouvrir `/adherents/[slug]`.
- Vérifier :
  - breadcrumb ;
  - logo ou fallback ;
  - contact principal ;
  - domaines ;
  - présentation ;
  - bloc “autres adhérents”.

### 13.3 Adhésion
- Ouvrir `/adhesion`.
- Vérifier :
  - navigation en étapes ;
  - validation des champs requis ;
  - persistance temporaire du brouillon ;
  - soumission finale.

### 13.4 Magic link / fiche
- Ouvrir `/fiche/[token]` avec un token valide.
- Vérifier :
  - accès autorisé ;
  - upload logo ;
  - autosave ;
  - soumission.

### 13.5 Administration
- Se connecter via `/admin/login`.
- Vérifier :
  - dashboard ;
  - demandes ;
  - fiches ;
  - actions approuver/refuser/désactiver ;
  - relances ;
  - paramètres.

### 13.6 Cron relances
- Lancer `GET /api/cron/reminders` avec le bon secret.
- Vérifier :
  - réponse JSON ;
  - compteur sent/skipped ;
  - journal des relances.

### 13.7 Accessibilité minimale
- Vérifier :
  - skip link ;
  - titres hiérarchisés ;
  - navigation clavier ;
  - labels de formulaire ;
  - focus trap / fermeture modale si applicable.

**Preuves**
- `tests/e2e/example.spec.ts`
- composants d’interface cités plus haut

---

## 14. Risques

### 14.1 Incohérence documentaire vs implémentation
Le pack montre un conflit potentiel entre :
- la décision “adhésion en 3 étapes” ;
- et le code du formulaire d’adhésion qui expose aussi une étape “Certifications”.

Risque :
- divergence métier / UI ;
- réécriture manuelle des données ;
- confusion utilisateur.

### 14.2 Relances incomplètes
Le cron actuel ne montre pas l’arrêt après 10 envois ni l’arrêt manuel effectif.

Risque :
- sur-relance ;
- charge e-mail inutile ;
- mauvaise expérience bureau.

### 14.3 Référentiels fermés non explicitement visibles ici
Les listes fermées des domaines, compétences, certifications, statuts juridiques sont signalées comme blocages métiers.

Risque :
- invention de valeurs ;
- incohérences de tri / filtres / import.

### 14.4 Sécurité des tokens
Les tokens sont protégés, mais tout écart dans :
- la génération ;
- la durée de vie ;
- la comparaison ;
- ou l’exposition log
peut créer un risque de fuite ou d’usurpation.

### 14.5 Données publiques / RGPD
La publication de certains champs doit rester conditionnée à la validation et au consentement.

Risque :
- exposition de données non consenties.

### 14.6 Dépendance au stockage blob
L’upload logo dépend de la disponibilité du service de blob et de la clé d’accès.

### 14.7 Indexation SEO des filtres
Si le `noindex` saute, l’annuaire filtré peut générer du bruit SEO.

### 14.8 Qualité des imports
Les scripts d’import et de comparaison signalent une migration de contenus existants.

Risque :
- doublons ;
- mauvais mapping de domaines ;
- slugs incorrects.

---

## 15. Questions ouvertes

### Questions ouvertes / Points à valider

1. **Le formulaire d’adhésion doit-il réellement rester en 3 étapes sans certifications ?**  
   Le code visible contient encore une étape certifications, mais la décision validée dit le contraire.

2. **Le nombre maximal de relances doit-il être 10, comme dans les décisions, ou autre chose ?**  
   Le cron actuel ne montre pas ce plafond.

3. **Le “contact principal” est-il unique ou plusieurs contacts peuvent coexister avec priorité ?**  
   Le code supporte plusieurs contacts avec un principal.

4. **Le statut juridique : quelle liste fermée officielle faut-il appliquer pour la PF ?**  
   Le référentiel est explicitement signalé comme à compléter.

5. **Les compétences et certifications sont-elles publiquement visibles sur la fiche ?**  
   Le code de la fiche magic link les collecte ; l’exposition publique exacte doit être confirmée.

6. **Le logo uploadé est-il définitivement public ou doit-il être signé / protégé ?**  
   Le route d’upload publie le blob.

7. **L’envoi des relances vise-t-il uniquement un e-mail admin ou également le membre concerné ?**  
   Le code observé envoie au destinataire admin configuré.

8. **Le mode de calcul des statistiques d’accueil est-il figé ou modifiable par le bureau ?**  
   Les documents indiquent une auto-calcul partiel et une saisie manuelle partielle, mais le code admin actuel montre aussi une saisie manuelle.

9. **Le statut `inactive` doit-il rester visible uniquement en BO ou aussi dans certains contextes publics d’archives ?**  
   Les preuves n’indiquent pas d’exposition publique.

10. **Le magic link doit-il être usage unique ou seulement expirant ?**  
    Le code vérifie l’absence d’usage sur la table de tokens, mais la politique exacte de consommation doit être confirmée.

11. **La page publique `/adherents/[slug]` doit-elle afficher uniquement les membres actifs ?**  
    Le code semble l’orienter ainsi, mais le flux de publication mérite confirmation métier.

12. **Le système doit-il journaliser les actions de validation / désactivation ?**  
    La base contient un `audit_log`, mais son usage effectif n’apparaît pas dans les extraits fournis.

13. **Le workflow de soumission génère-t-il un e-mail de confirmation au déposant ?**  
    Aucun extrait explicite ne le confirme.

14. **La modale d’adhésion doit-elle être obligatoire sur mobile, ou la page complète suffit-elle ?**  
    Le design permet les deux ; la priorité UX reste à valider.

15. **Les documents / ressources utiles sont-ils hors périmètre ou simplement non encore constitués ?**  
    La page existe mais affiche une section en cours de constitution.

---