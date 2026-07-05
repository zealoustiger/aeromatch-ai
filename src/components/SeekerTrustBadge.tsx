import { ShieldCheck } from 'lucide-react'
import { PartnershipSeeker } from '@/lib/types'
import { evaluateSeekerTrust, SEEKER_TRUST_SIGNAL_COUNT } from '@/lib/seekerTrust'

/**
 * Compact trust / completeness chip for a "pilot seeking a partnership" listing.
 *
 * Slice 1 of the seeker trust layer: makes trustworthiness VISIBLE. Pure read
 * of existing data; no ranking effect. Mirrors `AircraftTrustBadge`'s original
 * compact-only shape — no seeker detail page slot for a checklist variant yet.
 */
export default function SeekerTrustBadge({ s }: { s: PartnershipSeeker }) {
  const { score, signals } = evaluateSeekerTrust(s)

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200"
      title={`Meets ${score} of ${SEEKER_TRUST_SIGNAL_COUNT} trust signals: ${
        signals
          .filter((sig) => sig.met)
          .map((sig) => sig.label)
          .join(', ') || 'none yet'
      }`}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      {score}/{SEEKER_TRUST_SIGNAL_COUNT} trust signals
    </span>
  )
}
