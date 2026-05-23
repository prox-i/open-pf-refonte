# Normalisation des logos adhérents

Ce document décrit les règles de format pour les logos uploadés par les adhérents, les comportements CSS garantis par le composant `MemberLogo`, et les recommandations pour le backoffice.

---

## Pourquoi normaliser ?

Les logos fournis par les adhérents sont hétérogènes :

- Logo centré dans un grand canvas blanc → paraît minuscule
- Logo rogné au bord → déborde visuellement
- PNG opaque, PNG transparent, SVG, JPEG
- Formats très horizontaux, très carrés ou très verticaux

Sans normalisation, l'annuaire ressemble à un patchwork. L'objectif est d'obtenir un rendu **homogène** quelle que soit l'origine du fichier.

---

## A. Règles de format recommandées pour les fichiers uploadés

| Critère | Recommandé | À éviter |
|---|---|---|
| Format | SVG ou PNG avec transparence | JPEG, BMP, GIF |
| Canvas | Carré (ex. 512 × 512) | Rectangulaire très allongé |
| Fond | Transparent | Fond blanc plein (le CSS rajoute le fond) |
| Marge interne | ~10 % du côté (ex. 50 px sur 512) | Logo collé aux bords ou noyé dans 60 %+ de blanc |
| Poids maximum | 200 Ko | > 500 Ko |
| Taille minimale | 512 × 512 px | < 256 px (flou en Retina) |

> **Priorité SVG** : un SVG est résolution-indépendant, léger, et s'adapte à toutes les tailles sans artefact de compression.

---

## B. Comportement CSS actuel (côté front)

### Composant `MemberLogo` (`src/components/public/member-logo.tsx`)

Le composant utilise **`next/image`** en mode `fill` avec `object-fit: contain` et `padding: 20px`.

- **`object-fit: contain`** : le logo ne sera jamais coupé ni déformé — il tient dans la zone disponible en conservant son ratio.
- **`padding: 20px`** sur l'image : crée une marge interne de 20 px entre le bord du conteneur et le contenu du logo.
- **Fond blanc** sur le conteneur : unifie l'affichage quelle que soit la transparence du PNG.

### Prop `size`

| Valeur | Hauteur autonome | Contexte typique |
|---|---|---|
| `"sm"` | 80 px | Listes compactes |
| `"md"` (défaut) | 130 px | Carte annuaire |
| `"lg"` | 200 px | Fiche adhérent |

Les classes contextuelles (`.showcase-link .member-logo-wrap`, `.profile-logo-zone .member-logo-wrap`) surchargent la prop `size` quand le composant est imbriqué dans ces layouts.

### Fallback

Si `logoUrl` est `null`, le composant affiche les initiales de l'adhérent dans une couleur dérivée du nom (déterministe). Le fallback est `role="img"` avec un `aria-label` lisible.

---

## C. Problèmes non solubles en CSS seul

| Problème | Cause | Solution recommandée |
|---|---|---|
| Logo minuscule dans un grand canvas blanc | Le blanc **fait partie du fichier image** | Recadrer le fichier source avant upload |
| Logo flou en Retina | Fichier source trop petit (< 256 px) | Demander un SVG ou un PNG ≥ 512 px |
| Fond coloré visible | PNG sans transparence + fond ≠ blanc | Exporter en PNG transparent |

---

## D. Outil de normalisation côté serveur (à implémenter)

La dépendance **`sharp`** est déjà disponible dans Next.js (utilisée par `next/image`). Elle peut être utilisée dans une Server Action ou un script Node pour normaliser automatiquement les logos à l'upload.

### Interface cible (`src/lib/images/normalize-logo.ts`)

```ts
interface NormalizeOptions {
  canvasSize?: number   // défaut 512
  padding?: number      // défaut 51 (≈ 10 %)
  background?: { r: number; g: number; b: number; alpha: number }
}

// Retourne un Buffer PNG normalisé
export async function normalizeLogo(input: Buffer, options?: NormalizeOptions): Promise<Buffer>
```

### Algorithme attendu

1. Charger l'image avec `sharp(input)`
2. Détecter les dimensions réelles du logo (trim du fond blanc/transparent)
3. Calculer le ratio et centrer dans un canvas carré de `canvasSize × canvasSize`
4. Appliquer une marge de `padding` px de chaque côté
5. Composer sur fond transparent (ou blanc selon `background`)
6. Exporter en PNG optimisé (`sharp().png({ compressionLevel: 9 })`)

> Ne pas implémenter sans vérifier que `sharp` est disponible dans le contexte d'exécution (Edge runtime ne le supporte pas — utiliser Node.js uniquement).

---

## E. Prévisualisation backoffice (à implémenter)

Dans le formulaire d'adhésion (admin), après upload du logo, afficher une prévisualisation dans les trois contextes :

```
┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────┐
│  Annuaire card  │  │  Fiche adhérent  │  │  Showcase home        │
│  130 × 130      │  │  160 × 160       │  │  180 × 180            │
└─────────────────┘  └──────────────────┘  └───────────────────────┘
```

Afficher un **warning** si :
- La boîte englobante visible du logo est inférieure à 40 % de la surface totale de l'image → logo probablement noyé dans du blanc
- La taille du fichier est supérieure à 200 Ko
- Le format est JPEG
