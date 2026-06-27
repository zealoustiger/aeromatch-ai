import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAirportsWithinRadius } from '@/lib/airports'
import { Partnership } from '@/lib/types'
import { MOCK_PARTNERSHIPS } from '@/lib/mockData'
import { evaluateTrust } from '@/lib/partnershipTrust'

/**
 * Shared partnership-listing query for the partnership LIST surfaces.
 *
 * This is the SINGLE source of truth for "which active partnerships does a given
 * filter return, and in what order." Previously this fetch + trust-sort lived
 * privately inside `PartnershipList.tsx`; it's extracted here so a page can build
 * ItemList JSON-LD from the EXACT same result set the page visibly renders
 * (`/partnerships/state/[state]`, `/partnerships/make/[make]`) — no cloaking, no
 * divergence between the markup and the rendered cards.
 *
 * Behavior is byte-for-byte the same query/filters/limit/sort `PartnershipList`
 * used before; the component now calls this helper. Mock-data fallback preserved.
 */

export interface PartnershipFilters {
  airport?: string
  airports?: string
  radius?: string
  state?: string
  make?: string
  max_monthly?: string
  max_buyin?: string
  share_type?: string
}

/**
 * Slice 2 of the trust layer: float higher-trust listings up. Additive, stable
 * secondary sort — equal-trust listings keep recency order. (Moved verbatim from
 * PartnershipList.)
 */
function sortByTrust(listings: Partnership[]): Partnership[] {
  return listings
    .map((p, i) => ({ p, i, score: evaluateTrust(p).score }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.p)
}

export interface PartnershipQueryResult {
  /** Trust-sorted listings (same order the cards render in). */
  listings: Partnership[]
  /** Resolved airport list (multi-airport / radius expansion), for the count line. */
  airportList: string[]
  /** True when the DB query failed (component shows an error state). */
  error: boolean
}

/**
 * Resolve the airport filter list exactly as PartnershipList did: explicit
 * multi-airport input, OR a single airport optionally expanded by radius.
 */
async function resolveAirportList(filters: PartnershipFilters): Promise<string[]> {
  if (filters.airports) {
    return filters.airports
      .split(',')
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean)
  }
  if (filters.airport) {
    const radiusMiles = filters.radius ? parseInt(filters.radius) : 0
    if (radiusMiles > 0) {
      return getAirportsWithinRadius(filters.airport, radiusMiles)
    }
    return [filters.airport.toUpperCase()]
  }
  return []
}

/**
 * Fetch + trust-sort the active partnerships matching `filters`. Returns the
 * listings already in render order (so an ItemList built from them matches the
 * page 1:1), plus the resolved airport list and an error flag.
 */
export async function getPartnershipListings(
  filters: PartnershipFilters
): Promise<PartnershipQueryResult> {
  const airportList = await resolveAirportList(filters)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) {
    const listings = MOCK_PARTNERSHIPS.filter((p) => {
      if (airportList.length > 0 && !airportList.includes(p.home_airport)) return false
      if (filters.state && p.state !== filters.state) return false
      if (filters.make && !p.make.toLowerCase().includes(filters.make.toLowerCase())) return false
      if (filters.share_type && p.share_type !== filters.share_type) return false
      if (filters.max_monthly && (p.monthly_fixed ?? 0) > parseInt(filters.max_monthly)) return false
      if (filters.max_buyin && (p.buy_in_price ?? 0) > parseInt(filters.max_buyin)) return false
      return true
    })
    return { listings: sortByTrust(listings), airportList, error: false }
  }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('partnerships')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (airportList.length > 1) {
      query = query.in('home_airport', airportList)
    } else if (airportList.length === 1) {
      query = query.ilike('home_airport', `%${airportList[0]}%`)
    }

    if (filters.state) query = query.eq('state', filters.state)
    if (filters.make) query = query.ilike('make', `%${filters.make}%`)
    if (filters.share_type) query = query.eq('share_type', filters.share_type)
    if (filters.max_monthly) query = query.lte('monthly_fixed', parseInt(filters.max_monthly))
    if (filters.max_buyin) query = query.lte('buy_in_price', parseInt(filters.max_buyin))

    const { data, error: err } = await query.limit(50)
    if (err) return { listings: [], airportList, error: true }
    return { listings: sortByTrust(data ?? []), airportList, error: false }
  } catch {
    return { listings: [], airportList, error: true }
  }
}

function hasSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return Boolean(url && url !== 'https://placeholder.supabase.co')
}

/**
 * Count active partnerships for a make filter (the SEO_MAKES `filter` string, e.g.
 * "Cessna"), matched case-insensitively like the make hub page. Used by
 * `/partnerships/browse` to gate + label each make link so it never points at an
 * empty family. Mirrors `countForSaleState`; returns 0 on any failure. Mock-data
 * fallback when Supabase is unconfigured.
 */
export async function countPartnershipsByMake(filter: string): Promise<number> {
  if (!hasSupabase()) {
    return MOCK_PARTNERSHIPS.filter((p) =>
      p.make.toLowerCase().includes(filter.toLowerCase())
    ).length
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { count, error } = await supabase
      .from('partnerships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .ilike('make', `%${filter}%`)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

/**
 * Count active partnerships in a US state (USPS code, e.g. "CA"). Used by
 * `/partnerships/browse` to gate + label each state link. Mirrors
 * `countForSaleState`; returns 0 on any failure. Mock-data fallback when Supabase
 * is unconfigured.
 */
export async function countPartnershipsByState(code: string): Promise<number> {
  if (!hasSupabase()) {
    return MOCK_PARTNERSHIPS.filter((p) => p.state === code).length
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { count, error } = await supabase
      .from('partnerships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('state', code)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

/**
 * Count active partnerships, optionally narrowed to a make (case-insensitive
 * substring, like the make hub page). Used by the `/aircraft` cross-sell card to
 * show how many partnerships exist the other way (make-aware when a make filter is
 * active). Mirrors `countPartnershipsByMake`; returns 0 on any failure. Mock-data
 * fallback when Supabase is unconfigured.
 */
export async function countActivePartnerships(make?: string): Promise<number> {
  const m = make?.trim()
  if (!hasSupabase()) {
    return MOCK_PARTNERSHIPS.filter(
      (p) => !m || p.make.toLowerCase().includes(m.toLowerCase())
    ).length
  }
  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('partnerships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    if (m) query = query.ilike('make', `%${m}%`)
    const { count, error } = await query
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

/**
 * Cross-sell data for aircraft listing detail pages: count + minimum buy-in of
 * active partnerships for the same make, optionally narrowed to the same model.
 *
 * When `model` is supplied, first tries make+model (ILIKE on both). If ≥1 match
 * is found, returns those results with `modelLevel: true` so the caller can show
 * "3 Cessna 172 partnerships" instead of "6 Cessna partnerships."  Falls back to
 * make-only when no model-level matches exist. Returns null when make is blank or
 * no partnerships are found at either level.
 */
export async function getPartnershipCrossSell(
  make: string,
  model?: string | null,
): Promise<{ count: number; minBuyIn: number | null; modelLevel: boolean } | null> {
  const m = make.trim()
  if (!m) return null
  const mo = model?.trim() || ''

  if (!hasSupabase()) {
    // Model-level attempt first
    if (mo) {
      const modelMatches = MOCK_PARTNERSHIPS.filter(
        (p) =>
          p.make.toLowerCase().includes(m.toLowerCase()) &&
          p.model?.toLowerCase().includes(mo.toLowerCase()),
      )
      if (modelMatches.length) {
        const prices = modelMatches.map((p) => p.buy_in_price).filter((n): n is number => n != null)
        return { count: modelMatches.length, minBuyIn: prices.length ? Math.min(...prices) : null, modelLevel: true }
      }
    }
    // Make-level fallback
    const matches = MOCK_PARTNERSHIPS.filter((p) =>
      p.make.toLowerCase().includes(m.toLowerCase()),
    )
    if (!matches.length) return null
    const prices = matches.map((p) => p.buy_in_price).filter((n): n is number => n != null)
    return { count: matches.length, minBuyIn: prices.length ? Math.min(...prices) : null, modelLevel: false }
  }

  try {
    const supabase = await createServerSupabaseClient()

    // Model-level attempt: require both make AND model to match
    if (mo) {
      const { data: modelData, error: modelError } = await supabase
        .from('partnerships')
        .select('id, buy_in_price')
        .eq('status', 'active')
        .ilike('make', `%${m}%`)
        .ilike('model', `%${mo}%`)
        .limit(200)
      if (!modelError && modelData && modelData.length) {
        const prices = modelData.map((p) => p.buy_in_price).filter((n): n is number => n != null)
        return { count: modelData.length, minBuyIn: prices.length ? Math.min(...prices) : null, modelLevel: true }
      }
    }

    // Make-level fallback
    const { data, error } = await supabase
      .from('partnerships')
      .select('id, buy_in_price')
      .eq('status', 'active')
      .ilike('make', `%${m}%`)
      .limit(200)
    if (error || !data || !data.length) return null
    const prices = data.map((p) => p.buy_in_price).filter((n): n is number => n != null)
    return { count: data.length, minBuyIn: prices.length ? Math.min(...prices) : null, modelLevel: false }
  } catch {
    return null
  }
}

/**
 * Distinct aircraft makes that have active partnerships, ordered by listing count
 * (most-listed first). Read-time aggregation over the existing `make` column — no
 * schema, no extra tables — mirroring `getAircraftFacets`'s make logic. Used by the
 * `/partnerships` quick-filter chip bar so make chips only ever surface makes that
 * actually have listings (no empty-result chips). Mock-data fallback when Supabase
 * is unconfigured; returns [] on any failure.
 */
export async function getPartnershipMakes(): Promise<string[]> {
  // Skip placeholder/junk make values so the chip bar never surfaces a chip like
  // "Unknown" — they're real listings but not a useful quick filter.
  const JUNK_MAKES = new Set(['unknown', 'other', 'n/a', 'na', '-'])
  const rank = (rows: { make: string | null }[]): string[] => {
    const counts = new Map<string, number>()
    for (const row of rows) {
      const make = (row.make ?? '').trim()
      if (!make || JUNK_MAKES.has(make.toLowerCase())) continue
      counts.set(make, (counts.get(make) ?? 0) + 1)
    }
    return [...counts.keys()].sort((a, b) => {
      const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0)
      return diff !== 0 ? diff : a.localeCompare(b)
    })
  }

  if (!hasSupabase()) {
    return rank(MOCK_PARTNERSHIPS.map((p) => ({ make: p.make })))
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('partnerships')
      .select('make')
      .eq('status', 'active')
      .not('make', 'is', null)
      .limit(5000)
    if (error || !data) return []
    return rank(data)
  } catch {
    return []
  }
}
