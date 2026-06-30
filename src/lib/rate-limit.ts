/**
 * Limiteur anti-brute-force simple, en mémoire (BO-003).
 *
 * ⚠️ Limite connue : l'état vit dans le processus. En serverless (plusieurs
 * instances / cold starts), la protection est « best-effort ». Pour un blocage
 * réellement partagé, brancher un store distribué (ex. Upstash Redis /
 * @vercel/kv) derrière la même interface. Suffisant ici pour freiner un
 * bourrinage basique sur la connexion admin.
 */
interface Attempt {
  count: number
  firstAt: number
}

const attempts = new Map<string, Attempt>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Renvoie le nombre de minutes restantes de blocage si la clé est verrouillée,
 * sinon `null`. Ne compte pas la tentative (voir `recordFailure`).
 */
export function getLockoutMinutes(key: string): number | null {
  const entry = attempts.get(key)
  if (!entry) return null
  const elapsed = Date.now() - entry.firstAt
  if (elapsed > WINDOW_MS) {
    attempts.delete(key)
    return null
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 60000))
  }
  return null
}

/** Enregistre une tentative échouée pour la clé. */
export function recordFailure(key: string): void {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now })
    return
  }
  entry.count += 1
}

/** Réinitialise le compteur (connexion réussie). */
export function resetRateLimit(key: string): void {
  attempts.delete(key)
}
