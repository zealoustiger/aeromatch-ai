import Link from 'next/link'
import { ShieldCheck, Check, Circle } from 'lucide-react'
import { PartnershipSeeker } from '@/lib/types'
import { evaluateSeekerTrust, SEEKER_TRUST_SIGNAL_COUNT } from '@/lib/seekerTrust'
import { cn } from '@/lib/utils'

/**
 * Trust / completeness indicator for a "pilot seeking a partnership" listing.
 *
 * - `variant="compact"` (default) — a small "N/4 trust signals" chip for cards.
 * - `variant="checklist"` — an expanded checklist for the detail page, mirroring
 *   `AircraftTrustBadge`/`TrustBadge`'s checklist variant exactly.
 */
export default function SeekerTrustBadge({
  s,
  variant = 'compact',
}: {
  s: PartnershipSeeker
  variant?: 'compact' | 'checklist'
}) {
  const { score, signals } = evaluateSeekerTrust(s)

  if (variant === 'compact') {
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

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-sky-800">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Listing trust
        </h2>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
          {score}/{SEEKER_TRUST_SIGNAL_COUNT}
        </span>
      </div>
      <ul className="space-y-2.5">
        {signals.map((sig) => (
          <li key={sig.key} className="flex items-start gap-2">
            {sig.met ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
            )}
            <span className="min-w-0">
              <span
                className={cn(
                  'text-sm font-medium',
                  sig.met ? 'text-slate-800' : 'text-slate-400',
                )}
              >
                {sig.label}
              </span>
              <span className="block text-xs text-slate-400">{sig.hint}</span>
            </span>
          </li>
        ))}
      </ul>
      <Link
        href="/listing-quality"
        className="mt-3 inline-block text-xs font-medium text-sky-700 hover:text-sky-800 hover:underline"
      >
        What do these mean? →
      </Link>
    </div>
  )
}
