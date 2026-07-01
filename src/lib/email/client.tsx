import { render } from '@react-email/components'
import { MagicLinkEmail } from './templates/magic-link'
import { ReminderEmail } from './templates/reminder'
import { ContactEmail } from './templates/contact'
import { env } from '@/lib/env'

async function sendViaMandrill(message: {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  replyToName?: string
}): Promise<void> {
  const all = Array.isArray(message.to) ? message.to : [message.to]

  const restrictDomain = env.EMAIL_RESTRICT_DOMAIN
  const recipients = restrictDomain
    ? all.filter((email) => {
        const allowed = email.endsWith(`@${restrictDomain}`)
        if (!allowed) console.warn(`[email] bloqué (domaine non autorisé) : ${email}`)
        return allowed
      })
    : all

  if (recipients.length === 0) {
    console.warn('[email] aucun destinataire autorisé — envoi annulé')
    return
  }
  const res = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: env.MANDRILL_API_KEY,
      message: {
        from_email: env.MANDRILL_SENDER_EMAIL,
        from_name: env.MANDRILL_SENDER_NAME,
        to: recipients.map((email) => ({ email, type: 'to' })),
        ...(message.replyTo && {
          headers: {
            'Reply-To': message.replyToName
              ? `${message.replyToName} <${message.replyTo}>`
              : message.replyTo,
          },
        }),
        subject: message.subject,
        html: message.html,
        text: message.text,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mandrill error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as Array<{ status: string; reject_reason?: string }>
  const result = data[0]
  if (result && result.status === 'rejected') {
    throw new Error(`Mandrill rejected email: ${result.reject_reason ?? 'unknown'}`)
  }
}

interface SendMagicLinkParams {
  to: string
  memberName: string
  magicUrl: string
}

export async function sendMagicLinkEmail({
  to,
  memberName,
  magicUrl,
}: SendMagicLinkParams): Promise<void> {
  const html = await render(<MagicLinkEmail memberName={memberName} magicUrl={magicUrl} />)
  const text = `Bonjour,\n\nComplétez la fiche adhérent de ${memberName} sur OPEN PF :\n${magicUrl}\n\nCe lien est valable 30 jours.`

  await sendViaMandrill({
    to,
    subject: `Complétez la fiche adhérent de ${memberName} — OPEN PF`,
    html,
    text,
    replyTo: 'contact@open.pf',
  })
}

interface SendContactParams {
  to: string | string[]
  name: string
  email: string
  subject: string
  message: string
}

export async function sendContactEmail({
  to,
  name,
  email,
  subject,
  message,
}: SendContactParams): Promise<void> {
  const html = await render(
    <ContactEmail name={name} email={email} subject={subject} message={message} />,
  )
  const text = `Nouveau message via le formulaire de contact OPEN PF\n\nSujet : ${subject}\nDe : ${name} <${email}>\n\n${message}`

  await sendViaMandrill({
    to,
    subject: `[Contact OPEN PF] ${subject} — ${name}`,
    html,
    text,
    replyTo: email,
    replyToName: name,
  })
}

interface SendReminderParams {
  to: string | string[]
  memberName: string
  submittedAt: Date
  adminUrl: string
}

export async function sendReminderEmail({
  to,
  memberName,
  submittedAt,
  adminUrl,
}: SendReminderParams): Promise<void> {
  const html = await render(
    <ReminderEmail memberName={memberName} submittedAt={submittedAt} adminUrl={adminUrl} />,
  )
  const submittedFormatted = submittedAt.toLocaleDateString('fr-FR')
  const text = `Demande d'adhésion en attente : ${memberName} (déposée le ${submittedFormatted}).\n\nTraiter : ${adminUrl}`

  await sendViaMandrill({
    to,
    subject: `[OPEN PF] Demande en attente — ${memberName}`,
    html,
    text,
  })
}
