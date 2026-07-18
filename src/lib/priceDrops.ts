/**
 * Price-drop detection for aircraft-for-sale alerts (GOAL.md: "new-listing AND
 * price-drop alerts" — never fire on a price INCREASE, only a genuine decrease).
 *
 * Reuses the `previous_price` / `price_changed_at` columns the scraper already
 * writes on every detected price change (`scraper/lib/ingest-core.mjs`) — no new
 * `price_history` table needed, since only the most recent change matters for
 * "did this listing just get cheaper," not a multi-drop trend. Those columns stay
 * `null` on a listing's first insert, so a brand-new listing can never also
 * register as a price drop.
 *
 * Pure + deterministic: callers pass `sinceIso` explicitly (no `Date.now()`
 * inside) so this is testable without the DB or the clock — mirrors the
 * daysOnMarket / aircraftEstimate helpers.
 */

export interface PriceDropSubject {
  previous_price: number | null
  asking_price: number | null
  price_changed_at: string | null
}

/**
 * True when `subject`'s most recent recorded price change was a genuine
 * decrease, recorded at or after `sinceIso`.
 */
export function hasRecentPriceDrop(subject: PriceDropSubject, sinceIso: string): boolean {
  const amount = priceDropAmount(subject)
  if (amount == null) return false
  if (!subject.price_changed_at) return false

  const changedMs = new Date(subject.price_changed_at).getTime()
  const sinceMs = new Date(sinceIso).getTime()
  if (Number.isNaN(changedMs) || Number.isNaN(sinceMs)) return false

  return changedMs >= sinceMs
}

/**
 * Whole-dollar amount of the drop (previous − current), or null when there's
 * no genuine decrease to report (missing prices, or the price went up/unchanged).
 */
export function priceDropAmount(subject: PriceDropSubject): number | null {
  if (subject.previous_price == null || subject.asking_price == null) return null
  if (subject.asking_price >= subject.previous_price) return null
  return subject.previous_price - subject.asking_price
}

/** A drop counts as "meaningful" (worth a search-scoped price-drop alert) once
 *  it clears either an honest percent floor or a flat-dollar floor — trivial
 *  repricing (e.g. $100 off a $150k listing) shouldn't email every matching
 *  subscriber. Deliberately NOT applied to single-listing "watch this
 *  listing" alerts (`resolveListingWatch`/`resolvePartnershipWatch` in the
 *  alert-digest cron) — a subscriber watching one specific listing wants to
 *  hear about any genuine drop, not just ones that clear a search-wide bar. */
export const MIN_MEANINGFUL_DROP_PERCENT = 0.01
export const MIN_MEANINGFUL_DROP_DOLLARS = 500

export function isMeaningfulPriceDrop(subject: PriceDropSubject): boolean {
  const amount = priceDropAmount(subject)
  if (amount == null) return false
  if (amount >= MIN_MEANINGFUL_DROP_DOLLARS) return true
  return amount / (subject.previous_price as number) >= MIN_MEANINGFUL_DROP_PERCENT
}
