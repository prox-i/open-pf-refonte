# Relecture critique des audits — ONBAAA-49

> Produit par le Chef d'Onboarding (ONBAAA-49) le 2026-06-18.
> Basé sur la lecture intégrale des 7 fichiers `*_AUDIT.md` produits par l'auditeur (ONBAAA-48),
> confrontés à `CLAUDE.md`, `architecture.md`, `CARTE_DES_DOMAINES.md`, `RELECTURE_WORKFLOWS.md`.

---

## Verdict global

**Acceptable avec réserves**

Les 7 audits forment un ensemble cohérent, bien documenté, avec une discipline de distinction faits/hypothèses/incertitudes remarquable. Les bugs fonctionnels les plus graves (legalStatusId, revalidatePath manquants, jsonLd vide) sont correctement identifiés et recoupés entre plusieurs audits. Deux réserves structurelles limitent la valeur opérationnelle de l'ensemble :

1. **L'absence de graduation de sévérité explicite** (CRITIQUE / IMPORTANT / MINEUR) dans les audits rend difficile la priorisation des correctifs pour un dev qui découvrirait ces fichiers. Les audits emploient des références (`B1`, `B4`, etc.) à `RELECTURE_WORKFLOWS.md` sans reproduire les niveaux de sévérité — les deux documents doivent être lus ensemble.

2. **Trois audits ont une couverture partielle connue** (A11Y : medium, FORMS : medium côté UI, SEO : medium sur les pages éditoriales). Ce n'est pas une faute — l'auditeur l'indique explicitement — mais le board doit savoir que ces zones restent à vérifier avant de considérer les audits comme complets.

---

## Par audit : ARCHITECTURE_AUDIT

**Verdict** : Bon

**Pertinence** : Excellente. Tous les constats sont vérifiables : `bcrypt-ts` dans `package.json`, `next-auth@5.0.0-beta.31`, dualité `board-members.ts`/`team_members`, tests unitaires absents sur les Server Actions. Aucun point inventé.

**Sévérité** : Juste. La beta `next-auth` est traitée comme une dette opérationnelle (pas un bug), `bcrypt-ts` comme un doublon non urgent. Correct.

**Complétude** :
- [MINEUR] L'audit ne mentionne pas la configuration CI/CD (GitHub Actions, Vercel preview). Sans pipeline de test automatisé sur PR, les tests unitaires et e2e ne servent que localement.
- [MINEUR] Le commentaire sur le middleware Edge vs Node runtime est une hypothèse non vérifiée — l'audit aurait pu lire `next.config.ts` pour vérifier si `experimental.runtime` est configuré.

**Actionabilité** : Bonne. Recommandations concrètes avec fichiers cibles identifiés.

**Problèmes** :
- Aucun bloquant. L'audit est le plus solide des 7.

---

## Par audit : AUTH_AUDIT

**Verdict** : Bon

**Pertinence** : Excellente. Les 5 problèmes de sécurité sont appuyés sur des numéros de ligne précis dans les fichiers sources. L'analyse cryptographique du magic link est correcte.

**Sévérité** : Globalement juste, avec une nuance :
- [MINEUR] Le problème "token inséré avant email" (B8) est présenté comme une dette technique. Il mériterait une sévérité IMPORTANTE car en cas d'échec Brevo silencieux, l'admin pense que le lien a été envoyé alors que l'adhérent ne l'a pas reçu — c'est un bug fonctionnel confirmé, pas un risque théorique.
- Le problème des sessions JWT persistantes après désactivation est correctement minorisé pour un back-office mono-admin.

**Complétude** :
- [BLOQUANT] L'audit ne soulève pas la question de la **rotation du secret HMAC** (`MAGIC_LINK_SECRET`). Si le secret est compromis, tous les tokens actifs (jusqu'à 30 jours de TTL) sont invalidés en changeant le secret, mais l'audit ne documente pas cette procédure d'urgence ni si elle est connue.
- [MINEUR] Aucune mention du comportement de l'upload logo (`api/upload/logo/route.ts`) si le token magic link est utilisé après soumission du profil — l'audit évoque ce fichier mais ne conclut pas que ce cas est géré.

**Actionabilité** : Bonne. Toutes les recommandations sont concrètes avec des extraits de code SQL/code.

**Problèmes** :
- [BLOQUANT] Angle mort sur la procédure de rotation du secret HMAC — à documenter ou à mentionner comme risque opérationnel.

---

## Par audit : DB_AUDIT

**Verdict** : Bon

**Pertinence** : Excellente. Le bug `legalStatusId: null` est le point le plus critique de l'ensemble des audits — il est correctement identifié avec la ligne précise dans `adhesion.ts`. L'absence d'index et le N+1 sont bien documentés.

**Sévérité** : Correcte sur le fond, mais l'organisation des "Dettes techniques" vs "Risques" manque de hiérarchie explicite. Le bug `legalStatusId` mérite d'être explicitement classé CRITIQUE (toutes les adhésions depuis le lancement ont un statut juridique null en DB) mais l'audit ne distingue pas ce point comme plus grave que l'absence d'index.

**Complétude** :
- [IMPORTANT] L'audit ne mentionne pas si `drizzle-kit migrate` est dans le pipeline de déploiement. Le CLAUDE.md §8 interdit `drizzle-kit push` en production — sans lire le `drizzle.config.ts` et les scripts de déploiement, cette règle est non vérifiable. L'auditeur l'identifie comme question ouverte mais aurait pu la traiter.
- [MINEUR] Le format de `news.content` et `jobOffers.description` (Markdown vs HTML vs texte brut) est identifié comme incertitude mais pas relié au risque d'injection HTML si le front utilise `dangerouslySetInnerHTML` sur du contenu admin — angle de sécurité manqué.

**Actionabilité** : Très bonne. Les requêtes SQL pour les index sont précisées.

**Problèmes** :
- [MINEUR] Le niveau de sévérité du bug `legalStatusId` devrait être explicitement CRITIQUE plutôt que listé parmi les dettes techniques au même niveau que l'absence d'index.

---

## Par audit : FORMS_AUDIT

**Verdict** : Acceptable avec réserves

**Pertinence** : Bonne sur la couche validation/Server Actions. La partie UI est correctement flaggée "medium" — l'audit ne prétend pas ce qu'il n'a pas vérifié.

**Sévérité** :
- [MINEUR] `updateSiteStats` sans Zod est présenté comme une violation CLAUDE.md §3 — c'est juste, mais la sévérité réelle est faible : la donnée est un entier nullable saisi par un admin authentifié, le vecteur d'exploitation est minimal. L'audit ne module pas cette nuance.
- La double soumission de `submitAdhesion` est mentionnée mais sans évaluation de la gravité : avec `generateUniqueSlug`, le résultat est deux entrées DB avec des slugs différents mais le même contenu — c'est un vrai risque opérationnel si l'adhérent recharge la page.

**Complétude** :
- [IMPORTANT] L'audit ne couvre pas le **comportement du formulaire multi-étapes en cas de timeout ou erreur réseau sur la Server Action**. Si `submitAdhesion` échoue après 30 secondes (timeout Vercel), l'utilisateur voit-il une erreur récupérable ou perd-il son brouillon ? Ce cas d'usage est critique pour le workflow principal.
- [IMPORTANT] `src/lib/validations/member-profile.ts` et `src/lib/validations/admin.ts` sont explicitement non lus — deux schémas Zod centraux restent non audités.
- [MINEUR] L'audit relève que `newsSchema` et `jobSchema` sont dans `content.ts` au lieu de `lib/validations/` — c'est juste, mais l'auditeur aurait pu vérifier si ces schémas incluent bien une validation Zod du champ `jsonLd` (qui est vide en production selon SEO_AUDIT).

**Actionabilité** : Bonne pour les bugs confirmés. Les recommandations sur les composants UI (modale de confirmation, localStorage corrompu) sont correctes mais non vérifiables sans lire les composants.

**Problèmes** :
- [BLOQUANT] Les schémas `member-profile.ts` et `admin.ts` ne sont pas audités — gap de couverture à combler.

---

## Par audit : PERF_AUDIT

**Verdict** : Bon

**Pertinence** : Excellente sur les bugs de cache ISR — les lignes de code manquantes (`revalidatePath('/adherents')`) sont citées avec précision. Le streaming Suspense sur `/adherents` est correctement analysé.

**Sévérité** : Juste. Les deux bugs ISR sont des impacts utilisateur immédiats (membres invisibles jusqu'à 1h, offres non mises à jour) — leur gravité est correctement identifiée comme élevée.

**Complétude** :
- [IMPORTANT] L'audit n'aborde pas la stratégie de `revalidateTag` vs `revalidatePath`. Pour un projet Next.js 15, `revalidateTag` est plus précis et permet d'invalider une fiche individuelle sans invalider tout `/adherents`. L'opportunité d'une meilleure architecture de cache n'est pas mentionnée.
- [MINEUR] Le bundle first-load JS n'a pas été mesuré (hypothèse "probablement raisonnable"). Sans exécuter `next build`, l'objectif de 80 kB du CLAUDE.md §12 reste non vérifié. L'audit aurait pu lister les dépendances client-side estimées pour affiner l'hypothèse.
- [MINEUR] `force-dynamic` sur les fiches membres est présenté comme un risque à volume. L'alternative `unstable_cache` ou `revalidate = 60` est mentionnée en question ouverte mais pas recommandée — manque de décisivité.

**Actionabilité** : Très bonne. Les corrections des bugs ISR sont triviales (une ligne par bug) et clairement localisées.

**Problèmes** :
- Aucun bloquant. Les limites sont honnêtement documentées.

---

## Par audit : SEO_AUDIT

**Verdict** : Acceptable avec réserves

**Pertinence** : Bonne sur les éléments lus. Le bug `jsonLd` jamais rempli pour actualités et offres est un constat direct dans le code (`content.ts` ne renseigne jamais ce champ).

**Sévérité** :
- [BLOQUANT] Les offres d'emploi sans `JobPosting` JSON-LD sont présentées comme une dette technique. C'est une violation directe du CLAUDE.md §13 ET un impact business direct : les offres ne peuvent pas apparaître dans Google Jobs. La sévérité devrait être CRITIQUE, pas "dette technique".
- Les URLs canoniques relatives sont présentées comme une dette — c'est discutable. Next.js 15 résout les canoniques relatives avec le header `Host` de manière fiable en production Vercel. Sans preuve d'un bug observable, classer ça comme "dette" est peut-être trop prudent.

**Complétude** :
- [IMPORTANT] `src/app/(public)/actualites/[slug]/page.tsx` et `src/app/(public)/offres-emploi/[slug]/page.tsx` ne sont pas lus — la présence de `generateMetadata` sur les pages de détail des contenus éditoriaux est non confirmée, alors que le CLAUDE.md §13 l'exige explicitement.
- [IMPORTANT] L'audit relève que `opengraph-image.tsx` existe mais ne le lit pas. Si ces fichiers ont des bugs (logo absent, dimensions incorrectes), le partage social sera cassé sur les pages les plus partagées.
- [MINEUR] La page `documents-utiles` dans le sitemap sans table DB correspondante est mentionnée mais le risque (404 crawlé) n'est pas évalué concrètement.

**Actionabilité** : Bonne sur les recommandations concrètes. La recommandation de construire `jsonLd` dans `upsertNews`/`upsertJob` est correcte, mais l'audit ne propose pas de structure de données JSON-LD — un dev devra chercher le schéma schema.org séparément.

**Problèmes** :
- [BLOQUANT] Les pages de détail des contenus éditoriaux (actualités, offres) ne sont pas lues — gap de couverture majeur pour un audit SEO.
- [MINEUR] La sévérité du bug `jsonLd` offres d'emploi est sous-estimée.

---

## Par audit : A11Y_AUDIT

**Verdict** : Acceptable avec réserves

**Pertinence** : Correcte sur les éléments testés (axe-core, skip link, structure DOM). Toutes les incertitudes sont clairement marquées — l'auditeur ne prétend pas ce qu'il n'a pas vu.

**Sévérité** :
- [BLOQUANT] Le formulaire d'adhésion multi-étapes (workflow le plus critique du produit) est identifié comme zone de risque, mais l'audit ne peut pas confirmer la présence ou l'absence d'`aria-live` et d'`aria-describedby` sans lire les composants. Signaler ce point comme "incertitude" est honnête, mais du point de vue du relecteur, c'est une **zone non auditée** déguisée en audit partiel.
- Les tests axe limités aux violations `critical` (pas `serious`) sont correctement identifiés comme lacune — mais sans estimation du nombre de violations `serious` attendues, la sévérité réelle est inconnue.

**Complétude** :
- [IMPORTANT] L'audit ne couvre pas les **composants admin non testés par axe** (pages `/admin/*`). Le CLAUDE.md §6 s'applique à tout le projet, pas seulement aux pages publiques. Un back-office inaccessible est un problème réel si l'admin a un handicap.
- [IMPORTANT] La navigation clavier complète (tabulation dans les formulaires multi-étapes, activation des boutons d'action, ordre de tabulation) n'est pas couverte — les tests axe ne testent pas la navigation clavier.
- [MINEUR] Le contraste des couleurs du thème Tailwind n'est pas vérifiable sans `tailwind.config.ts`. L'audit aurait pu lire ce fichier.

**Actionabilité** :
- Les recommandations 1, 4, 5 sont concrètes et actionables.
- Les recommandations 2 et 3 sont conditionnnelles ("vérifier la présence d") — l'audit recommande de vérifier ce qu'il aurait dû vérifier. Ce n'est pas une recommandation actionable, c'est un aveu de lacune de couverture.

**Problèmes** :
- [BLOQUANT] `adhesion-form.tsx`, `stepper.tsx`, `step-*.tsx` — les composants du workflow critique ne sont pas lus. L'audit A11Y du formulaire d'adhésion est un audit de l'entour, pas du formulaire lui-même.
- [BLOQUANT] `member-actions.tsx` (modales admin) non lu — focus management et accessibilité des actions critiques non vérifiés.

---

## Cohérence inter-audits

### Recoupements corrects (points confirmés par plusieurs audits)

- **Bug `legalStatusId: null`** : identifié dans DB_AUDIT (fait observé, ligne citée), FORMS_AUDIT (B1 confirmé), référencé dans RELECTURE_WORKFLOWS. Cohérent et confirmé. ✓
- **Tokens magic link non invalidés** : identifié dans AUTH_AUDIT (B8, B9) et DB_AUDIT (accumulation de tokens). Les deux audits se recoupent et se renforcent. ✓
- **N+1 dans le cron de relances** : identifié dans DB_AUDIT et PERF_AUDIT avec la même analyse. Cohérent. ✓
- **Absence d'index DB** : identifié dans DB_AUDIT (absence de `CREATE INDEX`) et PERF_AUDIT (impact sur `searchMembers`). Cohérent. ✓
- **`revalidatePath('/adherents')` manquant dans `approveMember`** : identifié dans PERF_AUDIT, cohérent avec ARCHITECTURE_AUDIT qui note l'absence de tests sur les Server Actions. ✓
- **`jsonLd` jamais rempli** : identifié dans SEO_AUDIT depuis `content.ts`, cohérent avec FORMS_AUDIT qui note les schémas locaux dans `content.ts`. ✓

### Incohérences ou tensions entre audits

- **`@base-ui/react` vs Shadcn** : ARCHITECTURE_AUDIT le signale comme ambiguïté non résolue. A11Y_AUDIT s'appuie sur "Shadcn fournit des primitives accessibles par défaut" sans noter que si `@base-ui/react` est utilisé pour certains composants, la garantie d'accessibilité de Shadcn ne s'applique pas. Tension non résolue.
- **`getMemberByToken` sans filtre `usedAt`** : AUTH_AUDIT la classe comme "incohérence UX" et "hypothèse : comportement intentionnel". FORMS_AUDIT ne mentionne pas ce cas alors qu'il impacte directement l'UX post-soumission du profil adhérent. Gap de cohérence entre les deux audits.
- **Format de `news.content`** : DB_AUDIT soulève l'incertitude Markdown/HTML/texte brut. SEO_AUDIT recommande `dangerouslySetInnerHTML` pour injecter le JSON-LD sans noter le risque si `content` est du HTML éditeur — deux audits touchent le même composant sans se coordonner.

### Angles morts globaux (non couverts par aucun audit)

- **Pipeline CI/CD** : aucun audit ne confirme que les tests unitaires et e2e tournent en CI avant merge. Sans ça, les tests existent mais ne protègent pas les PRs.
- **Procédure de rollback** : en l'absence de transactions Neon HTTP, quelle est la procédure pour détecter et corriger un membre `submitted` sans contacts ? DB_AUDIT le mentionne mais ne le résout pas.
- **`src/lib/validations/member-profile.ts`** et **`src/lib/validations/admin.ts`** : non lus par aucun audit. Deux schémas de validation centraux restent non vérifiés.
- **Composants formulaire admin** (`news-form.tsx`, `job-form.tsx`) : non lus par aucun audit. Les formulaires d'édition du contenu éditorial — directement liés aux bugs SEO (jsonLd) et FORMS — sont des angles morts.

---

## Synthèse des verdicts

| Audit            | Verdict              | Raison principale                                                       |
|------------------|----------------------|-------------------------------------------------------------------------|
| ARCHITECTURE     | Bon                  | Constats directs, bien documentés, cohérents avec le code               |
| AUTH             | Bon                  | Problèmes de sécurité précis et vérifiables, angle mort sur rotation secret |
| DB               | Bon                  | Bug legalStatusId correctement identifié, index et N+1 bien analysés    |
| FORMS            | Acceptable           | Couche serveur bien couverte, couche UI et 2 schémas clés non lus       |
| PERF             | Bon                  | Bugs ISR précis et actionables, bundle non mesuré                       |
| SEO              | Acceptable           | Pages éditoriales non lues, jsonLd offres sous-évalué en sévérité       |
| A11Y             | Acceptable           | Composants du workflow critique non lus, incertitudes non résolues      |

---

## Recommandations au board

1. **Avant de clore l'onboarding**, lire les fichiers non couverts : `adhesion-form.tsx`, `stepper.tsx`, `step-*.tsx`, `member-actions.tsx`, `actualites/[slug]/page.tsx`, `offres-emploi/[slug]/page.tsx`, `validations/member-profile.ts`, `validations/admin.ts`.
2. **Trier les bugs confirmés par sévérité** avant remise au développeur :
   - CRITIQUE : bug `legalStatusId: null` (toutes les adhésions depuis le lancement), `jsonLd` offres d'emploi vide (Google Jobs impossible), `revalidatePath('/adherents')` manquant.
   - IMPORTANT : tokens magic link non invalidés, format `content` non documenté, schémas content locaux.
   - MINEUR : `bcrypt-ts` orphelin, URLs canoniques relatives, sitemap `force-dynamic`.
3. **Les audits A11Y et SEO sont partiels** — les signaler comme tels dans le livrable final plutôt que comme des audits complets.
