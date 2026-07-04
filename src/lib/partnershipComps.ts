import { resolveMakeModelFamily } from './seo'
import type { createServerSupabaseClient } from './supabase-server'
import type { Partnership, PartnershipSeeker, ShareType } from './types'

/**
 * Buy-in price comp helpers for partnership listings (read-only, pure — no DB, no React).
 *
 * Compares a partnership's buy-in price to the going rate of OTHER active
 * same-make-and-model-FAMILY partnerships on ClubHanger, normalized for share
 * size. Same honesty philosophy as aircraftComps.ts (families resolved via the
 * same `resolveMakeModelFamily` single source of truth, so a Cessna 172 is never
 * benchmarked against a Cessna 206 or Citation just because the make matches):
 *
 *  - Buy-in price alone isn't comparable across listings — a 1/8 share and a 1/2
 *    share of the same make are different products. Normalize every comp to its
 *    implied full-aircraft value (`buy_in_price × total_shares`) before taking the
 *    median, then scale back down to "what a share this size would cost" for the
 *    subject. Without this, a small fraction reads as a false "below market" deal
 *    purely because it's a smaller slice, not a better price.
 *  - Require MIN_OTHER_COMPS other same-family comps with a real buy-in price AND
 *    a known share count before publishing any comparison. Below that the median
 *    is too noisy, and a listing missing its own share count gets no verdict
 *    either (can't normalize what you can't scale).
 *  - A listing whose make+model doesn't resolve to a known family (via
 *    `resolveMakeModelFamily`) gets no verdict — self-suppress rather than fall
 *    back to a looser same-make-only comparison.
 *  - A ±DEAD_BAND window reads "Around market" rather than fabricating small-delta
 *    precision on what is effectively the going rate.
 *  - Percentages round to whole numbers.
 */

/** Resolved family key ("makeSlug/modelSlug") for a make+model pair, or null if
 *  it doesn't resolve to a known `SEO_MAKE_MODELS` family. */
function familyKeyFor(make: string | null | undefined, model: string | null | undefined): string | null {
  const fam = resolveMakeModelFamily(make, model)
  return fam ? `${fam.makeSlug}/${fam.modelSlug}` : null
}

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

/** One other comp's buy-in price + share count, for normalization. `year`/`ttaf`/`smoh`
 *  are optional — only `partnershipDealVerdict` (below) consults them; the plain
 *  whole-family comp (`partnershipBuyInComp`) ignores the extra fields. */
export interface PartnerCompInput {
  buyIn: number
  totalShares: number | null
  year?: number | null
  ttaf?: number | null
  smoh?: number | null
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

/* ────────────────────────────────────────────────────────────────────────────
 * Partnership Deal Check — the endorsement-style "good deal / fair / priced high"
 * verdict `partnershipBuyInComp` deliberately withholds, mirroring
 * `aircraftEstimate.ts`'s `clubHangerDealVerdict`. The whole-family comparison above
 * is honest only as a DESCRIPTIVE read because its comp set is the entire make+model
 * family — a buy-in gap there can simply mean this share is newer/lower-time, not a
 * bargain. This helper earns the right to a value judgement by first narrowing the
 * comp set to SIMILAR YEAR and SIMILAR HOURS (same bands as the aircraft-for-sale
 * version), same as before ALSO normalizing every comp to its implied full-aircraft
 * value before taking the median, so a smaller/larger fractional share is never
 * compared on raw buy-in dollars.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Minimum number of comps that fall inside BOTH the year and hours bands required
 *  before a value verdict is published. */
export const MIN_PARTNER_DEAL_COMPS = 4

/** A comp's year must be within ±this many years of the subject to count as
 *  "similar year". Matches the aircraft-for-sale Deal Check. */
export const PARTNER_DEAL_YEAR_BAND = 5

/** A comp's hours signal qualifies as "similar" when within the larger of an
 *  absolute and a relative band of the subject's hours. Matches the aircraft-for-sale
 *  Deal Check. */
export const PARTNER_DEAL_HOURS_ABS_BAND = 1000
export const PARTNER_DEAL_HOURS_REL_BAND = 0.35

/** Within ±this fraction of the narrowed expected buy-in we call it "Fair price". */
export const PARTNER_DEAL_DEAD_BAND = 0.05

export type PartnerDealVerdictKind = 'good' | 'fair' | 'high'

/** Which hours field a verdict's comp set was narrowed on. TTAF is preferred; SMOH is
 *  only used as a fallback when the subject has no TTAF — comps are narrowed on the
 *  SAME field, never mixed. */
export type PartnerHoursSignal = 'ttaf' | 'smoh'

export interface PartnershipDealCheck {
  /** Good deal (below the narrowed expected buy-in), Fair (inside the dead band), or
   *  Priced high (above it) — a genuine value judgement, controlled for year+hours. */
  verdict: PartnerDealVerdictKind
  /** Expected buy-in for a share this size, derived from the narrowed comps' median
   *  implied full-aircraft value (whole dollars). */
  median: number
  /** Number of comps inside BOTH the year and hours bands. */
  compCount: number
  /** Signed whole-dollar distance from the expected buy-in (negative = below). */
  deltaDollars: number
  /** Absolute whole-percent distance from the expected buy-in (>= 1 for non-fair). */
  deltaPct: number
  /** The ± year band actually used (for on-page copy). */
  yearBand: number
  /** Which hours field ('ttaf' or 'smoh') the comp set was narrowed on. */
  hoursSignal: PartnerHoursSignal
}

/** The subject listing being judged. `smoh` is an optional fallback hours signal, only
 *  consulted when `ttaf` is missing/invalid. */
export interface PartnerDealSubject {
  buyIn: number | null | undefined
  totalShares: number | null | undefined
  year: number | null | undefined
  ttaf: number | null | undefined
  smoh?: number | null | undefined
}

/** True when a comp's hours value is within the subject's similar-hours band. */
function partnerHoursWithinBand(subjectHours: number, compHours: number): boolean {
  const band = Math.max(PARTNER_DEAL_HOURS_ABS_BAND, subjectHours * PARTNER_DEAL_HOURS_REL_BAND)
  return Math.abs(compHours - subjectHours) <= band
}

/**
 * Compute the Partnership Deal Check verdict for one listing against OTHER active
 * same-family partnerships narrowed to similar year + similar hours, normalized for
 * share size (mirrors `partnershipBuyInComp`'s implied-full-value normalization).
 *
 * `comps` should already be narrowed to the subject's resolved make+model family and
 * exclude the subject's own row (same contract as `partnershipBuyInComp`).
 *
 * Returns null — no verdict — when the subject lacks a real buy-in / a share count
 * >= 2 / a year / any usable hours signal, or when fewer than MIN_PARTNER_DEAL_COMPS
 * comps fall inside both bands. Thin or uncontrolled data publishes nothing rather
 * than a misleading endorsement.
 */
export function partnershipDealVerdict(
  subject: PartnerDealSubject,
  comps: PartnerCompInput[]
): PartnershipDealCheck | null {
  const { buyIn, totalShares, year, ttaf, smoh } = subject
  if (!buyIn || buyIn <= 0) return null
  if (!totalShares || totalShares < 2) return null
  if (year == null || !Number.isFinite(year)) return null

  let hoursSignal: PartnerHoursSignal
  let subjectHours: number
  if (ttaf != null && Number.isFinite(ttaf) && ttaf >= 0) {
    hoursSignal = 'ttaf'
    subjectHours = ttaf
  } else if (smoh != null && Number.isFinite(smoh) && smoh >= 0) {
    hoursSignal = 'smoh'
    subjectHours = smoh
  } else {
    return null
  }

  const impliedValues: number[] = []
  for (const c of comps) {
    if (!c.buyIn || c.buyIn <= 0) continue
    if (!c.totalShares || c.totalShares < 2) continue
    if (c.year == null || !Number.isFinite(c.year)) continue
    if (Math.abs(c.year - year) > PARTNER_DEAL_YEAR_BAND) continue
    const compHours = hoursSignal === 'ttaf' ? c.ttaf : c.smoh
    if (compHours == null || !Number.isFinite(compHours) || compHours < 0) continue
    if (!partnerHoursWithinBand(subjectHours, compHours)) continue
    impliedValues.push(c.buyIn * c.totalShares)
  }
  if (impliedValues.length < MIN_PARTNER_DEAL_COMPS) return null

  impliedValues.sort((a, b) => a - b)
  const medianImplied = medianOfSorted(impliedValues)
  if (medianImplied <= 0) return null
  const expectedBuyIn = medianImplied / totalShares
  if (expectedBuyIn <= 0) return null

  const deltaDollars = Math.round(buyIn - expectedBuyIn)
  const delta = (buyIn - expectedBuyIn) / expectedBuyIn

  if (Math.abs(delta) < PARTNER_DEAL_DEAD_BAND) {
    return {
      verdict: 'fair',
      median: Math.round(expectedBuyIn),
      compCount: impliedValues.length,
      deltaDollars,
      deltaPct: 0,
      yearBand: PARTNER_DEAL_YEAR_BAND,
      hoursSignal,
    }
  }
  const deltaPct = Math.max(1, Math.round(Math.abs(delta) * 100))
  return {
    verdict: delta < 0 ? 'good' : 'high',
    median: Math.round(expectedBuyIn),
    compCount: impliedValues.length,
    deltaDollars,
    deltaPct,
    yearBand: PARTNER_DEAL_YEAR_BAND,
    hoursSignal,
  }
}

export interface PartnershipCompVerdict {
  kind: 'below' | 'above'
  pct: number
  median: number
  count: number
}

/** Combined browse/rail-card verdict — the narrowed year+hours Deal Check wins over the
 *  plain whole-family comp pill, mirroring `AircraftCompVerdict` in `aircraftComps.ts`. */
export interface PartnershipCardVerdict {
  comp: PartnershipCompVerdict | null
  dealVerdict: PartnershipDealCheck | null
}

/**
 * Batch-compute Deal Check / "below-above market" verdicts for a set of listings, one
 * DB query per unique make (so a browse page's whole card grid costs O(makes),
 * not O(listings)), then narrowed in-memory to the same resolved make+model
 * FAMILY before computing each verdict. Mirrors `getAircraftCompVerdicts`'s precedence:
 * the narrowed (similar-year/hours) `partnershipDealVerdict` wins when available, else the
 * plain family "vs market" pill, else nothing. Any browse surface rendering
 * `PartnershipCard` outside `PartnershipList` should call this so the proprietary comp
 * signal doesn't silently go missing there. "Near" verdicts are omitted (the card shows
 * nothing rather than a bland "around market" chip). A listing whose make+model doesn't
 * resolve to a known family gets no verdict. Fails soft — a query error yields an empty
 * map so callers render without chips rather than erroring the page.
 */
export async function getPartnershipCompVerdicts(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  listings: Partnership[]
): Promise<Map<string, PartnershipCardVerdict>> {
  const verdicts = new Map<string, PartnershipCardVerdict>()
  const uniqueMakes = [
    ...new Set(
      listings
        .filter((l) => l.buy_in_price && l.total_shares && l.total_shares >= 2 && l.make)
        .map((l) => l.make as string)
    ),
  ]
  if (uniqueMakes.length === 0) return verdicts

  type BaseCompRow = { id: string; buy_in_price: number; total_shares: number | null; model: string | null }
  const baseRows = new Map<string, BaseCompRow[]>()
  try {
    const priceResults = await Promise.all(
      uniqueMakes.map((make) =>
        supabase
          .from('partnerships')
          .select('id, buy_in_price, total_shares, model')
          .eq('status', 'active')
          .eq('make', make)
          .not('buy_in_price', 'is', null)
          .limit(200)
      )
    )
    uniqueMakes.forEach((make, i) => {
      baseRows.set(
        make,
        (priceResults[i].data ?? []).filter(
          (r): r is BaseCompRow => r.buy_in_price != null && r.buy_in_price > 0
        )
      )
    })
  } catch {
    // Non-fatal: caller renders cards without any comp chips.
  }

  // Narrowed Deal Check comps (+ year/ttaf/smoh) — a SEPARATE query/try-catch from the
  // base comp rows above: `ttaf`/`smoh` on `partnerships` are dormant behind a pending
  // migration (see `partnership-deal-check`'s detail-page panel), so a missing-column
  // error here must not take down the always-available whole-family comp pill.
  type DealCompRow = BaseCompRow & { year: number | null; ttaf: number | null; smoh: number | null }
  const dealRows = new Map<string, DealCompRow[]>()
  try {
    const dealResults = await Promise.all(
      uniqueMakes.map((make) =>
        supabase
          .from('partnerships')
          .select('id, buy_in_price, total_shares, model, year, ttaf, smoh')
          .eq('status', 'active')
          .eq('make', make)
          .not('buy_in_price', 'is', null)
          .limit(200)
      )
    )
    uniqueMakes.forEach((make, i) => {
      dealRows.set(
        make,
        (dealResults[i].data ?? []).filter(
          (r): r is DealCompRow => r.buy_in_price != null && r.buy_in_price > 0
        )
      )
    })
  } catch {
    // Non-fatal: the narrowed Deal Check chip stays dormant until the migration is applied.
  }

  for (const p of listings) {
    if (!p.buy_in_price || !p.make || !p.total_shares || p.total_shares < 2) continue
    const family = familyKeyFor(p.make, p.model)
    if (!family) continue

    const dRows = dealRows.get(p.make) ?? []
    const otherDealComps = dRows
      .filter((r) => r.id !== p.id && familyKeyFor(p.make, r.model) === family)
      .map((r) => ({ buyIn: r.buy_in_price, totalShares: r.total_shares, year: r.year, ttaf: r.ttaf, smoh: r.smoh }))
    const dealVerdict = partnershipDealVerdict(
      { buyIn: p.buy_in_price, totalShares: p.total_shares, year: p.year, ttaf: p.ttaf, smoh: p.smoh },
      otherDealComps
    )

    let comp: PartnershipCompVerdict | null = null
    if (!dealVerdict) {
      const bRows = baseRows.get(p.make) ?? []
      const otherComps = bRows
        .filter((r) => r.id !== p.id && familyKeyFor(p.make, r.model) === family)
        .map((r) => ({ buyIn: r.buy_in_price, totalShares: r.total_shares }))
      const rawComp = partnershipBuyInComp(p.buy_in_price, p.total_shares, otherComps)
      comp = rawComp && rawComp.kind !== 'near'
        ? { kind: rawComp.kind, pct: rawComp.pct, median: rawComp.median, count: rawComp.count }
        : null
    }

    if (dealVerdict || comp) verdicts.set(p.id, { comp, dealVerdict })
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
