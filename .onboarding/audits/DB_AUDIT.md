# Modèle de données (DB) — Audit

> Confiance : high
> Produit par l'agent Auditeur (ONBAAA-48) le 2026-06-18.
> Fondé sur la lecture directe de : `src/lib/db/schema.ts`, `drizzle/0000_quiet_phalanx.sql`, `drizzle/0001_keen_the_executioner.sql`, `drizzle/0003_drop_events.sql`, `src/lib/actions/adhesion.ts`, `src/lib/actions/admin/members.ts`, `src/lib/actions/admin/content.ts`, `src/lib/actions/admin/settings.ts`, `src/lib/actions/member-profile.ts`, `src/lib/db/queries/members.ts`, `src/app/api/cron/reminders/route.ts`.

---

## Compréhension globale

Le modèle de données couvre 7 domaines : membres (cycle de vie adhésion), contenus éditoriaux (actualités + offres d'emploi), institutionnel (partenaires, bureau, frise, stats), authentification admin, tokens magic link, logs de relances et journal d'audit. Le schéma est maintenu dans un unique fichier `src/lib/db/schema.ts` (243 lignes) conformément au CLAUDE.md §8. Drizzle ORM est utilisé avec le driver Neon HTTP serverless.

---

## Résumé exécutif

Le schéma est propre, bien typé, et les conventions Drizzle sont respectées. Les enums PostgreSQL sont utilisés à bon escient, les clés primaires sont toutes en UUID, les timestamps incluent le fuseau horaire. Deux défauts sérieux ressortent : (1) l'absence totale d'index secondaires sur les colonnes les plus interrogées (notamment `members.status`, `member_tokens.member_id`, `reminder_logs.member_id`) qui constitue un risque de performance croissant avec le volume ; (2) l'incohérence de `legalStatusId` — la colonne existe en DB avec FK sur `legal_statuses`, mais `submitAdhesion` l'insère systématiquement à `null`, silencieusement. Un bug fonctionnel confirmé depuis les premières migrations. La contrainte de la stack (Neon HTTP driver sans support de transactions) est documentée dans le code mais non mitigée : une panne intermédiaire peut laisser un membre `submitted` sans ses contacts, domaines ou certifications.

---

## Constats détaillés

### Structure générale du schéma

**Fait observé** : Le schéma définit 19 tables + 4 enums PostgreSQL dans `src/lib/db/schema.ts`. Toutes les tables utilisent `uuid` en clé primaire avec `defaultRandom()`. Les timestamps utilisent `timestamp(..., { withTimezone: true })` — bonne pratique pour un déploiement international. Les relations m:n (`memberActivities`, `memberCertifications`) utilisent `primaryKey({ columns: [...] })` composite. Les delete rules sont définies (`onDelete: 'cascade'` pour les entités enfants, `onDelete: 'set null'` pour les références optionnelles comme `jobOffers.memberId`).

### Bug : `legalStatusId` jamais renseigné

**Fait observé** : `stepEntrepriseSchema` dans `src/lib/validations/adhesion.ts` exige `legalStatus: z.string().min(1, 'Statut juridique requis')`. Cette valeur passe la validation Zod mais n'est pas mappée vers `legalStatusId` dans `submitAdhesion` (`src/lib/actions/adhesion.ts`, ligne 52) : `legalStatusId: null` est inscrit en dur. La colonne `members.legal_status_id` en DB est nullable — aucune erreur SQL n'est levée. Le statut juridique de chaque adhésion est silencieusement perdu depuis le début du projet.

### Absence de transactions (Neon HTTP driver)

**Fait observé** : `submitAdhesion` effectue 4 insertions séquentielles sans transaction : `members`, `memberContacts`, `memberActivities`, `memberCertifications`. `submitMemberProfile` effectue 1 update + 2 delete + 2 insert séquentiels. Le commentaire dans les deux fichiers documente explicitement la limitation : `// neon-http driver does not support transactions`. En cas de panne réseau ou d'erreur Neon après le premier `INSERT members`, un membre `submitted` peut se retrouver sans contacts, sans domaines, ou sans certifications. La récupération manuelle devrait être documentée dans les procédures opérationnelles.

### Absence d'index secondaires

**Fait observé** : Le schéma `schema.ts` ne définit aucun index secondaire au-delà des contraintes `UNIQUE` et des clés primaires. Les requêtes critiques qui manquent d'index :
- `members.status` : filtré dans `getActiveMembers()`, `searchMembers()`, et le cron de relances. Sans index, chaque lecture scanne toute la table.
- `member_tokens.member_id` : jointure dans `resolveToken()` et `sendMagicLink()`.
- `reminder_logs.member_id + type` : requête composite dans le cron `api/cron/reminders/route.ts` (ligne 40).
- `news.status`, `job_offers.status` : filtrés dans les pages publiques et le sitemap.

**Hypothèse** : avec ~50 membres actuellement, l'absence d'index est imperceptible. À 500 membres ou en cas de charge cron, ces scans pourraient devenir problématiques.

### Pattern N+1 dans le cron de relances

**Fait observé** : `src/app/api/cron/reminders/route.ts` récupère tous les membres `submitted` en une requête, puis effectue **une requête DB par membre** pour obtenir son dernier log de relance (lignes 38–43). Si 30 membres sont en attente, le cron émet 31 requêtes DB. Ce pattern N+1 est acceptable au volume actuel mais sera coûteux à l'échelle.

### Table `events` créée puis droppée

**Fait observé** : `drizzle/0000_quiet_phalanx.sql` crée une table `events` (10 colonnes, avec `slug`, `title`, `starts_at`, `is_published`). `drizzle/0003_drop_events.sql` ne contient qu'une ligne : `DROP TABLE IF EXISTS "events"`. La table n'apparaît plus dans `schema.ts`. **Hypothèse** : une fonctionnalité événements a été esquissée puis abandonnée. Pas de risque résiduel côté applicatif, mais les migrations documentent ce churn.

### `members.reviewedBy` sans FK

**Fait observé** : `members.reviewedBy` est de type `uuid` sans contrainte de clé étrangère vers `adminUsers.id`. Le commentaire dans `schema.ts` (ligne 74) justifie : `// adminUsers.id (no FK to avoid circular dep)`. **Hypothèse** : la contrainte peut être ajoutée sans circularité réelle (Drizzle gère les auto-références). En l'état, une suppression d'`adminUsers` laisse des `reviewedBy` orphelins sans avertissement DB.

### `siteStats` : table single-row

**Fait observé** : `siteStats` a une clé primaire `integer('id').primaryKey().default(1)` — toujours `1`. `updateSiteStats` utilise `onConflictDoUpdate` pour un upsert sur `id = 1`. C'est un anti-pattern courant mais acceptable pour ce cas d'usage (chiffres clés saisis manuellement). La contrainte `memberCount` et `domainCount` ne sont pas dans cette table (elles sont calculées dynamiquement dans `queries/stats.ts`).

### Accumulation de `memberTokens`

**Fait observé** : `sendMagicLink` insère un nouveau token sans invalider les anciens pour le même membre (`src/lib/actions/admin/members.ts`, lignes 121–124). Plusieurs tokens actifs peuvent coexister pour un membre. La table `memberTokens` n'a pas de mécanisme de purge. **Hypothèse** : avec 50 membres et un usage modéré, l'accumulation reste négligeable, mais l'accumulation indéfinie de tokens actifs constitue une surface d'attaque croissante (identifiée comme B8 et B9 dans RELECTURE_WORKFLOWS).

### `news.content` et `jobOffers.description` en texte libre

**Fait observé** : Les champs `content` (news) et `description` (jobOffers) sont de type `text` — aucune contrainte de format. Aucune indication dans le schéma ou le CLAUDE.md sur le format attendu (Markdown, HTML, texte brut). **Incertitude** : les composants d'affichage n'ont pas été lus. Si le front attend du Markdown et que l'admin saisit du texte brut, l'affichage sera correct mais sans formatage. Si le front attend du HTML, du texte brut sera affiché tel quel.

---

## Forces

- **Schéma lisible et autonome** : un développeur peut comprendre l'intégralité du modèle de données en lisant un seul fichier de 243 lignes.
- **Enums PostgreSQL natifs** : `memberStatusEnum`, `newsStatusEnum`, `jobStatusEnum`, `reminderTypeEnum` — les états invalides sont rejetés au niveau DB.
- **Delete rules cohérentes** : `cascade` pour les entités enfants des membres, `set null` pour les références optionnelles. Pas de lignes orphelines sur suppression d'un membre.
- **Migrations commitées** : les 4 fichiers `drizzle/*.sql` sont dans le dépôt, conformément au CLAUDE.md §8.
- **`memberTokens.tokenHash` en UNIQUE** : un hash ne peut pas être réutilisé. La contrainte DB protège contre une insertion accidentelle en doublon.

---

## Dettes techniques

- **Bug `legalStatusId: null`** : conflit entre le schéma de validation (valeur obligatoire) et l'action serveur (valeur ignorée). Aucune donnée historique de statut juridique n'est utilisable.
- **Absence d'index** : `members.status`, `member_tokens.member_id`, `reminder_logs.member_id + type`, `news.status`, `job_offers.status` n'ont pas d'index dédiés.
- **N+1 dans le cron** : une requête par membre soumis plutôt qu'un seul `LEFT JOIN LATERAL` ou une sous-requête groupée.
- **Tokens orphelins potentiels** : les anciens tokens ne sont pas invalidés lors d'un nouvel envoi de magic link.
- **`reviewedBy` sans FK** : intégrité référentielle non garantie par la DB.

---

## Zones critiques

- **`src/lib/actions/adhesion.ts`** : le seul point d'entrée de la création d'un membre, sans transaction, avec un bug de perte silencieuse de `legalStatusId`. Toute modification doit être testée avec des données de bout en bout.
- **`src/lib/actions/member-profile.ts`** : 5 opérations DB séquentielles sans transaction pour `submitMemberProfile`. Une erreur entre la mise à jour du membre et la suppression/réinsertion des activités laisse les données dans un état incohérent.
- **`src/app/api/cron/reminders/route.ts`** : N+1 queries + pas d'atomicité email/log. Si le log échoue après l'email réussi, la même relance sera renvoyée au prochain cycle.

---

## Risques

- **Incohérence silencieuse des données membres** : le bug `legalStatusId: null` signifie que toutes les adhésions depuis le début du projet ont un statut juridique `null` en DB. Corriger le bug ne corrige pas l'historique.
- **Membres partiellement créés** : sans transactions, une panne pendant `submitAdhesion` peut créer un membre `submitted` sans aucun contact. Le cron de relances enverra des emails pour des membres dont l'admin ne peut pas traiter le dossier correctement.
- **Scalabilité des scans complets** : l'annuaire public (`searchMembers`) fait un scan sur `members.status = 'active'` + filtre texte `ILIKE` sans index. À volume, cela deviendra une requête lente sur la page la plus visitée du site.

---

## Recommandations priorisées

1. **Corriger le bug `legalStatusId`** — mapper `data.legalStatus` vers `legalStatusId` en résolvant l'ID depuis la table `legalStatuses`, ou stocker le label directement. Décision à prendre avant de migrer les données. — `src/lib/actions/adhesion.ts`
2. **Ajouter les index manquants** — via une migration Drizzle : `CREATE INDEX idx_members_status ON members(status)`, `CREATE INDEX idx_member_tokens_member_id ON member_tokens(member_id)`, `CREATE INDEX idx_reminder_logs_member_type ON reminder_logs(member_id, type)`. — `src/lib/db/schema.ts`, nouvelle migration
3. **Invalider les anciens tokens à l'émission d'un nouveau** — `UPDATE member_tokens SET used_at = now() WHERE member_id = ? AND used_at IS NULL AND expires_at > now()` avant l'insert. — `src/lib/actions/admin/members.ts`
4. **Corriger le N+1 du cron** — remplacer la boucle de requêtes individuelles par un `LEFT JOIN LATERAL` ou une requête avec `DISTINCT ON`. — `src/app/api/cron/reminders/route.ts`
5. **Documenter la procédure de récupération des insertions partielles** — tant que Neon HTTP ne supporte pas les transactions, avoir une runbook décrivant comment détecter et corriger un membre `submitted` sans contacts/activités.
6. **Ajouter une contrainte FK sur `members.reviewed_by`** — une migration `ALTER TABLE members ADD CONSTRAINT ... FOREIGN KEY (reviewed_by) REFERENCES admin_users(id) ON DELETE SET NULL`. — `src/lib/db/schema.ts`

---

## Questions ouvertes

- Le format attendu pour `news.content` et `jobOffers.description` est-il du Markdown, du HTML, ou du texte brut ? Cette décision impacte les composants d'affichage et le formulaire d'édition admin.
- La migration de correction du bug `legalStatusId` doit-elle backfiller les membres existants ? Si oui, quelle valeur par défaut utiliser pour les adhésions historiques ?
- `drizzle.config.ts` non lu : confirmer que `drizzle-kit migrate` (et non `push`) est la commande de déploiement documentée dans le CI.
