// Per-browser "this device belongs to an alert subscriber" hint.
//
// Set after a successful alert subscribe, or on a genuine authenticated visit to
// `/alerts/manage`. Nav.tsx reads it to swap the primary "Get alerts" capture CTA
// for a "My alerts" → /alerts/manage management link, so returning subscribers reach
// their alerts in one click while capture stays the default for everyone else.
//
// Stores ONLY a boolean — never the unsubscribe token, email, or any alert data.
// The manage page itself still proves ownership via session/token; this flag is
// just a UI hint and grants no access. SSR-safe: every accessor guards on
// `typeof window`, mirroring src/lib/localSaves.ts.

const STORAGE_KEY = 'ch_alert_subscriber'

/** Fired on the window whenever the flag changes, so a mounted Nav can re-read it
 *  without a page reload (same-tab; cross-tab arrives via the native `storage` event). */
export const ALERT_SUBSCRIBER_EVENT = 'ch:alert-subscriber-changed'

function hasWindow(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function isAlertSubscriber(): boolean {
  if (!hasWindow()) return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Mark this browser as belonging to an alert subscriber. Idempotent. */
export function markAlertSubscriber(): void {
  if (!hasWindow()) return
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === '1') return
    window.localStorage.setItem(STORAGE_KEY, '1')
    window.dispatchEvent(new Event(ALERT_SUBSCRIBER_EVENT))
  } catch {
    /* quota / disabled storage — fail soft, the nav just keeps the capture CTA */
  }
}
