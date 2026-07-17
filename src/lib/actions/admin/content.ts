'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { news, jobOffers, teamMembers, timelineEvents } from '@/lib/db/schema'
import { auth } from '@/lib/auth/session'
import { toSlug, stripHtml } from '@/lib/utils'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorisé')
  return session.user.id
}

// ─── News ──────────────────────────────────────────────────────────────────

const newsSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  // BO-007 : slug personnalisable (laissé vide → généré depuis le titre).
  slug: z.string().optional().or(z.literal('')),
  excerpt: z.string().optional().or(z.literal('')),
  content: z.string().optional().or(z.literal('')),
  categoryId: z.string().uuid().optional().or(z.literal('')),
  authorName: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  metaDescription: z.string().max(160).optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
})

export async function upsertNews(
  raw: unknown,
  id?: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  await requireAdmin()
  const parsed = newsSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: 'Données invalides' }

  const data = parsed.data
  const db = getDb()

  // BO-008 : nettoyer les balises HTML héritées de WordPress.
  const cleanContent = data.content ? stripHtml(data.content) : null
  const cleanExcerpt = data.excerpt ? stripHtml(data.excerpt) : null
  // BO-007 : slug choisi (slugifié) sinon dérivé du titre.
  const resolvedSlug = data.slug ? toSlug(data.slug) : toSlug(data.title)

  if (id) {
    await db
      .update(news)
      .set({
        title: data.title,
        slug: resolvedSlug,
        excerpt: cleanExcerpt,
        content: cleanContent,
        categoryId: data.categoryId || null,
        authorName: data.authorName ?? null,
        imageUrl: data.imageUrl ?? null,
        metaDescription: data.metaDescription ?? null,
        status: data.status,
        publishedAt: data.status === 'published' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(news.id, id))
    revalidatePath('/admin/actualites')
    revalidatePath('/actualites')
    return { success: true, id }
  }

  const [inserted] = await db
    .insert(news)
    .values({
      slug: resolvedSlug,
      title: data.title,
      excerpt: cleanExcerpt,
      content: cleanContent,
      categoryId: data.categoryId || null,
      authorName: data.authorName ?? null,
      imageUrl: data.imageUrl ?? null,
      metaDescription: data.metaDescription ?? null,
      status: data.status,
      publishedAt: data.status === 'published' ? new Date() : null,
    })
    .returning({ id: news.id })

  revalidatePath('/admin/actualites')
  revalidatePath('/actualites')
  return { success: true, ...(inserted?.id ? { id: inserted.id } : {}) }
}

export async function deleteNews(id: string): Promise<{ success: boolean }> {
  await requireAdmin()
  const db = getDb()
  await db.delete(news).where(eq(news.id, id))
  revalidatePath('/admin/actualites')
  revalidatePath('/actualites')
  return { success: true }
}

// ─── Job offers ────────────────────────────────────────────────────────────

const jobSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  contractType: z.string().optional().or(z.literal('')),
  salary: z.string().optional().or(z.literal('')),
  applicationUrl: z.string().url().optional().or(z.literal('')),
  applicationEmail: z.string().email().optional().or(z.literal('')),
  // BO-009 : méta description SEO pour les offres (existait en DB, absente du form).
  metaDescription: z.string().max(160).optional().or(z.literal('')),
  memberId: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'closed']),
})

export async function upsertJob(
  raw: unknown,
  id?: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  await requireAdmin()
  const parsed = jobSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: 'Données invalides' }

  const data = parsed.data
  const db = getDb()

  const values = {
    title: data.title,
    description: data.description ? stripHtml(data.description) : null,
    location: data.location ?? null,
    contractType: data.contractType ?? null,
    salary: data.salary ?? null,
    applicationUrl: data.applicationUrl ?? null,
    applicationEmail: data.applicationEmail ?? null,
    metaDescription: data.metaDescription ?? null,
    memberId: data.memberId || null,
    status: data.status,
    publishedAt: data.status === 'published' ? new Date() : null,
    updatedAt: new Date(),
  }

  if (id) {
    await db.update(jobOffers).set(values).where(eq(jobOffers.id, id))
    revalidatePath('/admin/offres-emploi')
    return { success: true, id }
  }

  const slug = toSlug(data.title) + '-' + Date.now()
  const [inserted] = await db
    .insert(jobOffers)
    .values({ ...values, slug })
    .returning({ id: jobOffers.id })

  revalidatePath('/admin/offres-emploi')
  return { success: true, ...(inserted?.id ? { id: inserted.id } : {}) }
}

export async function deleteJob(id: string): Promise<{ success: boolean }> {
  await requireAdmin()
  const db = getDb()
  await db.delete(jobOffers).where(eq(jobOffers.id, id))
  revalidatePath('/admin/offres-emploi')
  return { success: true }
}

// ─── Bureau OPEN (team_members) ──────────────────────────────────────────────

const teamMemberSchema = z.object({
  fullName: z.string().min(1, 'Nom requis'),
  role: z.string().min(1, 'Rôle requis'),
  professionalRole: z.string().max(200).optional().or(z.literal('')),
  photoUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

function revalidateBureau() {
  revalidatePath('/admin/contenu')
  revalidatePath('/reseau')
  revalidatePath('/')
}

export async function upsertTeamMember(
  raw: unknown,
  id?: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const parsed = teamMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const d = parsed.data
  const values = {
    fullName: d.fullName,
    role: d.role,
    professionalRole: d.professionalRole || null,
    photoUrl: d.photoUrl || null,
    sortOrder: d.sortOrder,
    isActive: d.isActive,
  }
  const db = getDb()

  if (id) {
    await db.update(teamMembers).set(values).where(eq(teamMembers.id, id))
  } else {
    await db.insert(teamMembers).values(values)
  }

  revalidateBureau()
  return { success: true }
}

export async function deleteTeamMember(id: string): Promise<{ success: boolean }> {
  await requireAdmin()
  const db = getDb()
  await db.delete(teamMembers).where(eq(teamMembers.id, id))
  revalidateBureau()
  return { success: true }
}

// ─── Frise chronologique (timeline_events) ───────────────────────────────────

const timelineSchema = z.object({
  year: z.coerce.number().int().min(1900, 'Année invalide').max(2100, 'Année invalide'),
  description: z.string().min(1, 'Description requise'),
  sortOrder: z.coerce.number().int().min(0).default(0),
})

function revalidateTimeline() {
  revalidatePath('/admin/contenu')
  revalidatePath('/reseau')
}

export async function upsertTimelineEvent(
  raw: unknown,
  id?: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const parsed = timelineSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const values = parsed.data
  const db = getDb()

  if (id) {
    await db.update(timelineEvents).set(values).where(eq(timelineEvents.id, id))
  } else {
    await db.insert(timelineEvents).values(values)
  }

  revalidateTimeline()
  return { success: true }
}

export async function deleteTimelineEvent(id: string): Promise<{ success: boolean }> {
  await requireAdmin()
  const db = getDb()
  await db.delete(timelineEvents).where(eq(timelineEvents.id, id))
  revalidateTimeline()
  return { success: true }
}

