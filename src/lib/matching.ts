import type { Partnership, PartnershipSeeker } from '@/lib/types'

// Duplicated from src/lib/airports.ts / nearbyPartnerships.ts rather than imported: this
// module stays free of `@/`-alias value imports so its worked-example tests keep running
// directly under `node --experimental-strip-types --test` without path-alias resolution.
function haversineNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065 // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Honest compatibility check between a partnership listing and a pilot seeking a
 * partnership, using only columns both sides already store (no schema change).
 *
 * A criterion only counts against a match when BOTH sides have data to compare —
 * missing data is never treated as a mismatch. This mirrors the honesty-gate
 * convention the buyer-analysis modules already use (e.g. `partnershipBuyInComp`):
 * "not enough data" beats a confident-but-wrong no.
 */
export function isCompatibleMatch(seeker: PartnershipSeeker, partnership: Partnership): boolean {
  if (seeker.preferred_makes && seeker.preferred_makes.length > 0) {
    const wanted = new Set(seeker.preferred_makes.map((m) => m.toLowerCase()))
    if (!wanted.has(partnership.make.toLowerCase())) return false
  }

  if (seeker.max_buy_in != null && partnership.buy_in_price != null) {
    if (partnership.buy_in_price > seeker.max_buy_in) return false
  }
  if (seeker.max_monthly != null && partnership.monthly_fixed != null) {
    if (partnership.monthly_fixed > seeker.max_monthly) return false
  }
  if (seeker.max_hourly != null && partnership.hourly_wet != null) {
    if (partnership.hourly_wet > seeker.max_hourly) return false
  }

  if (partnership.min_hours != null && seeker.total_hours != null) {
    if (seeker.total_hours < partnership.min_hours) return false
  }
  if (partnership.ratings_required && partnership.ratings_required.length > 0 && seeker.ratings_held) {
    const held = new Set(seeker.ratings_held)
    if (!partnership.ratings_required.every((r) => held.has(r))) return false
  }

  if (seeker.preferred_share_types && seeker.preferred_share_types.length > 0) {
    if (!seeker.preferred_share_types.includes(partnership.share_type)) return false
  }

  return true
}

/**
 * Distance criterion for the matching engine: is `partnershipCoord` within the
 * seeker's stated `willingToTravelNm` of `seekerCoord`? Honesty-gated like every
 * `isCompatibleMatch` criterion above — a missing radius or an unresolvable
 * airport (either side) never disqualifies, it just means there's not enough
 * data to judge distance.
 */
export function isWithinTravelRadius(
  seekerCoord: { lat: number; lng: number } | undefined,
  partnershipCoord: { lat: number; lng: number } | undefined,
  willingToTravelNm: number | null
): boolean {
  if (willingToTravelNm == null || !seekerCoord || !partnershipCoord) return true
  return haversineNm(seekerCoord.lat, seekerCoord.lng, partnershipCoord.lat, partnershipCoord.lng) <= willingToTravelNm
}
