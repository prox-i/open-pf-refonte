'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import {
  members,
  memberTokens,
  memberActivities,
  memberCertifications,
  auditLog,
} from '@/lib/db/schema'
import { adminMemberEditSchema } from '@/lib/validations/admin'
import { auth } from '@/lib/auth/session'
import { generateMagicToken } from '@/lib/auth/magic-link'
import { sendMagicLinkEmail } from '@/lib/email/client'
import { env } from '@/lib/env'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorisé')
  return session.user.id
}

export async function approveMember(memberId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await requireAdmin()
    const db = getDb()

    await db
      .update(members)
      .set({ status: 'active', reviewedAt: new Date(), reviewedBy: adminId })
      .where(eq(members.id, memberId))

    await db.insert(auditLog).values({
      adminId,
      action: 'member.approve',
      targetType: 'member',
      targetId: memberId,
    })

    revalidatePath('/admin/demandes')
    revalidatePath('/admin/adherents')
    return { success: true }
  } catch (e) {
    console.error('[approveMember]', e)
    return { success: false, error: 'Erreur lors de la validation.' }
  }
}

export async function rejectMember(
  memberId: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await requireAdmin()
    const db = getDb()

    await db
      .update(members)
      .set({ status: 'draft', reviewedAt: new Date(), reviewedBy: adminId })
      .where(eq(members.id, memberId))

    await db.insert(auditLog).values({
      adminId,
      action: 'member.reject',
      targetType: 'member',
      targetId: memberId,
      data: reason ? { reason } : null,
    })

    revalidatePath('/admin/demandes')
    return { success: true }
  } catch (e) {
    console.error('[rejectMember]', e)
    return { success: false, error: 'Erreur lors du refus.' }
  }
}

export async function deactivateMember(memberId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await requireAdmin()
    const db = getDb()

    await db.update(members).set({ status: 'inactive' }).where(eq(members.id, memberId))

    await db.insert(auditLog).values({
      adminId,
      action: 'member.deactivate',
      targetType: 'member',
      targetId: memberId,
    })

    revalidatePath('/admin/adherents')
    return { success: true }
  } catch (e) {
    console.error('[deactivateMember]', e)
    return { success: false, error: 'Erreur lors de la désactivation.' }
  }
}

/**
 * Édition complète d'une fiche adhérent par l'admin (BO). Met à jour les champs
 * de la fiche + domaines + certifications. neon-http ne gère pas les
 * transactions → opérations séquentielles.
 */
export async function updateMemberByAdmin(
  memberId: string,
  raw: unknown,
): Promise<{ success: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    const adminId = await requireAdmin()
    const parsed = adminMemberEditSchema.safeParse(raw)
    if (!parsed.success) {
      const errors: Record<string, string[]> = {}
      for (const [key, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
        errors[key] = issues ?? []
      }
      return { success: false, error: 'Données invalides', errors }
    }

    const data = parsed.data
    const db = getDb()

    const [updated] = await db
      .update(members)
      .set({
        name: data.name,
        description: data.description || null,
        websiteUrl: data.websiteUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        address: data.address || null,
        yearFounded: data.yearFounded ?? null,
        employeeCount: data.employeeCount ?? null,
        logoUrl: data.logoUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId))
      .returning({ slug: members.slug })

    if (!updated) return { success: false, error: 'Adhérent introuvable' }

    await db.delete(memberActivities).where(eq(memberActivities.memberId, memberId))
    if (data.activityDomains.length > 0) {
      await db
        .insert(memberActivities)
        .values(data.activityDomains.map((domainId) => ({ memberId, domainId })))
    }

    await db.delete(memberCertifications).where(eq(memberCertifications.memberId, memberId))
    if (data.certifications.length > 0) {
      await db.insert(memberCertifications).values(
        data.certifications.map((certId) => ({
          memberId,
          certificationId: certId,
          otherLabel: certId === 'autre' ? (data.certificationOtherLabel ?? null) : null,
        })),
      )
    }

    await db.insert(auditLog).values({
      adminId,
      action: 'member.update',
      targetType: 'member',
      targetId: memberId,
    })

    revalidatePath('/admin/adherents')
    revalidatePath(`/admin/adherents/${memberId}`)
    revalidatePath('/adherents')
    revalidatePath(`/adherents/${updated.slug}`)
    return { success: true }
  } catch (e) {
    console.error('[updateMemberByAdmin]', e)
    return { success: false, error: "Erreur lors de l'enregistrement." }
  }
}

export async function reactivateMember(
  memberId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await requireAdmin()
    const db = getDb()

    // Réactive un adhérent précédemment désactivé (inactive → active). BO-013.
    await db.update(members).set({ status: 'active' }).where(eq(members.id, memberId))

    await db.insert(auditLog).values({
      adminId,
      action: 'member.reactivate',
      targetType: 'member',
      targetId: memberId,
    })

    revalidatePath('/admin/adherents')
    return { success: true }
  } catch (e) {
    console.error('[reactivateMember]', e)
    return { success: false, error: 'Erreur lors de la réactivation.' }
  }
}

export async function sendMagicLink(
  memberId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    const db = getDb()

    const [member] = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1)

    if (!member) return { success: false, error: 'Membre introuvable' }

    const { memberContacts } = await import('@/lib/db/schema')
    const contacts = await db
      .select({ email: memberContacts.email, isPrimary: memberContacts.isPrimary })
      .from(memberContacts)
      .where(eq(memberContacts.memberId, memberId))

    const contact = contacts.find((c) => c.isPrimary) ?? contacts[0]
    if (!contact?.email) return { success: false, error: 'Aucun contact trouvé pour cet adhérent' }

    const { raw, hash, expiresAt } = generateMagicToken()

    await db.insert(memberTokens).values({
      memberId,
      tokenHash: hash,
      expiresAt,
    })

    const magicUrl = `${env.AUTH_URL}/fiche/${raw}`

    await sendMagicLinkEmail({
      to: contact.email,
      memberName: member.name,
      magicUrl,
    })

    return { success: true }
  } catch (e) {
    console.error('[sendMagicLink]', e)
    return { success: false, error: "Erreur lors de l'envoi du lien." }
  }
}
