import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AircraftForSale } from '@/lib/types'
import { resolveMakeModelFamily } from '@/lib/seo'
import { PARTS_TITLE_PATTERNS } from '@/lib/partsFilter'

/**
 * Single for-sale aircraft fetch by id. Mirrors `getPartnershipById` in
 * `src/lib/partnerships.ts` so the `/compare` view reuses one fetch path per
 * marketplace. Returns null for a missing/invalid id (the `/compare` page drops
 * those and handles the "fewer than asked for" case). No mock fallback: the
 * for-sale marketplace has no mock data, so without Supabase it returns null.
 */
export async function getAircraftForSaleById(id: string): Promise<AircraftForSale | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) return null

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('aircraft_for_sale')
      .select('*')
      .eq('id', id)
      .single()
    return data
  } catch {
    return null
  }
}

// Buyer-surface price floor for indexability: the verified sub-$50k for-sale rows
// are parts/projects ("M20C COWLING", "O-235 MAGS", rivet-gun kits), not flyable
// aircraft, and no-price rows are unsuitable as standalone detail pages. Gating the
// sitemap to priced real aircraft keeps Google's crawl budget on genuine listings
// (GOAL.md: no thin/junk/doorway pages).
const SITEMAP_PRICE_FLOOR = 50_000

/**
 * Rows (id + freshness inputs) of the active for-sale listings worth surfacing in
 * the sitemap as individual `/aircraft/listing/[id]` detail pages. Gated to
 * `status='active'` AND `asking_price >= SITEMAP_PRICE_FLOOR`, so the ~200 sub-$50k
 * parts/projects and the no-price rows never enter the sitemap. Paginated in
 * 1000-row batches so the result is NOT silently capped at PostgREST's default row
 * limit (the for-sale table can exceed 1000 priced rows). Internal try/catch →
 * `[]` on any failure, so a sitemap build never aborts on this query.
 */
export async function getForSaleListingSitemapRows(): Promise<
  { id: string; last_seen_at: string | null; created_at: string | null; price_changed_at: string | null }[]
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return []

  type Row = { id: string; last_seen_at: string | null; created_at: string | null; price_changed_at: string | null }
  try {
    const supabase = await createServerSupabaseClient()
    const PAGE = 1000
    const rows: Row[] = []
    for (let from = 0; ; from += PAGE) {
      let pageQuery = supabase
        .from('aircraft_for_sale')
        .select('id, last_seen_at, created_at, price_changed_at')
        .eq('status', 'active')
        .gte('asking_price', SITEMAP_PRICE_FLOOR)
      for (const pattern of PARTS_TITLE_PATTERNS) {
        pageQuery = pageQuery.not('title', 'ilike', pattern)
      }
      const { data, error } = await pageQuery
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error || !data || data.length === 0) break
      rows.push(...(data as Row[]))
      if (data.length < PAGE) break
    }
    return rows
  } catch {
    return []
  }
}

// Recency key for ranking ties: prefer the freshest listing (first_seen, then
// created). Unparseable/missing dates sort last (-Infinity).
function recencyMs(p: AircraftForSale): number {
  const raw = p.first_seen_at ?? p.created_at
  const t = raw ? new Date(raw).getTime() : NaN
  return Number.isNaN(t) ? -Infinity : t
}

/**
 * Rank same-make candidates for the "Similar aircraft" module: exact make+model
 * family match first, then same state, then a comparable price (within ±25%);
 * freshest listing breaks ties. Pure JS over rows already fetched.
 */
function rankSimilar(current: AircraftForSale, candidates: AircraftForSale[]): AircraftForSale[] {
  const curFamily = resolveMakeModelFamily(current.make, current.model)
  const curKey = curFamily ? `${curFamily.makeSlug}/${curFamily.modelSlug}` : null
  const curPrice = current.asking_price ?? null
  return candidates
    .map((p) => {
      const fam = resolveMakeModelFamily(p.make, p.model)
      const key = fam ? `${fam.makeSlug}/${fam.modelSlug}` : null
      let score = 0
      if (curKey && key === curKey) score += 4
      if (current.state && p.state && p.state === current.state) score += 2
      if (curPrice && p.asking_price && Math.abs(p.asking_price - curPrice) <= curPrice * 0.25) score += 1
      return { p, score }
    })
    .sort((a, b) => b.score - a.score || recencyMs(b.p) - recencyMs(a.p))
    .map((x) => x.p)
}

/**
 * "Similar aircraft for sale" for the listing detail page (Zillow/Redfin
 * "more like this"): real active same-make listings, excluding the current one,
 * gated to the same $50k buyer-quality floor the sitemap uses (no parts/junk),
 * ranked by `rankSimilar`. Returns [] (render nothing) when the listing has no
 * usable make or there are no sensible matches — never fabricates rows.
 */
export async function getSimilarAircraftForSale(
  current: AircraftForSale,
  limit = 3
): Promise<AircraftForSale[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return []

  const make = current.make?.trim()
  if (!make) return []

  try {
    const supabase = await createServerSupabaseClient()
    let simQuery = supabase
      .from('aircraft_for_sale')
      .select('*')
      .eq('status', 'active')
      .neq('id', current.id)
      .ilike('make', `%${make}%`)
      .gte('asking_price', SITEMAP_PRICE_FLOOR)
      .not('images', 'eq', '[]')
    for (const pattern of PARTS_TITLE_PATTERNS) {
      simQuery = simQuery.not('title', 'ilike', pattern)
    }
    const { data, error } = await simQuery.limit(40)
    if (error || !data) return []
    return rankSimilar(current, data).slice(0, limit)
  } catch {
    return []
  }
}

/**
 * Fetch several for-sale aircraft by id, returned in the SAME order as the input
 * ids (so the compare columns match the order the user picked). Missing/invalid
 * ids are silently dropped. Reuses `getAircraftForSaleById` (single source of
 * truth) rather than a new query path.
 */
export async function getAircraftForSaleByIds(ids: string[]): Promise<AircraftForSale[]> {
  const results = await Promise.all(ids.map((id) => getAircraftForSaleById(id)))
  return results.filter((p): p is AircraftForSale => p !== null)
}

/**
 * Raw asking prices of all ACTIVE, PRICED listings in one make+model family, used
 * by the listing detail page's "ClubHanger Estimate" comp set. The family is passed
 * as `make` + `modelPattern` (+ optional `notModelPattern`) — exactly the fields on
 * a resolved `SeoMakeModel` — so this comp set lines up with the make+model page's
 * "Market snapshot" (`priceStatsForMakeModel` uses the identical filter). Read-only,
 * no schema change; returns [] on any failure or when Supabase isn't configured.
 *
 * Note: no $50k floor here (unlike the sitemap/similar queries) — the estimate
 * compares against the genuine going rate of the whole priced family; the per-listing
 * pure helper applies its own honesty floors (min comps / dead band).
 */
export async function getFamilyAskingPrices(
  make: string,
  modelPattern: string,
  notModelPattern?: string
): Promise<number[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return []
  try {
    const supabase = await createServerSupabaseClient()
    const base = supabase
      .from('aircraft_for_sale')
      .select('asking_price')
      .eq('status', 'active')
      .ilike('make', `%${make}%`)
      .ilike('model', modelPattern)
      .not('asking_price', 'is', null)
      .gt('asking_price', 0)
      .limit(5000)
    const { data, error } = await (notModelPattern
      ? base.not('model', 'ilike', notModelPattern)
      : base)
    if (error || !data) return []
    return data
      .map((r) => r.asking_price as number | null)
      .filter((p): p is number => p != null && Number.isFinite(p) && p > 0)
  } catch {
    return []
  }
}

/**
 * Same-family active priced comps WITH year + total time, used by the listing detail
 * page's "ClubHanger Deal Check" (the similar-year + similar-hours value verdict). The
 * family filter mirrors `getFamilyAskingPrices` exactly, but this read also returns
 * `year`/`ttaf`/`first_seen_at` and EXCLUDES the subject listing by id (`excludeId`) so
 * the verdict's pure helper never has to undo a self-comparison. `first_seen_at` lets the
 * same comp set drive the relative days-on-market read (`computeDaysOnMarketContext`)
 * without a second DB round-trip; the deal-verdict helper ignores it. Read-only, no schema
 * change; returns [] on any failure or when Supabase isn't configured.
 */
export async function getFamilyComps(
  make: string,
  modelPattern: string,
  notModelPattern: string | undefined,
  excludeId: string
): Promise<{ asking_price: number | null; year: number | null; ttaf: number | null; first_seen_at: string | null }[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return []
  try {
    const supabase = await createServerSupabaseClient()
    const base = supabase
      .from('aircraft_for_sale')
      .select('asking_price, year, ttaf, first_seen_at')
      .eq('status', 'active')
      .neq('id', excludeId)
      .ilike('make', `%${make}%`)
      .ilike('model', modelPattern)
      .not('asking_price', 'is', null)
      .gt('asking_price', 0)
      .limit(5000)
    const { data, error } = await (notModelPattern
      ? base.not('model', 'ilike', notModelPattern)
      : base)
    if (error || !data) return []
    return data.map((r) => ({
      asking_price: r.asking_price as number | null,
      year: r.year as number | null,
      ttaf: r.ttaf as number | null,
      first_seen_at: r.first_seen_at as string | null,
    }))
  } catch {
    return []
  }
}

/**
 * Same-family active priced comps WITH id + year + total time, for batch deal-verdict
 * computation across multiple listings (e.g. the "Similar aircraft" rail). Unlike
 * `getFamilyComps`, there is no `excludeId` filter — the caller receives ALL active
 * priced comps for the family and self-excludes each subject by filtering `c.id !==
 * p.id` in JS, so one DB read serves N rail cards instead of N reads. Read-only, no
 * schema change; returns [] on any failure or when Supabase isn't configured.
 */
export async function getFamilyCompsForBatch(
  make: string,
  modelPattern: string,
  notModelPattern?: string
): Promise<{ id: string; asking_price: number | null; year: number | null; ttaf: number | null }[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return []
  try {
    const supabase = await createServerSupabaseClient()
    const base = supabase
      .from('aircraft_for_sale')
      .select('id, asking_price, year, ttaf')
      .eq('status', 'active')
      .ilike('make', `%${make}%`)
      .ilike('model', modelPattern)
      .not('asking_price', 'is', null)
      .gt('asking_price', 0)
      .limit(5000)
    const { data, error } = await (notModelPattern
      ? base.not('model', 'ilike', notModelPattern)
      : base)
    if (error || !data) return []
    return data.map((r) => ({
      id: r.id as string,
      asking_price: r.asking_price as number | null,
      year: r.year as number | null,
      ttaf: r.ttaf as number | null,
    }))
  } catch {
    return []
  }
}
