/* eslint-disable no-console */
import { hash } from 'bcrypt-ts'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'

import * as schema from './schema'

const {
  legalStatuses,
  activityDomains,
  certifications,
  newsCategories,
  partners,
  teamMembers,
  timelineEvents,
  siteStats,
  adminUsers,
  members,
} = schema

async function seed() {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) throw new Error('DATABASE_URL is required')

  const sql = neon(databaseUrl)
  const db = drizzle(sql, { schema })

  console.log('🌱 Seeding database...')

  // ─── Statuts juridiques ────────────────────────────────────────────────────
  console.log('  → legal_statuses')
  await db.insert(legalStatuses).values([
    { label: 'Personne physique / Entreprise individuelle', sortOrder: 1 },
    { label: 'EURL', sortOrder: 2 },
    { label: 'SARL', sortOrder: 3 },
    { label: 'SAS / SASU', sortOrder: 4 },
    { label: 'SA', sortOrder: 5 },
    { label: 'SNC', sortOrder: 6 },
    { label: 'Association loi 1901', sortOrder: 7 },
    { label: 'Coopérative (SCOP)', sortOrder: 8 },
    { label: 'Autre', sortOrder: 9 },
  ])

  // ─── Domaines d'activité ───────────────────────────────────────────────────
  console.log('  → activity_domains')
  await db.insert(activityDomains).values([
    { id: 'droit-specialise', label: 'Droit spécialisé', sortOrder: 1 },
    { id: 'communication-digitale', label: 'Communication digitale', sortOrder: 2 },
    { id: 'amo-ami', label: 'AMO / AMI', sortOrder: 3 },
    { id: 'audit', label: 'Audit', sortOrder: 4 },
    { id: 'conseil-expertise', label: 'Conseil / Expertise', sortOrder: 5 },
    { id: 'formation', label: 'Organisme de formation / Formateur', sortOrder: 6 },
    { id: 'commerce-en-ligne', label: 'Commerce et service en ligne', sortOrder: 7 },
    { id: 'application-mobile', label: 'Application mobile', sortOrder: 8 },
    { id: 'developpement-logiciels', label: 'Développement logiciels', sortOrder: 9 },
    { id: 'edition-logiciels', label: 'Édition de logiciels', sortOrder: 10 },
    { id: 'iot', label: 'IoT', sortOrder: 11 },
    { id: 'sites-applis-web', label: 'Sites et applis web', sortOrder: 12 },
    { id: 'telecom-voip', label: 'Télécom et voix sur IP', sortOrder: 13 },
    { id: 'admin-reseaux-systeme', label: 'Admin / Réseaux / Système', sortOrder: 14 },
    { id: 'fai', label: 'FAI', sortOrder: 15 },
    { id: 'cloud', label: 'Hébergement / Stockage / Cloud', sortOrder: 16 },
    { id: 'cybersecurite', label: 'Normes / Cybersécurité', sortOrder: 17 },
    {
      id: 'vente-materiel',
      label: 'Vente de matériels informatique et audiovisuel',
      sortOrder: 18,
    },
    { id: 'sav', label: 'SAV', sortOrder: 19 },
    { id: 'autre', label: 'Autre', sortOrder: 20 },
  ])

  // ─── Certifications ────────────────────────────────────────────────────────
  console.log('  → certifications')
  await db.insert(certifications).values([
    { id: 'agrement-dfp', label: 'Agrément DFP', sortOrder: 1 },
    { id: 'caruba', label: 'CARUBA', sortOrder: 2 },
    { id: 'cciso', label: 'CCISO', sortOrder: 3 },
    { id: 'ccna', label: 'CCNA', sortOrder: 4 },
    { id: 'ceh', label: 'CEH (Certified Ethical Hacker)', sortOrder: 5 },
    {
      id: 'google-ads',
      label: 'Certification Google Ads (Publicité sur le Réseau de Recherche)',
      sortOrder: 6,
    },
    { id: 'google-analytics', label: 'Certification Google Analytics IQ', sortOrder: 7 },
    { id: 'cevoc', label: 'CEVOC', sortOrder: 8 },
    { id: 'hfi', label: 'HFI', sortOrder: 9 },
    { id: 'cisco', label: 'CISCO', sortOrder: 10 },
    { id: 'cissp', label: 'CISSP', sortOrder: 11 },
    { id: 'csnah', label: 'CSNAH', sortOrder: 12 },
    { id: 'peitil-v3', label: 'PEITIL V3', sortOrder: 13 },
    { id: 'ms365-fundamentals', label: 'Microsoft 365 Fundamentals', sortOrder: 14 },
    { id: 'ms-mvp', label: 'Microsoft Most Valuable Professional (MVP)', sortOrder: 15 },
    { id: 'osce', label: 'Offensive Security Certified Expert (OSCE)', sortOrder: 16 },
    { id: 'oscp', label: 'OSCP', sortOrder: 17 },
    { id: 'qswp', label: 'QSWP', sortOrder: 18 },
    { id: 'qcssa', label: 'QCSSA', sortOrder: 19 },
    { id: 'ge', label: 'GE', sortOrder: 20 },
    { id: 'scrum-master', label: 'SCRUM Master', sortOrder: 21 },
    { id: 'teams-admin', label: 'Teams Administration Associate', sortOrder: 22 },
    { id: 'autre', label: 'Autre', sortOrder: 23 },
  ])

  // ─── Catégories d'actualités ───────────────────────────────────────────────
  console.log('  → news_categories')
  await db.insert(newsCategories).values([
    { slug: 'vie-association', label: "Vie de l'association", sortOrder: 1 },
    { slug: 'filiere-numerique', label: 'Filière numérique', sortOrder: 2 },
    { slug: 'cybersecurite', label: 'Cybersécurité', sortOrder: 3 },
    { slug: 'evenement', label: 'Événement', sortOrder: 4 },
    { slug: 'partenariat', label: 'Partenariat', sortOrder: 5 },
    { slug: 'communique-presse', label: 'Communiqué de presse', sortOrder: 6 },
  ])

  // ─── Partenaires ───────────────────────────────────────────────────────────
  console.log('  → partners')
  await db.insert(partners).values([
    {
      name: 'MEDEF Polynésie française',
      websiteUrl: 'https://www.medef.pf',
      sortOrder: 1,
      isActive: true,
    },
    { name: 'OPEN NC', websiteUrl: 'https://www.open.nc', sortOrder: 2, isActive: true },
    { name: 'CLUSIR Tahiti', websiteUrl: null, sortOrder: 3, isActive: true },
    { name: 'La French Tech Polynésie', websiteUrl: null, sortOrder: 4, isActive: true },
    { name: 'Gendarmerie de Polynésie française', websiteUrl: null, sortOrder: 5, isActive: true },
  ])

  // ─── Bureau ────────────────────────────────────────────────────────────────
  console.log('  → team_members')
  await db.insert(teamMembers).values([
    { fullName: 'DE REVIERE Thibault', role: 'Président', sortOrder: 1, isActive: true },
    { fullName: 'LUCAS Tuarii', role: 'Vice-président', sortOrder: 2, isActive: true },
    { fullName: 'LATIL Frédéric', role: 'Secrétaire', sortOrder: 3, isActive: true },
    { fullName: 'PURAVET Sébastien', role: 'Trésorier', sortOrder: 4, isActive: true },
    { fullName: 'AMPOURNALES Véronique', role: 'Assesseur', sortOrder: 5, isActive: true },
    { fullName: 'CHABOT Florian', role: 'Assesseur', sortOrder: 6, isActive: true },
    { fullName: 'LEGENDRE Patrick', role: 'Assesseur', sortOrder: 7, isActive: true },
    { fullName: 'CHANE Alain', role: 'Assesseur', sortOrder: 8, isActive: true },
  ])

  // ─── Frise chronologique ───────────────────────────────────────────────────
  console.log('  → timeline_events')
  await db.insert(timelineEvents).values([
    {
      year: 2011,
      description:
        "Création de l'association. Élection de Guillaume PROIA à la présidence d'OPEN PF",
      sortOrder: 1,
    },
    {
      year: 2013,
      description: 'Changements de bureau et de président. Élection de Frédéric DOCK',
      sortOrder: 2,
    },
    {
      year: 2015,
      description: 'Changements de bureau et de président. Élection de Vincent FABRE',
      sortOrder: 3,
    },
    { year: 2017, description: 'Rapprochement avec OPEN NC (Nouvelle-Calédonie)', sortOrder: 4 },
    {
      year: 2021,
      description: 'Changements de bureau et de président. Élection de Thibault DE REVIERE',
      sortOrder: 5,
    },
    {
      year: 2021,
      description: "Vision, convictions, missions… Travaux autour de la raison d'être OPEN",
      sortOrder: 6,
    },
    {
      year: 2022,
      description: 'Développement de partenariats clés — CLUSIR, French Tech',
      sortOrder: 7,
    },
    {
      year: 2026,
      description: 'Refonte du site et lancement de la plateforme numérique',
      sortOrder: 8,
    },
  ])

  // ─── Site stats (single row) ───────────────────────────────────────────────
  console.log('  → site_stats')
  await db.insert(siteStats).values([{ id: 1, employeeCount: null }])

  // ─── Adhérents (54 entreprises) ────────────────────────────────────────────
  console.log('  → members (54)')
  await db.insert(members).values([
    {
      slug: 'bbs',
      name: 'BBS',
      logoUrl: 'https://open.pf/wp-content/uploads/2025/09/BBS-Logo-Simple-2BTrame-1200x1200.jpg',
      description:
        'Accompagnement entreprises et institutions du fenua sur la gestion complète de SI : ingénierie systèmes et réseaux, assistance utilisateurs, cybersécurité et conseil stratégique.',
      status: 'active',
    },
    {
      slug: 'clusir-tahiti',
      name: 'CLUSIR Tahiti',
      logoUrl:
        'https://open.pf/wp-content/uploads/2025/07/326535350_711841490478657_2673823807400474931_n-1200x661.png',
      description:
        "Club de la Sécurité de l'Information Région Tahiti — association de professionnels pour l'entraide, le partage d'expériences et les bonnes pratiques de la sécurité de l'information.",
      status: 'active',
    },
    {
      slug: 'oraclia-sas',
      name: 'ORACLIA, SAS',
      logoUrl: 'https://open.pf/wp-content/uploads/2025/07/Design-sans-titre.png',
      description:
        "Transforme l'intelligence artificielle en levier stratégique aussi naturel et indispensable que l'utilisation quotidienne des outils de travail.",
      status: 'active',
    },
    {
      slug: 'fenua-online',
      name: 'Fenua online',
      logoUrl: 'https://open.pf/wp-content/uploads/2025/07/google-business-720x720-1.png',
      description:
        "Sites internet, solutions en ligne et ingénierie informatique sur Tahiti. Produits clés-en-main personnalisables par le service d'ingénierie logicielle.",
      status: 'active',
    },
    {
      slug: 'galatea',
      name: 'GALATEA',
      logoUrl: 'https://open.pf/wp-content/uploads/2025/05/Galatea-Io-Logo-2.png',
      description:
        "Spécialisée dans la mesure, la collecte de données et le pilotage d'équipements à distance.",
      status: 'active',
    },
    {
      slug: 'rbcs-it-advisory',
      name: 'RBCS – IT Advisory',
      logoUrl: 'https://open.pf/wp-content/uploads/2025/04/Signature-1.png',
      description:
        'Accompagnement en transformation numérique et optimisation du SI. Approche pragmatique orientée résultats.',
      status: 'active',
    },
    {
      slug: 'foxit',
      name: 'FOXIT',
      logoUrl: 'https://open.pf/wp-content/uploads/2025/04/TRANSPA_LOGO_FOXIT_2020-1200x1234.png',
      description:
        'Entreprise polynésienne spécialiste en Cybersécurité et Sécurité des SI, intervient APAC, France Métropolitaine et DOM-TOM.',
      status: 'active',
    },
    {
      slug: 'delta-consulting',
      name: 'DELTA Consulting',
      logoUrl: 'https://open.pf/wp-content/uploads/2025/04/DELTA_2.3.png',
      description:
        "Partenaire de confiance pour la transformation digitale. De la conception à la mise en œuvre, optimisation de la performance et accompagnement de l'évolution.",
      status: 'active',
    },
    {
      slug: 'socredo',
      name: 'SOCREDO',
      logoUrl: null,
      description:
        'Créée en 1959, première banque de Polynésie française. Services bancaires et financiers efficaces et adaptés aux particuliers comme aux entreprises depuis 60 ans.',
      status: 'active',
    },
    {
      slug: 'mana-cyber-pacifique',
      name: 'MANA CYBER PACIFIQUE',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/12/FullLogo-1200x960.png',
      description:
        "Spécialisée dans l'audit, le conseil et l'accompagnement en cybersécurité, gestion des risques numériques, et conformité RGPD en Polynésie.",
      status: 'active',
    },
    {
      slug: 'numeri',
      name: 'NŪMERI',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/12/logo.png',
      description:
        "Fruit de l'association des compétences d'IDT (Innovative Digital Technologies) et du Groupe SF2i.",
      status: 'active',
    },
    {
      slug: 'cnam-polynesie',
      name: 'Cnam Polynésie',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/12/logo_fb.jpg',
      description:
        "Présent depuis 1978 en Polynésie pour permettre aux habitants de suivre des formations de l'enseignement supérieur en présentiel, distanciel ou hybride.",
      status: 'active',
    },
    {
      slug: 'fortitude-services',
      name: 'FORTITUDE SERVICES',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/10/Logo_Facebook-1200x1200.png',
      description:
        'Cabinet de conseil en gestion des risques et protection des entreprises : audit de risques, sensibilisation, gestion de crise, assurance cyber.',
      status: 'active',
    },
    {
      slug: 'soram-pacifique',
      name: 'SORAM PACIFIQUE',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/10/LOGO-Soram-Pacifique-VERT.jpg',
      description:
        "Leader vente/location de systèmes d'impression et numérisation, solutions SIRH, cybersécurité, écrans multimédia et supports de diffusion.",
      status: 'active',
    },
    {
      slug: 'havae-consulting',
      name: "Hava'e consulting",
      logoUrl:
        'https://open.pf/wp-content/uploads/2024/10/Black20White20Minimalist20SImple20Monogram20Typography20Logo-1200x1200.png',
      description:
        "Cabinet de conseil basé en Polynésie française, spécialisé dans la transformation numérique, la stratégie d'entreprise et l'optimisation des processus.",
      status: 'active',
    },
    {
      slug: 'invest-in-pacific',
      name: 'SAS INVEST IN PACIFIC',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/10/logotype-IIP_FR-1200x980.jpg',
      description:
        "Agrément AMF. Permet aux épargnants d'investir directement dans l'immobilier, les sociétés innovantes et les PME locales.",
      status: 'active',
    },
    {
      slug: 'dinovox',
      name: 'DinoVox',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/09/Logo-DinoVox-v2-1-1200x450.png',
      description:
        '1ère entreprise nativement Web3 de Polynésie. NFT, cryptomonnaies, blockchain, tokenisation, métavers, FenuaVerse.',
      status: 'active',
    },
    {
      slug: 'spilog',
      name: 'SPILOG',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/07/Logo20SPILOG.png',
      description: null,
      status: 'active',
    },
    {
      slug: 'cabinet-alain-oziel',
      name: 'Cabinet Alain Oziel',
      logoUrl: null,
      description: null,
      status: 'active',
    },
    {
      slug: 'advens',
      name: 'Advens',
      logoUrl:
        'https://open.pf/wp-content/uploads/2024/05/logo-cercle-ad_blanc-et-bleu_fond-gris_1182x1182px.png',
      description: null,
      status: 'active',
    },
    {
      slug: 'maraamu',
      name: "Mara'amu",
      logoUrl: 'https://open.pf/wp-content/uploads/2024/05/Maraamu-1200x1200.png',
      description: null,
      status: 'active',
    },
    {
      slug: 'update-solutions',
      name: 'Üpdate solütions',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/05/UPDATE-LOGO_page-0001-1200x675.jpg',
      description: null,
      status: 'active',
    },
    {
      slug: 'green-tech-lab',
      name: 'Green/Tech/Lab',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/04/android-chrome-256x256-1.png',
      description:
        'Mesure, amélioration et valorisation des impacts environnementaux des infrastructures et services IT.',
      status: 'active',
    },
    {
      slug: 'foodease',
      name: 'Foodease',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/04/sans-bordure-ni-ecriture.png',
      description: '1ère plateforme de livraison de restaurant et commerce du Fenua.',
      status: 'active',
    },
    {
      slug: 'taiara-sarl',
      name: "TA'IARA SARL",
      logoUrl: 'https://open.pf/wp-content/uploads/2024/04/Logo-seul-couleurs-1200x1017.png',
      description: null,
      status: 'active',
    },
    {
      slug: 'community-tahiti',
      name: 'Community Tahiti',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/04/FullColor_1024x1024_72dpi.png',
      description: null,
      status: 'active',
    },
    {
      slug: 'moana-numera',
      name: 'Moana Nūmera',
      logoUrl: 'https://open.pf/wp-content/uploads/2024/04/logo-black-1200x261.png',
      description:
        "Forme, accompagne et outille les organisations qui désirent transformer leur approche du numérique en respectant l'environnement, plaçant l'humain au cœur et améliorant l'efficience.",
      status: 'active',
    },
    {
      slug: 'innovative-digital-technologies',
      name: 'Innovative Digital Technologies',
      logoUrl: null,
      description:
        'Conseil / Expertise, Distribution et intégration, Hébergement / Stockage / Cloud. Immeuble Hokulea 2, rue Cook 98 713 Papeete.',
      status: 'active',
    },
    {
      slug: 'digital-tahiti',
      name: 'Digital Tahiti',
      logoUrl: 'https://open.pf/wp-content/uploads/2023/06/Digital-Tahiti-logo-DFT2019.png',
      description: null,
      status: 'active',
    },
    { slug: 'sysnux', name: 'SysNux', logoUrl: null, description: null, status: 'active' },
    {
      slug: 'vittoria-io',
      name: 'Vittoria.io',
      logoUrl: null,
      description: null,
      status: 'active',
    },
    {
      slug: 'banque-de-tahiti',
      name: 'Banque de Tahiti',
      logoUrl: null,
      description: null,
      status: 'active',
    },
    {
      slug: 'bull-sas-atos',
      name: 'Bull SAS, an Atos company',
      logoUrl: null,
      description: null,
      status: 'active',
    },
    { slug: 'tehera', name: 'Tehera', logoUrl: null, description: null, status: 'active' },
    {
      slug: 'tahiti-numerique',
      name: 'Tahiti Numérique',
      logoUrl: null,
      description:
        "Agence d'ingénierie logicielle depuis 2018 : conseil en transformation digitale, développement applications web/mobile, intégration SaaS (GEC, GRU, RH, BI), formations.",
      status: 'active',
    },
    {
      slug: 'iaora-systems',
      name: 'Iaora systems',
      logoUrl:
        'https://open.pf/wp-content/uploads/2022/07/iaora_systems-logo-rvb_2018_796x224.jpeg',
      description:
        'Spécialisée en services numériques : développement de logiciels et conseil RGPD.',
      status: 'active',
    },
    {
      slug: 'tahiti-video-production',
      name: 'Tahiti Video Production',
      logoUrl: null,
      description: null,
      status: 'active',
    },
    { slug: 'cegelec', name: 'Cegelec', logoUrl: null, description: null, status: 'active' },
    {
      slug: 'oceanienne-de-services-business',
      name: 'Océanienne de Services Business',
      logoUrl: 'https://open.pf/wp-content/uploads/2022/07/Design-sans-titre-1.png',
      description: null,
      status: 'active',
    },
    {
      slug: 'ivea',
      name: 'Ivea',
      logoUrl: null,
      description:
        'Regroupe 5 enseignes : Ivea Apple Premium Reseller / Centre de Services / Bose Store / Smart Store / iStore. Papeete - Centre Vaima.',
      status: 'active',
    },
    {
      slug: 'te-rama',
      name: 'TE RAMA',
      logoUrl:
        'https://open.pf/wp-content/uploads/2022/05/118653317478_TERAMA-LOGO-FAB_cartouche20vert20bleu-1200x529.png',
      description: null,
      status: 'active',
    },
    { slug: 'isi-pf', name: 'ISI.PF', logoUrl: null, description: null, status: 'active' },
    {
      slug: 'ileade',
      name: 'iléade',
      logoUrl: null,
      description:
        "De la gestion de projet à l'assistance MOA, du développement à l'ingénierie inversée, de l'intégration à l'éditique : large panoplie de services.",
      status: 'active',
    },
    {
      slug: 'actecil-polynesie-francaise',
      name: 'Actecil Polynésie française',
      logoUrl: null,
      description:
        'Audit, Communication digitale, Conseil / Expertise. Immeuble Laux, Rue Émile Martin, Quartier du Commerce, PAPEETE. Contact : Christel CHAUVEAU-SIMIOL.',
      status: 'active',
    },
    {
      slug: 'la-french-tech-polynesie',
      name: 'La French Tech Polynésie',
      logoUrl: null,
      description:
        "Mouvement français des startups en Polynésie. Promotion de l'innovation numérique, transformation digitale, ses acteurs et porteurs de projets.",
      status: 'active',
    },
    {
      slug: 'tep',
      name: 'TEP',
      logoUrl: null,
      description: "Transport d'énergie électrique en Polynésie française.",
      status: 'active',
    },
    {
      slug: 'iki-consulting',
      name: 'iKi consulting',
      logoUrl: null,
      description:
        "Amélioration des processus et déroulement des projets. Le digital et les logiciels comme leviers d'efficience opérationnelle.",
      status: 'active',
    },
    {
      slug: 'digital-techno',
      name: 'Digital Techno',
      logoUrl: null,
      description: null,
      status: 'active',
    },
    { slug: 'b-edition', name: 'B Edition', logoUrl: null, description: null, status: 'active' },
    {
      slug: 'polynesienne-des-eaux',
      name: 'Polynésienne des eaux',
      logoUrl: null,
      description: null,
      status: 'active',
    },
    { slug: 'inbusol', name: 'Inbusol', logoUrl: null, description: null, status: 'active' },
    {
      slug: 'proxi',
      name: '#Prox-i',
      logoUrl: 'https://open.pf/wp-content/uploads/2023/12/OPEN-Pf_PROXI.png',
      description: null,
      status: 'active',
    },
    { slug: 'sas-onati', name: 'SAS ONATi', logoUrl: null, description: null, status: 'active' },
    {
      slug: 'sf2i',
      name: 'SF2I',
      logoUrl: null,
      description:
        'Admin / Réseaux / Système, AMO / AMI, Audit, Conseil / Expertise, Développement logiciels. Immeuble Le Bihan 1er étage, I1 et H1 - 98716 Pirae. Contact : Florian CHABOT.',
      status: 'active',
    },
  ])

  // ─── Admin par défaut ──────────────────────────────────────────────────────
  console.log('  → admin_users (default)')
  const defaultPassword = process.env['SEED_ADMIN_PASSWORD'] ?? 'changeme'
  const passwordHash = await hash(defaultPassword, 12)
  await db.insert(adminUsers).values([
    {
      email: 'admin@open.pf',
      passwordHash,
      name: 'Admin OPEN PF',
      isActive: true,
    },
  ])

  console.log('✅ Seed complete.')
  console.log('   → admin@open.pf / ' + defaultPassword + ' (change this immediately)')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
