import { QuickBar } from '@/components/layout/quickbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { getSiteSettings } from '@/lib/settings'

export default async function PublicLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  const { facebookUrl, linkedinUrl, publicAddress } = await getSiteSettings()

  return (
    <>
      <SiteHeader />
      <main id="contenu" role="main">{children}</main>
      {modal}
      <SiteFooter
        facebookUrl={facebookUrl}
        linkedinUrl={linkedinUrl}
        publicAddress={publicAddress}
      />
      {/* QuickBar rendered AFTER main+footer so DOM order matches reading order */}
      <QuickBar />
    </>
  )
}
