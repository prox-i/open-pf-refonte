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
