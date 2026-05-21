import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMemberByToken } from '@/lib/actions/member-profile'
import { ProfileForm } from '@/components/fiche/profile-form'

export const metadata: Metadata = {
  title: 'Compléter ma fiche — OPEN PF',
  description: "Complétez la fiche de votre entreprise dans l'annuaire OPEN PF.",
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ token: string }>
}

export default async function FichePage({ params }: Props) {
  const { token } = await params
  const memberData = await getMemberByToken(token).catch(() => null)

  if (!memberData) notFound()

  return (
    <section className="section" style={{ background: 'var(--soft)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <div className="fiche-intro">
          <span className="eyebrow">Espace adhérent</span>
          <h1 style={{ marginTop: '12px' }}>Complétez votre fiche</h1>
          <p style={{ marginTop: '16px', color: 'var(--muted)', lineHeight: 1.7 }}>
            Ces informations seront visibles dans l&apos;annuaire des adhérents après validation par
            le bureau d&apos;OPEN. Vous pouvez sauvegarder un brouillon à tout moment et revenir
            plus tard via ce même lien.
          </p>
        </div>
        <ProfileForm token={token} initialData={memberData} />
      </div>
    </section>
  )
}
