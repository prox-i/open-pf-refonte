import { type NextRequest, NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { members, memberContacts, memberTokens, reminderLogs } from '@/lib/db/schema'
import { sendReminderEmail, sendProfileIncompleteReminderEmail } from '@/lib/email/client'
import { getSiteSettings } from '@/lib/settings'
import { env } from '@/lib/env'
import { generateMagicToken } from '@/lib/auth/magic-link'

const FIRST_REMINDER_DAYS = 3
const REPEAT_REMINDER_DAYS = 7

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const db = getDb()
  const now = new Date()
  // TODO: remettre contactRecipientEmail quand l'adresse OPEN PF sera prête
  // const { contactRecipientEmail: adminEmail } = await getSiteSettings()
  void getSiteSettings()
  const adminEmail = ['damien@prox-i.pf', 'thibault@prox-i.pf']

  const submittedMembers = await db
    .select({ id: members.id, name: members.name, submittedAt: members.submittedAt })
    .from(members)
    .where(eq(members.status, 'submitted'))

  let sent = 0
  let skipped = 0

  for (const member of submittedMembers) {
    if (!member.submittedAt) {
      skipped++
      continue
    }

    const [latestLog] = await db
      .select({ sentAt: reminderLogs.sentAt })
      .from(reminderLogs)
      .where(and(eq(reminderLogs.memberId, member.id), eq(reminderLogs.type, 'validation_pending')))
      .orderBy(desc(reminderLogs.sentAt))
      .limit(1)

    const shouldSend = latestLog
      ? daysBetween(latestLog.sentAt, now) >= REPEAT_REMINDER_DAYS
      : daysBetween(member.submittedAt, now) >= FIRST_REMINDER_DAYS

    if (!shouldSend) {
      skipped++
      continue
    }

    const adminUrl = `${env.AUTH_URL}/admin/demandes/${member.id}`

    try {
      await sendReminderEmail({
        to: adminEmail,
        memberName: member.name,
        submittedAt: member.submittedAt,
        adminUrl,
      })

      await db.insert(reminderLogs).values({
        memberId: member.id,
        type: 'validation_pending',
        emailTo: Array.isArray(adminEmail) ? adminEmail.join(', ') : adminEmail,
      })

      sent++
    } catch (err) {
      console.error(`Reminder failed for member ${member.id}:`, err)
      skipped++
    }
  }

  // ─── Relance adhérent : fiche non complétée après envoi du lien fiche ──────
  // Un adhérent "n'a pas complété sa fiche" tant que son jeton le plus récent
  // n'a jamais été utilisé (submitMemberProfile met usedAt à jour à la fin).
  const allTokens = await db
    .select({
      memberId: memberTokens.memberId,
      createdAt: memberTokens.createdAt,
      usedAt: memberTokens.usedAt,
    })
    .from(memberTokens)
    .orderBy(desc(memberTokens.createdAt))

  const latestTokenByMember = new Map<string, { createdAt: Date; usedAt: Date | null }>()
  for (const t of allTokens) {
    if (!latestTokenByMember.has(t.memberId)) {
      latestTokenByMember.set(t.memberId, { createdAt: t.createdAt, usedAt: t.usedAt })
    }
  }

  let profileReminderSent = 0
  let profileReminderSkipped = 0

  for (const [memberId, token] of latestTokenByMember) {
    if (token.usedAt) continue // fiche déjà complétée

    const [latestLog] = await db
      .select({ sentAt: reminderLogs.sentAt })
      .from(reminderLogs)
      .where(and(eq(reminderLogs.memberId, memberId), eq(reminderLogs.type, 'profile_incomplete')))
      .orderBy(desc(reminderLogs.sentAt))
      .limit(1)

    const shouldSend = latestLog
      ? daysBetween(latestLog.sentAt, now) >= REPEAT_REMINDER_DAYS
      : daysBetween(token.createdAt, now) >= FIRST_REMINDER_DAYS

    if (!shouldSend) {
      profileReminderSkipped++
      continue
    }

    const [member] = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1)
    if (!member) {
      profileReminderSkipped++
      continue
    }

    const contacts = await db
      .select({ email: memberContacts.email, isPrimary: memberContacts.isPrimary })
      .from(memberContacts)
      .where(eq(memberContacts.memberId, memberId))
    const contact = contacts.find((c) => c.isPrimary) ?? contacts[0]
    if (!contact?.email) {
      profileReminderSkipped++
      continue
    }

    try {
      // Nouveau jeton : l'ancien n'est récupérable qu'en clair au moment de sa
      // génération (seul le hash est stocké), on ne peut donc pas réutiliser le lien envoyé.
      const { raw, hash, expiresAt } = generateMagicToken()
      await db.insert(memberTokens).values({ memberId, tokenHash: hash, expiresAt })
      const magicUrl = `${env.AUTH_URL}/fiche/${raw}`

      await sendProfileIncompleteReminderEmail({
        to: contact.email,
        memberName: member.name,
        magicUrl,
      })

      await db.insert(reminderLogs).values({
        memberId,
        type: 'profile_incomplete',
        emailTo: contact.email,
      })

      profileReminderSent++
    } catch (err) {
      console.error(`Profile-incomplete reminder failed for member ${memberId}:`, err)
      profileReminderSkipped++
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    profileReminderSent,
    profileReminderSkipped,
    processedAt: now.toISOString(),
  })
}
