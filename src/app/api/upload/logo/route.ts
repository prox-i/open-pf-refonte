import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { type NextRequest, NextResponse } from 'next/server'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { memberTokens } from '@/lib/db/schema'
import { hashMagicToken, verifyMagicToken } from '@/lib/auth/magic-link'

/**
 * Upload du logo d'un adhérent depuis sa fiche (magic-link) — flux CLIENT direct
 * vers Vercel Blob. Le jeton magique est transmis via `clientPayload` et validé
 * ici avant d'émettre le jeton d'upload. Contourne la limite de taille des
 * fonctions serverless et supprime `sharp` (cause de « Unexpected end of JSON input »).
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody
  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const token = clientPayload
        if (!token || !verifyMagicToken(token)) throw new Error('Token invalide')

        const tokenHash = hashMagicToken(token)
        const db = getDb()
        const [record] = await db
          .select({ memberId: memberTokens.memberId })
          .from(memberTokens)
          .where(
            and(
              eq(memberTokens.tokenHash, tokenHash),
              gt(memberTokens.expiresAt, new Date()),
              isNull(memberTokens.usedAt),
            ),
          )
          .limit(1)
        if (!record) throw new Error('Token expiré ou invalide')

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: 4 * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {
        // L'URL est renvoyée au client par le flux upload().
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload échoué' },
      { status: 400 },
    )
  }
}
