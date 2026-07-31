# Décisions du projet OPEN PF — référence canonique

> Toutes les décisions validées avec le bureau le 21 mai 2026.  
> **Source de vérité unique.** En cas de doute entre ce fichier et un autre document, c'est ce fichier qui prime.

---

## 🎨 1. Charte graphique

**Décision** : palette **magenta du mockup** retenue.

- Couleur principale : `#e6007e` (open-magenta)
- Couleurs d'appui : navy `#050f2e`, blue `#0057d8`, cyan `#29c7ff`
- Tokens complets dans `mockup/open_pf_site_8_5/assets/css/styles.css`
- Le CDC mentionnait « vert/orange/blanc à moderniser » → **abandonné**, la palette magenta est définitive

---

## 📝 2. Formulaire d'adhésion

**Décision** : **3 étapes** (selon le mockup, pas les 5 du CDC).

1. **Informations entreprise** — raison sociale, statut juridique, n° TAHITI, description courte, déjà adhérent MEDEF PF (oui/non)
2. **Domaines d'activité** — sélection multiple parmi 19 entrées (voir `seeds/referentiels.md`)
3. **Coordonnées** — contact(s) principal(aux) + RGPD + consentement

**Implication structurante** : les compétences et certifications sont collectées **uniquement via la fiche adhérent** (espace magic link), pas dans le formulaire d'adhésion initial.

---

## 🪟 3. Format du parcours d'adhésion

**Décision** : **modale** (overlay) au-dessus de n'importe quelle page.

**Pattern technique Next.js** : intercepting routes + parallel routes
```
src/app/(public)/
├── @modal/(.)adhesion/page.tsx   ← modale depuis le clic sur "Adhérer"
├── adhesion/page.tsx              ← version pleine page (URL directe, SEO, partage)
└── layout.tsx                     ← rend {modal} + {children}
```

Accessibilité : Shadcn `<Dialog>` (Radix) gère focus trap, ESC pour fermer, ARIA.

---

## 📊 4. Chiffres clés

**Décision** : calcul automatique pour les chiffres dérivés, saisie manuelle pour le reste.

| Indicateur | Mode |
|---|---|
| Nombre d'adhérents | **AUTO** — `COUNT(*) WHERE status='active'` |
| Domaines de compétences couverts | **AUTO** — `COUNT(DISTINCT activity_domain_id)` parmi les adhérents actifs |
| Salariés représentés | **MANUEL** — champ éditable dans le BO (table `site_stats.employee_count`) |
| Légende ("Mise à jour le ...") | **MANUEL** — champ éditable dans le BO |

Le mockup `admin-parametres.html` reflète ces règles (champ adhérents en lecture seule + tag "AUTO").

> **MAJ BO (2026-06)** : la rubrique « Paramètres » a été scindée en deux dans le back-office —
> **Contenu du site** (`/admin/contenu` : chiffres clés, bureau, frise, tous éditables) et
> **Réglages** (`/admin/reglages` : email destinataire, coordonnées publiques de /contact).

---

## ✋ 5. Modération des fiches

**Décision** : **validation par le bureau avant publication** dans l'annuaire public.

Cycle de vie d'une fiche :
```
draft (en cours de saisie par l'adhérent)
  ↓ soumission
submitted (en attente de validation)
  ↓ validation par l'admin
active (visible dans l'annuaire)
  ↓ désactivation (cotisation impayée, désadhésion)
inactive (historique conservé, non visible)
```

---

## ⚙️ 6. Règles techniques validées

### 6.1 Magic links
- **Durée de vie** : 30 jours
- **Renouvellement** : possible depuis le BO (action "Renvoyer le lien")
- **Format** : token `crypto.randomUUID() + HMAC signature`, stocké hashé (SHA-256) en DB

### 6.2 Relances automatiques
- **J+3** : première relance
- **+7 jours** ensuite : relances récurrentes
- **Arrêt automatique** après **10 envois** (≈ 10 semaines)
- **Arrêt manuel** possible depuis le BO

### 6.3 Authentification admin
- **Un compte par membre du bureau** (mêmes droits, pas de multi-rôles à ce stade)
- **Auth.js v5** avec credentials provider
- **2FA optionnelle** (TOTP via Google Authenticator)
- **Audit log** activé (qui a validé/désactivé quoi, quand)

### 6.4 E-mails transactionnels
- **Expéditeur (FROM)** : `emailtestopen@prox-i.pf` — domaine **authentifié** dans Brevo (SPF/DKIM OK).
  ⚠️ `open.pf` n'autorise PAS Brevo dans son SPF (`include:sendgrid.net … -all`, DMARC `quarantine`) :
  tant que le DNS d'`open.pf` n'aura pas reçu l'include `spf.brevo.com` + les DKIM Brevo, on n'envoie
  pas depuis `@open.pf` (mails bloqués/spam). `BREVO_SENDER_EMAIL` porte cette adresse.
- **Réponse-à** : email du contact (formulaire) / `contact@open.pf`
- **Destinataire** des contacts + relances : `site_settings.contact_recipient_email`
  (éditable dans `/admin/reglages`, repli sur `ADMIN_NOTIFICATION_EMAIL`)
- **Service** : Brevo (templates dans `src/lib/email/templates/` via React Email)

---

## 🌐 7. Hébergement & infrastructure

**Décision** : pas de contrainte RGPD stricte → **Vercel** suffit.

- **Hébergement web** : Vercel (région `fra1` Frankfurt pour latence Pacifique correcte)
- **Base de données** : Neon Postgres (région `eu-central-1`)
- **Stockage fichiers** (logos) : Vercel Blob
- **Cron** : Vercel Cron pour les relances
- **Analytics** : Plausible (RGPD-friendly, pas de bandeau cookies)
- **Monitoring** : Sentry

---

## 📚 8. Référentiels (récupérés depuis open.pf)

Tous dans `seeds/referentiels.md` :
- 6 statuts juridiques (à enrichir à 9 — voir le fichier)
- **19 domaines d'activité** (liste fermée + Autre)
- **22 certifications** (liste fermée + Autre)

**Source** : formulaire d'adhésion actuel sur https://open.pf

---

## 🏢 9. Bureau actuel (8 membres)

Tous dans `seeds/institutionnel.md` :
- DE REVIERE Thibault — Président
- LUCAS Tuarii — Vice-président
- LATIL Frédéric — Secrétaire
- PURAVET Sébastien — Trésorier
- AMPOURNALES Véronique, CHABOT Florian, LEGENDRE Patrick, CHANE Alain — Assesseurs

**Photos à fournir** par le bureau plus tard (300×300 min). Workaround au lancement : initiales colorées dans un cercle.

---

## 📞 10. Coordonnées

- **Adresse** : Immeuble ATEIVI, 3ème étage, Rue Mgr Tepano Jaussen, BP 972, 98713 Papeete
- **E-mail** : contact@open.pf
- **Téléphone** : ⚠️ à fournir (absent du site actuel — c'est le bug `00 00 00` du CDC)
- **GPS** : -17.5403928, -149.5662001
- **Réseaux** : Facebook (open.polynesie), LinkedIn (company/open-pf)

---

## 📅 11. Phasing imposé

D'après `architecture.md §11`, **ne pas anticiper sur la phase suivante** :

| Phase | Périmètre | Stop attendu |
|---|---|---|
| **P0** | Setup repo + tooling | Build + lint + tests vides passent |
| **P1** | Design system Tailwind + Shadcn + layout | Pages vides mais branding OK |
| **P2** | Schéma DB Drizzle + migrations + seed | DB en place avec référentiels |
| **P3** | Site public statique | Site navigable avec données réelles |
| **P4** | Adhésion (modal + 3 étapes + emails) | Parcours adhésion fonctionnel |
| **P5** | Fiche adhérent (magic link + upload) | Adhérent peut compléter sa fiche |
| **P6** | Back-office complet | Bureau autonome |
| **P7** | Cron relances | Relances automatiques |
| **P8** | SEO + a11y + perf | Audit propre |
| **P9** | Recette + doc | Prêt prod |

À chaque fin de phase : commit propre + résumé + attente validation avant de continuer.

---

## 🔧 12. Recette du 29/06/2026 (branche fix/recette-29062026)

Traitement des 51 anomalies « À faire » de `Recette_Site_OPEN_29062026.xlsx`.
Détail complet : [`docs/recette-29062026.md`](docs/recette-29062026.md).

Décisions structurantes prises pendant cette recette :

- **Carte /contact** : OpenStreetMap (sans cookie ni clé) plutôt que Google Maps → pas de
  bandeau de consentement. `frame-src https://www.openstreetmap.org` ajouté à la CSP.
- **noindex préversion** : `robots.ts` + métadonnées `layout` désindexent toute préversion
  Vercel (`VERCEL_ENV !== 'production'`) pour éviter le contenu dupliqué avant la bascule.
- **Redirections 301** : table WordPress→nouvelles URL dans `next.config.ts` (source :
  `page-sitemap.xml` de open.pf).
- **Session admin** : ramenée à 8 h ; rate-limit anti-brute-force en mémoire (best-effort,
  prévoir un store partagé type Upstash pour la prod).
- **Contenu actualités** : nettoyage HTML (`stripHtml`) à l'enregistrement ; le slug devient
  éditable. **Pas d'éditeur riche** (BO-014) sans validation : dépendance majeure.
- **Newsletter (REC-024)** : écartée (OPEN n'en diffuse pas).
- **Cookies (REC-034 / MOB-014)** : sans objet tant qu'aucun outil d'audience n'est ajouté.

Actions hors-code restant avant prod : migration des images d'articles
(`pnpm migrate:article-images`), corrections de contenu en base via le BO, redirection
www↔domaine nu côté domaine Vercel, mesure PageSpeed sur le déploiement.

---

## 📅 13. Agenda OPEN (home + back-office)

Ajout d'une carte « Agenda OPEN » dans la section « Actualités de la filière » de la
home : **2 actualités + 1 carte agenda** (au lieu de 3 actualités). Détail complet :
[`docs/agenda-open.md`](docs/agenda-open.md).

- **Modèle** : table `agenda_events` (migration `0005`). Pas de page publique agenda,
  pas de dépendance calendrier.
- **Expiration** : un événement disparaît le **lendemain** du jour où il a lieu, en
  **heure de Tahiti (UTC−10)**. Logique pure et testée (`src/lib/agenda.ts`).
- **Affichage home** : publié + `showOnHome` + à venir, tri date croissante ; liste
  scrollable ; « Voir plus » uniquement si `detailUrl`.
- **Back-office** : rubrique « Agenda » (liste + formulaire create/update/delete,
  publier/dépublier, afficher sur la home).
- **Prod** : appliquer la migration `0005` puis (optionnel) `pnpm seed:agenda`.

---

## 🔧 14. Suivi recette post-lancement (27–30/06/2026)

Correctifs sur retours Damien après remise en ligne. Voir aussi les messages de commit
(`0c99d84`, `4864079`, `31beab5`, `868b1a5`, `91676d4`, `15f4576`) pour le détail technique.

- **⚠️ Piège Vercel Blob — `OPEN_READ_WRITE_TOKEN`, pas `BLOB_READ_WRITE_TOKEN`** : le
  store Blob du projet est connecté sous le préfixe **`OPEN_`** (`OPEN_STORE_ID`,
  `OPEN_READ_WRITE_TOKEN`), pas le préfixe par défaut `BLOB_` attendu implicitement par
  le SDK `@vercel/blob`. Une variable `BLOB_READ_WRITE_TOKEN` orpheline (antérieure au
  store actuel) traînait en prod et cassait tous les uploads (« Failed to retrieve the
  client token »). **Toujours passer `token: env.OPEN_READ_WRITE_TOKEN` explicitement**
  à `handleUpload`/`put` — ne jamais compter sur le nom de variable par défaut du SDK
  dans ce projet.
- **Lien GitHub ↔ Vercel réactivé** : l'app GitHub de Vercel n'était plus autorisée sur
  l'org `prox-i` (repo transféré à Arthur). Reconnecté via `vercel git connect` ; un
  push sur `main` déclenche à nouveau un déploiement prod automatique.
- **Image d'accueil éditable en BO** : champ `home_hero_image_url` sur `site_settings`
  (migration `0009`), même pattern que `legal_notice_content` — vide → repli sur
  `/hero-illustration.png`. Upload via `/admin/reglages` (flux Blob des actus).
- **Revalidation `/`** manquante sur `upsertNews`/`deleteNews` et `updateSiteSettings` —
  une actu publiée ou un réglage modifié pouvait mettre jusqu'à 1 h (cache ISR) à
  apparaître sur la home. Ajout de `revalidatePath('/')` dans les deux.
- **Gouttière mobile (`.container`)** : le bug corrigé une première fois sur `.hero-inner`
  (commit `aa7ac31`) existait aussi sur `.cta-inner`, `.hero-directory .hero-inner`
  (base + media query 980px) et `.footer-bottom` — même cause (shorthand `padding: Npx 0`
  qui écrase le `padding-left/right` hérité de `.container`). Vérifier ce pattern sur
  tout nouvel élément combinant une classe custom avec `.container`.
- **Tri `/admin/actualites`** : sur `createdAt` seul, plus sur `publishedAt` (toujours
  `null` pour un brouillon) — sans quoi tout brouillon retombe en bas du listing.
- **Scroll post-soumission** (`/adhesion`, `/contact`) : le message de succès remplace
  un formulaire plus long au même endroit du DOM ; sans `scrollIntoView` dédié sur le
  passage en `submitted`, le scroll reste clampé en bas d'une page devenue plus courte.
  Même remède que le `scrollIntoView` déjà en place sur le changement d'étape.
