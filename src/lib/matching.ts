import type { Partnership, PartnershipSeeker } from '@/lib/types'

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
