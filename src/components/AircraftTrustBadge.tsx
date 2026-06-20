'use client'

import { ShieldCheck } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { evaluateAircraftTrust, AIRCRAFT_TRUST_SIGNAL_COUNT } from '@/lib/aircraftTrust'

/**
 * Compact trust / completeness chip for an aircraft-for-sale listing.
 *
 * Slice 1 of the for-sale listing trust layer: makes trustworthiness VISIBLE.
 * Pure read of existing data; no ranking effect. Sky-blue accent only. Mirrors
 * the partnerships `TrustBadge` compact variant. The score is always a real
 * computed count (0–4), so the chip is never fake/empty.
 *
 * There is no for-sale per-listing detail page, so only the compact variant is
 * provided this slice (a checklist would have nowhere to render).
 */
export default function AircraftTrustBadge({ p }: { p: AircraftForSale }) {
  const { score, signals } = evaluateAircraftTrust(p)

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200"
      title={`Meets ${score} of ${AIRCRAFT_TRUST_SIGNAL_COUNT} trust signals: ${
        signals
          .filter((s) => s.met)
          .map((s) => s.label)
          .join(', ') || 'none yet'
      }`}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      {score}/{AIRCRAFT_TRUST_SIGNAL_COUNT} trust signals
    </span>
  )
}
