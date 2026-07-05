import type { PartnershipSeeker } from '@/lib/types'

/**
 * Seeker-listing trust / completeness signals ("pilot seeking a partnership").
 *
 * Mirrors the `aircraftTrust.ts`/`partnershipTrust.ts` pattern (a flat signal
 * table + a pure scorer) so it's unit-testable and reusable across cards. This
 * closes the last Pillar-3 gap: aircraft-for-sale and partnership listings
 * both have a trust/completeness read; seeker listings had none.
 *
 * Differences from the other two signal sets (and why): seekers have no price
 * or photo to disclose — they're the buyer, not the listing being bought. The
 * signals that matter here are the ones an owner needs to judge whether this
 * seeker is a real, qualified, serious match: what they're looking for, what
 * they can afford, and how experienced they are.
 */

export interface SeekerTrustSignal {
  key: 'aircraft_preference' | 'budget_disclosed' | 'experience_disclosed' | 'member_posted'
  /** Short label for the chip tooltip. */
  label: string
  /** One-line "why this matters". */
  hint: string
  present: (s: PartnershipSeeker) => boolean
}

export const SEEKER_TRUST_SIGNAL_COUNT = 4

/** A make, model, or aircraft category — not "any aircraft, no preference". */
function hasAircraftPreference(s: PartnershipSeeker): boolean {
  return !!(s.preferred_makes?.length || s.preferred_models || s.aircraft_category)
}

/** A real budget number, not left blank. */
function hasBudgetDisclosed(s: PartnershipSeeker): boolean {
  return s.max_buy_in != null || s.max_monthly != null || s.max_hourly != null
}

/** Total time AND at least one rating held — the qualification numbers owners need. */
function hasExperienceDisclosed(s: PartnershipSeeker): boolean {
  return s.total_hours != null && (s.ratings_held?.length ?? 0) > 0
}

/** Posted by a signed-up member (vs a seed/concierge profile). */
function isMemberPosted(s: PartnershipSeeker): boolean {
  return s.poster_id != null
}

export const SEEKER_TRUST_SIGNALS: SeekerTrustSignal[] = [
  {
    key: 'aircraft_preference',
    label: 'Aircraft preference stated',
    hint: 'A make, model, or category — not "any aircraft".',
    present: hasAircraftPreference,
  },
  {
    key: 'budget_disclosed',
    label: 'Budget disclosed',
    hint: 'A real buy-in, monthly, or hourly budget.',
    present: hasBudgetDisclosed,
  },
  {
    key: 'experience_disclosed',
    label: 'Experience disclosed',
    hint: 'Total flight time and ratings held are listed.',
    present: hasExperienceDisclosed,
  },
  {
    key: 'member_posted',
    label: 'Posted by a member',
    hint: 'Listed by a signed-up ClubHanger member.',
    present: isMemberPosted,
  },
]

export interface SeekerTrustResult {
  /** How many of the signals are met (0–4). */
  score: number
  /** Each signal with its met/unmet state, in display order. */
  signals: { key: SeekerTrustSignal['key']; label: string; hint: string; met: boolean }[]
}

/** Pure, side-effect-free trust evaluation for a single seeker listing. */
export function evaluateSeekerTrust(s: PartnershipSeeker): SeekerTrustResult {
  const signals = SEEKER_TRUST_SIGNALS.map((sig) => ({
    key: sig.key,
    label: sig.label,
    hint: sig.hint,
    met: sig.present(s),
  }))
  return { score: signals.filter((sig) => sig.met).length, signals }
}
