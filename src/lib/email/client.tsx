import { render } from '@react-email/components'
import { MagicLinkEmail } from './templates/magic-link'
import { env } from '@/lib/env'

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

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      replyTo: { email: 'contact@open.pf' },
      subject: `Complétez la fiche adhérent de ${memberName} — OPEN PF`,
      htmlContent: html,
      textContent: text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Brevo error ${res.status}: ${body}`)
  }
}
