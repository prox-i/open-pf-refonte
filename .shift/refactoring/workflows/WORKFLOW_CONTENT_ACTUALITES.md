# WORKFLOW_contenu éditorial actualités et SEO — Cahier de workflow fonctionnel et technique reconstitué

## 1. Objet

Ce workflow couvre la chaîne éditoriale des **actualités** du site OPEN PF, depuis la consultation publique jusqu’à la création/édition/publication dans le back-office, avec les exigences de **SEO**, de **partage social**, de **structuration des données**, de **sécurité d’accès** et d’**expérience de lecture**.

Il s’appuie sur :
- la page publique `/actualites` ;
- la page détail `/actualites/[slug]` ;
- l’administration des contenus `/admin/actualites/*` ;
- le formulaire éditorial `src/components/admin/news-form.tsx` ;
- les helpers SEO `src/lib/seo` ;
- les schémas de données de `news` et `news_categories`.

**Sources principales**
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/app/admin/actualites/page.tsx`
- `src/app/admin/actualites/new/page.tsx`
- `src/app/admin/actualites/[id]/page.tsx`
- `src/components/admin/news-form.tsx`
- `src/lib/seo`
- `scripts/seed-data.mjs`
- `mockup/open_pf_site_8_5/actualites.html`

---

## 2. Synthèse fonctionnelle

Le site propose :
- une **page d’index des actualités** avec mise en avant d’un article principal, grille des autres contenus, pagination ;
- des **pages détail d’article** avec titre, date, auteur, image, extrait ou contenu riche ;
- un **back-office éditorial** pour lister, créer et modifier les actualités ;
- un **téléversement d’image** associé aux articles ;
- une **stratégie SEO** systématique : metadata, canonical, Open Graph, Twitter Card, JSON-LD breadcrumb et article ;
- un **statut éditorial** minimal : brouillon / publié ;
- une **catégorisation** des actualités via référentiels de catégories.

Le périmètre observé est clairement orienté **publication institutionnelle et visibilité organique** plutôt que simple CMS interne.

---

## 3. Acteurs concernés

### 3.1 Visiteur public
- Consulte la liste des actualités.
- Ouvre une actualité.
- Partage potentiellement une page article.
- Bénéficie des métadonnées SEO et des données structurées.

### 3.2 Rédacteur / administrateur
- Crée une nouvelle actualité.
- Renseigne titre, extrait, contenu, auteur, image, meta description et statut.
- Publie ou garde en brouillon.
- Modifie une actualité existante.

### 3.3 Système
- Récupère les données en base.
- Génère metadata et JSON-LD.
- Uploade et convertit les images.
- Trie, pagine et expose les contenus.
- Protège les routes d’upload par session.

---

## 4. Points d’entrée

### 4.1 Front public
- `/actualites`
- `/actualites?page=N`
- `/actualites/[slug]`

### 4.2 Administration
- `/admin/actualites`
- `/admin/actualites/new`
- `/admin/actualites/[id]`

### 4.3 API technique
- `POST /api/upload/news-image`

### 4.4 Seed / initialisation de contenu
- `scripts/seed-data.mjs` insère des catégories et des actualités de départ.

---

## 5. Composants source

### 5.1 Pages publiques
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`

### 5.2 Pages admin
- `src/app/admin/actualites/page.tsx`
- `src/app/admin/actualites/new/page.tsx`
- `src/app/admin/actualites/[id]/page.tsx`

### 5.3 Formulaire éditorial
- `src/components/admin/news-form.tsx`

### 5.4 Upload d’image
- `src/app/api/upload/news-image/route.ts`

### 5.5 SEO / données structurées
- `src/lib/seo`
- appels depuis `actualites/page.tsx` et `actualites/[slug]/page.tsx`

### 5.6 Données
- table `news`
- table `news_categories`

### 5.7 Contenu de référence / mockup
- `mockup/open_pf_site_8_5/actualites.html`
- `scripts/seed-data.mjs`

---

## 6. Données principales

### 6.1 Article d’actualité
Données visibles dans le formulaire admin et sur le site :
- `title`
- `excerpt`
- `content`
- `authorName`
- `imageUrl`
- `metaDescription`
- `status` (`draft` | `published`)
- `slug` (déduit de la couche métier/DB)
- `publishedAt`
- `updatedAt`

**Preuves**
- `src/components/admin/news-form.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/app/(public)/actualites/page.tsx`
- `src/app/admin/actualites/page.tsx`

### 6.2 Catégorie d’actualité
Le seed montre des catégories éditoriales :
- vie de l’association
- filière numérique
- cybersécurité
- événement
- partenariat
- communiqué de presse

**Preuve**
- `scripts/seed-data.mjs`

### 6.3 Image d’actualité
- Téléversée via l’admin.
- URL stockée dans `imageUrl`.
- Utilisée comme image principale, Open Graph et Twitter.

**Preuves**
- `src/components/admin/news-form.tsx`
- `src/app/api/upload/news-image/route.ts`
- `src/app/(public)/actualites/[slug]/page.tsx`

### 6.4 Métadonnée SEO
- `metaDescription` limitée à 160 caractères côté formulaire.
- canonical.
- Open Graph.
- Twitter Card.
- JSON-LD BreadcrumbList.
- JSON-LD Article.

**Preuves**
- `src/components/admin/news-form.tsx`
- `src/lib/seo`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`

---

## 7. Étapes nominales

### 7.1 Consultation de la liste d’actualités
1. Le visiteur accède à `/actualites`.
2. Le système charge les articles publiés paginés.
3. L’article le plus récent de la page 1 est affiché en vedette.
4. Les autres articles sont présentés en grille.
5. La page affiche titre, description, canonical et Open Graph.
6. Un fil d’Ariane JSON-LD est injecté.

**Preuves**
- `src/app/(public)/actualites/page.tsx`
- `src/lib/seo`
- `mockup/open_pf_site_8_5/actualites.html`

### 7.2 Consultation du détail d’un article
1. Le visiteur ouvre `/actualites/[slug]`.
2. Le système charge l’article correspondant au slug.
3. Si l’article est absent, la page renvoie une 404.
4. Si présent, la page affiche :
   - breadcrumb ;
   - catégorie ;
   - date de publication ;
   - auteur si fourni ;
   - image si présente ;
   - extrait ou contenu HTML ;
   - CTA éventuel via composant partagé.
5. Metadata article et JSON-LD sont générés.

**Preuves**
- `src/app/(public)/actualites/[slug]/page.tsx`
- `src/lib/seo`

### 7.3 Création d’une actualité en admin
1. L’administrateur ouvre `/admin/actualites/new`.
2. Le formulaire `NewsForm` s’affiche avec valeurs par défaut.
3. Il saisit :
   - titre ;
   - extrait ;
   - contenu ;
   - auteur ;
   - image ;
   - meta description ;
   - statut.
4. Si besoin, il téléverse une image via `/api/upload/news-image`.
5. À l’envoi, l’action d’upsert est appelée.
6. En succès, redirection vers `/admin/actualites`.

**Preuves**
- `src/app/admin/actualites/new/page.tsx`
- `src/components/admin/news-form.tsx`
- `src/app/api/upload/news-image/route.ts`

### 7.4 Édition d’une actualité existante
1. L’administrateur ouvre `/admin/actualites/[id]`.
2. Le système charge l’actualité par identifiant.
3. Le formulaire est prérempli.
4. L’administrateur modifie les champs.
5. L’upsert met à jour la ligne.
6. Retour à la liste admin.

**Preuves**
- `src/app/admin/actualites/[id]/page.tsx`
- `src/components/admin/news-form.tsx`

### 7.5 Publication / brouillon
1. Le rédacteur choisit `draft` ou `published`.
2. L’état sert à filtrer les contenus visibles côté public.
3. La liste admin affiche un badge de statut.

**Preuves**
- `src/components/admin/news-form.tsx`
- `src/app/admin/actualites/page.tsx`

---

## 8. Variantes

### 8.1 Page 1 vs pages suivantes
- Page 1 : un contenu vedette + grille secondaire.
- Pages suivantes : liste homogène sans vedette.

**Preuve**
- `const featured = page === 1 ? (articles[0] ?? null) : null`
- `const grid = page === 1 ? articles.slice(1) : articles`
- `src/app/(public)/actualites/page.tsx`

### 8.2 Article avec image ou sans image
- Avec image : `<Image>` rendue.
- Sans image : fallback décoratif visuel sur la liste ; sur la page détail, l’image est simplement absente.

**Preuves**
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`

### 8.3 Article avec contenu riche ou seulement extrait
- Si `content` existe : rendu HTML injecté.
- Sinon si `excerpt` existe : affichage de l’extrait.
- Sinon : état “Contenu non disponible.”

**Preuve**
- `src/app/(public)/actualites/[slug]/page.tsx`

### 8.4 Image fournie par URL ou par upload
- Le champ peut recevoir une URL directe.
- Le téléversement produit une URL Blob stockée dans le champ.

**Preuve**
- `src/components/admin/news-form.tsx`
- `src/app/api/upload/news-image/route.ts`

### 8.5 Indexabilité de la liste filtrée
Le modèle observé côté annuaire ne met pas de noindex sur les filtres ; pour les actualités, le comportement spécifique n’est pas explicitement documenté ici. Il faut vérifier si des variantes de pagination/filtrage éditorial nécessitent une stratégie noindex/canonical spécifique.

**Question à valider**
- faut-il canonicaliser ou noindex les vues d’archive paginée au-delà de la page 1 ?

---

## 9. Cas d’erreur

### 9.1 Article introuvable
- `/actualites/[slug]` → `notFound()`

**Preuve**
- `src/app/(public)/actualites/[slug]/page.tsx`

### 9.2 Image non conforme
L’upload refuse :
- les fichiers non image ;
- les formats non autorisés ;
- les fichiers trop volumineux.

**Preuve**
- `src/app/api/upload/news-image/route.ts`

### 9.3 Utilisateur non authentifié sur l’upload
- L’API renvoie 401 si `auth()` ne retourne pas de session.

**Preuve**
- `src/app/api/upload/news-image/route.ts`

### 9.4 URL d’image invalide
- Le formulaire admin valide `imageUrl` comme URL.
- Une URL invalide empêche la soumission.

**Preuve**
- `src/components/admin/news-form.tsx`

### 9.5 Meta description trop longue
- Le schéma limite `metaDescription` à 160 caractères.
- Au-delà : erreur de validation.

**Preuve**
- `src/components/admin/news-form.tsx`

### 9.6 Erreur d’upsert / sauvegarde
- Le formulaire admin ne semble pas exposer un message d’erreur détaillé ici.
- Risque UX : échec silencieux si l’action serveur retourne un problème non remonté.

**Hypothèse**
- Les actions `upsertNews` gèrent un retour `success/error`, mais la gestion d’affichage d’erreur visible n’apparaît pas dans l’extrait.

**Question à valider**
- un message d’erreur serveur est-il affiché systématiquement dans l’UI admin ?

---

## 10. Documents / emails / effets de bord

### 10.1 Métadonnées de page
Effets de bord SEO à la lecture publique :
- `title`
- `description`
- canonical
- Open Graph
- Twitter Card

**Preuves**
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`

### 10.2 JSON-LD
- Fil d’Ariane via `buildBreadcrumbJsonLd`
- Article via `buildArticleJsonLd`

**Preuves**
- `src/lib/seo`
- `src/app/(public)/actualites/[slug]/page.tsx`

### 10.3 Upload d’image
- Téléversement vers Vercel Blob.
- URL publique renvoyée.
- L’éditeur peut ensuite la conserver en base.

**Preuve**
- `src/app/api/upload/news-image/route.ts`

### 10.4 Seed de contenus éditoriaux
- Le script d’initialisation alimente des catégories et des articles.
- Cela constitue la base de contenu initiale.

**Preuve**
- `scripts/seed-data.mjs`

### 10.5 Effets de bord possibles côté moteur de recherche
- Variation des canoniques sur pages paginées.
- Contenu HTML injecté dans la page détail.
- Image OG potentiellement absente si `imageUrl` n’est pas renseignée.

---

## 11. Règles métier

### 11.1 Statut éditorial
- `draft` : non visible publiquement.
- `published` : visible dans la liste et la page détail.

**Preuves**
- `src/components/admin/news-form.tsx`
- `src/app/admin/actualites/page.tsx`

### 11.2 Listing public uniquement des contenus publiés
L’index public consomme la source de données des actualités publiées uniquement.

**Preuve**
- `getNewsPaginated(page, PAGE_SIZE)` dans `src/app/(public)/actualites/page.tsx`
- `getNewsBySlug(slug)` dans `src/app/(public)/actualites/[slug]/page.tsx`

### 11.3 Pagination
- Taille de page : 9 articles.
- Page courante minimum : 1.

**Preuve**
- `const PAGE_SIZE = 9`
- `const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)`
- `src/app/(public)/actualites/page.tsx`

### 11.4 Article vedette
- Sur la première page uniquement, le premier article sert de mise en avant.

**Preuve**
- `src/app/(public)/actualites/page.tsx`

### 11.5 Longueur meta description
- Maximum 160 caractères.

**Preuve**
- `src/components/admin/news-form.tsx`

### 11.6 Limites de format image
- Uploader accepte :
  - JPEG
  - PNG
  - WebP
- Taille max : 5 Mo

**Preuve**
- `src/app/api/upload/news-image/route.ts`

### 11.7 Transformation image
- Les images sont redimensionnées et converties en WebP qualité 85.
- Resize max 1600x900, sans agrandissement.

**Preuve**
- `src/app/api/upload/news-image/route.ts`

### 11.8 SEO social
- Si une image est fournie, elle sert d’OG image et de Twitter image.
- Sinon fallback `/logo-open.png`.

**Preuve**
- `src/app/(public)/actualites/[slug]/page.tsx`

### 11.9 Canonical
- La page liste canonique est `/actualites`.
- La page détail canonique est `/actualites/[slug]`.

**Preuve**
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`

### 11.10 Accessibilité de base
La page liste et les cartes utilisent :
- liens explicites ;
- titres hiérarchisés ;
- alt image sur détail ;
- structures sémantiques.

**Preuves**
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`
- `tests/e2e/example.spec.ts`

---

## 12. Sécurité / permissions

### 12.1 Accès admin
La partie éditoriale est dans le périmètre `/admin/*` et s’appuie sur l’auth NextAuth credentials.

**Preuves**
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/app/admin/(auth)/login/page.tsx`

### 12.2 Authentification d’upload
L’upload des images d’articles nécessite une session utilisateur valide.

**Preuve**
- `src/app/api/upload/news-image/route.ts`

### 12.3 Pas de publication anonyme
Le back-office n’expose pas d’édition publique des contenus.

**Preuves**
- pages admin sous `/admin/actualites/*`
- formulaire protégé implicitement par l’auth globale du back-office

### 12.4 Surface XSS potentielle
La page détail injecte `content` via `dangerouslySetInnerHTML`.

**Risque**
- si le contenu n’est pas sanitizé en amont, risque d’injection HTML/JS.

**Preuve**
- `src/app/(public)/actualites/[slug]/page.tsx`

### 12.5 Invariants de SEO et sécurité
- metadata générées côté serveur ;
- pas de secrets exposés dans les pages ;
- l’URL Blob publique est renvoyée, pas la clé.

**Preuve**
- `src/app/api/upload/news-image/route.ts`

---

## 13. Recette

### 13.1 Recette fonctionnelle publique
1. Ouvrir `/actualites`.
2. Vérifier :
   - présence d’un h1 ;
   - article vedette en première page ;
   - grille des autres articles ;
   - pagination si plus de 9 contenus.
3. Ouvrir un article.
4. Vérifier :
   - breadcrumb ;
   - titre ;
   - date ;
   - auteur si renseigné ;
   - image si renseignée ;
   - contenu ou extrait ;
   - metadata correctes.

### 13.2 Recette SEO
1. Vérifier le `<title>` de la page liste et d’un article.
2. Vérifier canonical.
3. Vérifier Open Graph / Twitter.
4. Vérifier présence de JSON-LD breadcrumb.
5. Vérifier présence de JSON-LD Article sur la page détail.

**Preuves de référence**
- `tests/unit/seo.test.ts`
- `src/app/(public)/actualites/page.tsx`
- `src/app/(public)/actualites/[slug]/page.tsx`

### 13.3 Recette admin
1. Se connecter au back-office.
2. Aller sur `/admin/actualites`.
3. Créer une actualité.
4. Téléverser une image.
5. Sauvegarder en brouillon.
6. Revenir l’éditer.
7. Publier.
8. Vérifier apparition côté public.

### 13.4 Recette upload image
1. Se connecter.
2. Poster un fichier JPEG/PNG/WebP < 5 Mo.
3. Vérifier la réponse URL.
4. Vérifier la mise à jour du champ `imageUrl`.

---

## 14. Risques

### 14.1 Risque SEO de contenu injecté
`dangerouslySetInnerHTML` exige une sanitation stricte en amont.

### 14.2 Risque de cohérence éditoriale
Sans workflow de validation ou prévisualisation fine, le contenu publié peut comporter :
- doublons ;
- metadata faibles ;
- images non optimisées ;
- descriptions trop courtes ou dupliquées.

### 14.3 Risque de référencement des archives paginées
La stratégie canonical/noindex des pages paginées doit être clarifiée.

### 14.4 Risque d’upload image
Même si l’API limite le type et la taille, il faut s’assurer que le contenu image reste sain et que la provenance Blob est maîtrisée.

### 14.5 Risque d’ergonomie admin
L’extrait ne montre pas de gestion explicite des erreurs serveur dans le formulaire admin ; risque de perte de feedback utilisateur.

### 14.6 Risque de dette métier
La logique éditoriale est actuellement simple : `draft/published`. Si le besoin évolue vers :
- relecture,
- auteur,
- date de publication séparée,
- catégories obligatoires,
- planification,
il faudra enrichir le workflow.

---

## 15. Questions ouvertes

1. **Catégorisation des actualités**
   - Une actualité doit-elle obligatoirement avoir une catégorie ?
   - La catégorie doit-elle apparaître sur la liste, le détail, les métadonnées ?

2. **Publication**
   - Le statut `published` suffit-il ou faut-il une date de publication gérée explicitement au BO ?

3. **SEO archive**
   - Les pages `/actualites?page=N` doivent-elles être indexables ou noindex ?
   - Faut-il une canonical spécifique pour les pages paginées ?

4. **Sanitization du contenu**
   - `content` est-il sanitizé avant enregistrement ou rendu ?
   - Quels tags HTML sont autorisés ?

5. **Image article**
   - Faut-il imposer une image de couverture pour certains types d’articles ?
   - Faut-il une validation de ratio ou de dimensions minimale ?

6. **Auteur**
   - Le champ `authorName` est-il obligatoire, optionnel, ou lié à un compte admin ?

7. **Workflow de publication**
   - Faut-il prévoir une prévisualisation avant publication ?
   - Faut-il un historique d’édition / audit sur les actualités ?

8. **Règles de visibilité**
   - Les contenus brouillons doivent-ils rester totalement invisibles, y compris pour les prévisualisations publiques ?
   - Le détail d’un brouillon doit-il être accessible via lien privé ?

9. **Relecture / consentement éditorial**
   - Une validation humaine supplémentaire est-elle requise avant passage en `published` ?

10. **URL et slug**
    - Le slug est-il généré automatiquement à partir du titre, ou éditable manuellement ?
    - Que se passe-t-il en cas de collision de slug ?

11. **Mise à jour des sources de contenu**
    - Faut-il importer/convertir des contenus depuis une source externe de type WordPress existant ?

12. **Opérations**
    - Souhaite-t-on des notifications internes à la publication d’une actualité ?
    - Faut-il journaliser les modifications éditoriales dans `audit_log` comme pour les adhérents ?

---

## Questions ouvertes / Points à valider

- **Stratégie d’indexation des archives** `/actualites?page=N`
- **Niveau de sanitation HTML** autorisé dans `content`
- **Gestion des catégories** : obligatoire ou facultative
- **Gestion du slug** : auto-généré ou contrôlable
- **Exigence de prévisualisation** avant publication
- **Politique d’audit** sur les contenus éditoriaux
- **Règles images** : dimensions, ratio, image obligatoire ou non
- **Comportement SEO si `metaDescription` absente**
- **Gestion des brouillons** côté public et côté admin
- **Gestion des collisions de contenus** lors d’un import/migration éditoriale