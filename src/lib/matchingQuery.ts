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
