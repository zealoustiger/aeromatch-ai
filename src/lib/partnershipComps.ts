import type { createServerSupabaseClient } from './supabase-server'
import type { Partnership } from './types'

/**
 * Buy-in price comp helpers for partnership listings (read-only, pure — no DB, no React).
 *
 * Compares a partnership's buy-in price to the median buy-in of OTHER active
 * same-make partnerships on ClubHanger. Same honesty philosophy as aircraftComps.ts:
 *
 *  - Require MIN_OTHER_COMPS other same-make partnerships with a real buy-in price
 *    before publishing any comparison. Below that the median is too noisy.
 *  - A ±DEAD_BAND window reads "Around market" rather than fabricating small-delta
 *    precision on what is effectively the going rate.
 *  - Percentages round to whole numbers.
 */

/** Minimum number of OTHER same-make active partnerships with a buy-in price
 *  required before we publish a comparison. Below this threshold renders nothing. */
export const MIN_OTHER_COMPS = 4

/** Within ±5% of the median we call it "around market" — avoids false precision. */
export const DEAD_BAND = 0.05

export type PartnerCompKind = 'below' | 'above' | 'near'

export interface PartnerCompResult {
  kind: PartnerCompKind
  /** Whole-number percent distance from the median. 0 for "near". */
  pct: number
  /** Median buy-in of the comp set (whole dollars). */
  median: number
  /** Number of other partnerships used as comps. */
  count: number
  /** Delta in dollars (negative = below market). */
  deltaDollars: number
}

/** Median of an ascending numeric array. Caller guarantees length > 0. */
function medianOfSorted(sorted: number[]): number {
  const n = sorted.length
  const mid = Math.floor(n / 2)
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Compare one listing's buy-in to the median of OTHER same-make buy-ins.
 * Returns null (→ panel self-suppresses) when:
 *  - buyIn is null/zero,
 *  - or otherBuyIns has fewer than MIN_OTHER_COMPS positive values.
 *
 * `otherBuyIns` should be the buy-in prices of all OTHER active same-make
 * partnerships that have a buy-in price — exclude the current listing's own price.
 */
export function partnershipBuyInComp(
  buyIn: number | null,
  otherBuyIns: number[]
): PartnerCompResult | null {
  if (!buyIn || buyIn <= 0) return null

  const valid = otherBuyIns.filter((p) => p > 0)
  if (valid.length < MIN_OTHER_COMPS) return null

  const sorted = [...valid].sort((a, b) => a - b)
  const median = medianOfSorted(sorted)
  if (median <= 0) return null

  const delta = (buyIn - median) / median
  const deltaDollars = Math.round(buyIn - median)

  if (Math.abs(delta) < DEAD_BAND) {
    return { kind: 'near', pct: 0, median: Math.round(median), count: valid.length, deltaDollars }
  }

  const pct = Math.max(1, Math.round(Math.abs(delta) * 100))
  return {
    kind: delta < 0 ? 'below' : 'above',
    pct,
    median: Math.round(median),
    count: valid.length,
    deltaDollars,
  }
}

export interface PartnershipCompVerdict {
  kind: 'below' | 'above'
  pct: number
  median: number
  count: number
}

/**
 * Batch-compute "below/above market" buy-in verdicts for a set of listings, one
 * DB query per unique make (so a browse page's whole card grid costs O(makes),
 * not O(listings)). Mirrors the per-card comp chip on `/partnerships`; any
 * browse surface rendering `PartnershipCard` outside `PartnershipList` should
 * call this so the proprietary comp signal doesn't silently go missing there.
 * "Near" verdicts are omitted (the card shows nothing rather than a bland
 * "around market" chip). Fails soft — a query error yields an empty map so
 * callers render without chips rather than erroring the page.
 */
export async function getPartnershipCompVerdicts(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  listings: Partnership[]
): Promise<Map<string, PartnershipCompVerdict>> {
  const verdicts = new Map<string, PartnershipCompVerdict>()
  try {
    const uniqueMakes = [
      ...new Set(listings.filter((l) => l.buy_in_price && l.make).map((l) => l.make as string)),
    ]
    if (uniqueMakes.length === 0) return verdicts

    const priceResults = await Promise.all(
      uniqueMakes.map((make) =>
        supabase
          .from('partnerships')
          .select('id, buy_in_price')
          .eq('status', 'active')
          .eq('make', make)
          .not('buy_in_price', 'is', null)
          .limit(200)
      )
    )
    const makeRows = new Map<string, { id: string; buy_in_price: number }[]>()
    uniqueMakes.forEach((make, i) => {
      makeRows.set(
        make,
        (priceResults[i].data ?? []).filter(
          (r): r is { id: string; buy_in_price: number } => r.buy_in_price != null && r.buy_in_price > 0
        )
      )
    })
    for (const p of listings) {
      if (!p.buy_in_price || !p.make) continue
      const rows = makeRows.get(p.make) ?? []
      const otherBuyIns = rows.filter((r) => r.id !== p.id).map((r) => r.buy_in_price)
      const result = partnershipBuyInComp(p.buy_in_price, otherBuyIns)
      if (result && result.kind !== 'near') {
        verdicts.set(p.id, { kind: result.kind, pct: result.pct, median: result.median, count: result.count })
      }
    }
  } catch {
    // Non-fatal: caller renders cards without comp chips.
  }
  return verdicts
}
