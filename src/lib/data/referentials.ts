export const LEGAL_STATUSES = [
  { id: 'sarl', label: 'SARL' },
  { id: 'sas', label: 'SAS' },
  { id: 'sasu', label: 'SASU' },
  { id: 'eurl', label: 'EURL' },
  { id: 'sa', label: 'SA' },
  { id: 'snc', label: 'SNC' },
  { id: 'association', label: 'Association' },
  { id: 'etablissement-public', label: 'Établissement public' },
  { id: 'autre', label: 'Autre' },
] as const

export type LegalStatusId = (typeof LEGAL_STATUSES)[number]['id']

export const ACTIVITY_DOMAINS = [
  { id: 'audit', label: 'Audit & Conseil' },
  { id: 'cloud', label: 'Cloud & Hébergement' },
  { id: 'cybersecurite', label: 'Cybersécurité' },
  { id: 'developpement', label: 'Développement logiciel' },
  { id: 'distribution', label: 'Distribution & Intégration' },
  { id: 'formation', label: 'Formation & Enseignement' },
  { id: 'ia', label: 'Intelligence artificielle' },
  { id: 'infrastructure', label: 'Infrastructure & Réseaux' },
  { id: 'innovation', label: 'Innovation & Startups' },
  { id: 'marketing-digital', label: 'Marketing digital' },
  { id: 'media-numerique', label: 'Médias numériques' },
  { id: 'objets-connectes', label: 'Objets connectés & IoT' },
  { id: 'rgpd', label: 'RGPD & Conformité' },
  { id: 'services-finances', label: 'Services financiers numériques' },
  { id: 'telecom', label: 'Télécommunications' },
  { id: 'transformation-digitale', label: 'Transformation digitale' },
  { id: 'web3', label: 'Web3 & Blockchain' },
  { id: 'web-mobile', label: 'Web & Mobile' },
  { id: 'autre', label: 'Autre' },
] as const

export type ActivityDomainId = (typeof ACTIVITY_DOMAINS)[number]['id']

export const CERTIFICATIONS = [
  { id: 'iso27001', label: 'ISO 27001' },
  { id: 'iso9001', label: 'ISO 9001' },
  { id: 'hds', label: 'HDS (Hébergeur de Données de Santé)' },
  { id: 'pci-dss', label: 'PCI-DSS' },
  { id: 'anssi-pssie', label: 'ANSSI / PSSIE' },
  { id: 'cisco', label: 'Cisco Partner' },
  { id: 'microsoft', label: 'Microsoft Partner' },
  { id: 'aws', label: 'AWS Partner' },
  { id: 'google-cloud', label: 'Google Cloud Partner' },
  { id: 'oscp', label: 'OSCP' },
  { id: 'ceh', label: 'CEH' },
  { id: 'cisa', label: 'CISA' },
  { id: 'cissp', label: 'CISSP' },
  { id: 'rgpd-dpo', label: 'DPO certifié RGPD' },
  { id: 'qualiopi', label: 'Qualiopi' },
  { id: 'autre', label: 'Autre (préciser)' },
] as const

export type CertificationId = (typeof CERTIFICATIONS)[number]['id']
