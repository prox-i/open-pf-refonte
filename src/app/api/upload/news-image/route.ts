import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { env } from '@/lib/env'

/**
 * Upload d'image d'actualité — flux CLIENT direct vers Vercel Blob.
 *
 * Le fichier va du navigateur directement au Blob (via un jeton signé émis ici),
 * ce qui contourne la limite de taille du body des fonctions serverless (~4,5 Mo)
 * qui provoquait « Unexpected end of JSON input ». Plus de traitement `sharp`
 * côté serveur : next/image optimise (webp/avif) à la livraison.
 *
 * Le store Blob est connecté au projet Vercel sous le préfixe "OPEN" plutôt que
 * le défaut "BLOB" : on passe donc `token` explicitement à `handleUpload`, sans
 * quoi le SDK retombe sur `BLOB_READ_WRITE_TOKEN` (obsolète, store inexistant)
 * et l'upload échoue avec « Vercel Blob: Failed to retrieve the client token ».
 */
// Route partagée avec l'upload de logo adhérent en BO (member-edit-form.tsx),
// d'où l'ajout du SVG : les logos d'entreprise sont fréquemment vectoriels.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody
  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      token: env.OPEN_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => {
        const session = await auth()
        if (!session?.user) throw new Error('Non autorisé')
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {
        // L'URL est renvoyée au client par le flux upload() ; rien à faire ici.
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
