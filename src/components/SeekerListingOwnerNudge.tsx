import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { PartnershipSeeker } from '@/lib/types'
import { evaluateSeekerTrust, type SeekerTrustSignal } from '@/lib/seekerTrust'

/**
 * Owner-facing "Improve your listing" nudge for "pilot seeking a partnership"
 * listings — the seeker-side counterpart to `ListingOwnerNudge` (partnerships)
 * and `AircraftListingOwnerNudge` (aircraft-for-sale).
 *
 * Shown ONLY to the listing's owner (the parent server component gates on
 * poster_id), this names exactly which trust signals are still missing and
 * links to the listing's edit page. It REUSES `evaluateSeekerTrust` as the
 * single source of truth for what's missing — the signals are never
 * redefined here.
 */

/**
 * Action-oriented copy per signal key. Maps a *missing* signal (decided by
 * `evaluateSeekerTrust`) to what the owner can do about it. `member_posted`
 * is intrinsic to being the poster (you already are one), so it is never an
 * action item.
 */
const SIGNAL_ACTIONS: Partial<Record<SeekerTrustSignal['key'], string>> = {
  aircraft_preference: 'Add a make, model, or category you’re looking for',
  budget_disclosed: 'Add your buy-in, monthly, or hourly budget',
  experience_disclosed: 'Add your total flight hours and ratings held',
}

export default function SeekerListingOwnerNudge({
  s,
  editHref,
}: {
  s: PartnershipSeeker
  editHref: string
}) {
  const { signals } = evaluateSeekerTrust(s)
  const todo = signals.filter((sig) => !sig.met && SIGNAL_ACTIONS[sig.key])

  // Nothing actionable left — don't nag a complete listing.
  if (todo.length === 0) return null

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-sky-800">
        <Sparkles className="h-4 w-4" aria-hidden /> Improve your listing
      </h2>
      <p className="mt-1 text-sm text-sky-700">
        You own this listing. Completing these signals helps owners trust it:
      </p>
      <ul className="mt-3 space-y-2">
        {todo.map((sig) => (
          <li key={sig.key} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
            <span>{SIGNAL_ACTIONS[sig.key]}</span>
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
