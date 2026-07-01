import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { members, memberContacts, memberActivities, memberCertifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { MemberActions } from '@/components/admin/member-actions'

export const metadata: Metadata = { title: 'Fiche adhérent — Admin OPEN PF' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdherentDetailPage({ params }: Props) {
  const { id } = await params
  const db = getDb()

  const [member] = await db.select().from(members).where(eq(members.id, id)).limit(1)
  if (!member) notFound()

  const [contacts, activities, certs] = await Promise.all([
    db.select().from(memberContacts).where(eq(memberContacts.memberId, id)),
    db
      .select({ domainId: memberActivities.domainId })
      .from(memberActivities)
      .where(eq(memberActivities.memberId, id)),
    db.select().from(memberCertifications).where(eq(memberCertifications.memberId, id)),
  ])

  return (
    <>
      <div className="admin-top">
        <div>
          <nav style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
            <Link href="/admin/adherents">Adhérents</Link> › {member.name}
          </nav>
          <h1>{member.name}</h1>
          <span
            className={`status-badge status-badge--${member.status}`}
            style={{ marginTop: '8px', display: 'inline-block' }}
          >
            {member.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={`/admin/adherents/${id}/edit`} className="btn">
            Éditer la fiche
          </Link>
          <MemberActions memberId={id} status={member.status} />
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Informations</h2>
          <dl className="detail-list">
            <div>
              <dt>N° TAHITI</dt>
              <dd>{member.tahitiNumber ?? '—'}</dd>
            </div>
            <div>
              <dt>Site web</dt>
              <dd>
                {member.websiteUrl ? (
                  <a href={member.websiteUrl} target="_blank" rel="noopener noreferrer">
                    {member.websiteUrl}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>LinkedIn</dt>
              <dd>
                {member.linkedinUrl ? (
                  <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    Voir
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Adresse</dt>
              <dd>{member.address ?? '—'}</dd>
            </div>
            <div>
              <dt>Année création</dt>
              <dd>{member.yearFounded ?? '—'}</dd>
            </div>
            <div>
              <dt>Salariés</dt>
              <dd>{member.employeeCount ?? '—'}</dd>
            </div>
            <div>
              <dt>Membre MEDEF</dt>
              <dd>{member.isMedefMember ? 'Oui' : 'Non'}</dd>
            </div>
          </dl>
          {member.description && (
            <p
              style={{
                marginTop: '16px',
                fontSize: '14px',
                color: 'var(--muted)',
                lineHeight: 1.7,
              }}
            >
              {member.description}
            </p>
          )}
        </section>

        <div style={{ display: 'grid', gap: '20px' }}>
          <section className="card">
            <h2>Contacts ({contacts.length})</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
              {contacts.map((c) => (
                <li key={c.id} style={{ fontSize: '14px' }}>
                  <strong>{c.name}</strong>
                  {c.isPrimary && (
                    <span className="badge" style={{ marginLeft: '6px' }}>
                      Principal
                    </span>
                  )}
                  <br />
                  <a href={`mailto:${c.email}`} style={{ color: 'var(--blue)' }}>
                    {c.email}
                  </a>
                  {c.role && (
                    <span style={{ color: 'var(--muted)', display: 'block' }}>{c.role}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Domaines</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {activities.map((a) => (
                <span key={a.domainId} className="filter-chip filter-chip--active">
                  {a.domainId}
                </span>
              ))}
              {activities.length === 0 && (
                <span style={{ color: 'var(--muted)', fontSize: '14px' }}>—</span>
              )}
            </div>
          </section>

          {certs.length > 0 && (
            <section className="card">
              <h2>Certifications</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {certs.map((c) => (
                  <span key={c.certificationId} className="filter-chip filter-chip--active">
                    {c.otherLabel ?? c.certificationId}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
