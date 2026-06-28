/**
 * Relative days-on-market — how long THIS listing has been for sale compared to
 * comparable active listings of the same make+model family.
 *
 * Proprietary + honest by construction: synthesized from our own `first_seen_at`
 * column across the active priced family, and framed only against listings that are
 * STILL for sale (never "how fast comparable planes sell" — we have no sold data, so
 * that claim would be survivorship-biased fabrication). When the comp set is too thin
 * to compare honestly, the helper returns null and the caller falls back to the plain
 * absolute "Listed N ago" copy.
 *
 * The pure helper takes `now` as a parameter (no `Date.now()` inside) so it is
 * deterministically testable — mirrors the aircraftEstimate / engineLife helpers.
 */

const DAY_MS = 86_400_000

// Honesty floor: need at least this many comparable active listings with a known
// first_seen_at before we'll state a percentile — fewer than this and one or two
// outliers would swing the comparison, so we say nothing rather than mislead.
export const MIN_DOM_COMPS = 5

// Dead band around the middle: when the subject sits between these percentiles of the
// comp set's time-on-market, it's "about typical" rather than notably longer/shorter —
// avoids over-claiming a signal from a near-median position.
export const DOM_TYPICAL_LOW = 40
export const DOM_TYPICAL_HIGH = 60

export interface DaysOnMarketContext {
  /** Whole days the subject listing has been on the market. */
  subjectDays: number
  /** Number of comparable active listings (with a known first_seen) compared against. */
  compCount: number
  /**
   * Share (0–100, rounded to the nearest 5) of comparable active listings the subject
   * has been listed LONGER than. 80 ⇒ among the stalest fifth; 10 ⇒ fresher than most.
   */
  percentileLongerThan: number
  /** Bucketed read of percentileLongerThan, with a dead band → 'typical'. */
  relative: 'longer' | 'shorter' | 'typical'
}

/**
 * Compute the subject's days-on-market position within its comparable active listings.
 *
 * @param subjectFirstSeen  the subject listing's `first_seen_at` (ISO) or null
 * @param compFirstSeen     `first_seen_at` of the comparable active listings (subject
 *                          already excluded by the caller); nulls/unparseable are dropped
 * @param now               current epoch ms (pass `Date.now()` from the caller)
 * @returns context, or null when the subject date is unknown/invalid or fewer than
 *          MIN_DOM_COMPS comps have a usable first_seen.
 */
export function computeDaysOnMarketContext(
  subjectFirstSeen: string | null,
  compFirstSeen: (string | null)[],
  now: number,
): DaysOnMarketContext | null {
  if (!subjectFirstSeen) return null
  const subjMs = new Date(subjectFirstSeen).getTime()
  if (Number.isNaN(subjMs)) return null
  const subjectDays = Math.floor((now - subjMs) / DAY_MS)
  if (subjectDays < 0) return null

  const compDays = compFirstSeen
    .map((s) => (s ? new Date(s).getTime() : NaN))
    .filter((t) => !Number.isNaN(t))
    .map((t) => Math.floor((now - t) / DAY_MS))
    .filter((d) => d >= 0)

  if (compDays.length < MIN_DOM_COMPS) return null

  const shorter = compDays.filter((d) => d < subjectDays).length
  // Round to the nearest 5 — these are approximate reads, not precise statistics.
  const percentileLongerThan = Math.round((shorter / compDays.length) * 20) * 5

  let relative: DaysOnMarketContext['relative'] = 'typical'
  if (percentileLongerThan >= DOM_TYPICAL_HIGH) relative = 'longer'
  else if (percentileLongerThan <= DOM_TYPICAL_LOW) relative = 'shorter'

  return { subjectDays, compCount: compDays.length, percentileLongerThan, relative }
}
