import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const memberStatusEnum = pgEnum('member_status', [
  'draft',
  'submitted',
  'active',
  'inactive',
])

export const newsStatusEnum = pgEnum('news_status', ['draft', 'published'])

export const jobStatusEnum = pgEnum('job_status', ['draft', 'published', 'closed'])

export const reminderTypeEnum = pgEnum('reminder_type', [
  'submission_reminder',
  'validation_pending',
  'renewal_reminder',
  'profile_incomplete',
])

// ─── Référentiels ──────────────────────────────────────────────────────────────

export const legalStatuses = pgTable('legal_statuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 120 }).notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const activityDomains = pgTable('activity_domains', {
  id: varchar('id', { length: 80 }).primaryKey(), // slug e.g. 'audit', 'cloud'
  label: varchar('label', { length: 120 }).notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const certifications = pgTable('certifications', {
  id: varchar('id', { length: 80 }).primaryKey(), // slug e.g. 'cisco', 'oscp'
  label: varchar('label', { length: 200 }).notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ─── Membres ──────────────────────────────────────────────────────────────────

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  logoUrl: text('logo_url'),
  description: text('description'),
  websiteUrl: text('website_url'),
  legalStatusId: uuid('legal_status_id').references(() => legalStatuses.id),
  address: text('address'),
  yearFounded: integer('year_founded'),
  employeeCount: integer('employee_count'),
  linkedinUrl: text('linkedin_url'),
  tahitiNumber: varchar('tahiti_number', { length: 50 }),
  isMedefMember: boolean('is_medef_member').notNull().default(false),
  // Status lifecycle: draft → submitted → active ↔ inactive
  status: memberStatusEnum('status').notNull().default('draft'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by'), // adminUsers.id (no FK to avoid circular dep)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const memberContacts = pgTable('member_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  role: varchar('role', { length: 120 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  isPrimary: boolean('is_primary').notNull().default(false),
})

// m:n — member ↔ activity_domain
export const memberActivities = pgTable(
  'member_activities',
  {
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    domainId: varchar('domain_id', { length: 80 })
      .notNull()
      .references(() => activityDomains.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.memberId, t.domainId] })],
)

// m:n — member ↔ certification (with optional free-text for "Autre")
export const memberCertifications = pgTable(
  'member_certifications',
  {
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    certificationId: varchar('certification_id', { length: 80 })
      .notNull()
      .references(() => certifications.id, { onDelete: 'cascade' }),
    otherLabel: varchar('other_label', { length: 200 }), // populated when certificationId === 'autre'
  },
  (t) => [primaryKey({ columns: [t.memberId, t.certificationId] })],
)

// ─── Contenus ─────────────────────────────────────────────────────────────────

export const newsCategories = pgTable('news_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  label: varchar('label', { length: 120 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const news = pgTable('news', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 300 }).notNull(),
  excerpt: text('excerpt'),
  content: text('content'),
  categoryId: uuid('category_id').references(() => newsCategories.id),
  status: newsStatusEnum('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  authorName: varchar('author_name', { length: 120 }),
  imageUrl: text('image_url'),
  metaDescription: varchar('meta_description', { length: 160 }),
  jsonLd: jsonb('json_ld'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const jobOffers = pgTable('job_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 200 }),
  contractType: varchar('contract_type', { length: 80 }), // CDI, CDD, Stage, Alternance...
  salary: varchar('salary', { length: 100 }),
  applicationUrl: text('application_url'),
  applicationEmail: varchar('application_email', { length: 255 }),
  status: jobStatusEnum('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metaDescription: varchar('meta_description', { length: 160 }),
  jsonLd: jsonb('json_ld'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Institutionnel ───────────────────────────────────────────────────────────

export const partners = pgTable('partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
})

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: varchar('full_name', { length: 200 }).notNull(),
  role: varchar('role', { length: 120 }).notNull(),
  photoUrl: text('photo_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
})

export const timelineEvents = pgTable('timeline_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  year: integer('year').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

// Single-row table for manually-edited site-wide stats
export const siteStats = pgTable('site_stats', {
  id: integer('id').primaryKey().default(1), // always 1
  employeeCount: integer('employee_count'), // bureau-entered, not auto-calculated
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Single-row table for site-wide editable settings (réglages).
// Read at runtime with a fallback to env vars when a field is empty —
// see src/lib/settings.ts. Lets the bureau change the contact recipient
// and public coordinates without a redeploy.
export const siteSettings = pgTable('site_settings', {
  id: integer('id').primaryKey().default(1), // always 1
  contactRecipientEmail: varchar('contact_recipient_email', { length: 255 }), // où arrivent les messages
  publicEmail: varchar('public_email', { length: 255 }), // email affiché sur /contact
  publicAddress: text('public_address'),
  publicHours: text('public_hours'),
  facebookUrl: text('facebook_url'),
  linkedinUrl: text('linkedin_url'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
})

export const memberTokens = pgTable('member_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(), // SHA-256 hex
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reminderLogs = pgTable('reminder_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  type: reminderTypeEnum('type').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  emailTo: varchar('email_to', { length: 255 }).notNull(),
})

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 120 }).notNull(), // e.g. 'member.approve', 'member.reject'
  targetType: varchar('target_type', { length: 80 }), // e.g. 'member', 'news'
  targetId: uuid('target_id'),
  data: jsonb('data'), // snapshot or diff
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Agenda OPEN — événements à venir affichés dans la carte agenda de la home.
 * Pas de page détail obligatoire : `detailUrl` est optionnel. `eventDate` est une
 * date calendaire (sans fuseau) ; l'expiration se calcule à la journée en heure
 * de Tahiti (l'événement disparaît le lendemain du jour où il a lieu).
 */
export const agendaEvents = pgTable('agenda_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  // Contenu riche (Markdown) de la page de détail optionnelle (/agenda/[slug]).
  content: text('content'),
  eventDate: date('event_date').notNull(),
  startTime: varchar('start_time', { length: 5 }), // "HH:MM" optionnel
  location: varchar('location', { length: 200 }),
  detailUrl: text('detail_url'),
  isExternalUrl: boolean('is_external_url').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  showOnHome: boolean('show_on_home').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
