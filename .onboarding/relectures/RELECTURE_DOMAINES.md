# Relecture de la Carte des Domaines — ONBAAA-45

> Produit par le relecteur critique (Chef d'Onboarding, ONBAAA-45) le 2026-06-18.  
> Artefact challengé : `CARTE_DES_DOMAINES.md` (ONBAAA-44).

---

## Verdict global

**Acceptable avec réserves**

La carte est solide dans l'ensemble : bonne couverture fonctionnelle, preuves fichier/code abondantes, 5 incertitudes honnêtement signalées. Elle est suffisamment intelligible pour un agent en aval. Cependant, deux problèmes de frontières sont suffisamment structurels pour mériter correction avant la phase d'implémentation — notamment la double appartenance de l'entité `members` et la position ambiguë de `backoffice` comme pseudo-domaine.

---

## Points forts

- **Exhaustivité des preuves** : chaque domaine liste les fichiers sources, les routes, et les indices de rattachement. Un agent implémenteur peut s'y référer sans accès au code.
- **Niveau de confiance explicite** : le champ `Confiance: high` sur tous les domaines est cohérent avec la densité de preuves fournie.
- **Signalement honnête des incertitudes** : les 5 zones grises (board-members.ts vs DB, documents-utiles, espace-adhérent, admin/fiches, webhook Brevo) sont bien posées et bloquantes à juste titre.
- **Diagramme de dépendances** : la carte ASCII + le tableau des flux sont complémentaires et permettent une lecture rapide.
- **Séparation des deux mécanismes d'auth** : la distinction auth admin (Auth.js) / magic link adhérent est clairement documentée dans le domaine `auth`.

---

## Problèmes identifiés

### [BLOQUANT] Entité `members` partagée sans patron explicite entre `adhesion` et `annuaire`

Les domaines `adhesion` et `annuaire` opèrent tous les deux sur la table `members`, ainsi que sur `memberContacts`, `memberActivities`, `memberCertifications`. La carte ne documente pas le patron d'isolation choisi.

Sans clarification, un agent implémenteur peut :
- dupliquer les requêtes Drizzle sur `members` dans les deux domaines,
- ignorer les contraintes de lecture (`status = active`) lors des mutations d'adhésion,
- créer un couplage implicite entre les deux contextes via des imports croisés.

**Ce qu'il faut préciser** : est-ce un _shared kernel_ (la table est partagée, les deux domaines en sont conscients) ou un _CQRS_ light (adhesion écrit, annuaire ne lit que les membres `active`) ? La mention actuelle « Création du membre — le membre passe en `active` après validation » est insuffisante pour trancher.

---

### [BLOQUANT] Flèche `annuaire → auth` erronée dans le diagramme

Le diagramme montre `annuaire` comme source du flux « déclenche envoi token » vers `auth`. Or, d'après les preuves elles-mêmes, c'est `src/lib/actions/admin/members.ts` (sous `adhesion` / `backoffice`) qui appelle `sendMagicLink()`. L'annuaire n'émet aucun token — il consomme le magic link via `/fiche/[token]/page.tsx`.

La flèche correcte est : `backoffice (approveMember) → auth (sendMagicLink) → notifications (sendMagicLinkEmail)`.

Cette erreur peut induire un agent en aval à placer `sendMagicLink()` dans le mauvais domaine ou à créer une dépendance circulaire annuaire ↔ auth.

---

### [MINEUR] `backoffice` décrit comme domaine métier alors que c'est une couche infrastructure

`backoffice` est présenté au même niveau que `adhesion` et `editorial` (catégorie `technique`), mais il n'encapsule aucune règle métier propre : c'est un shell d'accueil (layout, dashboard agrégé) et un journal d'audit transverse. L'`auditLog` est une préoccupation cross-domaine, pas une logique appartenant à un domaine.

**Risque concret** : un agent peut s'autoriser à importer des modules `backoffice` depuis tous les autres domaines, ou ne pas savoir où placer une logique d'audit dans un domaine qui n'est pas `backoffice`.

**Suggestion de reformulation** : renommer en `shell-admin` et qualifier explicitement qu'il ne contient pas de règle métier, uniquement de l'assemblage et de l'observabilité.

---

### [MINEUR] `notifications` cumule des responsabilités de trois domaines différents

La description du domaine `notifications` mélange :
1. les relances automatiques (propriété de `adhesion`, déclenchées par l'état `submitted`)
2. l'envoi du magic link (propriété de `auth`, ou du flux `adhesion → auth`)
3. l'email de contact (propriété de `institutional`)

En l'état, `notifications` est un domaine technique de livraison (Brevo + templates + cron), ce qui est légitime. Mais les types de workflows attendus incluent « envoi magic link depuis l'admin » comme si c'était une responsabilité propre au domaine — ce qui créé une ambiguïté sur qui décide d'envoyer quoi.

**Suggestion** : reformuler les workflows attendus de `notifications` en mode passif (« reçoit les demandes d'envoi des autres domaines ») plutôt qu'actif (« envoie le magic link »).

---

### [MINEUR] Incertitude n°4 (`admin/fiches`) mal catégorisée

L'ambiguïté entre `admin/demandes`, `admin/adherents` et `admin/fiches` est signalée comme « incertitude », mais elle est en réalité un problème structurel de chevauchement de routes dans le domaine `annuaire`/`adhesion`. Si les trois pages coexistent sans responsabilité distincte, cela implique des composants dupliqués et une UX confuse pour l'admin.

Cette question mérite d'être remontée au board pour décision avant de cartographier les composants en phase 2 — ce n'est pas juste une incertitude à « confirmer ».

---

## Recommandations

1. **Clarifier le patron `members` partagé** (BLOQUANT) : ajouter une section « Kernel partagé » ou « CQRS » dans la carte, explicitant que `adhesion` possède les mutations et que `annuaire` ne lit que les membres `active`. Cette règle doit être codifiée (ex : `lib/db/queries/members.ts` est la seule source de lecture pour `annuaire`).

2. **Corriger la flèche `annuaire → auth`** (BLOQUANT) : remplacer par `backoffice → auth → notifications` dans le diagramme, en concordance avec les preuves code.

3. **Reformuler `backoffice` comme couche d'assemblage** : distinguer clairement qu'il ne contient pas de règle métier, pour éviter que des agents y déplacent de la logique.

4. **Reclasser les workflows de `notifications` en passif** : inverser le sens des responsabilités dans la description.

5. **Escalader l'incertitude n°4** (`admin/fiches` vs `admin/adherents`) au board avant la phase 2 — la réponse impacte directement la structure des composants.

6. Les incertitudes n°1 (board-members.ts vs DB), n°2 (documents-utiles), n°3 (espace-adhérent), et n°5 (webhook Brevo) sont bien posées et peuvent rester en suspens jusqu'à la phase concernée, à condition qu'elles soient tracées dans un backlog visible.
