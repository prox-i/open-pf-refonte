/**
 * Corrections de contenu en base de prod (recette 29/06) :
 *   - REC-008 : renomme le slug WordPress « 3528-2 » → « voeux-2025 ».
 *   - BO-008  : convertit le HTML hérité de WordPress en **Markdown propre**
 *               (formatage préservé — liens, gras, listes — et rendu ensuite via
 *               renderMarkdown). On ne SUPPRIME pas le HTML, on le convertit.
 *   - REC-012 : harmonise la casse « de Reviere » → « De Reviere ».
 *   - REC-013 : corrige des fautes connues des articles migrés.
 *
 * NON-DESTRUCTIF : dry-run par défaut (montre les changements, n'écrit rien).
 * Passer `--apply` pour exécuter réellement.
 *
 * Lit DATABASE_URL depuis .env.local (via `pnpm fix:content-prod`).
 *   pnpm fix:content-prod          # dry-run
 *   pnpm fix:content-prod --apply  # exécution
 */

/* eslint-disable no-console */
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'
import TurndownService from 'turndown'
import * as schema from '../src/lib/db/schema'

const { news } = schema
const APPLY = process.argv.includes('--apply')

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
})

const HTML_RE = /<\/?[a-z][^>]*>/i

// REC-013 : fautes connues (récurrentes dans les articles migrés).
const TYPO_FIXES: Array<[RegExp, string]> = [
  [/tiens à remercier/g, 'tient à remercier'],
  [/Le CA 2023[–-]2025,/g, 'Le CA 2023-2025'],
]

function fixText(text: string): string {
  let out = text.replace(/\bde Reviere\b/g, 'De Reviere') // REC-012
  for (const [re, to] of TYPO_FIXES) out = out.replace(re, to) // REC-013
  return out
}

/** Convertit en Markdown si du HTML est détecté, puis applique les corrections de texte. */
function clean(text: string): string {
  const base = HTML_RE.test(text) ? turndown.turndown(text) : text
  return fixText(base).trim()
}

function getDb() {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL manquant (.env.local)')
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

    if (row.slug === '3528-2') updates.slug = 'voeux-2025' // REC-008

    const newTitle = fixText(row.title)
    if (newTitle !== row.title) updates.title = newTitle

    if (row.excerpt) {
      const next = clean(row.excerpt)
      if (next !== row.excerpt) updates.excerpt = next
    }
    if (row.content) {
      const next = clean(row.content)
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
