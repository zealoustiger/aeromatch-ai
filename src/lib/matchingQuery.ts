import { getPartnershipListings } from '@/lib/partnershipsQuery'
import { getSeekers } from '@/lib/seekersQuery'
import { isCompatibleMatch } from '@/lib/matching'
import type { Partnership, PartnershipSeeker } from '@/lib/types'

/** Active pilots-seeking-a-partnership listings compatible with this partnership. */
export async function countMatchingSeekersForPartnership(partnership: Partnership): Promise<number> {
  const seekers = await getSeekers({})
  return seekers.filter((s) => isCompatibleMatch(s, partnership)).length
}

/** Active partnership listings compatible with this seeker's stated preferences. */
export async function countMatchingPartnershipsForSeeker(seeker: PartnershipSeeker): Promise<number> {
  const { listings } = await getPartnershipListings({})
  return listings.filter((p) => isCompatibleMatch(seeker, p)).length
}
