// Device-only "recently viewed" log — a lightweight signal for suggesting an alert
// when a visitor's own browsing clusters on one make/model, without an account or
// any server-side tracking.
//
// Stores ONLY make/model/type — no listing id, no PII — same honesty precedent as
// src/lib/localSaves.ts. SSR-safe: every accessor guards on `typeof window`.

export type RecentlyViewedNoun = 'aircraft' | 'partnership'

export interface RecentlyViewedEntry {
  make: string
  model: string | null
  noun: RecentlyViewedNoun
}

const STORAGE_KEY = 'ch_recently_viewed'
/** Caps how far back a suggestion can look — old browsing shouldn't skew today's. */
const MAX_ENTRIES = 20

function hasWindow(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function getRecentlyViewed(): RecentlyViewedEntry[] {
  if (!hasWindow()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is RecentlyViewedEntry =>
        e &&
        typeof e.make === 'string' &&
        !!e.make.trim() &&
        (e.model === null || typeof e.model === 'string') &&
        (e.noun === 'aircraft' || e.noun === 'partnership')
    )
  } catch {
    return []
  }
}

/** Logs one listing-detail view. Fails soft on quota/disabled storage. */
export function addRecentlyViewed(make: string, model: string | null, noun: RecentlyViewedNoun): void {
  if (!hasWindow()) return
  const trimmedMake = make.trim()
  if (!trimmedMake) return
  try {
    const existing = getRecentlyViewed()
    const entry: RecentlyViewedEntry = { make: trimmedMake, model: model?.trim() || null, noun }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, entry].slice(-MAX_ENTRIES)))
  } catch {
    /* quota / disabled storage — fail soft, no recently-viewed signal this session */
  }
}
