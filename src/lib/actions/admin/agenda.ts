'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { agendaEvents } from '@/lib/db/schema'
import { auth } from '@/lib/auth/session'
import { agendaEventSchema } from '@/lib/validations/admin'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorisé')
  return session.user.id
}

function revalidateAgenda() {
  revalidatePath('/admin/agenda')
  revalidatePath('/') // carte agenda de la home
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

    const [inserted] = await db
      .insert(agendaEvents)
      .values(values)
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
