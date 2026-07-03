/**
 * Tiny localStorage cache with TTL.
 * Used to avoid re-downloading the UW catalog (terms, subjects, courses) on
 * every session. Fails silently on quota/serialization errors so it can never
 * break a page — a miss just falls back to the network.
 */

const PREFIX = "uwcp:"

type Entry<T> = { t: number; v: T }

export function cacheGet<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw) as Entry<T>
    if (Date.now() - entry.t > maxAgeMs) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return entry.v
  } catch {
    return null
  }
}

export function cacheSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v: value }))
  } catch {
    // Quota exceeded or unavailable — clear our namespace and give up quietly.
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k?.startsWith(PREFIX)) localStorage.removeItem(k)
      }
    } catch {
      /* ignore */
    }
  }
}

export const DAY = 24 * 60 * 60 * 1000
export const WEEK = 7 * DAY
