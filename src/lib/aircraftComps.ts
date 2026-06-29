import { resolveMakeModelFamily } from '@/lib/seo'

/**
 * Price-vs-market comp helpers (read-only, pure — no DB, no React).
 *
 * The for-sale cards show a small "~X% below/above average" pill comparing a
 * listing's asking price to the MEDIAN asking price of OTHER active listings of
 * the same make+model FAMILY. Families are resolved via the existing
 * `resolveMakeModelFamily` single source of truth (the same one the card uses
 * for its "See all … for sale" link), so the comp set lines up with a real page.
 *
 * Honesty guardrails baked into the math (GOAL.md honesty rule):
 *  - We only claim a comparison when there are >= MIN_OTHER_COMPS *other* priced
 *    listings in the family. Below that the median is too noisy to publish, so we
 *    render NOTHING rather than a misleading badge.
 *  - A ±DEAD_BAND window reads "Near average" instead of inventing fake precision
 *    ("3% below") on what is effectively a tie.
 *  - Percentages round to whole numbers — no false precision.
 */

/** Minimum number of OTHER same-family priced listings required before we show a
 *  pill. 4 (so >= 5 priced listings in the family including the listing itself):
 *  below this the median swings too much on one or two outliers to make a
 *  trustworthy public "below/above market" claim. Sparse families show no pill. */
export const MIN_OTHER_COMPS = 4

/** Within ±5% of the median we call it "near average" rather than claim a small
 *  percentage — avoids fake precision on what is effectively the going rate. */
export const DEAD_BAND = 0.05

/** A minimal listing shape — just what comps need (works for any AircraftForSale). */
export interface CompListing {
  make: string | null
  model: string | null
  asking_price: number | null
}

export type CompKind = 'below' | 'above' | 'near'

export interface CompResult {
  kind: CompKind
  /** Whole-number percent distance from the family median (>= 1 for below/above;
   *  0 for "near"). Rounded — no decimals. */
  pct: number
  /** Number of OTHER same-family priced listings the comparison was drawn from.
   *  Always >= MIN_OTHER_COMPS — compVsMarket returns null below that threshold. */
  count: number
  /** Median asking price of the comp set (whole dollars). */
  median: number
}

/** Stable family key for a listing, or null when it doesn't resolve to a known
 *  make+model family (then we can't define a clean comp set → no pill). */
export function familyKey(listing: CompListing): string | null {
  const fam = resolveMakeModelFamily(listing.make, listing.model)
  return fam ? `${fam.makeSlug}/${fam.modelSlug}` : null
}

/**
 * Build a map of family key -> ascending array of real asking prices, from a flat
 * list of listings. Only listings with a positive `asking_price` AND a resolvable
 * family are included. Pure: pass in the listings, get a map back.
 */
export function buildFamilyPriceMap(listings: CompListing[]): Map<string, number[]> {
  const map = new Map<string, number[]>()
  for (const l of listings) {
    if (l.asking_price == null || l.asking_price <= 0) continue
    const key = familyKey(l)
    if (!key) continue
    const arr = map.get(key)
    if (arr) arr.push(l.asking_price)
    else map.set(key, [l.asking_price])
  }
  for (const arr of map.values()) arr.sort((a, b) => a - b)
  return map
}

/** Median of an ascending numeric array. Caller guarantees length > 0. */
function medianOfSorted(sorted: number[]): number {
  const n = sorted.length
  const mid = Math.floor(n / 2)
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Minimum number of priced listings in a family before we publish an aggregate
 * "Market snapshot" (median + range + average). This is the same honesty
 * philosophy as slice 1's per-card pill (MIN_OTHER_COMPS), but a notch STRICTER:
 * a per-card pill only claims one listing is "below/above" its peers, whereas the
 * snapshot publishes a public median AND a low–high range — a price RANGE is far
 * more sensitive to a single outlier than a single relative claim. With only ~5
 * priced listings one mis-priced/project airframe (e.g. a $105k R44 against a
 * $650–860k field) drags the range and skews the median; 8 keeps the median and
 * range trustworthy. Below this, the family shows NO snapshot rather than publish
 * a noisy/misleading aggregate. Empirically this cleanly separates the dense
 * families (Cessna 172=36, Cherokee=23, Bonanza=58, …) from sparse ones
 * (Robinson R44=5 → suppressed).
 */
export const MIN_SNAPSHOT_LISTINGS = 8

/** Aggregate market stats for ONE make+model family, all in whole dollars. */
export interface PriceStats {
  /** Number of priced listings the stats were computed from. */
  count: number
  /** Median asking price (whole dollars). */
  median: number
  /** Lowest asking price (whole dollars). */
  low: number
  /** Highest asking price (whole dollars). */
  high: number
  /** Mean asking price (whole dollars). */
  average: number
}

/**
 * Compute aggregate price stats for a family's priced listings. Returns null when
 * there are fewer than MIN_SNAPSHOT_LISTINGS real priced listings — the caller
 * then renders nothing (honesty guardrail: no snapshot on sparse data).
 *
 * Pass the raw asking prices of ALL active priced listings in the family; only
 * positive finite values are counted. Pure — no DB, no React.
 */
export function priceStats(prices: number[]): PriceStats | null {
  const valid = prices.filter((p) => Number.isFinite(p) && p > 0)
  if (valid.length < MIN_SNAPSHOT_LISTINGS) return null
  const sorted = [...valid].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  return {
    count: sorted.length,
    median: Math.round(medianOfSorted(sorted)),
    low: sorted[0],
    high: sorted[sorted.length - 1],
    average: Math.round(sum / sorted.length),
  }
}

/**
 * Compare one listing's asking price to the median of OTHER same-family priced
 * listings. Returns null (→ no pill) when:
 *  - the listing has no real asking price,
 *  - it doesn't resolve to a known make+model family,
 *  - or there are fewer than MIN_OTHER_COMPS *other* priced comps in the family.
 *
 * `familyPriceMap` is the map from `buildFamilyPriceMap` over ALL active priced
 * listings (it INCLUDES this listing's own price — we exclude exactly one
 * occurrence below so a listing is never compared against itself).
 */
export function compVsMarket(
  listing: CompListing,
  familyPriceMap: Map<string, number[]>
): CompResult | null {
  const price = listing.asking_price
  if (price == null || price <= 0) return null
  const key = familyKey(listing)
  if (!key) return null

  const all = familyPriceMap.get(key)
  if (!all || all.length === 0) return null

  // Exclude exactly one occurrence of this listing's own price (it's in the map).
  const others: number[] = []
  let removed = false
  for (const p of all) {
    if (!removed && p === price) {
      removed = true
      continue
    }
    others.push(p)
  }
  if (others.length < MIN_OTHER_COMPS) return null

  const median = medianOfSorted(others) // `others` stays ascending (filtered from sorted)
  if (median <= 0) return null

  const count = others.length
  const delta = (price - median) / median
  if (Math.abs(delta) < DEAD_BAND) return { kind: 'near', pct: 0, count, median: Math.round(median) }

  const pct = Math.round(Math.abs(delta) * 100)
  // A delta just outside the dead-band can still round to 0; clamp to >= 1 so the
  // label always reads a real, non-zero percentage.
  return { kind: delta < 0 ? 'below' : 'above', pct: Math.max(1, pct), count, median: Math.round(median) }
}
