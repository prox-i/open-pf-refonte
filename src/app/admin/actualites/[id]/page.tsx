import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { news } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NewsForm } from '@/components/admin/news-form'

export const metadata: Metadata = { title: "Éditer l'actualité — Admin OPEN PF" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditActualitePage({ params }: Props) {
  const { id } = await params
  const db = getDb()
  const [article] = await db.select().from(news).where(eq(news.id, id)).limit(1)
  if (!article) notFound()

  return (
    <>
      <div className="admin-top">
        <div>
          <nav style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
            <Link href="/admin/actualites">Actualités</Link> › {article.title}
          </nav>
          <h1>{article.title}</h1>
        </div>
      </div>
      <NewsForm
        id={id}
        initialData={{
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt ?? '',
          content: article.content ?? '',
          authorName: article.authorName ?? '',
          imageUrl: article.imageUrl ?? '',
          metaDescription: article.metaDescription ?? '',
          status: article.status,
        }}
      />
    </>
  )
}
