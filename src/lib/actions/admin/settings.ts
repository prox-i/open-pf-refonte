'use server'

import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { siteStats, siteSettings } from '@/lib/db/schema'
import { auth } from '@/lib/auth/session'
import { siteSettingsSchema } from '@/lib/validations/admin'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autorisé')
}

export async function updateSiteStats(employeeCount: number | null): Promise<{ success: boolean }> {
  await requireAdmin()

  const db = getDb()
  await db
    .insert(siteStats)
    .values({ id: 1, employeeCount, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteStats.id,
      set: { employeeCount, updatedAt: new Date() },
    })

  revalidatePath('/')
  revalidatePath('/admin/contenu')
  return { success: true }
}

export async function updateSiteSettings(
  raw: unknown,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  const parsed = siteSettingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const values = { id: 1 as const, ...parsed.data, updatedAt: new Date() }
  const db = getDb()
  await db
    .insert(siteSettings)
    .values(values)
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { ...parsed.data, updatedAt: new Date() },
    })

  revalidatePath('/contact')
  revalidatePath('/mentions-legales')
  revalidatePath('/admin/reglages')
  return { success: true }
}
