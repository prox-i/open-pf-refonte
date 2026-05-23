import { and, asc, desc, eq, ilike, inArray, isNotNull, ne, or } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { activityDomains, memberActivities, memberContacts, members } from '@/lib/db/schema'
import { seededShuffle } from '@/lib/random/seeded-shuffle'

// Publication governance: all public queries filter on status = 'active'.
// The lifecycle is draft → submitted → active ↔ inactive (see schema.ts).
// 'active' is the only status that reaches the public annuaire.
// Content quality (description wording, logo presence, etc.) is NOT a filter criterion —
// it is the responsibility of the admin workflow (demandes/adherents pages).

export async function getActiveMembers() {
  const db = getDb()
  return db
    .select({
      id: members.id,
      slug: members.slug,
      name: members.name,
      logoUrl: members.logoUrl,
      description: members.description,
      websiteUrl: members.websiteUrl,
    })
    .from(members)
    .where(eq(members.status, 'active'))
    .orderBy(asc(members.name))
}

export async function getFeaturedMembers(limit = 12, options?: { seed?: string }) {
  const db = getDb()
  // Fetch the full pool when shuffling; DB-limit when deterministic order suffices.
  const list = options?.seed
    ? await db
        .select({ id: members.id, slug: members.slug, name: members.name, logoUrl: members.logoUrl })
        .from(members)
        .where(and(eq(members.status, 'active'), isNotNull(members.logoUrl)))
        .orderBy(asc(members.name))
    : await db
        .select({ id: members.id, slug: members.slug, name: members.name, logoUrl: members.logoUrl })
        .from(members)
        .where(and(eq(members.status, 'active'), isNotNull(members.logoUrl)))
        .orderBy(asc(members.name))
        .limit(limit)

  if (list.length === 0) return []

  const memberIds = list.map((m) => m.id)
  const activities = await db
    .select({ memberId: memberActivities.memberId, label: activityDomains.label })
    .from(memberActivities)
    .innerJoin(activityDomains, eq(memberActivities.domainId, activityDomains.id))
    .where(inArray(memberActivities.memberId, memberIds))

  const domainByMember = new Map<string, string>()
  for (const a of activities) {
    if (!domainByMember.has(a.memberId)) domainByMember.set(a.memberId, a.label)
  }

  const withDomains = list.map((m) => ({ ...m, primaryDomain: domainByMember.get(m.id) ?? null }))
  if (options?.seed) return seededShuffle(withDomains, options.seed).slice(0, limit)
  return withDomains
}

export async function getMemberBySlug(slug: string) {
  const db = getDb()
  const rows = await db
    .select({
      id: members.id,
      slug: members.slug,
      name: members.name,
      logoUrl: members.logoUrl,
      description: members.description,
      websiteUrl: members.websiteUrl,
      address: members.address,
      yearFounded: members.yearFounded,
      employeeCount: members.employeeCount,
      linkedinUrl: members.linkedinUrl,
      isMedefMember: members.isMedefMember,
      tahitiNumber: members.tahitiNumber,
    })
    .from(members)
    .where(and(eq(members.slug, slug), eq(members.status, 'active')))
    .limit(1)
  return rows[0] ?? null
}

export async function getMemberDomains(memberId: string): Promise<string[]> {
  const db = getDb()
  const rows = await db
    .select({ label: activityDomains.label })
    .from(memberActivities)
    .innerJoin(activityDomains, eq(memberActivities.domainId, activityDomains.id))
    .where(eq(memberActivities.memberId, memberId))
  return rows.map((r) => r.label)
}

export async function getActivityDomains() {
  const db = getDb()
  return db
    .select({ id: activityDomains.id, label: activityDomains.label })
    .from(activityDomains)
    .orderBy(asc(activityDomains.sortOrder))
}

export async function searchMembers(params: { q?: string | undefined; domainId?: string | undefined }) {
  const db = getDb()
  const searchTerm = params.q?.trim() ?? ''

  const list = await db
    .select({
      id: members.id,
      slug: members.slug,
      name: members.name,
      logoUrl: members.logoUrl,
      description: members.description,
    })
    .from(members)
    .where(
      and(
        eq(members.status, 'active'),
        searchTerm
          ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            or(ilike(members.name, `%${searchTerm}%`), ilike(members.description, `%${searchTerm}%`))!
          : undefined,
        params.domainId
          ? inArray(
              members.id,
              db
                .select({ memberId: memberActivities.memberId })
                .from(memberActivities)
                .where(eq(memberActivities.domainId, params.domainId)),
            )
          : undefined,
      ),
    )
    .orderBy(asc(members.name))

  if (list.length === 0) return []

  const memberIds = list.map((m) => m.id)
  const activities = await db
    .select({
      memberId: memberActivities.memberId,
      domainLabel: activityDomains.label,
    })
    .from(memberActivities)
    .innerJoin(activityDomains, eq(memberActivities.domainId, activityDomains.id))
    .where(inArray(memberActivities.memberId, memberIds))

  const domainByMember = new Map<string, string>()
  for (const a of activities) {
    if (!domainByMember.has(a.memberId)) {
      domainByMember.set(a.memberId, a.domainLabel)
    }
  }

  return list.map((m) => ({ ...m, primaryDomain: domainByMember.get(m.id) ?? null }))
}

export async function getMemberContacts(memberId: string) {
  const db = getDb()
  return db
    .select({
      id: memberContacts.id,
      name: memberContacts.name,
      role: memberContacts.role,
      email: memberContacts.email,
      phone: memberContacts.phone,
      isPrimary: memberContacts.isPrimary,
    })
    .from(memberContacts)
    .where(eq(memberContacts.memberId, memberId))
    .orderBy(desc(memberContacts.isPrimary), asc(memberContacts.name))
}

export async function getOtherActiveMembers(excludeSlug: string, limit = 3, options?: { seed?: string }) {
  const db = getDb()
  const list = options?.seed
    ? await db
        .select({ id: members.id, slug: members.slug, name: members.name, logoUrl: members.logoUrl, description: members.description })
        .from(members)
        .where(and(eq(members.status, 'active'), ne(members.slug, excludeSlug)))
        .orderBy(asc(members.name))
    : await db
        .select({ id: members.id, slug: members.slug, name: members.name, logoUrl: members.logoUrl, description: members.description })
        .from(members)
        .where(and(eq(members.status, 'active'), ne(members.slug, excludeSlug)))
        .orderBy(asc(members.name))
        .limit(limit)

  if (list.length === 0) return []

  const memberIds = list.map((m) => m.id)
  const activities = await db
    .select({ memberId: memberActivities.memberId, label: activityDomains.label })
    .from(memberActivities)
    .innerJoin(activityDomains, eq(memberActivities.domainId, activityDomains.id))
    .where(inArray(memberActivities.memberId, memberIds))

  const domainByMember = new Map<string, string>()
  for (const a of activities) {
    if (!domainByMember.has(a.memberId)) domainByMember.set(a.memberId, a.label)
  }

  const withDomains = list.map((m) => ({ ...m, primaryDomain: domainByMember.get(m.id) ?? null }))
  if (options?.seed) return seededShuffle(withDomains, options.seed).slice(0, limit)
  return withDomains
}
