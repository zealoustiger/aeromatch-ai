// Per-browser "you already get alerts for this" memory for EMAIL-ONLY subscribers
// (no account, no session — the majority path). `subscribeSignedInAlert` already
// gets this for free server-side via `getExistingAlertForSourcePath`; email-only
// subscribers have no session to query, so without this every return visit to the
// same capture point re-shows a blank form and risks a pointless re-submit.
//
// Stores ONLY the source_path a subscribe succeeded for — no email, no token, no
// PII beyond a route string already visible in the page URL. Same SSR-safe,
// fail-soft precedent as recentlyViewed.ts / alertSubscriberFlag.ts. This is a UI
// hint only — the server already treats a repeat (email, source_path) insert as an
// idempotent no-op (see subscribeToAlerts' 23505 handling), so losing this flag
// (quota, private browsing, a different browser) never breaks anything; it just
// means the form re-shows.

const STORAGE_KEY = 'ch_alert_local_subscriptions'
/** Caps how many capture points one browser remembers — oldest drops first. */
const MAX_ENTRIES = 50

function hasWindow(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function readAll(): string[] {
  if (!hasWindow()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string' && !!p) : []
  } catch {
    return []
  }
}

/** Has THIS browser already subscribed at this exact source_path? */
export function isLocallySubscribed(sourcePath: string): boolean {
  if (!sourcePath) return false
  return readAll().includes(sourcePath)
}

/** Record a successful email-only subscribe. Idempotent, fails soft. */
export function addLocalSubscription(sourcePath: string): void {
  if (!hasWindow() || !sourcePath) return
  try {
    const existing = readAll().filter((p) => p !== sourcePath)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, sourcePath].slice(-MAX_ENTRIES)))
  } catch {
    /* quota / disabled storage — fail soft, the form just re-shows next visit */
  }
}
