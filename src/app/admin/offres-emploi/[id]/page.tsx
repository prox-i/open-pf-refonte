import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { jobOffers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { JobForm } from '@/components/admin/job-form'

export const metadata: Metadata = { title: "Éditer l'offre — Admin OPEN PF" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditJobPage({ params }: Props) {
  const { id } = await params
  const db = getDb()
  const [job] = await db.select().from(jobOffers).where(eq(jobOffers.id, id)).limit(1)
  if (!job) notFound()

  return (
    <>
      <div className="admin-top">
        <div>
          <nav style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
            <Link href="/admin/offres-emploi">Offres</Link> › {job.title}
          </nav>
          <h1>{job.title}</h1>
        </div>
      </div>
      <JobForm
        id={id}
        initialData={{
          title: job.title,
          description: job.description ?? '',
          location: job.location ?? '',
          contractType: job.contractType ?? '',
          salary: job.salary ?? '',
          applicationUrl: job.applicationUrl ?? '',
          applicationEmail: job.applicationEmail ?? '',
          metaDescription: job.metaDescription ?? '',
          status: job.status,
        }}
      />
    </>
  )
}
