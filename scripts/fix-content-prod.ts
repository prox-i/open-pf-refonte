/**
 * Corrections de contenu en base de prod (recette 29/06) :
 *   - REC-008 : renomme le slug WordPress « 3528-2 » → « voeux-2025 ».
 *   - BO-008  : nettoie les balises HTML héritées dans excerpt/content (stripHtml).
 *   - REC-012 : harmonise la casse « de Reviere » → « De Reviere ».
 *   - REC-013 : corrige des fautes connues des articles migrés.
 *
 * NON-DESTRUCTIF : dry-run par défaut (montre les changements, n'écrit rien).
 * Passer `--apply` pour exécuter réellement.
 *
 * Lancer (dans TON terminal, la clé reste chez toi) :
 *   DATABASE_URL="postgresql://…NEON…" pnpm tsx scripts/fix-content-prod.ts          # dry-run
 *   DATABASE_URL="postgresql://…NEON…" pnpm tsx scripts/fix-content-prod.ts --apply  # exécution
 */

/* eslint-disable no-console */
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'
import * as schema from '../src/lib/db/schema'
import { stripHtml } from '../src/lib/utils'

const { news } = schema
const APPLY = process.argv.includes('--apply')

// REC-013 : fautes connues (récurrentes dans les articles migrés). Ajouter ici
// au besoin — remplacements littéraux, sûrs.
const TYPO_FIXES: Array<[RegExp, string]> = [
  [/tiens à remercier/g, 'tient à remercier'],
  [/Le CA 2023[–-]2025,/g, 'Le CA 2023-2025'],
]

function fixCasing(text: string): string {
  // REC-012 : « de Reviere » (d minuscule) → « De Reviere ».
  return text.replace(/\bde Reviere\b/g, 'De Reviere')
}

function applyTypos(text: string): string {
  return TYPO_FIXES.reduce((acc, [re, to]) => acc.replace(re, to), text)
}

function getDb() {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL manquant')
  return drizzle(neon(url), { schema })
}

async function main() {
  const db = getDb()
  console.log(`\n=== Corrections contenu prod (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)

  const rows = await db
    .select({ id: news.id, slug: news.slug, title: news.title, excerpt: news.excerpt, content: news.content })
    .from(news)

  let touched = 0
  for (const row of rows) {
    const updates: Partial<{ slug: string; title: string; excerpt: string; content: string }> = {}

    // REC-008 : slug
    if (row.slug === '3528-2') updates.slug = 'voeux-2025'

    // BO-008 + REC-012 + REC-013 sur title/excerpt/content
    const newTitle = fixCasing(applyTypos(row.title))
    if (newTitle !== row.title) updates.title = newTitle

    if (row.excerpt) {
      const next = fixCasing(applyTypos(stripHtml(row.excerpt)))
      if (next !== row.excerpt) updates.excerpt = next
    }
    if (row.content) {
      const next = fixCasing(applyTypos(stripHtml(row.content)))
      if (next !== row.content) updates.content = next
    }

    if (Object.keys(updates).length > 0) {
      touched++
      console.log(`• [${row.slug}] ${Object.keys(updates).join(', ')}`)
      if (APPLY) {
        await db.update(news).set({ ...updates, updatedAt: new Date() }).where(eq(news.id, row.id))
      }
    }
  }

  console.log(`\n${APPLY ? 'Mis à jour' : 'À mettre à jour'} : ${touched} article(s).`)
  if (!APPLY && touched > 0) console.log('Relancer avec --apply pour exécuter.\n')
  console.log(
    'NB REC-012 : vérifier aussi la casse « De Reviere » sur la fiche adhérent concernée ' +
      'directement dans le back-office (champ hors table news).\n',
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
