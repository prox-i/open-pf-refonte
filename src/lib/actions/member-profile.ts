'use server'

import { eq, and, gt, isNull } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { members, memberTokens, memberActivities, memberCertifications } from '@/lib/db/schema'
import { memberProfileSchema, type MemberProfileData } from '@/lib/validations/member-profile'
import { hashMagicToken, verifyMagicToken } from '@/lib/auth/magic-link'

type SaveResult = { success: true } | { success: false; errors: Record<string, string[]> }

type SubmitResult =
  | { success: true; memberName: string }
  | { success: false; errors: Record<string, string[]> }

async function resolveToken(rawToken: string) {
  if (!verifyMagicToken(rawToken)) return null

  const db = getDb()
  const hash = hashMagicToken(rawToken)
  const [record] = await db
    .select({ memberId: memberTokens.memberId, tokenId: memberTokens.id })
    .from(memberTokens)
    .where(
      and(
        eq(memberTokens.tokenHash, hash),
        gt(memberTokens.expiresAt, new Date()),
        isNull(memberTokens.usedAt),
      ),
    )
    .limit(1)

  return record ?? null
}

export async function saveMemberProfileDraft(rawToken: string, raw: unknown): Promise<SaveResult> {
  const token = await resolveToken(rawToken)
  if (!token) {
    return { success: false, errors: { _token: ['Lien invalide ou expiré'] } }
  }

  const parsed = memberProfileSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const [key, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[key] = issues ?? []
    }
    return { success: false, errors }
  }

  const data = parsed.data
  const db = getDb()

  await db
    .update(members)
    .set({
      description: data.description ?? null,
      websiteUrl: data.websiteUrl ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
      address: data.address ?? null,
      yearFounded: data.yearFounded ?? null,
      employeeCount: data.employeeCount ?? null,
      logoUrl: data.logoUrl ?? null,
      updatedAt: new Date(),
    })
    .where(eq(members.id, token.memberId))

  return { success: true }
}

export async function submitMemberProfile(rawToken: string, raw: unknown): Promise<SubmitResult> {
  const token = await resolveToken(rawToken)
  if (!token) {
    return { success: false, errors: { _token: ['Lien invalide ou expiré'] } }
  }

  const parsed = memberProfileSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const [key, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[key] = issues ?? []
    }
    return { success: false, errors }
  }

  const data = parsed.data
  const db = getDb()

  // neon-http driver does not support transactions — sequential operations
  const [updated] = await db
    .update(members)
    .set({
      description: data.description ?? null,
      websiteUrl: data.websiteUrl ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
      address: data.address ?? null,
      yearFounded: data.yearFounded ?? null,
      employeeCount: data.employeeCount ?? null,
      logoUrl: data.logoUrl ?? null,
      updatedAt: new Date(),
    })
    .where(eq(members.id, token.memberId))
    .returning({ name: members.name })

  if (!updated) throw new Error('Member not found')
  const memberName = updated.name

  await db.delete(memberActivities).where(eq(memberActivities.memberId, token.memberId))
  if (data.activityDomains.length > 0) {
    await db.insert(memberActivities).values(
      data.activityDomains.map((domainId) => ({
        memberId: token.memberId,
        domainId,
      })),
    )
  }

  await db.delete(memberCertifications).where(eq(memberCertifications.memberId, token.memberId))
  if (data.certifications.length > 0) {
    await db.insert(memberCertifications).values(
      data.certifications.map((certId) => ({
        memberId: token.memberId,
        certificationId: certId,
        otherLabel: certId === 'autre' ? (data.certificationOtherLabel ?? null) : null,
      })),
    )
  }

  await db
    .update(memberTokens)
    .set({ usedAt: new Date() })
    .where(eq(memberTokens.id, token.tokenId))

  return { success: true, memberName }
}

export async function getMemberByToken(
  rawToken: string,
): Promise<(MemberProfileData & { name: string; memberId: string }) | null> {
  if (!verifyMagicToken(rawToken)) return null

  const db = getDb()
  const hash = hashMagicToken(rawToken)

  const [record] = await db
    .select({
      memberId: memberTokens.memberId,
      expiresAt: memberTokens.expiresAt,
      usedAt: memberTokens.usedAt,
    })
    .from(memberTokens)
    .where(and(eq(memberTokens.tokenHash, hash), gt(memberTokens.expiresAt, new Date())))
    .limit(1)

  if (!record) return null

  const [member] = await db
    .select({
      id: members.id,
      name: members.name,
      description: members.description,
      websiteUrl: members.websiteUrl,
      linkedinUrl: members.linkedinUrl,
      address: members.address,
      yearFounded: members.yearFounded,
      employeeCount: members.employeeCount,
      logoUrl: members.logoUrl,
    })
    .from(members)
    .where(eq(members.id, record.memberId))
    .limit(1)

  if (!member) return null

  const activities = await db
    .select({ domainId: memberActivities.domainId })
    .from(memberActivities)
    .where(eq(memberActivities.memberId, record.memberId))

  const certs = await db
    .select({
      certificationId: memberCertifications.certificationId,
      otherLabel: memberCertifications.otherLabel,
    })
    .from(memberCertifications)
    .where(eq(memberCertifications.memberId, record.memberId))

  return {
    name: member.name,
    memberId: member.id,
    description: member.description ?? '',
    websiteUrl: member.websiteUrl ?? '',
    linkedinUrl: member.linkedinUrl ?? '',
    address: member.address ?? '',
    yearFounded: member.yearFounded ?? undefined,
    employeeCount: member.employeeCount ?? undefined,
    logoUrl: member.logoUrl ?? '',
    activityDomains: activities.map((a) => a.domainId),
    certifications: certs.map((c) => c.certificationId),
    certificationOtherLabel: certs.find((c) => c.certificationId === 'autre')?.otherLabel ?? '',
  }
}
