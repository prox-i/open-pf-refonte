# Stratégie d'amélioration priorisée
Le dépôt montre une refonte déjà avancée, avec un socle Next.js/TypeScript cohérent, une séparation public/admin, une base de données versionnée, un authentificateur dédié, des uploads sécurisés, des scripts d’import et un appareil de tests réel. La note globale actuelle est bonne, mais elle reste freinée par quelques zones où la complexité locale demeure trop élevée, par des points de sécurité qui ne sont pas encore complètement durcis, et par une couverture de tests encore trop inégale sur les flux sensibles. Le chemin vers 9/10 n’est donc pas un chantier de reconstruction : c’est un travail de consolidation ciblée et de fermeture des risques identifiés par les preuves.

La stratégie doit prioriser les actions qui font monter simultanément la maintenabilité, la sécurité et la robustesse sans casser les arbitrages déjà validés dans `architecture.md` et `DECISIONS.md`. Les quick wins les plus fiables sont ceux qui réduisent immédiatement la dette visible dans les plus gros composants/pages, qui complètent les protections des flux d’upload/auth/cron, et qui verrouillent les comportements critiques avec des tests orientés mutation et parcours utilisateur. Les dossiers administratifs et les formulaires complexes sont les meilleurs candidats, parce que les preuves montrent à la fois des signaux de volumétrie, des responsabilités encore mélangées, et un fort enjeu produit.

Pour atteindre la cible de 9/10, il faut aussi respecter une contrainte méthodologique : ne pas disperser les efforts sur des améliorations « confort » tant que les principaux points d’écart du scoring ne sont pas traités. Les actions ci-dessous sont ordonnées pour maximiser l’impact par effort, avec des missions Claude suffisamment cadrées pour être exécutées de manière autonome sur des fichiers précis, des tests précis et des critères d’acceptation explicites. Les points les plus risqués restent les routes d’upload, l’auth admin, les mutations admin et le volume de certains écrans, parce qu’ils touchent à la fois la sécurité, la maintenabilité et la confiance dans les parcours métier.
## Vue d'ensemble
Le plan d’exécution est construit autour de trois vagues successives. La première vague traite les quick wins à forte valeur : extraire la logique trop dense des plus gros écrans publics et admin, réduire le couplage des formulaires, et stabiliser les parcours qui concentrent l’essentiel des interactions métier. La deuxième vague verrouille les chemins critiques par des tests plus proches des mutations réelles et des parcours utilisateurs, en particulier sur l’authentification, les demandes, les uploads et les relances. La troisième vague applique les durcissements restants sur la sécurité et la gouvernance technique, notamment là où le code montre encore des TODO, des logs, ou une protection incomplète.

Le diagnostic priorisé est le suivant : le projet est déjà professionnel, mais il présente un plafond de maturité lié à l’agrégation de logique dans quelques modules trop gros et à l’insuffisance de preuves de robustesse sur les flux les plus sensibles. Les preuves montrent une architecture globalement saine, un bon usage de Zod, Drizzle et de la documentation, mais aussi des pages longues, des composants client qui portent encore beaucoup d’orchestration, et un manque de couverture visible sur les mutations admin et certains endpoints. L’amélioration la plus rentable consiste donc à transformer les écrans « monolithiques » en assemblages plus lisibles, puis à compenser cette simplification par des tests qui prouvent que les comportements restent identiques.

La cible 9/10 est crédible si l’on respecte cette séquence : 1) réduire la complexité locale des gros écrans, 2) solidifier les flux sensibles avec des tests ciblés, 3) finir le durcissement sécurité/runtime. Cette approche améliore simultanément les critères `fallback_3`, `fallback_5`, `fallback_9` et, par effet secondaire, `fallback_2`, `fallback_1` et `fallback_6`. Le projet ne semble pas avoir besoin d’une refonte de fond ; il a besoin d’une fermeture méthodique des écarts qui empêchent la note d’atteindre le niveau « excellent ».
- Score global actuel : **7.5** / 10
- Score minimum actuel : **7.0** / 10
- Score cible : **9** / 10
- Écart à combler : Écart global de 1,5 point à combler, avec un plan centré sur la consolidation des pages/flux les plus complexes, la sécurisation des endpoints sensibles et l’augmentation des preuves de robustesse sur les mutations admin et les parcours critiques.
- ScoringEvidencePack utilisé : **oui**
- Evidence pack généré le : 2026-06-03T22:09:15.165Z
- Actions : **5** (5 automatisables Claude, 0 manuelles)
## Quick wins
- Découper d’abord les gros écrans publics et admin visibles dans les preuves (`src/app/(public)/page.tsx`, `src/app/(public)/adherents/page.tsx`, `src/app/admin/page.tsx`) pour faire baisser la complexité locale sans changer le produit.
- Supprimer les traces de debug encore présentes dans les endpoints sensibles et formaliser un audit minimal des logs restants, en s’appuyant sur les signaux `console.log` et les routes API listées dans le pack.
- Ajouter des tests de non-régression sur les mutations admin les plus critiques avant d’élargir le périmètre, car le repo a déjà une base de tests unitaires crédible à capitaliser.
- Durcir les routes d’upload et la route Brevo TODO avec des validations explicites et des comportements d’échec déterministes, parce que les preuves montrent des points de sécurité localisés et bien identifiés.
## Bloqueurs
- La logique métier est encore trop concentrée dans certains écrans/pages, ce qui limite la maintenabilité et la lisibilité globale.
- Les flux sensibles (auth, uploads, admin mutations, cron) ne disposent pas encore d’une couverture de tests démontrée au niveau des risques réels.
- La sécurité de certains endpoints dépend encore d’implémentations partielles ou de TODO explicites, notamment sur les webhooks et les logs opérationnels.
- Les gros composants client et pages publiques/admin peuvent encore générer des rerenders et une charge de maintenance supérieure au niveau visé.
## Points de validation humaine
- Valider que la découpe des gros écrans conserve bien les libellés, les états et l’ordre de lecture attendus sur les pages publiques et admin.
- Valider avec le bureau ou l’équipe produit que les critères d’acceptation sur les actions d’administration correspondent aux vrais cas métier avant de durcir les tests.
- Valider les choix de sécurité restants qui touchent à l’infrastructure ou aux secrets si un ajustement de configuration est nécessaire, même si le code applicatif reste modifiable par Claude.
- Valider manuellement les parcours sensibles après refactorisation des formulaires et des actions admin, en particulier login, demande, validation, upload et relance.
## Plan d'actions priorisé
### 1. Extraire l’orchestration des plus gros écrans publics pour réduire la dette de lisibilité
_Priorité : **high** · Effort : **M** · Risque : **Faible** · Automatisable Claude : **oui**_
**Problème observé**
Les preuves montrent plusieurs pages publiques déjà riches en metadata, JSON-LD, héro, sections et liste de contenus, avec une orchestration importante dans les fichiers de route eux-mêmes. Le signal de fichiers longs et la description Agent A indiquent que la logique métier/présentation n’est pas encore suffisamment extraite partout.
**Action recommandée**
Isoler les blocs stables des pages publiques en composants de domaine (hero, stats, listings, CTA, pagination, empty states), puis réduire les pages à du composage de haut niveau et à la récupération de données.
**Critères impactés** : fallback_3, fallback_2, fallback_1
**Scores actuels** : Maintenabilité (7/10), Architecture et séparation des responsabilités (8/10), Qualité générale du code (7/10)
**Objectif / cibles** : Maintenabilité → 9/10, Architecture et séparation des responsabilités → 9/10, Qualité générale du code → 8/10
**Preuves (refs)** : src/app/(public)/page.tsx, src/app/(public)/adherents/page.tsx, src/app/(public)/actualites/page.tsx, src/app/(public)/offres-emploi/page.tsx, signal: fichiers longs (14), fallback_3 evidence: src/components/adhesion/adhesion-form.tsx
**Fichiers cibles** : src/app/(public)/page.tsx, src/app/(public)/adherents/page.tsx, src/app/(public)/actualites/page.tsx, src/components/annuaire/directory-hero.tsx, src/components/annuaire/directory-stats.tsx, src/components/public/*
**Modules** : site public, annuaire, actualités, offres d’emploi
**Impacts attendus**
- Métier : Navigation plus fiable pour les visiteurs, évolutivité plus simple pour les prochaines pages publiques, et baisse du risque de régression lors des évolutions éditoriales.
- Technique : Moins de logique dans les routes, composants plus réutilisables, meilleure lisibilité pour les futures missions Claude, et base plus saine pour les tests de rendu.
- Gains score estimés : Gain attendu sur la maintenabilité via une réduction mesurable de la taille et du nombre de responsabilités par page.; Gain attendu sur l’architecture grâce à une séparation plus nette entre routes, présentation et données.; Gain indirect sur la qualité générale en réduisant les exceptions de style et les zones de couplage local.
**Tests à exécuter**
- pnpm lint
- pnpm typecheck
- pnpm test tests/unit/seo.test.ts
- pnpm e2e
**Critères d'acceptation**
- Les pages ciblées conservent le même rendu fonctionnel et la même navigation.
- Chaque page cible contient nettement moins d’assemblage inline et davantage de composants de domaine.
- Les tests SEO et les tests E2E existants passent sans adaptation comportementale.
- Aucun nouveau TODO ou contournement n’est introduit dans les routes publiques.
**Notes automatisation** : Mission entièrement automatisable par Claude Code sur les fichiers de pages et les composants de présentation. Validation humaine uniquement sur le rendu visuel final et l’ordre de lecture.
### 2. Découper et sécuriser les écrans admin les plus denses pour faire monter la maintenabilité et la robustesse
_Priorité : **high** · Effort : **L** · Risque : **Moyen** · Automatisable Claude : **oui**_
**Problème observé**
Les preuves montrent des pages admin qui accumulent consultation, orchestration de données et actions dans les mêmes fichiers, avec une séparation encore trop faible entre le shell de page et les sous-blocs métier. Agent A signale aussi un niveau de couverture tests correct mais encore insuffisant sur les flux de mutation admin.
**Action recommandée**
Extraire les tableaux, les panneaux de détail et les boutons d’action dans des composants admin dédiés, puis ajouter des tests unitaires et d’intégration sur les états d’affichage et les actions de mutation les plus risqués.
**Critères impactés** : fallback_3, fallback_5, fallback_9, fallback_2
**Scores actuels** : Maintenabilité (7/10), Sécurité (7/10), Tests et robustesse (8/10), Architecture et séparation des responsabilités (8/10)
**Objectif / cibles** : Maintenabilité → 9/10, Sécurité → 8/10, Tests et robustesse → 9/10, Architecture et séparation des responsabilités → 9/10
**Preuves (refs)** : src/app/admin/page.tsx, src/app/admin/demandes/page.tsx, src/app/admin/demandes/[id]/page.tsx, src/app/admin/adherents/page.tsx, src/app/admin/adherents/[id]/page.tsx, src/app/admin/offres-emploi/page.tsx, src/app/admin/offres-emploi/[id]/page.tsx, src/app/admin/parametres/page.tsx, src/components/admin/member-actions.tsx, tests/unit/member-card.test.tsx, tests/unit/member-showcase.test.tsx
**Fichiers cibles** : src/app/admin/page.tsx, src/app/admin/demandes/page.tsx, src/app/admin/demandes/[id]/page.tsx, src/app/admin/adherents/page.tsx, src/app/admin/adherents/[id]/page.tsx, src/app/admin/offres-emploi/page.tsx, src/app/admin/offres-emploi/[id]/page.tsx, src/app/admin/parametres/page.tsx, src/components/admin/member-actions.tsx, src/components/admin/*
**Modules** : back-office admin, actions membres, paramètres, contenu éditorial
**Impacts attendus**
- Métier : Back-office plus stable pour le bureau, moins de risque de casser une action de validation ou de publication lors d’un futur changement de contenu.
- Technique : Composants admin plus réutilisables, séparation nette entre collecte de données et rendu, meilleure base pour ajouter de nouveaux écrans sans créer de fichiers lourds.
- Gains score estimés : Montée de la maintenabilité par réduction du volume par fichier et meilleure répartition des responsabilités.; Montée de la robustesse grâce à des tests couvrant les actions admin réelles, pas seulement les helpers.; Amélioration de la qualité générale par suppression des assemblages trop monolithiques.
**Tests à exécuter**
- pnpm lint
- pnpm typecheck
- pnpm test tests/unit/member-card.test.tsx tests/unit/member-showcase.test.tsx
- pnpm test
- pnpm e2e
**Critères d'acceptation**
- Les pages admin ciblées restent fonctionnellement équivalentes.
- Les tableaux, actions et panneaux de détail sont sortis des pages pour limiter la complexité inline.
- Au moins un test couvre désormais les actions administratives critiques ou leurs invariants visuels.
- Aucun changement de droits ni de flux métier n’est introduit accidentellement.
**Notes automatisation** : Claude peut effectuer la découpe des composants et l’ajout des tests de rendu/interaction. Une validation humaine est recommandée sur les écrans de détail et sur le comportement des actions destructrices ou de publication.
### 3. Renforcer les endpoints d’upload et supprimer les traces de debug des flux sensibles
_Priorité : **high** · Effort : **M** · Risque : **Moyen** · Automatisable Claude : **oui**_
**Problème observé**
Les preuves montrent deux routes d’upload déjà protégées mais encore perfectibles sur la normalisation des erreurs, la validation d’entrées et la propreté des traces de debug. Le scoring mentionne explicitement des `console.log`, une CSP déjà discutée, et une sécurisation incomplète des flux sensibles.
**Action recommandée**
Uniformiser les réponses d’erreur, renforcer les validations explicites, supprimer les traces de debug, et finir la route Brevo TODO en mode fail-safe avant toute exposition plus large.
**Critères impactés** : fallback_5, fallback_1, fallback_9
**Scores actuels** : Sécurité (7/10), Qualité générale du code (7/10), Tests et robustesse (8/10)
**Objectif / cibles** : Sécurité → 8/10, Qualité générale du code → 8/10, Tests et robustesse → 9/10
**Preuves (refs)** : src/app/api/upload/logo/route.ts, src/app/api/upload/news-image/route.ts, src/app/api/webhooks/brevo/route.ts, src/app/api/cron/reminders/route.ts, signal: console.log détecté, fallback_5 evidence: next.config.ts, fallback_9 evidence: tests/e2e/example.spec.ts
**Fichiers cibles** : src/app/api/upload/logo/route.ts, src/app/api/upload/news-image/route.ts, src/app/api/webhooks/brevo/route.ts, src/app/api/cron/reminders/route.ts, next.config.ts, src/lib/auth/magic-link.ts
**Modules** : uploads médias, webhook Brevo, cron relances, auth magic-link
**Impacts attendus**
- Métier : Moins de risque de rupture sur les uploads ou les notifications, et plus grande confiance des utilisateurs admin lors de l’usage quotidien.
- Technique : Endpoints plus prévisibles, logs plus propres, maintenance plus simple des cas d’échec, et meilleure base pour un futur suivi d’incidents.
- Gains score estimés : Gain de sécurité sur les points d’entrée sensibles.; Gain de qualité générale par réduction du bruit opérationnel et des exceptions de style.; Gain de robustesse par comportement déterministe des endpoints en erreur.
**Tests à exécuter**
- pnpm lint
- pnpm typecheck
- pnpm test tests/unit/validations.test.ts tests/unit/contact.test.ts
- pnpm test
- pnpm e2e
**Critères d'acceptation**
- Les routes d’upload répondent de façon cohérente sur les cas de succès et d’échec.
- Aucune trace de debug inutile ne subsiste dans les chemins sensibles modifiés.
- La route Brevo ne reste plus un simple TODO si elle fait partie du périmètre ciblé.
- Les validations de taille/type restent strictement appliquées.
**Notes automatisation** : Claude peut automatiser le durcissement applicatif et la normalisation des réponses. Si une modification de configuration d’infrastructure ou de secrets est nécessaire, elle doit rester manuelle hors code.
### 4. Ajouter des tests de mutation et de parcours sur auth, demandes et adhésion
_Priorité : **high** · Effort : **M** · Risque : **Faible** · Automatisable Claude : **oui**_
**Problème observé**
Agent A signale explicitement que la couverture visible reste faible sur auth/admin/uploads/cron, alors que les fichiers de tests actuels sont surtout unitaires sur les helpers, le SEO et quelques composants d’annuaire. Le dépôt dispose pourtant déjà des dépendances nécessaires pour couvrir ces parcours.
**Action recommandée**
Écrire des tests d’intégration et E2E couvrant les scénarios de connexion admin, de validation des demandes, de soumission d’adhésion et de comportement a11y des écrans principaux, afin de transformer les risques en preuves.
**Critères impactés** : fallback_9, fallback_5, fallback_8
**Scores actuels** : Tests et robustesse (8/10), Sécurité (7/10), Accessibilité (8/10)
**Objectif / cibles** : Tests et robustesse → 9/10, Sécurité → 8/10, Accessibilité → 9/10
**Preuves (refs)** : tests/e2e/example.spec.ts, tests/unit/validations.test.ts, tests/unit/seo.test.ts, tests/unit/contact.test.ts, src/app/api/auth/[...nextauth]/route.ts, src/auth.ts, src/components/adhesion/adhesion-form.tsx, src/components/admin/login-form.tsx
**Fichiers cibles** : tests/e2e/example.spec.ts, tests/unit/validations.test.ts, tests/unit/contact.test.ts, tests/unit/seo.test.ts, src/components/adhesion/adhesion-form.tsx, src/components/admin/login-form.tsx, src/app/admin/demandes/[id]/page.tsx
**Modules** : auth admin, adhésion, demandes, SEO, accessibilité
**Impacts attendus**
- Métier : Réduction des régressions fonctionnelles et meilleure confiance lors des mises en production ou des itérations rapides sur le back-office.
- Technique : Suite de tests plus représentative du produit réel, meilleure détection des ruptures sur les états critiques, et base fiable pour les futurs refactors.
- Gains score estimés : Score de robustesse en hausse grâce à la couverture des mutations et parcours réels.; Renforcement de la sécurité perçue via la validation des chemins d’accès protégés.; Montée de l’accessibilité en instrumentant les écrans les plus importants avec des assertions plus concrètes.
**Tests à exécuter**
- pnpm test
- pnpm e2e
- pnpm lint
- pnpm typecheck
**Critères d'acceptation**
- Au moins un parcours complet couvre la connexion admin ou ses équivalents critiques.
- Au moins un test couvre une mutation métier sensible côté demandes ou adhésion.
- Les tests a11y existants sont conservés et idéalement étendus à un écran clé supplémentaire.
- Les nouveaux tests échouent sur les régressions attendues et passent sur le comportement cible.
**Notes automatisation** : Claude peut écrire la majorité des tests si les sélecteurs et les scénarios sont bien décrits. Une validation humaine reste recommandée pour confirmer les parcours métier et les attentes a11y sur les écrans les plus riches.
### 5. Formaliser les limites des écrans riches et les budgets de stabilité/performance attendus
_Priorité : **medium** · Effort : **S** · Risque : **Faible** · Automatisable Claude : **oui**_
**Problème observé**
Les preuves indiquent une bonne base de performance, mais sans profilage visible ni budget explicite, et une évolutivité surtout pensée pour un périmètre modéré. La documentation est forte mais hétérogène, et certaines limites restent plus implicites qu’opérationnelles.
**Action recommandée**
Ajouter des sections de limites, de budget de rendu et de stratégie de cache/revalidation dans la documentation canonique, puis aligner les pages lourdes avec ces règles de façon explicite.
**Critères impactés** : fallback_6, fallback_10, fallback_4
**Scores actuels** : Performance (7/10), Scalabilité / évolutivité (7/10), Lisibilité et documentation (8/10)
**Objectif / cibles** : Performance → 8/10, Scalabilité / évolutivité → 8/10, Lisibilité et documentation → 9/10
**Preuves (refs)** : src/app/(public)/page.tsx, src/app/(public)/actualites/page.tsx, src/app/(public)/adherents/page.tsx, architecture.md, architecture-addendum.md, README.md
**Fichiers cibles** : architecture.md, architecture-addendum.md, README.md, src/app/(public)/page.tsx, src/app/(public)/actualites/page.tsx, src/app/(public)/adherents/page.tsx
**Modules** : documentation d’architecture, site public, annuaire, actualités
**Impacts attendus**
- Métier : Meilleure capacité à expliquer le produit et ses limites au bureau, aux mainteneurs et aux futurs contributeurs, avec moins d’ambiguïtés sur ce qui est supporté ou non.
- Technique : Moins d’ambiguïté sur le cache, les pages dynamiques et les limites de charge, ce qui aide les futures missions Claude à rester alignées sur les choix du projet.
- Gains score estimés : Amélioration de la lisibilité documentaire et de la cohérence des arbitrages techniques.; Hausse de la note de performance grâce à une stratégie plus lisible et plus stable sur les pages publiques.; Hausse de la scalabilité perçue grâce à une clarification des limites et des points d’extension.
**Tests à exécuter**
- pnpm lint
- pnpm typecheck
- pnpm build
**Critères d'acceptation**
- La documentation canonique explicite les limites et les arbitrages sur les pages/flux lourds.
- Les pages mentionnées conservent un comportement stable et aligné avec la stratégie documentée.
- Les instructions d’exploitation et de contribution restent cohérentes avec le code réellement présent.
**Notes automatisation** : La partie documentation est automatisable par Claude, ainsi qu’une mise à jour légère des commentaires techniques dans les pages concernées. La validation humaine est utile pour confirmer que les limites décrites sont réalistes et acceptées par l’équipe.