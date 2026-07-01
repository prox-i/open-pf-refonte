# Agenda OPEN

Bloc « Agenda OPEN » affiché dans la section « Actualités de la filière » de la home,
administrable depuis le back-office. Pas de page publique dédiée.

## Modèle de données — table `agenda_events`
| champ | type | notes |
|---|---|---|
| id | uuid | PK |
| title | varchar(200) | requis |
| description | text | optionnel |
| eventDate | date | requis (date calendaire) |
| startTime | varchar(5) | « HH:MM » optionnel |
| location | varchar(200) | optionnel |
| detailUrl | text | optionnel — « Voir plus » seulement si présent |
| isExternalUrl | boolean | ouvre dans un nouvel onglet si vrai |
| isPublished | boolean | brouillon / publié |
| showOnHome | boolean | afficher dans l'agenda de la home |
| sortOrder | integer | tri secondaire |
| createdAt / updatedAt | timestamptz | |

## Règles de publication (home)
- publié (`isPublished = true`) **et** `showOnHome = true` **et** à venir ;
- tri : date croissante puis `sortOrder` ;
- « Voir plus → » uniquement si `detailUrl` est renseigné (jamais de lien vide).

## Expiration (heure de Tahiti)
Un événement disparaît le **lendemain** du jour où il a lieu, en heure de Tahiti
(UTC−10, sans DST) : il reste visible toute sa journée puis disparaît. Logique dans
`src/lib/agenda.ts` (`tahitiToday`, `isUpcoming`), testée dans `tests/unit/agenda.test.ts`.

## Fichiers
- Modèle : `src/lib/db/schema.ts` (agendaEvents) + `drizzle/0005_*.sql`
- Helpers : `src/lib/agenda.ts`
- Requêtes : `src/lib/db/queries/agenda.ts`
- Actions admin : `src/lib/actions/admin/agenda.ts`
- Home : `src/components/public/agenda-card.tsx`, `agenda-event-item.tsx`
- Back-office : `src/app/admin/agenda/**`, `src/components/admin/agenda-event-form.tsx`
- Seed d'exemples : `scripts/seed-agenda.ts` (`pnpm seed:agenda`)
