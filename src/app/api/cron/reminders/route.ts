import { type NextRequest, NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { members, reminderLogs } from '@/lib/db/schema'
import { sendReminderEmail } from '@/lib/email/client'
import { getSiteSettings } from '@/lib/settings'
import { env } from '@/lib/env'

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
  const { contactRecipientEmail: adminEmail } = await getSiteSettings()

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
        emailTo: adminEmail,
      })

      sent++
    } catch (err) {
      console.error(`Reminder failed for member ${member.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, processedAt: now.toISOString() })
}
