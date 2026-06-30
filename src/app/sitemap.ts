import type { MetadataRoute } from 'next'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
import { getDb } from '@/lib/db'
import { members, news, jobOffers } from '@/lib/db/schema'

const BASE_URL = 'https://open.pf'

async function getDynamicUrls() {
  try {
    const db = getDb()
    const [activeMembers, publishedNews, publishedJobs] = await Promise.all([
      db.select({ slug: members.slug }).from(members).where(eq(members.status, 'active')),
      db
        .select({ slug: news.slug, updatedAt: news.updatedAt })
        .from(news)
        .where(eq(news.status, 'published')),
      db
        .select({ slug: jobOffers.slug, updatedAt: jobOffers.updatedAt })
        .from(jobOffers)
        .where(eq(jobOffers.status, 'published')),
    ])
    return { activeMembers, publishedNews, publishedJobs }
  } catch {
    return { activeMembers: [], publishedNews: [], publishedJobs: [] }
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { activeMembers, publishedNews, publishedJobs } = await getDynamicUrls()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/adherents`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/actualites`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/offres-emploi`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/reseau`, changeFrequency: 'monthly', priority: 0.6 },
    // /documents-utiles retiré du sitemap tant que la page est vide (REC-023).
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/mentions-legales`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/confidentialite`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const memberPages: MetadataRoute.Sitemap = activeMembers.map((m) => ({
    url: `${BASE_URL}/adherents/${m.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const newsPages: MetadataRoute.Sitemap = publishedNews.map((n) => ({
    url: `${BASE_URL}/actualites/${n.slug}`,
    lastModified: n.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const jobPages: MetadataRoute.Sitemap = publishedJobs.map((j) => ({
    url: `${BASE_URL}/offres-emploi/${j.slug}`,
    lastModified: j.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...memberPages, ...newsPages, ...jobPages]
}
