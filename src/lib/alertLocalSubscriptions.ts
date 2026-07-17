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

// Separate key: the subscriber's own email, remembered on THIS device only, so a
// return visit to a NEW capture surface (different source_path) can offer a
// signed-in-style one-tap subscribe instead of retyping. Still no account, no
// token — just the same address they already typed once on this browser.
const EMAIL_STORAGE_KEY = 'ch_alert_local_email'

// Separate key: an ISO timestamp for "when did this browser last look at the
// site as a known subscriber" — powers the nav pill's honest "N new since your
// last visit" count (see alertMatchCounts.ts's `since`-scoped counting). Not
// tied to any single source_path; one stamp per browser, same as the email key.
const LAST_VISIT_STORAGE_KEY = 'ch_alert_last_visit_at'

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

/** Every source_path this browser has subscribed to, oldest first. */
export function getLocalSourcePaths(): string[] {
  return readAll()
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

/** This browser's remembered email from a past successful subscribe, if any. */
export function getLocalEmail(): string | null {
  if (!hasWindow()) return null
  try {
    return window.localStorage.getItem(EMAIL_STORAGE_KEY) || null
  } catch {
    return null
  }
}

/** Remember the subscriber's own email on THIS device. Idempotent, fails soft. */
export function setLocalEmail(email: string): void {
  if (!hasWindow() || !email) return
  try {
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email)
  } catch {
    /* quota / disabled storage — fail soft, one-tap just never offers */
  }
}

/** This browser's last-recorded visit timestamp (ISO string), if any. `null` on
 *  a first-ever visit — callers should treat that as "nothing to compare against
 *  yet" rather than "everything is new". */
export function getLastVisitAt(): string | null {
  if (!hasWindow()) return null
  try {
    return window.localStorage.getItem(LAST_VISIT_STORAGE_KEY) || null
  } catch {
    return null
  }
}

/** Stamp THIS browser's visit as "now". Idempotent to call every visit; fails soft. */
export function stampVisitNow(): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(LAST_VISIT_STORAGE_KEY, new Date().toISOString())
  } catch {
    /* quota / disabled storage — fail soft, the "N new" badge just never shows */
  }
}

// Cached across every caller for the lifetime of this page load — reset only on
// a fresh navigation/reload, when the module re-evaluates.
let visitStamp: { lastVisitAt: string | null } | undefined

/**
 * Read this browser's pre-visit last-visit-at stamp and re-stamp it to "now" —
 * exactly ONCE per page load, no matter how many components call this. Both the
 * nav pill and the homepage "since your last visit" recap need the identical
 * "since" boundary for one visit; if each called `getLastVisitAt`/`stampVisitNow`
 * independently, whichever mounted second would read the value the first already
 * overwrote and always see "since just now" (0 new, even for a real returning
 * subscriber). The first caller this page load does the real read+stamp; every
 * later caller reuses that cached result.
 */
export function readAndStampVisit(): string | null {
  if (!visitStamp) {
    const lastVisitAt = getLastVisitAt()
    stampVisitNow()
    visitStamp = { lastVisitAt }
  }
  return visitStamp.lastVisitAt
}
