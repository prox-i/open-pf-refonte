// LCG-based seeded Fisher-Yates. Deterministic, no deps, safe on server.

function lcg(seed: number): number {
  return ((seed * 1664525 + 1013904223) & 0xffffffff) >>> 0
}

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff
  }
  return h >>> 0
}

/** Returns a shuffled copy of `array` using a deterministic order derived from `seed`. */
export function seededShuffle<T>(array: readonly T[], seed: string): T[] {
  const arr = [...array]
  let s = hashSeed(seed)
  for (let i = arr.length - 1; i > 0; i--) {
    s = lcg(s)
    const j = s % (i + 1)
    // i and j are always in-range by construction
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

/** Returns today's UTC date as `YYYY-MM-DD` — stable for the full calendar day. */
export function getDailySeed(): string {
  const today = new Date()
  const y = today.getUTCFullYear()
  const m = String(today.getUTCMonth() + 1).padStart(2, '0')
  const d = String(today.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
