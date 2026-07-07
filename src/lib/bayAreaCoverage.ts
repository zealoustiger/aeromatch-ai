import { createAdminClient } from '@/lib/supabase-admin'
import { PARTS_TITLE_PATTERNS } from '@/lib/partsFilter'
import { BAY_AREA_AIRPORTS } from '@/lib/parseListing'

// Same floor the public sitemap/browse queries use — real, priced aircraft only.
const AIRCRAFT_PRICE_FLOOR = 50_000

// aircraft_for_sale has no ICAO column (free-text `location` + `state` only), so
// matching Bay Area rows there is approximate — city/airport keywords, not exact.
const BAY_AREA_LOCATION_TERMS = [
  'bay area', 'san francisco', 'oakland', 'hayward', 'palo alto', 'san jose',
  'livermore', 'san carlos', 'moffett', 'concord', 'napa', 'santa clara',
  'berkeley', 'san mateo', 'peninsula', 'marin', 'santa rosa', 'sonoma',
  ...BAY_AREA_AIRPORTS.map((icao) => icao.toLowerCase()),
]

export interface BayAreaCoverageSnapshot {
  partnerships: number
  aircraftForSale: number
  aircraftForSaleNote: string
  computedAt: string
}

/**
 * Numerator-only Bay Area coverage: how much of our OWN live inventory sits at/near
 * the 11 Bay Area airports today. No denominator (real market size) yet — that needs
 * external data (FAA fleet counts or a de-duped competitor count), so this never
 * computes or shows a coverage percentage.
 */
export async function getBayAreaCoverageSnapshot(): Promise<BayAreaCoverageSnapshot> {
  const admin = createAdminClient()

  const { count: partnershipsCount } = await admin
    .from('partnerships')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .in('home_airport', BAY_AREA_AIRPORTS)

  let forSaleQuery = admin
    .from('aircraft_for_sale')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('state', 'CA')
    .gte('asking_price', AIRCRAFT_PRICE_FLOOR)
  for (const pattern of PARTS_TITLE_PATTERNS) {
    forSaleQuery = forSaleQuery.not('title', 'ilike', pattern)
  }
  forSaleQuery = forSaleQuery.or(BAY_AREA_LOCATION_TERMS.map((t) => `location.ilike.%${t}%`).join(','))
  const { count: aircraftForSaleCount } = await forSaleQuery

  return {
    partnerships: partnershipsCount ?? 0,
    aircraftForSale: aircraftForSaleCount ?? 0,
    aircraftForSaleNote:
      'Approximate — matched by Bay Area city/airport keywords in the free-text location field (no ICAO column on this table).',
    computedAt: new Date().toISOString(),
  }
}
