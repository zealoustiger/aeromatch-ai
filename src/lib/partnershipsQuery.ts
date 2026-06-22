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
