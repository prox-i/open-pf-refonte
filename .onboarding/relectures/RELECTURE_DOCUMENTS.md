# RELECTURE_DOCUMENTS.md — Relecture critique des documents de synthèse

> Produit par l'agent Chef d'Onboarding (ONBAAA-51) le 2026-06-18.  
> Documents challengés : PROJECT_CONTEXT.md, CARTOGRAPHIE_TECHNIQUE.md, CAHIER_RECETTE.md (ONBAAA-50).  
> Matériau de référence : CARTE_DES_DOMAINES.md, RELECTURE_DOMAINES.md, WORKFLOWS_INDEX.md, RELECTURE_WORKFLOWS.md, tous les WORKFLOW_*.md, tous les *_AUDIT.md, CLAUDE.md.

---

## Verdict global

**Acceptable avec réserves**

Les trois documents sont de bonne facture globale : fidèles au matériau amont, sourcés, avec signalement honnête des zones à faible confiance. Un nouveau développeur peut prendre le projet en main. Cependant, plusieurs imprécisions factuelles et une inexactitude sémantique notable dans le CAHIER_RECETTE doivent être corrigées avant que ces documents servent de référence d'implémentation.

---

## Par document : PROJECT_CONTEXT.md

**Verdict** : Bon

**Points forts** :
- Onboarding en 5 minutes : atteint. La structure (ce que fait le projet → stack → domaines → état actuel → points critiques → incertitudes) est logique et progressive.
- Les 5 points critiques sont exacts, bien sourcés et bien priorisés.
- La table des incertitudes (I1–I5) correspond exactement au matériau amont.
- Le point de couplage `adhesion ↔ annuaire` est correctement nommé comme le bloquant #1 de RELECTURE_DOMAINES.

**Problèmes** :
- [MINEUR] Le bloquant #2 de RELECTURE_DOMAINES (flèche `annuaire → auth` erronée dans le diagramme de la carte des domaines, induisant un placement incorrect de `sendMagicLink()`) n'est pas mentionné dans la section "points d'attention". Ce n'est pas un bug de code mais une erreur dans un artefact d'analyse qui peut induire un implémenteur. Sa mention dans PROJECT_CONTEXT.md aurait été utile même brièvement.
- [MINEUR] La description du domaine `auth` dans le tableau des domaines pourrait préciser que le magic link est géré depuis `admin/members.ts` (domaine `backoffice`) et non depuis le domaine `auth` lui-même — ce qui est la correction apportée par RELECTURE_DOMAINES.

---

## Par document : CARTOGRAPHIE_TECHNIQUE.md

**Verdict** : Bon

**Points forts** :
- L'arborescence de fichiers est précise et cohérente avec les preuves des workflows et audits.
- Le modèle de données est fidèle à DB_AUDIT.md — toutes les tables listées, les états/enums, et les alertes (`legalStatuses` jamais utilisé en écriture, `teamMembers` source de vérité incertaine).
- Les 5 flux de données tracent le chemin exact du code avec les bugs annotés à leurs emplacements précis (⚠ dans les diagrammes).
- La section §6 sur les couplages est la plus complète du corpus : elle corrige implicitement l'erreur `annuaire → auth` de la carte des domaines en attribuant correctement `sendMagicLink()` à `admin/members.ts`.
- Les variables d'environnement sont listées exhaustivement.

**Problèmes** :
- [MINEUR] Section §6 (couplages), ligne `adhesion → notifications` : le label de domaine source est `adhesion` mais la correction apportée par RELECTURE_DOMAINES est que c'est `backoffice` (`admin/members.ts`) qui émet le token, pas `adhesion`. L'étiquette crée une ambiguïté de responsabilité : qui corrige `sendMagicLink()` ? Un implémenteur cherchera dans le dossier `adhesion` au lieu de `admin/`.
- [MINEUR] La note sur le middleware Edge Runtime (`src/auth.config.ts` sans bcryptjs) identifie un risque potentiel mais ne précise pas si c'est un problème actuel ou seulement hypothétique. AUTH_AUDIT.md le qualifie comme bug (B7 dans les workflows). Le CARTOGRAPHIE le traite comme risque conditionnel ("peut causer une erreur") — niveau de gravité sous-estimé par rapport à l'audit source.
- [MINEUR] `news-image/route.ts` est listé dans l'arborescence (§1) avec la mention "auth admin — non lu" mais aucun flux de données (§3) ne couvre ce endpoint. Son absence de trace dans les flux est cohérente, mais devrait être explicitement notée comme zone de confiance `low` à l'instar de `profile-form.tsx`.

---

## Par document : CAHIER_RECETTE.md

**Verdict** : Acceptable avec réserves

**Points forts** :
- Les checkpoints sont quasi-systématiquement testables (action → état vérifiable) et non ambigus.
- La couverture des 12 workflows identifiés est complète : chaque workflow a au moins un cas de test ou un point de régression.
- Les marqueurs `[BUG À CORRIGER AVANT RECETTE]` et `⚠ INCERTAIN` sont bien placés et honnêtes.
- La Section 3 (régression) est particulièrement bien écrite : chaque RG précise le fichier, la règle, et le test concret.

**Problèmes** :
- [BLOQUANT] Section Annexe : l'en-tête dit **« Les 15 points bloquants identifiés dans RELECTURE_WORKFLOWS.md »** — mais RELECTURE_WORKFLOWS.md ne classe pas 15 points comme [BLOQUANT]. Les bugs B2, B3, B5, B6, B7, B14, B15 sont classés "Moyenne" ou "Basse" dans l'annexe elle-même. L'intitulé est donc inexact et peut induire un trieur de tickets à traiter B6 (rate limiting) ou B7 (session persistante) avec la même urgence que B1 (perte de données) ou B8 (sécurité token). Corriger en : **« Les 15 points identifiés dans les audits, classés par priorité de correction »**.
- [MINEUR] CT-01 étape 9 : "Vérifier que le token ne fonctionne plus (accès à la page OK en lecture, sauvegarde/soumission retourne erreur)" — mais WORKFLOW_EDITION_FICHE_ADHERENT note que `getMemberByToken()` ne filtre PAS `usedAt` (le token consommé permet toujours d'accéder à la page en lecture). Ce comportement est un bug signalé (MINEUR dans RELECTURE_WORKFLOWS) mais le test CT-01 le présente comme comportement attendu ("accès à la page OK en lecture") sans signaler que c'est une tolérance temporaire. Ambiguïté pour le testeur.
- [MINEUR] Section 1.5 — Magic link : le checkpoint `[ ] L'envoi de magic link est tracé dans auditLog (incohérence actuelle — source : AUTH_AUDIT.md)` est libellé comme comportement attendu alors que c'est un bug non corrigé. Le marqueur `[BUG À CORRIGER AVANT RECETTE]` manque, contrairement aux autres bugs de la section.
- [MINEUR] Section 1.6 — Relances : le checkpoint `[ ] L'email de relance contient un lien direct vers /admin/demandes/{id}` est marqué ⚠ INCERTAIN, mais WORKFLOW_RELANCE_AUTOMATIQUE.md trace explicitement `sendReminderEmail()` avec le lien admin. Ce point n'a pas de raison d'être incertain — il peut être désambiguïsé.

---

## Fidélité au matériau amont

### Informations inexactes ou manquantes par rapport aux audits/workflows

| Document | Type | Écart |
|---|---|---|
| CARTOGRAPHIE_TECHNIQUE.md §6 | Inexact (mineur) | Label domaine `adhesion → notifications` devrait être `backoffice → notifications` d'après RELECTURE_DOMAINES bloquant #2 |
| CAHIER_RECETTE.md Annexe | Inexact (bloquant pour usage) | "15 points bloquants" — RELECTURE_WORKFLOWS ne classe pas 15 items [BLOQUANT] ; une majorité est [MINEUR] ou priorité "Basse/Moyenne" |
| CAHIER_RECETTE.md CT-01 étape 9 | Ambigu | Présente comme attendu un comportement (page lisible avec token usedAt) que RELECTURE_WORKFLOWS identifie comme bug MINEUR |
| CAHIER_RECETTE.md §1.5 auditLog | Manque marqueur | Bug connu sans marqueur `[BUG À CORRIGER AVANT RECETTE]`, contrairement aux autres |
| PROJECT_CONTEXT.md | Omission mineure | Bloquant #2 RELECTURE_DOMAINES (flèche annuaire→auth erronée) non mentionné |

### Ce qui est correctement transmis

- Tous les bugs B1–B15 sont présents dans CAHIER_RECETTE.md avec leur fichier source et leur priorité.
- L'état "non en production" et la phase de développement initial sont corrects.
- Les 5 incertitudes (I1–I5) de PROJECT_CONTEXT.md correspondent exactement à celles de CARTE_DES_DOMAINES.md.
- L'absence de transactions Neon HTTP (B2) est explicitement traitée dans les trois documents avec le bon niveau de gravité.
- Les bugs SEO (B10) et cache (B4, B12) sont correctement sourcés dans les deux documents qui les mentionnent.

---

## Conclusion

Les documents sont utilisables tel quel pour l'onboarding d'un développeur et le démarrage de l'implémentation, sous réserve de deux corrections avant diffusion :

1. **CAHIER_RECETTE.md** — Corriger le libellé de l'annexe ("15 points bloquants" → "15 points, classés par priorité") et ajouter le marqueur `[BUG À CORRIGER AVANT RECETTE]` sur le checkpoint auditLog magic link.
2. **CARTOGRAPHIE_TECHNIQUE.md** — Corriger le label du couplage `adhesion → notifications` en `backoffice → notifications` pour éviter l'ambiguïté de responsabilité sur `sendMagicLink()`.

Les corrections sont localisées et ne nécessitent pas une réécriture des documents.
