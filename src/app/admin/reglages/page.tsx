import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/settings'
import { SiteSettingsForm } from '@/components/admin/site-settings-form'

export const metadata: Metadata = { title: 'Réglages — Admin OPEN PF' }

export default async function ReglagesPage() {
  const settings = await getSiteSettings()

  return (
    <>
      <div className="admin-top">
        <h1>Réglages</h1>
      </div>

      <SiteSettingsForm
        initial={{
          contactRecipientEmail: settings.contactRecipientEmail,
          publicEmail: settings.publicEmail,
          publicAddress: settings.publicAddress,
          publicHours: settings.publicHours,
          facebookUrl: settings.facebookUrl,
          linkedinUrl: settings.linkedinUrl,
          legalNoticeContent: settings.legalNoticeContent,
        }}
      />
    </>
  )
}
