import { count, desc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { news, newsCategories } from '@/lib/db/schema'

export async function getRecentNews(limit = 3) {
  const db = getDb()
  return db
    .select({
      id: news.id,
      slug: news.slug,
      title: news.title,
      excerpt: news.excerpt,
      publishedAt: news.publishedAt,
      imageUrl: news.imageUrl,
      categoryLabel: newsCategories.label,
      categorySlug: newsCategories.slug,
    })
    .from(news)
    .leftJoin(newsCategories, eq(news.categoryId, newsCategories.id))
    .where(eq(news.status, 'published'))
    .orderBy(desc(news.publishedAt))
    .limit(limit)
}

export async function getNewsPaginated(page: number, pageSize: number) {
  const db = getDb()
  const offset = (page - 1) * pageSize

  const [articles, [totRow]] = await Promise.all([
    db
      .select({
        id: news.id,
        slug: news.slug,
        title: news.title,
        excerpt: news.excerpt,
        publishedAt: news.publishedAt,
        imageUrl: news.imageUrl,
        categoryLabel: newsCategories.label,
      })
      .from(news)
      .leftJoin(newsCategories, eq(news.categoryId, newsCategories.id))
      .where(eq(news.status, 'published'))
      .orderBy(desc(news.publishedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(news).where(eq(news.status, 'published')),
  ])

  return { articles, total: totRow?.total ?? 0 }
}

export async function getNewsBySlug(slug: string) {
  const db = getDb()
  const rows = await db
    .select({
      id: news.id,
      slug: news.slug,
      title: news.title,
      excerpt: news.excerpt,
      content: news.content,
      publishedAt: news.publishedAt,
      imageUrl: news.imageUrl,
      authorName: news.authorName,
      metaDescription: news.metaDescription,
      categoryLabel: newsCategories.label,
      categorySlug: newsCategories.slug,
    })
    .from(news)
    .leftJoin(newsCategories, eq(news.categoryId, newsCategories.id))
    .where(eq(news.slug, slug))
    .limit(1)

  return rows[0] ?? null
}
