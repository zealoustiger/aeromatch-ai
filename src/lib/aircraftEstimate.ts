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

/* ────────────────────────────────────────────────────────────────────────────
 * ClubHanger Deal Check — the endorsement-style "good deal / fair / priced high"
 * verdict the whole-family estimate above deliberately withholds.
 *
 * The family-median estimate is honest only as a DESCRIPTIVE comparison because its
 * comp set is the entire make+model family — a price gap there can simply mean this
 * airplane is newer or lower-time, not a bargain. This helper earns the right to make
 * a value judgement by first narrowing the comp set to listings of SIMILAR YEAR and
 * SIMILAR HOURS, controlling for the two biggest value drivers, then comparing against
 * that tighter median. Same honesty philosophy, one notch stricter on purpose:
 *  - The subject must itself have a year AND total time — we can't honestly judge a
 *    listing on year/hours when it doesn't state them.
 *  - We require >= MIN_DEAL_COMPS comps that fall inside BOTH bands; below that the
 *    narrowed median is too thin to call → no verdict.
 *  - A ±DEAL_DEAD_BAND window around the narrowed median reads "Fair price" rather than
 *    inventing a small percentage.
 *  - Whole-dollar / whole-percent only — no false precision.
 * Pure: no DB, no React, no imports. Unit-tested in `aircraftEstimate.test.ts`.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Minimum number of similar-year + similar-hours comps required before we publish a
 *  value verdict (stricter intent than the descriptive estimate's family median). */
export const MIN_DEAL_COMPS = 4

/** A comp's year must be within ±this many years of the subject to count as
 *  "similar year". 5 years brackets a typical model/avionics generation. */
export const DEAL_YEAR_BAND = 5

/** A comp's total time qualifies as "similar hours" when it is within the larger of an
 *  absolute and a relative band of the subject's hours — so low-time airframes get a
 *  sensible floor and high-time ones a proportional window. */
export const DEAL_HOURS_ABS_BAND = 1000
export const DEAL_HOURS_REL_BAND = 0.35

/** Within ±this fraction of the narrowed median we call it "Fair price". */
export const DEAL_DEAD_BAND = 0.05

export type DealVerdict = 'good' | 'fair' | 'high'

/** One same-family comp listing for the deal check. */
export interface DealComp {
  asking_price: number | null
  year: number | null
  ttaf: number | null
}

/** The subject listing being judged. */
export interface DealSubject {
  askingPrice: number | null | undefined
  year: number | null | undefined
  ttaf: number | null | undefined
}

export interface ClubHangerDealVerdict {
  /** Good deal (below the similar-year/hours median), Fair (inside the dead band), or
   *  Priced high (above it). A genuine value judgement — the comp set controls for
   *  year and hours. */
  verdict: DealVerdict
  /** Median asking price of the narrowed (similar-year + similar-hours) comps. */
  median: number
  /** Number of comps inside BOTH the year and hours bands. */
  compCount: number
  /** Signed whole-dollar distance from the narrowed median (negative = below). */
  deltaDollars: number
  /** Absolute whole-percent distance from the narrowed median (>= 1 for non-fair). */
  deltaPct: number
  /** The ± year band actually used (for the on-page explanation). */
  yearBand: number
}

/** True when a comp's total time is within the subject's similar-hours band. */
function hoursWithinBand(subjectTtaf: number, compTtaf: number): boolean {
  const band = Math.max(DEAL_HOURS_ABS_BAND, subjectTtaf * DEAL_HOURS_REL_BAND)
  return Math.abs(compTtaf - subjectTtaf) <= band
}

/**
 * Compute the ClubHanger Deal Check verdict for one listing against same-family comps
 * narrowed to similar year + similar hours.
 *
 * `comps` is the set of OTHER active priced same-family listings (the caller excludes
 * the subject by id in the DB read, so there's no self-comparison to undo here).
 *
 * Returns null — i.e. NO verdict — when the subject lacks a real price / year / total
 * time, or when fewer than MIN_DEAL_COMPS comps fall inside both bands. Thin or
 * uncontrolled data publishes nothing rather than a misleading endorsement.
 */
export function clubHangerDealVerdict(
  subject: DealSubject,
  comps: DealComp[]
): ClubHangerDealVerdict | null {
  const { askingPrice, year, ttaf } = subject
  if (askingPrice == null || !Number.isFinite(askingPrice) || askingPrice <= 0) return null
  if (year == null || !Number.isFinite(year)) return null
  if (ttaf == null || !Number.isFinite(ttaf) || ttaf < 0) return null

  const narrowed: number[] = []
  for (const c of comps) {
    const price = c.asking_price
    if (price == null || !Number.isFinite(price) || price <= 0) continue
    if (c.year == null || !Number.isFinite(c.year)) continue
    if (c.ttaf == null || !Number.isFinite(c.ttaf) || c.ttaf < 0) continue
    if (Math.abs(c.year - year) > DEAL_YEAR_BAND) continue
    if (!hoursWithinBand(ttaf, c.ttaf)) continue
    narrowed.push(price)
  }
  if (narrowed.length < MIN_DEAL_COMPS) return null

  narrowed.sort((a, b) => a - b)
  const median = Math.round(medianOfSorted(narrowed))
  if (median <= 0) return null

  const deltaDollars = Math.round(askingPrice - median)
  const delta = (askingPrice - median) / median

  if (Math.abs(delta) < DEAL_DEAD_BAND) {
    return { verdict: 'fair', median, compCount: narrowed.length, deltaDollars, deltaPct: 0, yearBand: DEAL_YEAR_BAND }
  }
  const deltaPct = Math.max(1, Math.round(Math.abs(delta) * 100))
  return {
    verdict: delta < 0 ? 'good' : 'high',
    median,
    compCount: narrowed.length,
    deltaDollars,
    deltaPct,
    yearBand: DEAL_YEAR_BAND,
  }
}
