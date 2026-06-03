# WORKFLOW_offres d'emploi — Cahier de workflow fonctionnel et technique reconstitué

## 1. Objet

Définir le fonctionnement métier et technique du parcours **offres d’emploi** du site OPEN PF, depuis la consultation publique jusqu’à la création/gestion des annonces dans le back-office.

Le workflow couvre :
- la liste publique des offres ;
- la fiche détaillée d’une offre ;
- l’administration des offres dans le back-office ;
- les données, règles de publication et impacts SEO / navigation associés.

---

## 2. Synthèse fonctionnelle

Le module “offres d’emploi” expose un catalogue public d’annonces publiées par les adhérents OPEN PF.

### Parcours public
- L’utilisateur accède à une page liste des offres.
- Il peut ouvrir une fiche détaillée d’une offre.
- La fiche détaille le poste, l’organisation porteuse, les informations pratiques et les moyens de candidature.
- Si aucune offre n’est publiée, une page d’état vide incite à rejoindre OPEN.

### Parcours administration
- Un administrateur se connecte au back-office.
- Il peut créer, modifier, publier ou clôturer une offre.
- Les offres sont listées dans l’admin avec leur statut.
- La fiche d’édition permet de renseigner titre, description, localisation, type de contrat, salaire, URL/email de candidature et statut.

### Sources / preuves
- Public liste : `src/app/(public)/offres-emploi/page.tsx`
- Public détail : `src/app/(public)/offres-emploi/[slug]/page.tsx`
- Carte publique : `src/components/public/job-card.tsx`
- Admin liste : `src/app/admin/offres-emploi/page.tsx`
- Admin création / édition : `src/app/admin/offres-emploi/new/page.tsx`, `src/app/admin/offres-emploi/[id]/page.tsx`
- Formulaire admin : `src/components/admin/job-form.tsx`
- Données/queries : `src/lib/db/queries/jobs` via les pages publiques et admin

---

## 3. Acteurs concernés

### 3.1 Visiteur public
- Consulte les offres.
- Accède au détail d’un poste.
- Peut cliquer vers une candidature externe ou email.

### 3.2 Adhérent / entreprise membre
- Source potentielle des offres publiées.
- Visible comme “entreprise porteuse” dans les annonces si rattachée à une fiche membre.

### 3.3 Administrateur OPEN PF
- Crée et gère les offres depuis le back-office.
- Décide de la publication.
- Peut clôturer une offre.

### 3.4 Système
- Rend les pages publiques.
- Alimente les métadonnées SEO.
- Produit le balisage schema.org JobPosting.
- Stocke et sert les données depuis la base.

---

## 4. Points d’entrée

### 4.1 Parcours public
- `/offres-emploi`
- `/offres-emploi/[slug]`

### 4.2 Back-office
- `/admin/offres-emploi`
- `/admin/offres-emploi/new`
- `/admin/offres-emploi/[id]`

### 4.3 APIs / actions implicites
Le pack montre une persistance via actions serveur, mais les implémentations exactes ne sont pas toutes visibles :
- `upsertJob` depuis `src/components/admin/job-form.tsx`
- lecture DB via `getPublishedJobs`, `getJobBySlug`

---

## 5. Composants source

### 5.1 Front public
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/components/public/job-card.tsx`

### 5.2 Back-office
- `src/app/admin/offres-emploi/page.tsx`
- `src/app/admin/offres-emploi/new/page.tsx`
- `src/app/admin/offres-emploi/[id]/page.tsx`
- `src/components/admin/job-form.tsx`

### 5.3 Données / infra
- `src/lib/db/queries/jobs` : lecture publique et détail
- `src/lib/actions/admin/content` : sauvegarde des offres
- `src/lib/seo` : JSON-LD JobPosting
- `src/lib/utils` : formatage date et helpers

### 5.4 Références de contexte projet
- `architecture.md`
- `DECISIONS.md`
- `mockup/open_pf_site_8_5/offres-emploi.html`
- `mockup/open_pf_site_8_5/admin-demande-detail.html` (pour cohérence BO, même si centrée adhésion)
- `README.md`

---

## 6. Données principales

## 6.1 Offre d’emploi
Champs visibles ou inférés d’après le formulaire et les pages :
- `title` : intitulé du poste
- `description` : description libre
- `location` : localisation
- `contractType` : type de contrat
- `salary` : rémunération indicatrice
- `applicationUrl` : URL de candidature
- `applicationEmail` : email de candidature
- `status` : statut de publication
- `publishedAt` : date de publication
- `updatedAt` : date de dernière modification
- `memberName` : entreprise porteuse, si rattachée
- `memberSlug` : slug de la fiche membre, si disponible
- `metaDescription` : description SEO éventuelle

### 6.2 Statuts observés
Dans le formulaire admin :
- `draft`
- `published`
- `closed`

### 6.3 Relations métier
- Une offre peut être associée à un membre OPEN.
- La page détail affiche un lien vers la fiche membre si `memberSlug` est présent.
- Le bloc public affiche le nom de l’entreprise porteuse.

### 6.4 Balisage SEO
La fiche détail génère un schéma `JobPosting` via `buildJobPostingJsonLd`.

### Sources / preuves
- `src/components/admin/job-form.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/components/public/job-card.tsx`
- `tests/unit/seo.test.ts`

---

## 7. Étapes nominales

## 7.1 Consultation publique de la liste
1. L’utilisateur ouvre `/offres-emploi`.
2. Le système charge les offres publiées via `getPublishedJobs()`.
3. Les offres sont rendues sous forme de cartes `JobCard`.
4. Si la liste est vide, un état vide s’affiche avec CTA vers l’adhésion.

## 7.2 Consultation d’une fiche offre
1. L’utilisateur ouvre `/offres-emploi/[slug]`.
2. Le système charge l’offre via `getJobBySlug(slug)`.
3. Si l’offre existe, la page détail s’affiche.
4. Le système injecte :
   - fil d’Ariane,
   - métadonnées OpenGraph/Twitter,
   - JSON-LD JobPosting.
5. L’utilisateur peut cliquer :
   - vers l’URL de candidature,
   - ou vers un `mailto:` si seul l’email est renseigné.

## 7.3 Création d’une offre dans le BO
1. L’admin ouvre `/admin/offres-emploi/new`.
2. Il remplit le formulaire `JobForm`.
3. Le formulaire valide les champs avec Zod.
4. `upsertJob` est appelée.
5. Le système redirige vers `/admin/offres-emploi`.

## 7.4 Édition d’une offre
1. L’admin ouvre `/admin/offres-emploi/[id]`.
2. Les données sont chargées depuis la base.
3. Le formulaire est prérempli.
4. L’admin modifie et sauvegarde.
5. Retour à la liste après enregistrement.

### Sources / preuves
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/app/admin/offres-emploi/new/page.tsx`
- `src/app/admin/offres-emploi/[id]/page.tsx`
- `src/components/admin/job-form.tsx`

---

## 8. Variantes

## 8.1 Aucune offre publiée
- La page publique affiche un empty state.
- Le message invite à devenir adhérent.
- CTA vers `/adhesion`.

## 8.2 Candidature par email
- Si `applicationUrl` est vide mais `applicationEmail` présent, la fiche doit proposer une action mailto.
- Sujet prérempli : `Candidature : [titre]`.

## 8.3 Candidature par URL externe
- Si `applicationUrl` est présent, le bouton / lien pointe vers cette URL.
- Le système considère cette URL comme externe.

## 8.4 Offre rattachée à un adhérent
- Le nom de l’entreprise est affiché dans la liste et la fiche.
- Si le slug membre est disponible, lien vers la fiche adhérent.

## 8.5 Statut non publié
- Les offres en brouillon ou clôturées ne doivent pas apparaître dans la liste publique.
- Elles restent visibles dans le BO.

### Sources / preuves
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/components/admin/job-form.tsx`
- `tests/unit/seo.test.ts`

---

## 9. Cas d’erreur

## 9.1 Offre introuvable
- Sur `/offres-emploi/[slug]`, si aucune offre n’est trouvée : `notFound()`.
- Sur `/admin/offres-emploi/[id]`, si l’offre n’existe pas : `notFound()`.

## 9.2 Données de formulaire invalides
- Le formulaire admin bloque :
  - titre vide,
  - URL invalide,
  - email invalide,
  - statut non autorisé.

## 9.3 Données manquantes côté public
- Si ni `content` ni `excerpt` ne sont présents, la page détail affiche “Contenu non disponible.”
- Si aucune offre n’existe, état vide.

## 9.4 Erreurs de persistence
- `upsertJob` peut échouer ; le composant n’affiche pas de détail technique ici, donc l’erreur est à gérer côté action serveur / UX globale.
- Hypothèse à valider : remontée d’un message explicite à l’admin en cas d’échec.

### Sources / preuves
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/app/admin/offres-emploi/[id]/page.tsx`
- `src/components/admin/job-form.tsx`
- `src/app/(public)/offres-emploi/page.tsx`

---

## 10. Documents / emails / effets de bord

## 10.1 Effets de bord fonctionnels
- Création/modification d’une offre dans le BO.
- Publication sur le site public selon le statut.
- Mise à jour des métadonnées SEO de la fiche.
- Génération du schéma JobPosting pour indexation.

## 10.2 E-mails
Aucun e-mail spécifique au workflow offres d’emploi n’est visible dans les preuves fournies.
- Pas de notification automatique explicitement documentée pour ce module.
- Hypothèse : l’équipe admin gère la mise en ligne manuellement.

## 10.3 Documents
- Aucune pièce jointe, PDF ou document d’annonce n’est visible dans le formulaire.
- Le contenu semble édité en texte libre uniquement.

### Sources / preuves
- `src/components/admin/job-form.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/lib/seo`
- `src/lib/actions/admin/content`

---

## 11. Règles métier

## 11.1 Publication
- Seules les offres “publiées” sont visibles publiquement.
- Les brouillons et offres clôturées restent internes.

## 11.2 Données minimales
- Un titre est obligatoire.
- Les autres champs sont optionnels, mais l’offre est plus utile si au moins :
  - description,
  - localisation,
  - type de contrat,
  - moyen de candidature
sont renseignés.

## 11.3 Candidature
- Priorité probable :
  1. `applicationUrl`
  2. `applicationEmail`
- Si les deux existent, l’URL est préférée pour l’action principale.

## 11.4 SEO
- La page liste a un titre et une description dédiés.
- La page détail doit fournir une canonical URL.
- Les pages génèrent un balisage schema.org.

## 11.5 Rattachement adhérent
- Une offre peut porter le nom d’un membre OPEN.
- Lien de rapprochement vers la fiche membre si le slug existe.

## 11.6 Gouvernance éditoriale
- Le BO est la source de vérité pour la création / édition.
- Aucun mécanisme d’auto-publication n’est documenté.

### Sources / preuves
- `src/components/admin/job-form.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `tests/unit/seo.test.ts`

---

## 12. Sécurité / permissions

## 12.1 Accès admin
- Les pages admin sont placées sous `/admin/...` et dépendent de l’authentification du back-office.
- Le projet utilise Auth.js pour l’administration.

### Preuves connexes
- `src/auth.ts`
- `src/lib/auth/config.ts`
- `src/app/admin/(auth)/login/page.tsx`
- `src/components/admin/login-form.tsx`

## 12.2 Autorisation métier
- Seuls les admins peuvent créer/éditer/clôturer des offres.
- Le public est en lecture seule.

## 12.3 Exposition des données
- Les pages publiques filtrent les offres publiées.
- Les données brouillons ne doivent pas fuiter dans le frontend public.

## 12.4 Sécurité de saisie
- Le formulaire admin valide les champs via Zod côté client.
- Les URLs et emails sont contraints.
- Le contenu reste textuel ; aucune preuve d’un éditeur riche dangereux n’est visible ici.

## 12.5 Risques sécurité à surveiller
- Injection HTML / contenu riche non maîtrisé si le champ `description` est rendu en HTML côté détail.
- Autorisations serveur des actions `upsertJob`.
- Contrôle d’accès effectif des routes admin, non démontré dans les extraits fournis.

---

## 13. Recette

## 13.1 Recette fonctionnelle
- [ ] La page `/offres-emploi` affiche les offres publiées.
- [ ] Chaque carte ouvre la bonne fiche.
- [ ] Une offre inexistante retourne 404.
- [ ] Le bouton d’action de la fiche ouvre l’URL de candidature si présente.
- [ ] À défaut, le lien `mailto:` fonctionne.
- [ ] L’admin peut créer une offre depuis `/admin/offres-emploi/new`.
- [ ] L’admin peut éditer une offre existante.
- [ ] Les statuts brouillon/publié/clôturé sont bien persistés.
- [ ] Les offres non publiées n’apparaissent pas publiquement.

## 13.2 Recette SEO
- [ ] Title et description sont corrects sur liste et détail.
- [ ] Canonical présent.
- [ ] JSON-LD JobPosting injecté sur la fiche.
- [ ] OpenGraph/Twitter configurés.

## 13.3 Recette accessibilité
- [ ] Les cartes sont accessibles par titre.
- [ ] Les liens d’action ont un libellé explicite.
- [ ] L’état vide est compréhensible.
- [ ] Les pages maintiennent une hiérarchie de titres cohérente.

### Sources / preuves
- `tests/unit/seo.test.ts`
- `src/components/public/job-card.tsx`
- `src/app/(public)/offres-emploi/page.tsx`
- `src/app/(public)/offres-emploi/[slug]/page.tsx`
- `src/components/admin/job-form.tsx`

---

## 14. Risques

## 14.1 Risque produit
- Module potentiellement peu utilisé si les offres ne sont pas alimentées régulièrement.
- L’absence de workflow de validation peut laisser publier des annonces incomplètes.

## 14.2 Risque contenu
- Les champs libres peuvent produire des fiches hétérogènes.
- Les conventions éditoriales ne sont pas documentées dans les preuves.

## 14.3 Risque SEO
- Si beaucoup de contenu est pauvre, les fiches auront peu de valeur indexable.
- Le balisage schema.org doit rester cohérent avec la donnée réelle.

## 14.4 Risque technique
- Render dynamique / lecture DB en temps réel sur les pages publiques.
- Dépendance aux actions serveur non montrées ici.
- Risque d’incohérence si le statut publié/clôturé n’est pas strictement filtré côté DB.

## 14.5 Risque sécurité
- Fiche détail : si `description` est rendue en HTML riche, surveillance de XSS nécessaire.
- Les routes admin doivent être verrouillées, y compris les actions.

---

## 15. Questions ouvertes

1. Le statut `closed` correspond-il à “offre archivée” ou “offre expirée” ?
2. Une offre peut-elle être liée à plusieurs membres, ou à un seul ?
3. Le lien de candidature est-il prioritairement externe, ou l’email est-il un fallback seulement ?
4. Faut-il une date de publication/expiration visible ou éditable dans le BO ?
5. Faut-il gérer des offres de stage / alternance avec des règles distinctes ?
6. Faut-il notifier l’admin ou le membre lors de la publication d’une offre ?
7. Faut-il un module de recherche/filtre sur la liste publique des offres ?
8. Faut-il autoriser un rich text editor pour `description` ?
9. Le BO doit-il afficher un aperçu de la fiche publique avant publication ?
10. Faut-il des métriques de performance / taux de clic sur les offres ?

### Questions / points à valider
- Statuts exacts et leur traduction métier.
- Présence ou non d’une échéance de validité.
- Relation offre ↔ adhérent.
- Politique d’édition du contenu et du format HTML.
- Besoin d’un workflow de validation avant publication.