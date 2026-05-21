'use server'

import { getDb } from '@/lib/db'
import { members, memberContacts, memberActivities } from '@/lib/db/schema'
import { adhesionSchema } from '@/lib/validations/adhesion'
import { toSlug } from '@/lib/utils'

type SubmitResult =
  | { success: true; slug: string }
  | { success: false; errors: Record<string, string[]> }

export async function submitAdhesion(raw: unknown): Promise<SubmitResult> {
  const parsed = adhesionSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const [key, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[key] = issues ?? []
    }
    return { success: false, errors }
  }

  const data = parsed.data
  const slug = toSlug(data.name)

  const db = getDb()

  // neon-http driver does not support transactions — sequential inserts
  const [member] = await db
    .insert(members)
    .values({
      slug,
      name: data.name,
      legalStatusId: null,
      tahitiNumber: data.tahitiNumber ?? null,
      websiteUrl: data.websiteUrl ?? null,
      description: data.description ?? null,
      yearFounded: data.yearFounded ?? null,
      employeeCount: data.employeeCount ?? null,
      isMedefMember: data.isMedefMember,
      status: 'submitted',
      submittedAt: new Date(),
    })
    .returning({ id: members.id })

  if (!member) throw new Error('Member insert failed')

  if (data.contacts.length > 0) {
    await db.insert(memberContacts).values(
      data.contacts.map((c) => ({
        memberId: member.id,
        name: c.name,
        role: c.role ?? null,
        email: c.email,
        phone: c.phone ?? null,
        isPrimary: c.isPrimary,
      })),
    )
  }

  if (data.activityDomains.length > 0) {
    await db.insert(memberActivities).values(
      data.activityDomains.map((domainId) => ({
        memberId: member.id,
        domainId,
      })),
    )
  }

  return { success: true, slug }
}
