import type { Metadata } from 'next'
import { getDb } from '@/lib/db'
import { siteStats, teamMembers, timelineEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SiteStatsForm } from '@/components/admin/site-stats-form'
import { TeamMembersEditor } from '@/components/admin/team-members-editor'
import { TimelineEditor } from '@/components/admin/timeline-editor'

export const metadata: Metadata = { title: 'Contenu du site — Admin OPEN PF' }

export default async function ContenuPage() {
  const db = getDb()
  const [stats] = await db.select().from(siteStats).where(eq(siteStats.id, 1)).limit(1)
  const bureau = await db.select().from(teamMembers).orderBy(teamMembers.sortOrder)
  const timeline = await db.select().from(timelineEvents).orderBy(timelineEvents.year)

  return (
    <>
      <div className="admin-top">
        <h1>Contenu du site</h1>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        <section className="card">
          <h2>Chiffres clés du site</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
            Ces chiffres apparaissent sur la page d&apos;accueil et sont saisis manuellement par le
            bureau.
          </p>
          <SiteStatsForm currentCount={stats?.employeeCount ?? null} />
        </section>

        <TeamMembersEditor
          members={bureau.map((m) => ({
            id: m.id,
            fullName: m.fullName,
            role: m.role,
            professionalRole: m.professionalRole,
            photoUrl: m.photoUrl,
            sortOrder: m.sortOrder,
            isActive: m.isActive,
          }))}
        />

        <TimelineEditor
          events={timeline.map((t) => ({
            id: t.id,
            year: t.year,
            description: t.description,
            sortOrder: t.sortOrder,
          }))}
        />
      </div>
    </>
  )
}
