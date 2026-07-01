import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { members, memberActivities, memberCertifications } from '@/lib/db/schema'
import { MemberEditForm } from '@/components/admin/member-edit-form'
import type { AdminMemberEditData } from '@/lib/validations/admin'

export const metadata: Metadata = { title: 'Éditer un adhérent — Admin OPEN PF' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditAdherentPage({ params }: Props) {
  const { id } = await params
  const db = getDb()

  const [member] = await db.select().from(members).where(eq(members.id, id)).limit(1)
  if (!member) notFound()

  const [domains, certs] = await Promise.all([
    db
      .select({ domainId: memberActivities.domainId })
      .from(memberActivities)
      .where(eq(memberActivities.memberId, id)),
    db
      .select({
        certificationId: memberCertifications.certificationId,
        otherLabel: memberCertifications.otherLabel,
      })
      .from(memberCertifications)
      .where(eq(memberCertifications.memberId, id)),
  ])

  const initialData: AdminMemberEditData = {
    name: member.name,
    description: member.description ?? '',
    websiteUrl: member.websiteUrl ?? '',
    linkedinUrl: member.linkedinUrl ?? '',
    address: member.address ?? '',
    ...(member.yearFounded != null ? { yearFounded: member.yearFounded } : {}),
    ...(member.employeeCount != null ? { employeeCount: member.employeeCount } : {}),
    logoUrl: member.logoUrl ?? '',
    activityDomains: domains.map((d) => d.domainId),
    certifications: certs.map((c) => c.certificationId),
    certificationOtherLabel: certs.find((c) => c.certificationId === 'autre')?.otherLabel ?? '',
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <nav style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
            <Link href="/admin/adherents">Adhérents</Link> ›{' '}
            <Link href={`/admin/adherents/${id}`}>{member.name}</Link> › Éditer
          </nav>
          <h1>Éditer « {member.name} »</h1>
        </div>
      </div>
      <MemberEditForm memberId={id} initialData={initialData} />
    </>
  )
}
