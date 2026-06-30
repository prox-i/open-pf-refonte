'use server'

import { contactSchema } from '@/lib/validations/contact'
import { sendContactEmail } from '@/lib/email/client'
import { getSiteSettings } from '@/lib/settings'

type ContactResult =
  | { success: true }
  | { success: false; errors?: Record<string, string[]>; message?: string }

export async function submitContact(raw: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const [key, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[key] = issues ?? []
    }
    return { success: false, errors }
  }

  const { name, email, subject, message, company } = parsed.data

  // Honeypot: a filled hidden field means a bot. Silently succeed (don't tip off the bot).
  if (company) return { success: true }

  // TODO: remettre contactRecipientEmail quand l'adresse OPEN PF sera prête
  // const { contactRecipientEmail } = await getSiteSettings()
  void getSiteSettings() // garde la dépendance pour éviter le lint

  try {
    await sendContactEmail({
      to: ['damien@prox-i.pf', 'thibault@prox-i.pf'],
      name,
      email,
      subject,
      message,
    })
    return { success: true }
  } catch (err) {
    console.error('Contact form send failed:', err)
    return {
      success: false,
      message:
        "L'envoi a échoué. Réessayez ou écrivez-nous directement à contact@open.pf.",
    }
  }
}
