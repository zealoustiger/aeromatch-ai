import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { evaluateAircraftTrust, type AircraftTrustSignal } from '@/lib/aircraftTrust'

/**
 * Owner-facing "Improve your listing" nudge for aircraft-for-sale listings —
 * the aircraft-side counterpart to `ListingOwnerNudge` (partnerships).
 *
 * Shown ONLY to the listing's owner (the parent server component gates on
 * poster_id), this names exactly which trust signals are still missing and
 * links to the listing's edit page. It REUSES `evaluateAircraftTrust` as the
 * single source of truth for what's missing — the signals are never
 * redefined here.
 */

/**
 * Action-oriented copy per signal key. Maps a *missing* signal (decided by
 * `evaluateAircraftTrust`) to what the owner can do about it. `member_posted`
 * is intrinsic to being the poster (you already are one), so it is never an
 * action item.
 */
const SIGNAL_ACTIONS: Partial<Record<AircraftTrustSignal['key'], string>> = {
  complete_specs: 'Fill in the year, registration, make/model, and a full description',
  maintenance_disclosed: 'Add airframe (TTAF) and engine (SMOH) hours',
  transparent_price: 'Add a real asking price',
}

export default function AircraftListingOwnerNudge({
  p,
  editHref,
}: {
  p: AircraftForSale
  editHref: string
}) {
  const { signals } = evaluateAircraftTrust(p)
  const todo = signals.filter((s) => !s.met && SIGNAL_ACTIONS[s.key])

  // Nothing actionable left — don't nag a complete listing.
  if (todo.length === 0) return null

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-sky-800">
        <Sparkles className="h-4 w-4" aria-hidden /> Improve your listing
      </h2>
      <p className="mt-1 text-sm text-sky-700">
        You own this listing. Completing these signals helps buyers trust it:
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
