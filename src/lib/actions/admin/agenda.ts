'use server'

import { and, eq, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { agendaEvents } from '@/lib/db/schema'
import { auth } from '@/lib/auth/session'
import { agendaEventSchema } from '@/lib/validations/admin'
import { toSlug } from '@/lib/utils'

/** Slug unique dérivé du titre (suffixe court si collision). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = getDb()
  const root = toSlug(base) || 'evenement'
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`
    const clause = excludeId
      ? and(eq(agendaEvents.slug, candidate), ne(agendaEvents.id, excludeId))
      : eq(agendaEvents.slug, candidate)
    const [existing] = await db
      .select({ id: agendaEvents.id })
      .from(agendaEvents)
      .where(clause)
      .limit(1)
    if (!existing) return candidate
  }
  return `${root}-${Date.now().toString(36).slice(-5)}`
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorisé')
  return session.user.id
}

function revalidateAgenda() {
  revalidatePath('/admin/agenda')
  revalidatePath('/') // carte agenda de la home
  revalidatePath('/agenda/[slug]', 'page') // pages de détail
}

export async function upsertAgendaEvent(
  raw: unknown,
  id?: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdmin()
    const parsed = agendaEventSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
    }
    const d = parsed.data
    const db = getDb()

    const values = {
      title: d.title,
      description: d.description || null,
      content: d.content || null,
      eventDate: d.eventDate,
      startTime: d.startTime || null,
      location: d.location || null,
      detailUrl: d.detailUrl || null,
      isExternalUrl: d.isExternalUrl,
      isPublished: d.isPublished,
      showOnHome: d.showOnHome,
      sortOrder: d.sortOrder,
      updatedAt: new Date(),
    }

    if (id) {
      await db.update(agendaEvents).set(values).where(eq(agendaEvents.id, id))
      revalidateAgenda()
      return { success: true, id }
    }

    const slug = await uniqueSlug(d.title)
    const [inserted] = await db
      .insert(agendaEvents)
      .values({ ...values, slug })
      .returning({ id: agendaEvents.id })
    revalidateAgenda()
    return { success: true, ...(inserted?.id ? { id: inserted.id } : {}) }
  } catch (e) {
    console.error('[upsertAgendaEvent]', e)
    return { success: false, error: "Erreur lors de l'enregistrement." }
  }
}

export async function deleteAgendaEvent(id: string): Promise<{ success: boolean }> {
  await requireAdmin()
  const db = getDb()
  await db.delete(agendaEvents).where(eq(agendaEvents.id, id))
  revalidateAgenda()
  return { success: true }
}

export async function toggleAgendaPublished(
  id: string,
  isPublished: boolean,
): Promise<{ success: boolean }> {
  await requireAdmin()
  const db = getDb()
  await db
    .update(agendaEvents)
    .set({ isPublished, updatedAt: new Date() })
    .where(eq(agendaEvents.id, id))
  revalidateAgenda()
  return { success: true }
}
