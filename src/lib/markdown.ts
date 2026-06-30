import { marked } from 'marked'

/**
 * Rendu Markdown → HTML pour le corps des actualités et offres (BO-014).
 *
 * Le contenu est saisi en Markdown dans le back-office et nettoyé de tout HTML
 * brut à l'enregistrement (`stripHtml`, BO-008) : le stock reste du texte propre.
 * On régénère le HTML à l'affichage. Par ceinture et bretelles (même si les
 * auteurs sont authentifiés), on neutralise les protocoles de lien dangereux.
 */
marked.setOptions({ gfm: true, breaks: true })

const SAFE_HREF = /^(https?:|mailto:|\/|#)/i

export function renderMarkdown(input: string): string {
  const html = marked.parse(input, { async: false })
  return html.replace(/href="([^"]*)"/gi, (match, href: string) =>
    SAFE_HREF.test(href.trim()) ? match : 'href="#"',
  )
}
