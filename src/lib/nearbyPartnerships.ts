import { createServerSupabaseClient } from './supabase-server'
import type { Partnership, Airport } from './types'

/**
 * Geo "partnerships near [airport]" query — the single source of truth for the
 * `/partnerships/near/[icao]` page family AND the sitemap entries for that family.
 *
 * Data shape (confirmed against the production DB, read-only):
 * - `partnerships.home_airport` is an ICAO string (e.g. "KPAO").
 * - The `airports` table (icao, name, city, state, lat, lng, …) holds the
 *   coordinates. A partnership's own lat/lng is mostly NULL, so — exactly like
 *   `/airports/[icao]` already does — we resolve each partnership's location from
 *   its home-airport record, then measure great-circle distance.
 *
 * HONESTY / thin-page guardrail (GOAL.md): a page only renders when it has real
 * nearby inventory (>= MIN_NEARBY partnerships within NEAR_RADIUS_NM). The route
 * 404s otherwise, and the sitemap emits ONLY the airports that clear the bar — so
 * no empty/doorway/near-duplicate pages get indexed.
 */

/** Great-circle radius for "near this airport," in nautical miles. */
export const NEAR_RADIUS_NM = 100

/** Minimum real nearby partnerships for a page to render / be in the sitemap. */
export const MIN_NEARBY = 2

/** Haversine distance in nautical miles. (Same formula as src/lib/airports.ts.) */
function haversineNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065 // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Fetch every airport (paginated past Supabase's 1000-row cap) as an ICAO map. */
async function loadAirportCoordMap(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<Map<string, Airport>> {
  const map = new Map<string, Airport>()
  let from = 0
  const PAGE = 1000
  for (;;) {
    const { data } = await supabase
      .from('airports')
      .select('icao, iata, name, city, state, lat, lng, elevation, type')
      .range(from, from + PAGE - 1)
    if (!data || data.length === 0) break
    for (const a of data) map.set((a.icao as string).toUpperCase(), a as Airport)
    if (data.length < PAGE) break
    from += PAGE
  }
  return map
}

export interface NearbyPartnership {
  p: Partnership
  /** Great-circle distance from the queried airport, in nautical miles (rounded). */
  distanceNm: number
}

export interface NearbyResult {
  airport: Airport
  results: NearbyPartnership[]
}

/**
 * Resolve the airport, fetch active partnerships, locate each via its home
 * airport, and return those within NEAR_RADIUS_NM sorted by distance ASC.
 * Returns null when the ICAO is unknown (→ caller 404s). An empty `results`
 * array means "known airport, no nearby inventory" (→ caller 404s on threshold).
 */
export async function getNearbyPartnerships(icao: string): Promise<NearbyResult | null> {
  const supabase = await createServerSupabaseClient()
  const code = icao.toUpperCase()

  const { data: airport } = await supabase
    .from('airports')
    .select('icao, iata, name, city, state, lat, lng, elevation, type')
    .eq('icao', code)
    .single()
  if (!airport || typeof airport.lat !== 'number' || typeof airport.lng !== 'number') return null

  const { data: parts } = await supabase
    .from('partnerships')
    .select('*')
    .eq('status', 'active')
  if (!parts || parts.length === 0) return { airport, results: [] }

  const coords = await loadAirportCoordMap(supabase)

  const results: NearbyPartnership[] = []
  for (const p of parts as Partnership[]) {
    // Prefer the partnership's own coords when present; else its home airport's.
    let lat = p.lat
    let lng = p.lng
    if (lat == null || lng == null) {
      const home = coords.get((p.home_airport ?? '').toUpperCase())
      if (home) {
        lat = home.lat
        lng = home.lng
      }
    }
    if (lat == null || lng == null) continue
    const distanceNm = haversineNm(airport.lat, airport.lng, lat, lng)
    if (distanceNm <= NEAR_RADIUS_NM) {
      results.push({ p, distanceNm: Math.round(distanceNm) })
    }
  }

  results.sort((a, b) => a.distanceNm - b.distanceNm || b.p.created_at.localeCompare(a.p.created_at))
  return { airport, results }
}

/**
/** A near-airport hub (>= MIN_NEARBY nearby partnerships) for the browse index. */
export interface NearAirportHub {
  /** lowercase ICAO, e.g. "khwd" — matches the /partnerships/near/[icao] route. */
  icao: string
  name: string
  city: string | null
  state: string | null
  /** nearby active partnerships within NEAR_RADIUS_NM. */
  count: number
}

/**
 * Shared source of truth: the airport hubs that have >= MIN_NEARBY real nearby
 * partnerships and therefore render a non-thin `/partnerships/near/[icao]` page.
 * Computed once over the full partnership set + airport coord map (no per-airport
 * DB round-trips). Both the sitemap (ICAOs only) and the browse hub (full details)
 * read from this, so they can never drift. Sorted by ICAO ascending.
 */
async function computeNearAirportHubs(): Promise<NearAirportHub[]> {
  const supabase = await createServerSupabaseClient()

  const { data: parts } = await supabase
    .from('partnerships')
    .select('home_airport, lat, lng, status')
    .eq('status', 'active')
  if (!parts || parts.length === 0) return []

  const coords = await loadAirportCoordMap(supabase)

  // Resolve each active partnership to a (lat, lng) point.
  const points: { lat: number; lng: number }[] = []
  for (const p of parts) {
    let lat = p.lat as number | null
    let lng = p.lng as number | null
    if (lat == null || lng == null) {
      const home = coords.get(((p.home_airport as string) ?? '').toUpperCase())
      if (home) {
        lat = home.lat
        lng = home.lng
      }
    }
    if (lat != null && lng != null) points.push({ lat, lng })
  }
  if (points.length === 0) return []

  // Candidate airports = the distinct home airports of the inventory (the genuine
  // hubs). For each, count nearby points; keep those clearing MIN_NEARBY. This
  // stays honest (only real hubs, not every airport that happens to be near the
  // cluster) and avoids near-duplicate sprawl across thousands of airports.
  const homeCodes = new Set<string>()
  for (const p of parts) {
    if (p.home_airport) homeCodes.add((p.home_airport as string).toUpperCase())
  }

  const out: NearAirportHub[] = []
  for (const code of homeCodes) {
    const a = coords.get(code)
    if (!a) continue
    let n = 0
    for (const pt of points) {
      if (haversineNm(a.lat, a.lng, pt.lat, pt.lng) <= NEAR_RADIUS_NM) n++
    }
    if (n >= MIN_NEARBY) {
      out.push({
        icao: code.toLowerCase(),
        name: a.name,
        city: a.city ?? null,
        state: a.state ?? null,
        count: n,
      })
    }
  }
  return out.sort((x, y) => x.icao.localeCompare(y.icao))
}

/**
 * Sitemap source of truth: the lowercase ICAOs that have >= MIN_NEARBY real
 * nearby partnerships and therefore render a non-thin page. Delegates to
 * `computeNearAirportHubs` so the sitemap and the browse hub stay in lockstep.
 */
export async function getNearAirportSitemapIcaos(): Promise<string[]> {
  return (await computeNearAirportHubs()).map((h) => h.icao)
}

/**
 * Full near-airport hub details (icao + name + place + nearby count) for the
 * `/partnerships/browse` "Near an airport" section. Same gated set as the sitemap.
 */
export async function getNearAirportHubs(): Promise<NearAirportHub[]> {
  return computeNearAirportHubs()
}
