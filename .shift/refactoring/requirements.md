# Documentation projet SHIFT — open-pf-refonte

Pack documentaire généré dans `.shift/refactoring/`.

## Index

- [CDC fonctionnel](.shift/refactoring/CDC_FONCTIONNEL.md) — 2991 mots — _functional_cdc_
- [CDC technique](.shift/refactoring/CDC_TECHNIQUE.md) — 2525 mots — _technical_cdc_
- [Cartographie du code](.shift/refactoring/CARTOGRAPHIE_CODE.md) — 1878 mots — _code_map_
- [Cahier de recette](.shift/refactoring/CAHIER_RECETTE.md) — 3101 mots — _recipe_
- [authentification et sécurité](.shift/refactoring/workflows/WORKFLOW_AUTHENTIFICATION.md) — 2415 mots — _workflow_
- [parcours d'adhésion](.shift/refactoring/workflows/WORKFLOW_ADHESION.md) — 2702 mots — _workflow_
- [espace adhérent et fiche sécurisée](.shift/refactoring/workflows/WORKFLOW_FICHE_ADHERENT.md) — 2261 mots — _workflow_
- [annuaire des adhérents](.shift/refactoring/workflows/WORKFLOW_ANNUAIRE.md) — 2781 mots — _workflow_
- [back-office de modération](.shift/refactoring/workflows/WORKFLOW_ADMIN_MODERATION.md) — 3086 mots — _workflow_
- [contenu éditorial actualités et SEO](.shift/refactoring/workflows/WORKFLOW_CONTENT_ACTUALITES.md) — 2441 mots — _workflow_
- [offres d'emploi](.shift/refactoring/workflows/WORKFLOW_OFFRES_EMPLOI.md) — 1985 mots — _workflow_
- [relances automatiques et e-mails transactionnels](.shift/refactoring/workflows/WORKFLOW_RELANCES_EMAIL.md) — 2541 mots — _workflow_

## Lecture recommandée pour Claude Code

1. README.md
2. CDC_FONCTIONNEL.md
3. CDC_TECHNIQUE.md
4. CARTOGRAPHIE_CODE.md
5. CAHIER_RECETTE.md
6. workflows/*.md

---

## Extrait — CDC fonctionnel

# Cahier fonctionnel reconstitué — open-pf-refonte

## 1. Objet du document

Ce document reconstitue le cahier fonctionnel du projet **open-pf-refonte** à partir des preuves disponibles dans le pack de preuves fonctionnelles, ainsi que des décisions d’architecture et du mockup.

Il décrit :
- les objectifs métier ;
- les typologies d’utilisateurs ;
- le périmètre fonctionnel ;
- les modules fonctionnels ;
- les parcours ;
- les règles métier observées ;
- les objets de données ;
- les états et transitions ;
- les emails et notifications ;
- les intégrations fonctionnelles ;
- les risques, questions ouvertes et points à valider.

**Sources principales :**
- `RequirementsEvidencePack`
- `architecture.md`
- `DECISIONS.md`
- `mockup/open_pf_site_8_5/*.html`
- extraits applicatifs : `src/app/...`, `src/components/...`, `src/lib/...`

---

## 2. Niveau de confiance

**Niveau de confiance global : moyen à élevé.**

### Raisons
- Le périmètre global est bien corroboré par `architecture.md`, `DECISIONS.md` et les pages mockup.
- Plusieurs règles métier sont confirmées par le code applicatif.
- Certains points restent ambigus ou en contradiction partielle entre mockup, architecture et implémentation.

### Points de confiance élevés
- annuaire des adhérents ;
- adhésion en plusieurs étapes ;
- magic link pour compléter la fiche ;
- relances automatiques ;
- back-office de validation ;
- contenus publics institutionnels ;
- actualités et offres d’emploi ;
- gestion d’upload d’images/logos.

### Points de confiance moyens
- liste exacte des champs métier dans certaines fiches ;
- nombre exact d’étapes selon les modules ;
- gestion des compétences/certifications ;
- limites de relance et conditions d’arrêt ;
- périmètre exact des notifications admin.

---

## 3. Vue d’ensemble du projet

Le projet est une **refonte du site OPEN Polynésie française** :
- site vitrine institutionnel ;
- annuaire des adhérents ;
- formulaire d’adhésion ;
- espace sécurisé de complétion de fiche adhérent ;
- back-office mono-administrateur ;
- contenus éditoriaux : actualités, offres d’emploi, documents utiles, contact, mentions légales, confidentialité.

### Objectif métier
L’association OPEN veut :
- valoriser la filière numérique en Polynésie française ;
- représenter les entreprises du secteur ;
- rendre visible les adhérents ;
- fluidifier la collecte d’adhésions ;
- permettre la complétion des fiches par lien sécurisé sans mot de passe ;
- industrialiser les validations et relances.

**Sources :**
- `architecture.md` section 1 ;
- `DECISIONS.md` sections 2, 3, 5, 6 ;
- `src/app/(public)/page.tsx`
- `src/app/(public)/reseau/page.tsx`
- `mockup/open_pf_site_8_5/index.html`

---

## 4. Typologie des utilisateurs

### 4.1 Visiteur public
Peut :
- consulter l’accueil ;
- parcourir le réseau ;
- rechercher des adhérents ;
- consulter une fiche adhérent ;
- lire les actualités ;
- consulter les offres d’emploi ;
- contacter l’association ;
- initier une demande d’adhésion.

**Preuves :**
- `src/app/(public)/page.tsx`
- `src/app/(public)/adherents/page.tsx`
- `src/app/(public)/adherents/[slug]/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/app/(public)/adhesion/page.tsx`

### 4.2 Candidat à l’adhésion / entreprise demandeuse
Peut :
- remplir un formulaire d’adhésion ;
- sauvegarder sa saisie ;
- soumettre une demande ;
- recevoir ou utiliser un magic link pour compléter sa fiche.

**Preuves :**
- `src/components/adhesion/adhesion-form.tsx`
- `src/components/adhesion/adhesion-modal.tsx`
- `src/app/(public)/adhesion/page.tsx`
- `src/app/(public)/fiche/[token]/page.tsx`
- `src/components/fiche/profile-form.tsx`

### 4.3 Administrateur
Peut :
- se connecter ;
- consulter les demandes ;
- valider / refuser / désactiver ;
- envoyer un magic link ;
- consulter / piloter les relances ;
- gérer les actualités ;
- gérer les offres d’emploi ;
- piloter les paramètres du site.

**Pre

_… extrait tronqué — voir le fichier complet dans le repo._