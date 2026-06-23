/**
 * The "ClubHanger Estimate" — a Zillow-Zestimate-style read on how one aircraft's
 * asking price compares to the going rate for its make+model family.
 *
 * This module is intentionally SELF-CONTAINED (no imports): the caller resolves the
 * make+model family and supplies the comp prices, so the math here is pure and
 * unit-testable on its own (`aircraftEstimate.test.ts`), exactly like
 * `calculators.ts`. Family resolution + the DB read live in `aircraftForSale.ts` /
 * the detail page.
 *
 * Honesty guardrails (GOAL.md honesty rule) — mirror the per-card pill in
 * `aircraftComps.ts`:
 *  - We only publish an estimate when there are >= MIN_ESTIMATE_COMPS *other* priced
 *    same-family listings. Below that the median is too noisy to trust → no block.
 *  - A ±ESTIMATE_DEAD_BAND window reads "Around market" rather than inventing fake
 *    precision ("priced 2% below") on what is effectively the going rate.
 *  - Dollars and percentages are whole numbers — no false precision.
 *  - The verdict is a DESCRIPTIVE market comparison ('below' / 'around' / 'above'
 *    the family median), NOT a value judgement ("good deal"): the comp set is the
 *    whole make+model family, so a gap can reflect year/hours/avionics rather than a
 *    bargain. An endorsement-style score awaits year-band/hours comps (see backlog).
 */

/** Minimum number of OTHER same-family priced comps required before we publish an
 *  estimate. Matches the per-card pill's MIN_OTHER_COMPS (so the detail block and the
 *  card pill agree on when a comparison is trustworthy). */
export const MIN_ESTIMATE_COMPS = 4

/** Within ±5% of the family median we call it "Fair price" rather than claim a small
 *  percentage — avoids fake precision on what is effectively the going rate. Matches
 *  the per-card pill's DEAD_BAND. */
export const ESTIMATE_DEAD_BAND = 0.05

export type EstimateVerdict = 'below' | 'around' | 'above'

/**
 * The ClubHanger Estimate for one listing. All dollar/percent fields are whole
 * numbers.
 */
export interface ClubHangerEstimate {
  /** Below market, Around market (within the dead band), or Above market — relative
   *  to the make+model family median. Descriptive, not a value judgement. */
  verdict: EstimateVerdict
  /** Median asking price of the OTHER family comps, in whole dollars. */
  median: number
  /** Number of OTHER same-family priced comps the estimate was computed from. */
  compCount: number
  /** Signed distance from the median in whole dollars (negative = below market). */
  deltaDollars: number
  /** Absolute whole-number percent distance from the median (>= 1 for non-fair). */
  deltaPct: number
}

/** Median of an ascending numeric array. Caller guarantees length > 0. */
function medianOfSorted(sorted: number[]): number {
  const n = sorted.length
  const mid = Math.floor(n / 2)
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Compute a ClubHanger Estimate for one listing against the asking prices of all
 * active priced listings in its make+model family. The detail page renders this as
 * a "Good deal / Fair price / Priced high" block.
 *
 * `familyPrices` is the raw asking prices of ALL active priced listings in the
 * family — it INCLUDES this listing's own price, exactly one occurrence of which we
 * exclude below so a listing is never compared against itself.
 *
 * Returns null (→ no block) when the listing has no real price, or there are fewer
 * than MIN_ESTIMATE_COMPS *other* priced comps — thin data publishes nothing rather
 * than a misleading estimate. Pure: no DB, no React, no imports.
 */
export function clubHangerEstimate(
  askingPrice: number | null | undefined,
  familyPrices: number[]
): ClubHangerEstimate | null {
  if (askingPrice == null || !Number.isFinite(askingPrice) || askingPrice <= 0) return null

  // Other priced comps (positive, finite), excluding exactly one occurrence of this
  // listing's own price so it's never compared against itself.
  const others: number[] = []
  let removed = false
  for (const p of familyPrices) {
    if (!Number.isFinite(p) || p <= 0) continue
    if (!removed && p === askingPrice) {
      removed = true
      continue
    }
    others.push(p)
  }
  if (others.length < MIN_ESTIMATE_COMPS) return null

  others.sort((a, b) => a - b)
  const median = Math.round(medianOfSorted(others))
  if (median <= 0) return null

  const deltaDollars = Math.round(askingPrice - median)
  const delta = (askingPrice - median) / median

  if (Math.abs(delta) < ESTIMATE_DEAD_BAND) {
    return { verdict: 'around', median, compCount: others.length, deltaDollars, deltaPct: 0 }
  }
  // A delta just outside the dead-band can still round to 0; clamp to >= 1 so the
  // label always reads a real, non-zero percentage.
  const deltaPct = Math.max(1, Math.round(Math.abs(delta) * 100))
  return {
    verdict: delta < 0 ? 'below' : 'above',
    median,
    compCount: others.length,
    deltaDollars,
    deltaPct,
  }
}
