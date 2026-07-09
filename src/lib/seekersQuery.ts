import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAirportsWithinRadius } from '@/lib/airports'
import { MOCK_SEEKERS } from '@/lib/mockData'
import type { PartnershipSeeker } from '@/lib/types'
import { parsePreferredModelTokens, matchesModelFilter } from './seekerModelFilter'
import { evaluateSeekerTrust } from './seekerTrust'

export type SeekerFilters = {
  /** Multi-airport list (comma-joined ICAO codes), OR'd together. */
  airports?: string
  /** Legacy single airport (kept for old links / saved searches), optionally + radius. */
  airport?: string
  radius?: string
  state?: string
  make?: string
  /** Comma-joined model tokens, OR'd against the free-text `preferred_models` field. */
  model?: string
  rating?: string
  min_hours?: string
  share_type?: string
}

function hasSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!url && url !== 'https://placeholder.supabase.co'
}

export function anySeekerFilter(f: SeekerFilters): boolean {
  return Boolean(f.airports || f.airport || f.state || f.make || f.model || f.rating || f.min_hours || f.share_type)
}

/** Parse a comma-joined multi-select param ("Cessna,Cirrus") into a clean, de-duped
 *  list of exact stored values. Tolerates the legacy single-value form ("Cessna"). */
function parseMulti(raw: string | undefined): string[] {
  if (!raw) return []
  return [...new Set(raw.split(',').map((v) => v.trim()).filter(Boolean))]
}

/** Resolve the home-airport filter into a list of ICAO codes to OR over. Prefers
 *  the multi-airport `airports` param; falls back to the legacy single `airport`
 *  (optionally expanded by `radius`). A lone airport with a radius expands to every
 *  field within range; several airports are matched exactly (radius is ambiguous
 *  across multiple centers, so the UI only offers it for a single airport). */
async function resolveSeekerAirports(f: SeekerFilters): Promise<string[]> {
  const codes = parseMulti(f.airports ?? f.airport).map((c) => c.toUpperCase())
  if (codes.length === 1) {
    const radius = f.radius ? parseInt(f.radius, 10) : 0
    if (radius > 0) return getAirportsWithinRadius(codes[0], radius)
  }
  return codes
}

// Completeness-weighted ranking (mirrors `sortByTrust` in `AircraftSaleList.tsx` /
// `partnershipsQuery.ts`, shipped there 2026-07-06 / 2026-06-20): a stable sort surfaces
// fuller, more-trustworthy seeker listings first, with recency as the tie-break. Unlike
// those two, `getSeekers` has no explicit sort param to preserve — this replaces the
// plain newest-first order as the one and only ordering.
function sortByTrust(seekers: PartnershipSeeker[]): PartnershipSeeker[] {
  return seekers
    .map((s, i) => ({ s, i, score: evaluateSeekerTrust(s).score }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.s)
}

/** Pilots-seeking listings matching the active filters (trust-ranked, recency tie-break).
 *  Seeker fields are mostly arrays (preferred makes / ratings / share types), so those
 *  filters use array-contains; hours is a floor; location is airport±radius or state. */
export async function getSeekers(f: SeekerFilters): Promise<PartnershipSeeker[]> {
  // Make / Rating are multi-select (comma-joined params) → match seekers wanting
  // ANY of the chosen makes / holding ANY of the chosen ratings (OR semantics).
  const makes = parseMulti(f.make)
  const models = parseMulti(f.model)
  const ratings = parseMulti(f.rating)

  if (!hasSupabase()) {
    let r = MOCK_SEEKERS
    const codes = parseMulti(f.airports ?? f.airport).map((c) => c.toUpperCase())
    if (codes.length) r = r.filter((s) =>
      codes.includes((s.home_airport ?? '').toUpperCase()) ||
      (s.additional_airports ?? []).some((a) => codes.includes(a.toUpperCase()))
    )
    else if (f.state) r = r.filter((s) => s.state === f.state!.toUpperCase())
    if (makes.length) {
      const wanted = new Set(makes.map((m) => m.toLowerCase()))
      r = r.filter((s) => s.preferred_makes?.some((m) => wanted.has(m.toLowerCase())))
    }
    if (models.length) r = r.filter((s) => matchesModelFilter(s.preferred_models, models))
    if (ratings.length) {
      const wanted = new Set(ratings)
      r = r.filter((s) => s.ratings_held?.some((rt) => wanted.has(rt)))
    }
    if (f.share_type) r = r.filter((s) => (s.preferred_share_types ?? []).some((t) => t === f.share_type))
    if (f.min_hours) r = r.filter((s) => (s.total_hours ?? 0) >= parseInt(f.min_hours!, 10))
    return sortByTrust(r)
  }

  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('partnership_seekers')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Location: a home airport list (multi-airport, or a lone airport optionally
  // expanded by radius) wins over a plain state.
  const airportIcaos = await resolveSeekerAirports(f)
  if (airportIcaos.length) {
    // OR: match primary home_airport OR any entry in additional_airports (requires the
    // seeker_additional_airports migration; graceful fallback below if absent).
    const airportList = airportIcaos.join(',')
    query = query.or(
      `home_airport.in.(${airportList}),additional_airports.ov.{${airportList}}`
    )
  } else if (f.state?.trim()) {
    query = query.eq('state', f.state.trim().toUpperCase())
  }

  // `.overlaps` (array `&&`) = the seeker's array shares ≥1 element with the selected
  // set, i.e. they want ANY of the chosen makes / hold ANY of the chosen ratings.
  if (makes.length) query = query.overlaps('preferred_makes', makes)
  if (ratings.length) query = query.overlaps('ratings_held', ratings)
  if (f.share_type?.trim()) query = query.contains('preferred_share_types', [f.share_type.trim()])
  if (f.min_hours) {
    const n = parseInt(f.min_hours, 10)
    if (Number.isFinite(n) && n > 0) query = query.gte('total_hours', n)
  }

  const { data, error } = await query

  // Graceful degradation: if additional_airports column not yet migrated, retry with
  // home_airport-only (same pattern as createSeekerListing in actions.ts).
  if (error?.message?.includes('additional_airports') && airportIcaos.length) {
    let retry = supabase
      .from('partnership_seekers')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .in('home_airport', airportIcaos)
    if (makes.length) retry = retry.overlaps('preferred_makes', makes)
    if (ratings.length) retry = retry.overlaps('ratings_held', ratings)
    if (f.share_type?.trim()) retry = retry.contains('preferred_share_types', [f.share_type.trim()])
    if (f.min_hours) {
      const n = parseInt(f.min_hours, 10)
      if (Number.isFinite(n) && n > 0) retry = retry.gte('total_hours', n)
    }
    const { data: fallback } = await retry
    const fallbackRows = (fallback as PartnershipSeeker[]) ?? []
    return sortByTrust(
      models.length ? fallbackRows.filter((s) => matchesModelFilter(s.preferred_models, models)) : fallbackRows,
    )
  }

  const rows = (data as PartnershipSeeker[]) ?? []
  // Model has no DB column of its own (free-text `preferred_models`), so it's
  // matched in JS against the already-filtered rows rather than in SQL.
  return sortByTrust(models.length ? rows.filter((s) => matchesModelFilter(s.preferred_models, models)) : rows)
}

/** Makes that seekers are actually looking for (most-wanted first) — feeds the
 *  chip bar + the make filter so values match what's stored (exact array-contains). */
export async function getSeekerMakes(): Promise<string[]> {
  const rank = (lists: (string[] | null | undefined)[]): string[] => {
    const counts = new Map<string, number>()
    for (const list of lists) for (const raw of list ?? []) {
      const make = (raw ?? '').trim()
      if (make) counts.set(make, (counts.get(make) ?? 0) + 1)
    }
    return [...counts.keys()].sort((a, b) => (counts.get(b)! - counts.get(a)!) || a.localeCompare(b))
  }
  if (!hasSupabase()) return rank(MOCK_SEEKERS.map((s) => s.preferred_makes))
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('partnership_seekers')
      .select('preferred_makes')
      .eq('status', 'active')
      .limit(5000)
    return rank((data ?? []).map((r) => r.preferred_makes as string[] | null))
  } catch {
    return []
  }
}

/** Model tokens seekers are actually looking for (most-wanted first), parsed out of
 *  the free-text `preferred_models` field — feeds the Model filter's option list.
 *  Mirrors getSeekerMakes()'s ranking, but over comma-split tokens instead of an
 *  array column. */
export async function getSeekerModels(): Promise<string[]> {
  const rank = (values: (string | null | undefined)[]): string[] => {
    const counts = new Map<string, number>()
    for (const raw of values) for (const model of parsePreferredModelTokens(raw)) {
      counts.set(model, (counts.get(model) ?? 0) + 1)
    }
    return [...counts.keys()].sort((a, b) => (counts.get(b)! - counts.get(a)!) || a.localeCompare(b))
  }
  if (!hasSupabase()) return rank(MOCK_SEEKERS.map((s) => s.preferred_models))
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('partnership_seekers')
      .select('preferred_models')
      .eq('status', 'active')
      .limit(5000)
    return rank((data ?? []).map((r) => r.preferred_models as string | null))
  } catch {
    return []
  }
}

export async function getSeekerCount(): Promise<number> {
  if (!hasSupabase()) return MOCK_SEEKERS.length
  try {
    const supabase = await createServerSupabaseClient()
    const { count } = await supabase
      .from('partnership_seekers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    return count ?? 0
  } catch {
    return 0
  }
}

/**
 * Cross-sell data for the aircraft-for-sale / partnership detail pages: real
 * seeker demand for a make, optionally narrowed to a model. Mirrors
 * `getForSaleCrossSell`/`getPartnershipCrossSell`'s make→model-level fallback
 * shape (try model-level first, fall back to make-only) so a visitor sees
 * "N pilots looking for a Cessna 172" instead of just "N Cessnas" when there's
 * a model-level match, or the make-only figure when there isn't. Returns null
 * when make is blank or there are no matching active seekers (self-suppress —
 * the for-sale/partnership marketplaces have no mock-data fallback either).
 */
export async function getSeekerCrossSell(
  make: string,
  model?: string | null,
): Promise<{ count: number; modelLevel: boolean; samples: PartnershipSeeker[] } | null> {
  const m = make.trim()
  if (!m) return null
  const mo = model?.trim() || ''
  const wanted = m.toLowerCase()

  let pool: PartnershipSeeker[]
  if (!hasSupabase()) {
    pool = MOCK_SEEKERS
  } else {
    try {
      const supabase = await createServerSupabaseClient()
      const { data } = await supabase
        .from('partnership_seekers')
        .select('*')
        .eq('status', 'active')
        .limit(500)
      pool = (data as PartnershipSeeker[]) ?? []
    } catch {
      pool = []
    }
  }

  const makeMatches = pool.filter((s) => s.preferred_makes?.some((pm) => pm.toLowerCase() === wanted))
  if (!makeMatches.length) return null

  if (mo) {
    const modelMatches = makeMatches.filter((s) => matchesModelFilter(s.preferred_models, [mo]))
    if (modelMatches.length) {
      return { count: modelMatches.length, modelLevel: true, samples: sortByTrust(modelMatches).slice(0, 3) }
    }
  }
  return { count: makeMatches.length, modelLevel: false, samples: sortByTrust(makeMatches).slice(0, 3) }
}

/** Single active seeker listing by id, or null if missing/inactive. */
export async function getSeekerById(id: string): Promise<PartnershipSeeker | null> {
  if (!hasSupabase()) return MOCK_SEEKERS.find((s) => s.id === id) ?? null
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('partnership_seekers')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

/** Several seeker listings by id, in the SAME order as the input ids (mirrors
 *  `getPartnershipsByIds`/`getAircraftForSaleByIds`). Missing/inactive ids drop out. */
export async function getSeekersByIds(ids: string[]): Promise<PartnershipSeeker[]> {
  const results = await Promise.all(ids.map((id) => getSeekerById(id)))
  return results.filter((s): s is PartnershipSeeker => s !== null)
}
