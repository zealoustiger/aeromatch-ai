import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Partnership } from '@/lib/types'
import { evaluateTrust, type TrustSignal } from '@/lib/partnershipTrust'

/**
 * Owner-facing "Improve your listing" nudge — slice 3 of the Listing trust layer.
 *
 * Shown ONLY to the listing's owner (the parent server component gates on
 * poster_id), this names exactly which trust signals are still missing and links
 * to the listing-management surface. It REUSES `evaluateTrust` from slice 1 as
 * the single source of truth for what's missing — the signals are never
 * redefined here.
 *
 * Tasteful, sky-blue, no dark patterns: no fake urgency, no modal, just an
 * inline card. Renders nothing when there's nothing actionable to improve.
 */

/**
 * Action-oriented copy per signal key. This maps a *missing* signal (decided by
 * `evaluateTrust`) to what the owner can do about it — it does NOT decide which
 * signals are missing. `member_posted` is intrinsic to being the poster (you
 * already are one), so it is never an action item.
 */
const SIGNAL_ACTIONS: Partial<Record<TrustSignal['key'], string>> = {
  real_photo: 'Add a real photo of the aircraft',
  complete_specs: 'Fill in the year, registration, pricing, and a full description',
  on_platform: 'Use on-platform contact so pilots can reach you here',
}

export default function ListingOwnerNudge({
  p,
  editHref,
}: {
  p: Partnership
  editHref: string
}) {
  const { signals } = evaluateTrust(p)
  const todo = signals.filter((s) => !s.met && SIGNAL_ACTIONS[s.key])

  // Nothing actionable left — don't nag a complete listing.
  if (todo.length === 0) return null

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-sky-800">
        <Sparkles className="h-4 w-4" aria-hidden /> Improve your listing
      </h2>
      <p className="mt-1 text-sm text-sky-700">
        You own this listing. Completing these signals helps pilots trust it:
      </p>
      <ul className="mt-3 space-y-2">
        {todo.map((s) => (
          <li key={s.key} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
            <span>{SIGNAL_ACTIONS[s.key]}</span>
          </li>
        ))}
      </ul>
      <Link
        href={editHref}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-900"
      >
        Update your listing <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
