import { getPartnershipListings } from '@/lib/partnershipsQuery'
import { getSeekers } from '@/lib/seekersQuery'
import { isCompatibleMatch, isWithinTravelRadius } from '@/lib/matching'
import { resolveAirportCoords } from '@/lib/airports'
import type { Partnership, PartnershipSeeker } from '@/lib/types'

/** Active pilots-seeking-a-partnership listings compatible with this partnership. */
export async function countMatchingSeekersForPartnership(partnership: Partnership): Promise<number> {
  const seekers = await getSeekers({})
  const compatible = seekers.filter((s) => isCompatibleMatch(s, partnership))

  const coords = await resolveAirportCoords([partnership.home_airport, ...compatible.map((s) => s.home_airport)])
  const partnershipCoord = coords[partnership.home_airport.toUpperCase()]

  return compatible.filter((s) =>
    isWithinTravelRadius(coords[s.home_airport.toUpperCase()], partnershipCoord, s.willing_to_travel_nm)
  ).length
}

/** Active partnership listings compatible with this seeker's stated preferences. */
export async function countMatchingPartnershipsForSeeker(seeker: PartnershipSeeker): Promise<number> {
  const { listings } = await getPartnershipListings({})
  const compatible = listings.filter((p) => isCompatibleMatch(seeker, p))

  const coords = await resolveAirportCoords([seeker.home_airport, ...compatible.map((p) => p.home_airport)])
  const seekerCoord = coords[seeker.home_airport.toUpperCase()]

  return compatible.filter((p) =>
    isWithinTravelRadius(seekerCoord, coords[p.home_airport.toUpperCase()], seeker.willing_to_travel_nm)
  ).length
}

/** Default proxy radius (miles) used when linking from a partnership to the seeker
 *  browse page — the seeker's own `willing_to_travel_nm` isn't knowable from the
 *  partnership side, so this is a generous stand-in, not the exact criterion. */
const DEFAULT_MATCH_LINK_RADIUS_MI = 100

/**
 * "Browse them" href for a partnership's match nudge → `/partnerships/seeking`,
 * carrying every dimension `isCompatibleMatch`/`isWithinTravelRadius` actually check
 * that the seeker browse page (`seekersQuery.ts`) can filter by, so the destination
 * list matches (or is a close superset of) the count that linked here. Skips `model`
 * (not part of the compatibility check — adding it would under-count vs. the shown
 * number) and the seeker's own budget ceilings (not filterable from this side).
 */
export function seekerBrowseHrefForPartnership(p: Partnership): string {
  const params = new URLSearchParams()
  params.set('make', p.make)
  if (p.home_airport) {
    params.set('airport', p.home_airport)
    params.set('radius', String(DEFAULT_MATCH_LINK_RADIUS_MI))
  }
  if (p.min_hours != null) params.set('min_hours', String(p.min_hours))
  if (p.ratings_required && p.ratings_required.length > 0) {
    params.set('rating', p.ratings_required.join(','))
  }
  params.set('share_type', p.share_type)
  return `/partnerships/seeking?${params.toString()}`
}

/**
 * "Browse them" href for a seeker's match nudge → `/partnerships`, carrying every
 * dimension `isCompatibleMatch`/`isWithinTravelRadius` check that the partnership
 * browse page (`partnershipsQuery.ts`) can filter by. Unlike the reverse direction,
 * airport/radius here IS the exact criterion (the seeker's own home airport + stated
 * travel radius). `make`/`share_type` only carry over when the seeker has exactly one
 * preferred value — `/partnerships` has no multi-value OR for either, so a narrower
 * (still-correct) link beats a falsely-broad one.
 */
export function partnershipBrowseHrefForSeeker(s: PartnershipSeeker): string {
  const params = new URLSearchParams()
  if (s.preferred_makes && s.preferred_makes.length === 1) params.set('make', s.preferred_makes[0])
  if (s.home_airport) {
    params.set('airport', s.home_airport)
    params.set('radius', String(s.willing_to_travel_nm ?? DEFAULT_MATCH_LINK_RADIUS_MI))
  }
  if (s.max_buy_in != null) params.set('max_buyin', String(s.max_buy_in))
  if (s.max_monthly != null) params.set('max_monthly', String(s.max_monthly))
  if (s.preferred_share_types && s.preferred_share_types.length === 1) {
    params.set('share_type', s.preferred_share_types[0])
  }
  const qs = params.toString()
  return qs ? `/partnerships?${qs}` : '/partnerships'
}
