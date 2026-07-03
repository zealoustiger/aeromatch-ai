import type { createServerSupabaseClient } from './supabase-server'
import type { Partnership, PartnershipSeeker, ShareType } from './types'

/**
 * Buy-in price comp helpers for partnership listings (read-only, pure — no DB, no React).
 *
 * Compares a partnership's buy-in price to the going rate of OTHER active
 * same-make partnerships on ClubHanger, normalized for share size. Same honesty
 * philosophy as aircraftComps.ts:
 *
 *  - Buy-in price alone isn't comparable across listings — a 1/8 share and a 1/2
 *    share of the same make are different products. Normalize every comp to its
 *    implied full-aircraft value (`buy_in_price × total_shares`) before taking the
 *    median, then scale back down to "what a share this size would cost" for the
 *    subject. Without this, a small fraction reads as a false "below market" deal
 *    purely because it's a smaller slice, not a better price.
 *  - Require MIN_OTHER_COMPS other same-make comps with a real buy-in price AND a
 *    known share count before publishing any comparison. Below that the median is
 *    too noisy, and a listing missing its own share count gets no verdict either
 *    (can't normalize what you can't scale).
 *  - A ±DEAD_BAND window reads "Around market" rather than fabricating small-delta
 *    precision on what is effectively the going rate.
 *  - Percentages round to whole numbers.
 */

/** Minimum number of OTHER same-make active partnerships with a buy-in price and
 *  known share count required before we publish a comparison. Below this
 *  threshold renders nothing. */
export const MIN_OTHER_COMPS = 4

/** Within ±5% of the expected buy-in we call it "around market" — avoids false precision. */
export const DEAD_BAND = 0.05

export type PartnerCompKind = 'below' | 'above' | 'near'

export interface PartnerCompResult {
  kind: PartnerCompKind
  /** Whole-number percent distance from the expected buy-in. 0 for "near". */
  pct: number
  /** Expected buy-in for a share this size, derived from the comp set's implied
   *  full-aircraft value (whole dollars) — NOT a raw median of comp buy-ins. */
  median: number
  /** Number of other partnerships used as comps. */
  count: number
  /** Delta in dollars (negative = below market). */
  deltaDollars: number
}

/** One other comp's buy-in price + share count, for normalization. */
export interface PartnerCompInput {
  buyIn: number
  totalShares: number | null
}

/** Median of an ascending numeric array. Caller guarantees length > 0. */
function medianOfSorted(sorted: number[]): number {
  const n = sorted.length
  const mid = Math.floor(n / 2)
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Compare one listing's buy-in to the going rate of OTHER same-make listings,
 * normalized by share size. Returns null (→ panel self-suppresses) when:
 *  - buyIn is null/zero,
 *  - totalShares is null or < 2 (can't normalize an unknown/whole-aircraft share),
 *  - or fewer than MIN_OTHER_COMPS other comps have both a real buy-in and a
 *    known share count (>= 2).
 *
 * `otherComps` should be the buy-in price + share count of all OTHER active
 * same-make partnerships — exclude the current listing's own row.
 */
export function partnershipBuyInComp(
  buyIn: number | null,
  totalShares: number | null,
  otherComps: PartnerCompInput[]
): PartnerCompResult | null {
  if (!buyIn || buyIn <= 0) return null
  if (!totalShares || totalShares < 2) return null

  // Normalize each comp to its implied full-aircraft value so different share
  // sizes are never compared on raw dollar price.
  const impliedValues = otherComps
    .filter((c) => c.buyIn > 0 && c.totalShares != null && c.totalShares >= 2)
    .map((c) => c.buyIn * (c.totalShares as number))
  if (impliedValues.length < MIN_OTHER_COMPS) return null

  const sorted = [...impliedValues].sort((a, b) => a - b)
  const medianImplied = medianOfSorted(sorted)
  if (medianImplied <= 0) return null

  // Scale the comp set's median full value back down to a share of the
  // subject's own size — the honest "expected buy-in" to compare against.
  const expectedBuyIn = medianImplied / totalShares
  if (expectedBuyIn <= 0) return null

  const delta = (buyIn - expectedBuyIn) / expectedBuyIn
  const deltaDollars = Math.round(buyIn - expectedBuyIn)

  if (Math.abs(delta) < DEAD_BAND) {
    return { kind: 'near', pct: 0, median: Math.round(expectedBuyIn), count: impliedValues.length, deltaDollars }
  }

  const pct = Math.max(1, Math.round(Math.abs(delta) * 100))
  return {
    kind: delta < 0 ? 'below' : 'above',
    pct,
    median: Math.round(expectedBuyIn),
    count: impliedValues.length,
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
      ...new Set(
        listings
          .filter((l) => l.buy_in_price && l.total_shares && l.total_shares >= 2 && l.make)
          .map((l) => l.make as string)
      ),
    ]
    if (uniqueMakes.length === 0) return verdicts

    const priceResults = await Promise.all(
      uniqueMakes.map((make) =>
        supabase
          .from('partnerships')
          .select('id, buy_in_price, total_shares')
          .eq('status', 'active')
          .eq('make', make)
          .not('buy_in_price', 'is', null)
          .limit(200)
      )
    )
    const makeRows = new Map<string, { id: string; buy_in_price: number; total_shares: number | null }[]>()
    uniqueMakes.forEach((make, i) => {
      makeRows.set(
        make,
        (priceResults[i].data ?? []).filter(
          (r): r is { id: string; buy_in_price: number; total_shares: number | null } =>
            r.buy_in_price != null && r.buy_in_price > 0
        )
      )
    })
    for (const p of listings) {
      if (!p.buy_in_price || !p.make || !p.total_shares || p.total_shares < 2) continue
      const rows = makeRows.get(p.make) ?? []
      const otherComps = rows
        .filter((r) => r.id !== p.id)
        .map((r) => ({ buyIn: r.buy_in_price, totalShares: r.total_shares }))
      const result = partnershipBuyInComp(p.buy_in_price, p.total_shares, otherComps)
      if (result && result.kind !== 'near') {
        verdicts.set(p.id, { kind: result.kind, pct: result.pct, median: result.median, count: result.count })
      }
    }
  } catch {
    // Non-fatal: caller renders cards without comp chips.
  }
  return verdicts
}

/** Maps a fractional share type to the share count `partnershipBuyInComp` needs to
 *  normalize against. Non-fractional types (leaseback/dry_lease/other) have no
 *  comparable share count, so they're intentionally excluded. */
const FRACTIONAL_SHARE_COUNTS: Partial<Record<ShareType, number>> = {
  '1/2': 2,
  '1/3': 3,
  '1/4': 4,
}

/**
 * Check whether a partnership seeker's stated budget (`max_buy_in`) is realistic
 * for the share size and make they're looking for, using the same share-size-
 * normalized comp math as `getPartnershipCompVerdicts`.
 *
 * Deliberately conservative — returns null (→ panel self-suppresses) unless the
 * seeker's intent is unambiguous:
 *  - exactly ONE preferred make (multiple makes → which one would we check?),
 *  - a `max_buy_in`,
 *  - exactly ONE fractional `preferred_share_types` entry (`1/2`/`1/3`/`1/4` — a
 *    seeker open to multiple share sizes or a non-fractional type like leaseback
 *    has no single share count to normalize against).
 * Below that, guessing would risk a confident-but-wrong verdict — exactly what
 * GOAL.md's honesty gate forbids.
 */
export async function getSeekerBudgetCheck(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  seeker: PartnershipSeeker
): Promise<{ make: string; shareType: ShareType; result: PartnerCompResult } | null> {
  if (!seeker.max_buy_in || seeker.max_buy_in <= 0) return null
  if (!seeker.preferred_makes || seeker.preferred_makes.length !== 1) return null
  const make = seeker.preferred_makes[0]
  if (!make) return null

  const fractionalTypes = (seeker.preferred_share_types ?? []).filter(
    (t): t is ShareType => t in FRACTIONAL_SHARE_COUNTS
  )
  if (fractionalTypes.length !== 1) return null
  const shareType = fractionalTypes[0]
  const shareCount = FRACTIONAL_SHARE_COUNTS[shareType]
  if (!shareCount) return null

  try {
    const { data } = await supabase
      .from('partnerships')
      .select('id, buy_in_price, total_shares')
      .eq('status', 'active')
      .eq('make', make)
      .not('buy_in_price', 'is', null)
      .limit(200)

    const otherComps = (data ?? [])
      .filter(
        (r): r is { id: string; buy_in_price: number; total_shares: number | null } =>
          r.buy_in_price != null && r.buy_in_price > 0
      )
      .map((r) => ({ buyIn: r.buy_in_price, totalShares: r.total_shares }))

    const result = partnershipBuyInComp(seeker.max_buy_in, shareCount, otherComps)
    if (!result) return null
    return { make, shareType, result }
  } catch {
    return null
  }
}

/** A seeker's unambiguous single preferred make + fractional share size, or null
 *  when the same honesty gates `getSeekerBudgetCheck` applies aren't met. */
function seekerIntent(seeker: PartnershipSeeker): { make: string; shareCount: number } | null {
  if (!seeker.max_buy_in || seeker.max_buy_in <= 0) return null
  if (!seeker.preferred_makes || seeker.preferred_makes.length !== 1) return null
  const make = seeker.preferred_makes[0]
  if (!make) return null
  const fractionalTypes = (seeker.preferred_share_types ?? []).filter(
    (t): t is ShareType => t in FRACTIONAL_SHARE_COUNTS
  )
  if (fractionalTypes.length !== 1) return null
  const shareCount = FRACTIONAL_SHARE_COUNTS[fractionalTypes[0]]
  if (!shareCount) return null
  return { make, shareCount }
}

/**
 * Batch sibling of `getSeekerBudgetCheck` for browse surfaces (`SeekerList`) — one
 * DB query per unique preferred make across all seekers on the page, instead of one
 * per seeker, mirroring `getPartnershipCompVerdicts`. "Near" verdicts are omitted,
 * matching the partnership card convention (the card shows nothing rather than a
 * bland "around market" chip). Fails soft — a query error yields an empty map.
 */
export async function getSeekerBudgetCheckVerdicts(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  seekers: PartnershipSeeker[]
): Promise<Map<string, PartnershipCompVerdict>> {
  const verdicts = new Map<string, PartnershipCompVerdict>()
  try {
    const intents = new Map<string, { make: string; shareCount: number }>()
    for (const s of seekers) {
      const intent = seekerIntent(s)
      if (intent) intents.set(s.id, intent)
    }
    if (intents.size === 0) return verdicts

    const uniqueMakes = [...new Set([...intents.values()].map((i) => i.make))]
    const priceResults = await Promise.all(
      uniqueMakes.map((make) =>
        supabase
          .from('partnerships')
          .select('id, buy_in_price, total_shares')
          .eq('status', 'active')
          .eq('make', make)
          .not('buy_in_price', 'is', null)
          .limit(200)
      )
    )
    const makeRows = new Map<string, { buy_in_price: number; total_shares: number | null }[]>()
    uniqueMakes.forEach((make, i) => {
      makeRows.set(
        make,
        (priceResults[i].data ?? []).filter(
          (r): r is { id: string; buy_in_price: number; total_shares: number | null } =>
            r.buy_in_price != null && r.buy_in_price > 0
        )
      )
    })

    for (const s of seekers) {
      const intent = intents.get(s.id)
      if (!intent) continue
      const otherComps = (makeRows.get(intent.make) ?? []).map((r) => ({
        buyIn: r.buy_in_price,
        totalShares: r.total_shares,
      }))
      const result = partnershipBuyInComp(s.max_buy_in as number, intent.shareCount, otherComps)
      if (result && result.kind !== 'near') {
        verdicts.set(s.id, { kind: result.kind, pct: result.pct, median: result.median, count: result.count })
      }
    }
  } catch {
    // Non-fatal: caller renders cards without budget-check chips.
  }
  return verdicts
}
