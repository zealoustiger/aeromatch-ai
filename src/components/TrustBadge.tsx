'use client'

import { ShieldCheck, Check, Circle } from 'lucide-react'
import { Partnership } from '@/lib/types'
import { evaluateTrust, TRUST_SIGNAL_COUNT } from '@/lib/partnershipTrust'
import { cn } from '@/lib/utils'

/**
 * Trust / completeness indicator for a partnership listing.
 *
 * - `variant="compact"` — a small "N/4 trust signals" chip for cards.
 * - `variant="checklist"` — an expanded checklist for the detail page.
 *
 * Slice 1 of the Listing trust layer: makes trustworthiness VISIBLE. Pure
 * read of existing data; no ranking effect. Sky-blue accent only.
 */
export default function TrustBadge({
  p,
  variant = 'compact',
}: {
  p: Partnership
  variant?: 'compact' | 'checklist'
}) {
  const { score, signals } = evaluateTrust(p)

  if (variant === 'compact') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200"
        title={`Meets ${score} of ${TRUST_SIGNAL_COUNT} trust signals: ${signals
          .filter((s) => s.met)
          .map((s) => s.label)
          .join(', ') || 'none yet'}`}
      >
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        {score}/{TRUST_SIGNAL_COUNT} trust signals
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
          {score}/{TRUST_SIGNAL_COUNT}
        </span>
      </div>
      <ul className="space-y-2.5">
        {signals.map((s) => (
          <li key={s.key} className="flex items-start gap-2">
            {s.met ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
            )}
            <span className="min-w-0">
              <span
                className={cn(
                  'text-sm font-medium',
                  s.met ? 'text-slate-800' : 'text-slate-400',
                )}
              >
                {s.label}
              </span>
              <span className="block text-xs text-slate-400">{s.hint}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
