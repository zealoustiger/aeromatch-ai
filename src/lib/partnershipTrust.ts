import type { Partnership } from '@/lib/types'

/**
 * Partnership trust / completeness signals.
 *
 * The human's #1 differentiator: pilots trust listings that are filled-out,
 * on-platform, real-photo, and posted by a signed-up member. This module makes
 * that trustworthiness measurable from EXISTING `partnerships` columns — no
 * schema change. It mirrors the `listingQuality.ts` pattern (a flat signal
 * table + a pure scorer) so it's unit-testable and reusable across the card and
 * the detail page.
 *
 * NOTE: this is slice 1 (make trust VISIBLE). It does NOT affect ranking — that
 * is a later slice.
 */

export interface TrustSignal {
  key: 'real_photo' | 'complete_specs' | 'on_platform' | 'member_posted'
  /** Short label for the checklist on the detail page. */
  label: string
  /** One-line "why this matters" shown in the detail checklist. */
  hint: string
  present: (p: Partnership) => boolean
}

export const TRUST_SIGNAL_COUNT = 4

/** A real, uploaded photo (not the generic make placeholder). */
function hasRealPhoto(p: Partnership): boolean {
  return !!p.images?.[0] && p.image_is_placeholder !== true
}

/** The core specs a pilot needs to evaluate a share, all filled in. */
function hasCompleteSpecs(p: Partnership): boolean {
  const hasPrice = p.buy_in_price != null || p.monthly_fixed != null || p.hourly_wet != null
  const hasDescription = (p.description ?? '').trim().length >= 80
  return p.year != null && !!p.registration && hasPrice && hasDescription
}

/** Contact happens on ClubHanger — no off-platform "view original post" redirect. */
function isOnPlatform(p: Partnership): boolean {
  return !p.source_url
}

/** Posted by a signed-up member (vs an imported / scraped listing). */
function isMemberPosted(p: Partnership): boolean {
  return p.poster_id != null
}

export const TRUST_SIGNALS: TrustSignal[] = [
  {
    key: 'real_photo',
    label: 'Real photo of the aircraft',
    hint: 'A genuine photo, not a stock placeholder.',
    present: hasRealPhoto,
  },
  {
    key: 'complete_specs',
    label: 'Complete details',
    hint: 'Year, registration, pricing, and a full description.',
    present: hasCompleteSpecs,
  },
  {
    key: 'on_platform',
    label: 'Contact on ClubHanger',
    hint: 'Reach the owner here — no off-platform redirect.',
    present: isOnPlatform,
  },
  {
    key: 'member_posted',
    label: 'Posted by a member',
    hint: 'Listed by a signed-up ClubHanger member.',
    present: isMemberPosted,
  },
]

export interface TrustResult {
  /** How many of the signals are met (0–4). */
  score: number
  /** Each signal with its met/unmet state, in display order. */
  signals: { key: TrustSignal['key']; label: string; hint: string; met: boolean }[]
}

/** Pure, side-effect-free trust evaluation for a single partnership. */
export function evaluateTrust(p: Partnership): TrustResult {
  const signals = TRUST_SIGNALS.map((s) => ({
    key: s.key,
    label: s.label,
    hint: s.hint,
    met: s.present(p),
  }))
  return { score: signals.filter((s) => s.met).length, signals }
}
