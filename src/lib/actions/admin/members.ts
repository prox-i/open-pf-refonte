'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { members, memberTokens, auditLog } from '@/lib/db/schema'
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
