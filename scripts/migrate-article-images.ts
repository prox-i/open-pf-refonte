/**
 * REC-002 — Migration des images d'articles depuis l'ancien WordPress vers Vercel Blob.
 *
 * Problème : le corps (`content`) et l'image de une (`imageUrl`) de certains articles
 * pointent encore vers `https://open.pf/wp-content/...`. Après la bascule sur open.pf,
 * ces URL renverront des 404. Ce script télécharge chaque image wp-content, la dépose
 * sur Vercel Blob, et réécrit les références dans la table `news`.
 *
 * NON-DESTRUCTIF : par défaut en mode DRY-RUN (affiche ce qui serait fait, n'écrit rien).
 * Passer `--apply` pour exécuter réellement les écritures.
 *
 * Pré-requis (dans .env.local ou l'environnement) :
 *   - DATABASE_URL              (Neon, base de PRODUCTION)
 *   - BLOB_READ_WRITE_TOKEN     (Vercel Blob)
 *
 * Lancer :
 *   pnpm tsx --env-file .env.local scripts/migrate-article-images.ts          # dry-run
 *   pnpm tsx --env-file .env.local scripts/migrate-article-images.ts --apply  # exécution
 */

/* eslint-disable no-console */
import { put } from '@vercel/blob'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'
import * as schema from '../src/lib/db/schema'

const { news } = schema

const WP_URL_RE = /https?:\/\/(?:www\.)?open\.pf\/wp-content\/uploads\/[^\s"'()<>]+/gi

const APPLY = process.argv.includes('--apply')

function getDb() {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL manquant (passer --env-file .env.local)')
  return drizzle(neon(url), { schema })
}

async function downloadAndUpload(srcUrl: string): Promise<string> {
  const res = await fetch(srcUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${srcUrl}`)
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
  const buffer = Buffer.from(await res.arrayBuffer())
  // Conserve le nom de fichier d'origine sous un préfixe dédié, suffixe aléatoire géré par Blob.
  const filename = srcUrl.split('/').pop() || 'image'
  const blob = await put(`news-migrated/${filename}`, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: true,
  })
  return blob.url
}

async function main() {
  const db = getDb()
  console.log(`\n=== REC-002 — Migration images articles (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)

  const rows = await db
    .select({ id: news.id, slug: news.slug, content: news.content, imageUrl: news.imageUrl })
    .from(news)

  let touchedRows = 0
  let migratedImages = 0
  const cache = new Map<string, string>() // srcUrl -> nouvelle URL Blob (dédup)

  for (const row of rows) {
    const fields: Array<'content' | 'imageUrl'> = ['content', 'imageUrl']
    const updates: Partial<{ content: string; imageUrl: string }> = {}

    for (const field of fields) {
      const value = row[field]
      if (!value) continue
      const matches = [...value.matchAll(WP_URL_RE)].map((m) => m[0])
      if (matches.length === 0) continue

      let next = value
      for (const src of matches) {
        let dest = cache.get(src)
        if (!dest) {
          console.log(`  [${row.slug}] ${field} → ${src}`)
          if (APPLY) {
            dest = await downloadAndUpload(src)
            console.log(`      ↳ ${dest}`)
          } else {
            dest = src // dry-run : on ne touche pas
          }
          cache.set(src, dest)
          migratedImages++
        }
        next = next.split(src).join(dest)
      }
      if (next !== value) updates[field] = next
    }

    if (Object.keys(updates).length > 0) {
      touchedRows++
      if (APPLY) {
        await db.update(news).set(updates).where(eq(news.id, row.id))
      }
    }
  }

  console.log(
    `\n${APPLY ? 'Migré' : 'À migrer'} : ${migratedImages} image(s) dans ${touchedRows} article(s).`,
  )
  if (!APPLY && migratedImages > 0) {
    console.log('Relancer avec --apply pour exécuter la migration.\n')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
