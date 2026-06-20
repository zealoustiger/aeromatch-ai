import type { AircraftForSale } from '@/lib/types'

/**
 * Aircraft-for-sale trust / completeness signals.
 *
 * The human's #1 differentiator: buyers trust listings that are filled-out,
 * disclose maintenance, name a real price, and are posted by a signed-up member.
 * This module makes that trustworthiness measurable from EXISTING
 * `aircraft_for_sale` columns — no schema change. It mirrors the
 * `partnershipTrust.ts` pattern (a flat signal table + a pure scorer) so it's
 * unit-testable and reusable across the for-sale card.
 *
 * Differences from the partnerships trust set (and why):
 * - `aircraft_for_sale` has NO image column (the card always renders a make
 *   placeholder), so there is no honest `real_photo` signal to port — porting it
 *   would leave it permanently false (fake/empty), which the runbook forbids.
 *   In its place we use buyer-relevant signals that DO exist on the schema:
 *   `maintenance_disclosed` (TTAF + SMOH) and `transparent_price` (a real number).
 *
 * NOTE: this is slice 1 (make trust VISIBLE). It does NOT affect ranking — that
 * is a later slice.
 */

export interface AircraftTrustSignal {
  key: 'complete_specs' | 'maintenance_disclosed' | 'transparent_price' | 'member_posted'
  /** Short label for the chip tooltip / future checklist. */
  label: string
  /** One-line "why this matters". */
  hint: string
  present: (p: AircraftForSale) => boolean
}

export const AIRCRAFT_TRUST_SIGNAL_COUNT = 4

/** The core specs a buyer needs to evaluate an aircraft, all filled in. */
function hasCompleteSpecs(p: AircraftForSale): boolean {
  const hasDescription = (p.description ?? '').trim().length >= 80
  return p.year != null && !!p.registration && !!p.make && !!p.model && hasDescription
}

/** Airframe + engine times disclosed — the numbers buyers actually need. */
function hasMaintenanceDisclosed(p: AircraftForSale): boolean {
  return p.ttaf != null && p.smoh != null
}

/** A concrete asking price, not just "contact for price". */
function hasTransparentPrice(p: AircraftForSale): boolean {
  return p.asking_price != null
}

/** Posted by a signed-up member (vs an imported / scraped aggregator listing). */
function isMemberPosted(p: AircraftForSale): boolean {
  return p.source === 'user'
}

export const AIRCRAFT_TRUST_SIGNALS: AircraftTrustSignal[] = [
  {
    key: 'complete_specs',
    label: 'Complete details',
    hint: 'Year, registration, make/model, and a full description.',
    present: hasCompleteSpecs,
  },
  {
    key: 'maintenance_disclosed',
    label: 'Maintenance disclosed',
    hint: 'Airframe (TTAF) and engine (SMOH) times are listed.',
    present: hasMaintenanceDisclosed,
  },
  {
    key: 'transparent_price',
    label: 'Transparent price',
    hint: 'A real asking price, not "contact for price".',
    present: hasTransparentPrice,
  },
  {
    key: 'member_posted',
    label: 'Posted by a member',
    hint: 'Listed by a signed-up ClubHanger member, not a scraped aggregator.',
    present: isMemberPosted,
  },
]

export interface AircraftTrustResult {
  /** How many of the signals are met (0–4). */
  score: number
  /** Each signal with its met/unmet state, in display order. */
  signals: { key: AircraftTrustSignal['key']; label: string; hint: string; met: boolean }[]
}

/** Pure, side-effect-free trust evaluation for a single for-sale listing. */
export function evaluateAircraftTrust(p: AircraftForSale): AircraftTrustResult {
  const signals = AIRCRAFT_TRUST_SIGNALS.map((s) => ({
    key: s.key,
    label: s.label,
    hint: s.hint,
    met: s.present(p),
  }))
  return { score: signals.filter((s) => s.met).length, signals }
}
