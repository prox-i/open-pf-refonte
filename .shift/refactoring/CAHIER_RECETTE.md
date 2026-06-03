# Cahier de recette — open-pf-refonte

## 1. Objet du cahier de recette

Ce document formalise les scénarios de recette pour la refonte **OPEN PF**, en couvrant :

- le site public ;
- le parcours d’adhésion ;
- l’espace adhérent sécurisé ;
- l’annuaire des membres ;
- le back-office ;
- les automatisations e-mail et relances ;
- les points de non-régression fonctionnels, UX, accessibilité et sécurité.

### Sources / preuves principales
- `architecture.md`
- `architecture-addendum.md`
- `DECISIONS.md`
- `README.md`
- `src/app/(public)/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/(public)/adhesion/page.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/reseau/page.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/app/admin/*`
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/lib/auth/*`
- `src/lib/email/templates/*`
- `src/components/*`
- `tests/unit/*`
- `tests/e2e/example.spec.ts`
- `mockup/open_pf_site_8_5/*`

---

## 2. Périmètre de recette

### 2.1 Parcours publics
- page d’accueil ;
- réseau / gouvernance ;
- annuaire des adhérents ;
- fiche adhérent publique ;
- actualités ;
- offres d’emploi ;
- contact ;
- documents utiles ;
- mentions légales ;
- confidentialité.

### 2.2 Parcours métier
- demande d’adhésion en 3 étapes ;
- ouverture du parcours en modale ou en page complète ;
- validation par le bureau ;
- génération et utilisation de magic links ;
- complétion de fiche adhérent ;
- upload de logo ;
- relances automatiques.

### 2.3 Back-office
- authentification admin ;
- tableau de bord ;
- gestion des demandes ;
- gestion des adhérents ;
- gestion des fiches à valider ;
- actualités ;
- offres d’emploi ;
- paramètres du site ;
- relances.

### 2.4 Hors périmètre fonctionnel confirmé
- paiement en ligne ;
- multi-rôles admin ;
- workflow complexe de validation ;
- formulaires d’adhésion en 5 étapes du CDC historique ;
- compétences/certifications dans le formulaire d’adhésion initial.

---

## 3. Référentiel de validation attendu

### 3.1 Règles métier validées
- le formulaire d’adhésion comporte **3 étapes** ;
- les compétences et certifications sont saisies **dans la fiche adhérent**, pas dans l’adhésion initiale ;
- le parcours d’adhésion doit être disponible **en modale** et en **page complète** ;
- les fiches sont validées **avant publication** ;
- le statut des membres suit le cycle : `draft → submitted → active → inactive` ;
- le magic link a une durée de vie de **30 jours** ;
- les relances automatiques commencent à **J+3**, puis tous les **7 jours** ;
- arrêt automatique des relances après **10 envois** ;
- les chiffres de l’accueil et de l’annuaire sont en partie calculés automatiquement ;
- le nombre d’adhérents est calculé à partir des fiches actives ;
- le back-office utilise Auth.js avec credentials admin ;
- le site doit rester compatible avec les contraintes de performance, SEO et accessibilité annoncées.

### 3.2 Données de test recommandées
- 1 compte admin actif ;
- 1 compte admin inactif ;
- 1 adhérent `draft` ;
- 1 demande `submitted` ;
- 1 adhérent `active` avec :
  - logo ;
  - contact principal ;
  - domaines d’activité ;
  - description ;
  - année de création ;
  - lien site web ;
- 1 adhérent `inactive` ;
- 1 magic link valide ;
- 1 magic link expiré ;
- 1 demande sans `submittedAt` ;
- 1 relance déjà envoyée ;
- 1 fichier image PNG/JPEG/WebP < 5 Mo ;
- 1 fichier SVG < 2 Mo ;
- 1 fichier trop volumineux ;
- 1 fichier de type interdit ;
- 1 article d’actualité publié ;
- 1 offre d’emploi publiée ;
- 1 offre d’emploi brouillon.

---

## 4. Scénarios de recette par domaine

## 4.1 Accueil

### Objectif
Vérifier que la page d’accueil présente correctement la mission, les chiffres clés, la vitrine des adhérents et les actualités récentes.

### Parcours nominal
1. Ouvrir la page d’accueil.
2. Vérifier le titre de page, le H1 et le message de positionnement.
3. Vérifier la présence des CTA :
   - rejoindre OPEN ;
   - explorer l’annuaire.
4. Vérifier l’affichage des chiffres clés.
5. Vérifier la vitrine des adhérents.
6. Vérifier la présence du bloc actualités.

### Données de test
- statistiques existantes en base ;
- au moins 3 adhérents actifs en vitrine ;
- au moins 1 actualité publiée.

### Critères d’acceptation
- titre et métadonnées corrects ;
- H1 visible ;
- CTA visibles et fonctionnels ;
- statistiques cohérentes ;
- vitrine affichée avec logos ou fallback ;
- actualités visibles.

### Points de contrôle
- `src/app/(public)/page.tsx`
- `src/components/annuaire/member-showcase.tsx`
- `src/lib/random/seeded-shuffle.ts`
- `src/lib/db/queries/stats`
- `src/lib/db/queries/news`

---

## 4.2 Réseau / gouvernance

### Objectif
Valider la page “Le réseau”, sa mission, sa frise chronologique et la gouvernance.

### Parcours nominal
1. Ouvrir `/reseau`.
2. Vérifier le H1.
3. Vérifier les sections missions.
4. Vérifier la frise chronologique.
5. Vérifier l’affichage des membres du bureau.

### Critères d’acceptation
- contenu institutionnel présent ;
- chronologie triée correctement ;
- cartes bureau lisibles ;
- aucun bloc vide si des données sont présentes.

### Sources
- `src/app/(public)/reseau/page.tsx`
- `src/components/public/board-member-card.tsx`
- `src/lib/data/board-members`

---

## 4.3 Annuaire des adhérents

### Objectif
Valider la recherche, les filtres, les statistiques, l’état vide et la navigation vers une fiche membre.

### Parcours nominal
1. Ouvrir `/adherents`.
2. Vérifier le titre et la description.
3. Vérifier les statistiques annuaire.
4. Rechercher un membre par nom.
5. Filtrer par domaine.
6. Ouvrir une fiche membre.
7. Revenir à l’annuaire.

### Cas de non-régression
- recherche sans résultat ;
- filtre combiné `q + domaine` ;
- réinitialisation des filtres ;
- page filtrée non indexée.

### Critères d’acceptation
- recherche fonctionnelle ;
- filtres fonctionnels ;
- card membre correcte ;
- fallback logo/texte correct ;
- état vide explicite ;
- navigation fiable ;
- SEO cohérent selon filtres.

### Données de test
- membre avec logo ;
- membre sans logo ;
- membre avec longue description ;
- au moins 2 domaines distincts.

### Sources
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/components/annuaire/member-search.tsx`
- `src/components/annuaire/member-filters.tsx`
- `src/components/annuaire/member-grid.tsx`
- `src/components/annuaire/member-card.tsx`
- `src/components/annuaire/member-profile-hero.tsx`
- `src/components/annuaire/member-contact-card.tsx`
- `src/components/annuaire/member-domains-card.tsx`
- `src/components/annuaire/member-presentation-card.tsx`

---

## 4.4 Fiche adhérent publique

### Objectif
Vérifier qu’une fiche active affiche les informations publiques attendues.

### Parcours nominal
1. Ouvrir une fiche membre active.
2. Vérifier le nom, les domaines et la description.
3. Vérifier les coordonnées.
4. Vérifier les facts métier :
   - année de création ;
   - nombre de salariés ;
   - adhésion MEDEF si applicable.
5. Vérifier les autres adhérents suggérés.

### Critères d’acceptation
- fiche accessible ;
- données cohérentes ;
- CTA vers autres adhérents ;
- JSON-LD présent ;
- fiche inactive ou inconnue non accessible.

### Sources
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/lib/seo`
- `src/components/annuaire/related-members.tsx`

---

## 4.5 Parcours d’adhésion

### Objectif
Valider le formulaire d’adhésion en 3 étapes, le récapitulatif, la validation, la persistance brouillon et l’envoi.

### Parcours nominal
1. Ouvrir `/adhesion`.
2. Vérifier la page et/ou l’ouverture en modale.
3. Remplir l’étape 1 : informations entreprise.
4. Passer à l’étape 2 : contacts.
5. Passer à l’étape 3 : domaines d’activité.
6. Passer à l’étape 4 : certifications facultatives.
7. Vérifier le récapitulatif.
8. Soumettre la demande.
9. Vérifier la création de la demande en statut `submitted`.
10. Vérifier le message de succès.

### Parcours modale
1. Depuis le site public, cliquer sur “Adhérer”.
2. Vérifier l’ouverture en overlay.
3. Vérifier la fermeture.
4. Vérifier la restauration du focus.

### Critères d’acceptation
- 3 étapes métier principales respectées ;
- champs obligatoires contrôlés ;
- un contact principal obligatoire ;
- consentement RGPD obligatoire ;
- brouillon sauvegardé localement ;
- soumission conforme ;
- erreur serveur affichée lisiblement ;
- aucune étape métier manquante.

### Données de test
- raison sociale valide ;
- statut juridique valide ;
- numéro TAHITI valide ;
- au moins 1 contact principal ;
- 1 ou plusieurs domaines ;
- consentement RGPD coché.

### Sources
- `src/app/(public)/adhesion/page.tsx`
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/components/adhesion/step-entreprise.tsx`
- `src/components/adhesion/step-contacts.tsx`
- `src/components/adhesion/step-activites.tsx`
- `src/components/adhesion/step-certifications.tsx`
- `src/components/adhesion/step-recap.tsx`
- `src/components/adhesion/stepper.tsx`
- `src/lib/validations/adhesion`

---

## 4.6 Magic link et espace adhérent sécurisé

### Objectif
Vérifier la sécurité, l’activation par lien et la complétion de fiche.

### Parcours nominal
1. Depuis le back-office, envoyer un magic link.
2. Ouvrir le lien reçu.
3. Vérifier l’accès à la fiche sécurisée.
4. Compléter la fiche.
5. Sauvegarder le brouillon.
6. Soumettre la fiche.
7. Vérifier le passage à la validation bureau.
8. Vérifier l’upload du logo si présent.

### Cas de sécurité
- token absent ;
- token invalide ;
- token expiré ;
- token déjà utilisé ;
- accès sans header attendu.

### Critères d’acceptation
- token vérifié correctement ;
- token hashé en base ;
- durée de vie respectée ;
- fiche non accessible sans token valide ;
- upload sécurisé ;
- messages d’erreur explicites.

### Sources
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`
- `src/lib/auth/magic-link.ts`
- `src/lib/actions/member-profile`
- `src/app/api/upload/logo/route.ts`
- `src/lib/email/templates/magic-link.tsx`

---

## 4.7 Upload logo et image d’actualité

### Objectif
Valider la sécurisation et le traitement des fichiers image.

### Cas de test logo
1. Fournir un PNG, JPEG, WebP ou SVG valide.
2. Vérifier l’acceptation.
3. Vérifier la compression / conversion vers WebP pour les raster.
4. Vérifier le nommage et l’URL retournée.

### Cas de test news image
1. Fournir un JPEG/PNG/WebP valide.
2. Vérifier la conversion WebP.
3. Vérifier le stockage public.

### Cas négatifs
- fichier sans objet File ;
- type interdit ;
- taille supérieure à la limite ;
- token absent ou invalide ;
- session absente pour news-image.

### Critères d’acceptation
- validation MIME ;
- taille max appliquée ;
- image transformée selon la règle ;
- erreurs HTTP appropriées ;
- upload impossible sans autorisation.

### Sources
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`
- `src/components/admin/news-form.tsx`
- `src/components/fiche/profile-form.tsx`

---

## 4.8 Back-office authentification

### Objectif
Valider la connexion admin et la gestion de session.

### Parcours nominal
1. Ouvrir `/admin/login`.
2. Saisir un email et un mot de passe valides.
3. Vérifier la redirection vers `/admin`.
4. Vérifier l’affichage du nom de l’admin.
5. Vérifier la déconnexion.

### Cas négatifs
- mauvais mot de passe ;
- compte inactif ;
- email inconnu ;
- session expirée.

### Critères d’acceptation
- connexion sécurisée ;
- JWT / session fonctionnelle ;
- `lastLoginAt` mis à jour ;
- accès admin protégé ;
- déconnexion effective.

### Sources
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/components/admin/login-form.tsx`
- `src/app/admin/(auth)/login/page.tsx`

---

## 4.9 Back-office — dashboard

### Objectif
Vérifier les indicateurs de pilotage et les raccourcis éditoriaux.

### Parcours nominal
1. Ouvrir `/admin`.
2. Vérifier les KPI :
   - adhérents actifs ;
   - demandes en attente ;
   - total adhérents ;
   - inactifs.
3. Vérifier les listes de demandes récentes et contenus récents.
4. Vérifier les raccourcis vers les écrans de gestion.

### Critères d’acceptation
- chiffres cohérents ;
- liens fonctionnels ;
- accès limité aux utilisateurs connectés.

### Sources
- `src/app/admin/page.tsx`
- `src/components/admin/admin-sidebar.tsx`

---

## 4.10 Back-office — demandes d’adhésion

### Objectif
Valider la consultation, l’examen, l’approbation et le refus d’une demande.

### Parcours nominal
1. Ouvrir `/admin/demandes`.
2. Vérifier le nombre de demandes.
3. Ouvrir une demande.
4. Vérifier les données entreprise et contacts.
5. Approuver la demande.
6. Vérifier le changement de statut.
7. Refuser une autre demande.

### Cas de non-régression
- aucune demande ;
- demande sans contact ;
- demande sans date ;
- demande déjà traitée ;
- actions répétées.

### Critères d’acceptation
- listing correct ;
- détail complet ;
- actions de décision visibles ;
- statut modifié correctement ;
- retour à la liste après approbation/refus.

### Sources
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/components/admin/member-actions.tsx`

---

## 4.11 Back-office — adhérents et fiches à valider

### Objectif
Valider le suivi des membres et la validation des fiches.

### Parcours nominal
1. Ouvrir `/admin/adherents`.
2. Vérifier les statuts.
3. Ouvrir une fiche adhérent.
4. Vérifier les informations détaillées.
5. Ouvrir `/admin/fiches`.
6. Vérifier les fiches en attente.

### Critères d’acceptation
- listing trié correctement ;
- fiche complète ;
- distinction entre demandes et adhérents ;
- affichage des contacts, activités, certifications.

### Sources
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/admin/fiches/page.tsx`

---

## 4.12 Back-office — actualités et offres d’emploi

### Objectif
Valider la création, l’édition, la publication et l’affichage.

### Parcours nominal actualités
1. Ouvrir `/admin/actualites`.
2. Créer une actualité.
3. Ajouter titre, extrait, contenu, auteur, image.
4. Publier ou enregistrer en brouillon.
5. Vérifier l’affichage public.

### Parcours nominal offres
1. Ouvrir `/admin/offres-emploi`.
2. Créer une offre.
3. Renseigner type de contrat, localisation, salaire, contact.
4. Publier.
5. Vérifier l’affichage public.

### Critères d’acceptation
- formulaires valides ;
- listes admin à jour ;
- contenu public visible après publication ;
- état brouillon non visible côté public.

### Sources
- `src/app/admin/actualites/page.tsx`
- `src/app/admin/actualites/new/page.tsx`
- `src/app/admin/actualites/[id]/page.tsx`
- `src/components/admin/news-form.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/app/admin/offres-emploi/page.tsx`
- `src/app/admin/offres-emploi/new/page.tsx`
- `src/app/admin/offres-emploi/[id]/page.tsx`
- `src/components/admin/job-form.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`

---

## 4.13 Back-office — paramètres du site

### Objectif
Vérifier la gestion des chiffres clés, du bureau et de la frise chronologique.

### Parcours nominal
1. Ouvrir `/admin/parametres`.
2. Vérifier le compteur de salariés représentés.
3. Modifier la valeur.
4. Sauvegarder.
5. Vérifier l’affichage public.
6. Vérifier le bureau.
7. Vérifier la frise chronologique.

### Critères d’acceptation
- donnée sauvegardée ;
- affichage cohérent côté public ;
- pas de saisie manuelle des indicateurs auto ;
- frise et bureau triés correctement.

### Sources
- `src/app/admin/parametres/page.tsx`
- `src/components/admin/site-stats-form.tsx`
- `src/lib/db/queries/stats`
- `architecture-addendum.md`
- `DECISIONS.md`

---

## 4.14 Relances automatiques et journal

### Objectif
Valider le déclenchement des relances et la traçabilité.

### Parcours nominal
1. Appeler le cron avec le bon secret.
2. Vérifier le filtrage des membres `submitted`.
3. Vérifier l’envoi au bon destinataire.
4. Vérifier l’écriture dans `reminderLogs`.
5. Vérifier le journal côté admin.

### Cas à couvrir
- secret absent ;
- secret invalide ;
- pas de membres éligibles ;
- `submittedAt` absent ;
- dernière relance trop récente ;
- échec d’envoi e-mail.

### Critères d’acceptation
- accès cron protégé ;
- règles J+3 / +7 respectées ;
- journal créé ;
- erreurs non bloquantes isolées par membre ;
- arrêt logique après le seuil de relances.

### Sources
- `src/app/api/cron/reminders/route.ts`
- `src/app/admin/relances/page.tsx`
- `src/lib/email/templates/reminder.tsx`
- `DECISIONS.md`
- `architecture.md`

---

## 4.15 Contact

### Objectif
Valider l’envoi du formulaire de contact et la protection anti-bot.

### Parcours nominal
1. Ouvrir `/contact`.
2. Renseigner nom, email, sujet, message.
3. Envoyer.
4. Vérifier l’état de succès.

### Cas négatifs
- honeypot rempli ;
- email invalide ;
- message trop court ;
- message trop long ;
- sujet inconnu.

### Critères d’acceptation
- formulaire accessible ;
- validation claire ;
- succès confirmé ;
- anti-bot présent ;
- erreur affichée en cas d’échec.

### Sources
- `src/app/(public)/contact/page.tsx`
- `src/components/public/contact-form.tsx`
- `src/lib/validations/contact`
- `src/lib/email/templates/contact.tsx`

---

## 4.16 Pages éditoriales et SEO

### Objectif
Vérifier les pages informatives, les métadonnées et les données structurées.

### Pages à contrôler
- `/`
- `/reseau`
- `/adherents`
- `/adherents/[slug]`
- `/actualites`
- `/actualites/[slug]`
- `/offres-emploi`
- `/offres-emploi/[slug]`
- `/adhesion`
- `/contact`
- `/documents-utiles`
- `/mentions-legales`
- `/confidentialite`

### Critères d’acceptation
- title cohérent ;
- canonical correct ;
- openGraph cohérent ;
- JSON-LD présent lorsque prévu ;
- indexation désactivée sur les pages privées / filtrées.

### Sources
- `src/app/layout.tsx`
- `src/lib/seo`
- `src/app/(public)/*`

---

## 5. Scénarios de non-régression prioritaires

## 5.1 Non-régression accessibilité
- skip link présent ;
- navigation clavier fonctionnelle ;
- modale adhésion avec focus trap ;
- formulaires avec labels et erreurs lisibles ;
- contrastes suffisants ;
- états d’activation explicites sur les filtres.

### Sources
- `tests/e2e/example.spec.ts`
- `src/components/layout/site-header.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/components/annuaire/member-filters.tsx`
- `src/components/public/contact-form.tsx`

## 5.2 Non-régression sécurité
- admin non accessible sans authentification ;
- magic links non forgeables ;
- upload sécurisé ;
- cron protégé ;
- pages confidentielles non indexées.

### Sources
- `src/auth.ts`
- `src/lib/auth/magic-link.ts`
- `src/app/api/upload/*`
- `src/app/api/cron/reminders/route.ts`
- `src/app/(public)/confidentialite/page.tsx`
- `src/app/(public)/mentions-legales/page.tsx`

## 5.3 Non-régression performance / UX
- page d’accueil rapide ;
- annuaire paginé/recherchable ;
- chargement contrôlé via Suspense ;
- pas de régression majeure de TTFB / LCP ;
- images optimisées ;
- navigation stable mobile/desktop.

### Sources
- `src/app/(public)/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/components/public/member-logo.tsx`
- `src/components/annuaire/member-grid.tsx`

## 5.4 Non-régression contenu
- contenus institutionnels non vides ;
- données de départ cohérentes avec le mockup ;
- absence de libellés provisoires en production.

### Sources
- `mockup/open_pf_site_8_5/*`
- `seeds/*`
- `scripts/seed-data.mjs`
- `DECISIONS.md`

---

## 6. Jeux de données de recette

### 6.1 Données minimales
- 1 membre actif avec :
  - nom ;
  - logo ;
  - description ;
  - contacts ;
  - domaines ;
  - année de création ;
  - nombre de salariés ;
  - adhésion MEDEF ;
- 1 membre en attente (`submitted`) ;
- 1 membre inactif ;
- 1 demande sans contact secondaire ;
- 1 demande avec plusieurs contacts ;
- 1 actualité publiée ;
- 1 actualité brouillon ;
- 1 offre d’emploi publiée ;
- 1 offre d’emploi brouillon ;
- 1 admin actif ;
- 1 admin inactif ;
- 1 token magic link valide ;
- 1 token expiré.

### 6.2 Données de fichiers
- logo PNG ;
- logo SVG ;
- image news JPEG ;
- image news WebP ;
- fichier refusé : PDF / EXE / autre type interdit ;
- fichier volumineux > limite.

### 6.3 Données de contenu
- entreprise avec TAHITI renseigné ;
- entreprise sans site web ;
- entreprise sans LinkedIn ;
- entreprise sans logo ;
- texte de contact avec message long ;
- offre d’emploi avec URL de candidature ;
- offre d’emploi avec email de candidature uniquement.

---

## 7. Critères généraux de validation finale

La recette sera considérée comme validée si :

1. les parcours critiques fonctionnent de bout en bout ;
2. les pages publiques principales sont accessibles, cohérentes et indexables ;
3. l’adhésion en 3 étapes est opérationnelle ;
4. la modération avant publication est effective ;
5. l’espace adhérent sécurisé est protégé et fonctionnel ;
6. les relances automatiques sont correctement tracées ;
7. le back-office permet la gestion courante sans blocage ;
8. les formulaires rejettent correctement les erreurs ;
9. les éléments d’accessibilité essentiels sont présents ;
10. aucune régression manifeste n’est détectée sur les routes et composants clés.

---

## 8. Sources / preuves citées

### Architecture et décisions
- `architecture.md`
- `architecture-addendum.md`
- `DECISIONS.md`
- `README.md`

### Front public
- `src/app/(public)/page.tsx`
- `src/app/(public)/reseau/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/(public)/adhesion/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/app/(public)/documents-utiles/page.tsx`
- `src/app/(public)/mentions-legales/page.tsx`
- `src/app/(public)/confidentialite/page.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`

### Back-office
- `src/app/admin/page.tsx`
- `src/app/admin/demandes/page.tsx`
- `src/app/admin/demandes/[id]/page.tsx`
- `src/app/admin/adherents/page.tsx`
- `src/app/admin/adherents/[id]/page.tsx`
- `src/app/admin/fiches/page.tsx`
- `src/app/admin/actualites/page.tsx`
- `src/app/admin/actualites/new/page.tsx`
- `src/app/admin/actualites/[id]/page.tsx`
- `src/app/admin/offres-emploi/page.tsx`
- `src/app/admin/offres-emploi/new/page.tsx`
- `src/app/admin/offres-emploi/[id]/page.tsx`
- `src/app/admin/parametres/page.tsx`
- `src/app/admin/relances/page.tsx`
- `src/app/admin/(auth)/login/page.tsx`

### API / sécurité / automatisation
- `src/app/api/upload/logo/route.ts`
- `src/app/api/upload/news-image/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/webhooks/brevo/route.ts`
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/lib/auth/magic-link.ts`

### Composants métiers
- `src/components/adhesion/*`
- `src/components/fiche/profile-form.tsx`
- `src/components/annuaire/*`
- `src/components/admin/*`
- `src/components/public/*`
- `src/components/layout/*`

### Tests
- `tests/e2e/example.spec.ts`
- `tests/unit/contact.test.ts`
- `tests/unit/member-card.test.tsx`
- `tests/unit/member-logo.test.ts`
- `tests/unit/member-showcase.test.tsx`
- `tests/unit/seeded-shuffle.test.ts`
- `tests/unit/seo.test.ts`
- `tests/unit/utils.test.ts`

---

## 9. Questions ouvertes / points à valider

1. **Référentiels métier fermés**
   - liste finale des domaines d’activité ;
   - liste finale des compétences ;
   - liste finale des certifications / agréments ;
   - validation des statuts juridiques.

2. **Contenus institutionnels**
   - liste finale des membres du bureau ;
   - photos validées ;
   - frise chronologique définitive ;
   - partenaires ;
   - texte de présentation / manifeste.

3. **E-mails**
   - expéditeur final ;
   - réponse-à ;
   - validation DNS SPF / DKIM / DMARC ;
   - textes définitifs des modèles transactionnels.

4. **Relances**
   - confirmation du plafond exact d’envois ;
   - confirmation des règles d’arrêt manuel ;
   - comportement attendu après désactivation d’un adhérent.

5. **Magic link**
   - confirmer la durée de vie si elle diverge du standard de 30 jours ;
   - confirmer le comportement en cas de renvoi multiple ;
   - confirmer l’invalidation après usage ou non.

6. **Admin / sécurité**
   - besoin réel d’une 2FA optionnelle à terme ;
   - besoin d’un audit log exhaustif en production ;
   - politique de rotation des secrets.

7. **Annuaire**
   - règles exactes d’affichage sur les fiches sans contact, sans site, sans description ;
   - logique de mise en avant des adhérents en vitrine ;
   - nombre maximum d’éléments affichés sur la page d’accueil.

8. **SEO / contenu**
   - validation finale des textes meta ;
   - validation des images OG ;
   - canonical des pages filtrées et paginées.

9. **Données importées**
   - cohérence des scripts d’import avec le référentiel final ;
   - règles de rapprochement et de dédoublonnage des fiches.

10. **Back-office**
    - confirmation du périmètre exact des actions de validation / désactivation / réactivation ;
    - besoin de journaliser toutes les actions administratives sensibles.