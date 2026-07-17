# Contexte projet

## Objectif
_Non renseigné dans SHIFT._

## Contexte technique
_Non renseigné dans SHIFT._

## Repository
- **Cible** : prox-i/open-pf-refonte
- **Branche source** : main
- **Score cible** : 9/10
- **Itérations max** : 3

## Frameworks
- Next.js
- React

## Langages
- JavaScript/TypeScript
- JavaScript/TypeScript

## Architecture
Frameworks: nextjs, react
Routes 5 · Contrôleurs 0

## Finalité
Le projet vise probablement à refondre une plateforme web de type association/réseau professionnel en Polynésie, en unifiant un site public d’information, un espace adhérent, une zone d’administration et des mécanismes d’import/synchronisation de données membres. Les fichiers de maquette montrent des pages de présentation, d’adhésion, d’annuaire, de contact, d’actualités, d’offres d’emploi, d’administration des demandes et des relances, ce qui indique un produit à la fois éditorial et transactionnel. La présence d’architecture, de décisions, de schémas Drizzle et de scripts d’import suggère une volonté de cadrer la solution sur des fondations maintenables et industrialisables.

## Contraintes importantes
- Ne pas modifier `.github/workflows/*` sans ticket dédié.
- Ne pas exposer secrets, tokens ou clés API.
- Ne pas faire de refonte massive non demandée.

## Ce qu'il ne faut pas casser
- Comportement métier existant sans preuve de test.
- Pipeline CI/CD et configuration de déploiement.