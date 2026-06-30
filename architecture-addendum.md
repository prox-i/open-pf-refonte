# Addendum à `architecture.md` — Décisions validées et blocages restants

> Mis à jour suite aux arbitrages du bureau, mai 2026.  
> À fusionner dans `architecture.md` quand tout est tranché.

---

## ✅ Arbitrages validés

### Palette
- **Magenta retenu** (`#e6007e` + dégradés navy/cyan)
- Tokens déjà en place dans `assets/css/styles.css`
- Tailwind config à dériver de ces tokens

### Formulaire d'adhésion : 3 étapes
1. **Informations entreprise** — raison sociale, statut juridique, n° TAHITI, description courte, déjà adhérent MEDEF (oui/non)
2. **Domaines d'activité** — sélection multiple parmi liste fermée
3. **Coordonnées** — contact principal (nom, fonction, e-mail, téléphone) + RGPD + consentement

**Implication structurante** : les compétences et certifications **ne figurent PAS dans le formulaire d'adhésion**. Elles sont collectées exclusivement via la fiche adhérent (espace magic link). Cohérent UX : adhésion rapide → complétion détaillée à tête reposée.

### Format adhésion : modale
Pattern Next.js retenu : **intercepting routes + parallel routes**.

```
src/app/(public)/
├── @modal/
│   └── (.)adhesion/
│       └── page.tsx          # ouvert en modale au-dessus de la page courante
├── adhesion/
│   └── page.tsx              # version pleine page (URL directe, SEO, partage)
└── layout.tsx                # rend {modal} + {children}
```

Avantages :
- Clic sur « Adhérer » depuis n'importe où → ouverture modale, pas de quit page
- URL directe `/adhesion` ou rafraîchissement → page complète SSR
- Partageable, indexable, accessible (focus trap géré par Radix `<Dialog>` de Shadcn)

> **MAJ BO (2026-06)** : la rubrique `admin-parametres` n'existe plus. Le contenu éditorial
> (chiffres clés, bureau, frise) vit dans **`/admin/contenu`** ; les réglages du site
> (email destinataire des contacts/relances, coordonnées publiques de /contact) dans
> **`/admin/reglages`** (table `site_settings`, lue via `src/lib/settings.ts` avec repli).

### Chiffres clés : calcul automatique
Le champ "nombre d'adhérents" dans `/admin/contenu` est **lecture seule**, calculé en temps réel :

```typescript
// src/lib/db/queries/stats.ts
export async function getActiveStats() {
  const [memberCount] = await db
    .select({ count: count() })
    .from(members)
    .where(eq(members.status, 'active'))
  
  const distinctDomains = await db
    .selectDistinct({ id: memberActivities.activityDomainId })
    .from(memberActivities)
    .innerJoin(members, eq(members.id, memberActivities.memberId))
    .where(eq(members.status, 'active'))
  
  const manualStats = await db.select().from(siteStats).get()
  
  return {
    memberCount: memberCount.count,           // auto
    domainCount: distinctDomains.length,      // auto
    employeeCount: manualStats?.employeeCount ?? 0,  // manual
    legend: manualStats?.legend ?? '',
  }
}
```

**Adaptation du schéma Drizzle** : la table `site_stats` ne contient plus que `employee_count` et `legend` (les autres sont dérivés).

### Modération
**Avant publication** (déjà documenté en §6.2 d'architecture.md). Aucun changement.

---

## ❌ Blocages restants pour la prod

### Référentiels métier (CRITIQUE)
Sans ces listes, Claude Code va inventer des contenus que le bureau devra tout réécrire :

- [ ] **Liste fermée des domaines d'activité** — pour les checkboxes étape 2 du formulaire et les filtres de l'annuaire
- [ ] **Liste fermée des compétences** — pour la fiche adhérent et les filtres
- [ ] **Liste fermée des certifications/agréments** — idem
- [ ] **Statuts juridiques** — à valider ou compléter (la liste du CDC est lacunaire pour la PF)

### Contenus institutionnels (CRITIQUE)
- [ ] **Membres du bureau** : photos (300×300 px min) + nom + fonction
- [ ] **Frise chronologique** : 6 à 10 dates clés de l'association
- [ ] **Partenaires** : logos SVG ou PNG transparent + nom + URL
- [ ] **Manifeste / texte d'accueil** (le mockup a du lorem ipsum-like)

### E-mails transactionnels (IMPORTANT)
- [ ] **Adresse d'expéditeur** validée (`contact@open.pf` ? `bureau@open.pf` ?)
- [ ] **Accès DNS** au domaine `open.pf` pour configurer SPF / DKIM / DMARC
- [ ] **Textes des 8 templates** ou validation d'un canevas à proposer

### Règles métier secondaires (IMPORTANT)
- [ ] **Durée de vie magic link** : 30 jours par défaut, à confirmer
- [ ] **Limite des relances** : stop après N envois ou ad vitam ? (recommandé : stop après 10)
- [ ] **Authentification admin** : 1 compte partagé ou 1 compte par membre du bureau ?

### Migration SEO (IMPORTANT)
- [ ] **Liste des URLs WordPress actuelles** pour redirections 301
- [ ] Accès Google Search Console (si configuré sur l'ancien site)

### Légal (BLOQUANT À LA MISE EN LIGNE)
- [ ] **Mentions légales** validées
- [ ] **Politique de confidentialité RGPD** validée
- [ ] **CGU** si nécessaire

---

## 📋 Statut prod-readiness

| Catégorie | État |
|---|---|
| Architecture technique | ✅ Validée |
| Décisions UX | ✅ Validées |
| Design system | ✅ Validé (magenta) |
| Mockup public | ✅ Complet |
| Mockup admin | ✅ Complet (corrigé chiffres dynamiques) |
| Référentiels métier | ❌ À collecter |
| Contenus institutionnels | ❌ À collecter |
| Templates e-mails | ❌ À rédiger |
| Règles secondaires | ⚠️ Valeurs par défaut OK pour démarrer |
| Migration SEO | ⚠️ Peut être faite après go-live |
| Documents légaux | ❌ À valider avant mise en ligne |

**Verdict :** on peut **lancer la P0 (setup) à P3 (site public statique)** sans les référentiels (Claude Code utilisera des données mockées). Mais **P4 (adhésion) et P5 (fiche adhérent) ont besoin des référentiels** pour ne pas être à refaire.

**Stratégie recommandée :** lancer P0→P3 dès maintenant en parallèle de la collecte des référentiels, qui doit aboutir avant P4.
