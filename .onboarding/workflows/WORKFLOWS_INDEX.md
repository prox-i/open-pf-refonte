# Index des workflows — open-pf (refonte)

> Produit par l'agent « Analyste de workflows » (ONBAAA-46) le 2026-06-18.  
> Fondé sur la lecture directe des fichiers sources listés dans chaque fichier WORKFLOW_*.md.  
> À lire avant de toucher n'importe quel processus métier ou technique du dépôt.

---

## Liste des workflows identifiés

| Clé | Titre | Domaine(s) | Type | Acteur principal |
|-----|-------|------------|------|-----------------|
| [SOUMISSION_ADHESION](WORKFLOW_SOUMISSION_ADHESION.md) | Soumission d'une demande d'adhésion | adhesion | user_journey | Entreprise candidate |
| [VALIDATION_ADMIN_DEMANDE](WORKFLOW_VALIDATION_ADMIN_DEMANDE.md) | Traitement d'une demande par l'admin | adhesion, backoffice | backoffice_flow | Admin |
| [MAGIC_LINK_ENVOI](WORKFLOW_MAGIC_LINK_ENVOI.md) | Envoi du magic link à un adhérent | auth, notifications | backoffice_flow | Admin |
| [EDITION_FICHE_ADHERENT](WORKFLOW_EDITION_FICHE_ADHERENT.md) | Édition de la fiche adhérent via magic link | annuaire, auth | user_journey | Adhérent (via lien) |
| [UPLOAD_LOGO](WORKFLOW_UPLOAD_LOGO.md) | Upload du logo d'un adhérent | annuaire, auth | technical_flow | Adhérent (via lien) |
| [CONNEXION_ADMIN](WORKFLOW_CONNEXION_ADMIN.md) | Connexion de l'administrateur | auth, backoffice | backoffice_flow | Admin |
| [ANNUAIRE_PUBLIC](WORKFLOW_ANNUAIRE_PUBLIC.md) | Consultation et filtrage de l'annuaire public | annuaire | user_journey | Grand public |
| [RELANCE_AUTOMATIQUE](WORKFLOW_RELANCE_AUTOMATIQUE.md) | Relances automatiques de validation (cron) | notifications, adhesion | scheduled_flow | Système (cron Vercel) |
| [GESTION_ACTUALITES](WORKFLOW_GESTION_ACTUALITES.md) | Création et publication d'une actualité | editorial | backoffice_flow | Admin |
| [GESTION_OFFRES_EMPLOI](WORKFLOW_GESTION_OFFRES_EMPLOI.md) | Création et gestion d'une offre d'emploi | editorial | backoffice_flow | Admin |
| [CONTACT_PUBLIC](WORKFLOW_CONTACT_PUBLIC.md) | Formulaire de contact public | institutional, notifications | user_journey | Grand public |
| [MISE_A_JOUR_PARAMETRES](WORKFLOW_MISE_A_JOUR_PARAMETRES.md) | Mise à jour des chiffres clés du site | institutional, backoffice | backoffice_flow | Admin |

---

## Notes de découpage

- **SOUMISSION_ADHESION** et **VALIDATION_ADMIN_DEMANDE** sont deux workflows distincts : le premier est piloté par l'entreprise candidate, le second est piloté par l'admin. Ils partagent la table `members` mais ont des points d'entrée, des acteurs et des règles complètement différents.
- **MAGIC_LINK_ENVOI** est séparé d'**EDITION_FICHE_ADHERENT** car l'envoi du lien (par l'admin) et l'utilisation du lien (par l'adhérent) sont deux parcours distincts avec des acteurs différents.
- **UPLOAD_LOGO** est séparé d'**EDITION_FICHE_ADHERENT** car c'est un endpoint API distinct (`/api/upload/logo`) avec sa propre logique de validation de token et de traitement d'image.
- **GESTION_ACTUALITES** et **GESTION_OFFRES_EMPLOI** sont deux workflows distincts malgré le même fichier d'actions (`content.ts`) : les entités, les statuts et les règles métier diffèrent.
- Le webhook Brevo (`/api/webhooks/brevo/route.ts`) n'est **pas documenté comme workflow** : le fichier ne contient qu'un stub `TODO P4` sans implémentation réelle.
