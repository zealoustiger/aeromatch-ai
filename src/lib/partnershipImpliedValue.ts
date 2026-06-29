/**
 * Implied full-aircraft value check for partnership listings (pure, no DB, no React).
 *
 * A co-ownership buy-in multiplied by total shares gives an "implied" full-aircraft
 * value that a buyer can compare to what the same make/model actually sells for on
 * the open market. This is proprietary: no other listing site cross-references
 * partnership share math against the for-sale market.
 *
 * Honesty guardrails (same philosophy as aircraftComps.ts / partnershipComps.ts):
 *  - Require at least MIN_FORSALE_COMPS active priced for-sale listings before
 *    publishing any comparison — below that the median is too noisy.
 *  - A ±DEAD_BAND window reads "near market" to avoid false precision on a rough
 *    cross-silo comparison (buy-in can include reserves, maintenance float, etc.).
 *  - Require total_shares >= 2 (a 1-share "partnership" is unusual/edge-case).
 *  - Never call it a "market value" — always "implied value" with a caveat.
 */

export const MIN_FORSALE_COMPS = 4

/** ±10 % dead-band — wider than aircraft comps (5 %) because buy-in may include
 *  reserves or partnership overhead beyond proportional aircraft equity. */
export const DEAD_BAND = 0.10

export type ImpliedValueKind = 'below' | 'near' | 'above'

export interface ImpliedValueResult {
  /** buy_in_price × total_shares */
  impliedValue: number
  /** Median asking price from the for-sale family comp set */
  median: number
  /** impliedValue − median (negative = implied is below market) */
  deltaDollars: number
  /** Abs percent from median. 0 when kind === 'near'. */
  pct: number
  kind: ImpliedValueKind
  /** Number of for-sale comps used in the median */
  count: number
}

/** Median of a non-empty ascending numeric array. */
function medianOfSorted(sorted: number[]): number {
  const n = sorted.length
  const mid = Math.floor(n / 2)
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Compare an implied aircraft value (buy_in × total_shares) against the median
 * asking price of same-make/model aircraft currently for sale.
 *
 * Returns null (→ signal row self-suppresses) when:
 *  - buyIn or totalShares is null/zero,
 *  - totalShares < 2 (not a real co-ownership scenario),
 *  - forSalePrices has fewer than MIN_FORSALE_COMPS positive entries.
 */
export function computeImpliedValueCheck(
  buyIn: number | null,
  totalShares: number | null,
  forSalePrices: number[],
): ImpliedValueResult | null {
  if (!buyIn || buyIn <= 0) return null
  if (!totalShares || totalShares < 2) return null

  const valid = forSalePrices.filter((p) => p > 0 && Number.isFinite(p))
  if (valid.length < MIN_FORSALE_COMPS) return null

  const impliedValue = buyIn * totalShares
  const sorted = [...valid].sort((a, b) => a - b)
  const median = medianOfSorted(sorted)
  if (median <= 0) return null

  const delta = (impliedValue - median) / median
  const deltaDollars = Math.round(impliedValue - median)

  if (Math.abs(delta) < DEAD_BAND) {
    return {
      impliedValue: Math.round(impliedValue),
      median: Math.round(median),
      deltaDollars,
      pct: 0,
      kind: 'near',
      count: valid.length,
    }
  }

  const pct = Math.max(1, Math.round(Math.abs(delta) * 100))
  return {
    impliedValue: Math.round(impliedValue),
    median: Math.round(median),
    deltaDollars,
    pct,
    kind: delta < 0 ? 'below' : 'above',
    count: valid.length,
  }
}
