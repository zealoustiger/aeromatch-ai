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

  const delta = (price - median) / median
  if (Math.abs(delta) < DEAD_BAND) return { kind: 'near', pct: 0 }

  const pct = Math.round(Math.abs(delta) * 100)
  // A delta just outside the dead-band can still round to 0; clamp to >= 1 so the
  // label always reads a real, non-zero percentage.
  return { kind: delta < 0 ? 'below' : 'above', pct: Math.max(1, pct) }
}
