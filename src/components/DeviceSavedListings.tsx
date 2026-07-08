'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Plane, Smartphone, ArrowRight } from 'lucide-react'
import PartnershipCard from './PartnershipCard'
import AircraftSaleCard from './AircraftSaleCard'
import SeekerCard from './SeekerCard'
import { getLocalSaves, LOCAL_SAVES_EVENT } from '@/lib/localSaves'
import { hydrateDeviceSaves } from '@/app/actions'
import type { Partnership, AircraftForSale, PartnershipSeeker } from '@/lib/types'
import type { AircraftCompVerdict } from '@/lib/aircraftComps'
import type { PartnershipCardVerdict, PartnershipCompVerdict } from '@/lib/partnershipComps'

/**
 * Slice 3 of soft-save. The logged-out view of `/saved`. A visitor who soft-saved
 * listings to this device (slice 1, localStorage) sees them here — with an honest
 * "saved on this device only" notice and a push to create an account to keep them —
 * instead of being bounced to /auth. Renders nothing server-side (saves live in the
 * browser); hydrates on mount via a read-only server action.
 *
 * Stays live: un-saving a card here fires LOCAL_SAVES_EVENT, and we re-read the
 * device store and drop the un-saved card without a reload.
 */
export default function DeviceSavedListings() {
  const [loading, setLoading] = useState(true)
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [aircraft, setAircraft] = useState<AircraftForSale[]>([])
  const [seekers, setSeekers] = useState<PartnershipSeeker[]>([])
  // Real, honesty-gated social-proof/deal signals — same helpers the logged-in
  // `/saved` page uses, keyed by listing id (plain objects: server-action-safe).
  const [partnershipSaveCounts, setPartnershipSaveCounts] = useState<Record<string, number>>({})
  const [aircraftSaveCounts, setAircraftSaveCounts] = useState<Record<string, number>>({})
  const [seekerSaveCounts, setSeekerSaveCounts] = useState<Record<string, number>>({})
  const [partnershipVerdicts, setPartnershipVerdicts] = useState<Record<string, PartnershipCardVerdict>>({})
  const [aircraftVerdicts, setAircraftVerdicts] = useState<Record<string, AircraftCompVerdict>>({})
  const [seekerBudgetVerdicts, setSeekerBudgetVerdicts] = useState<Record<string, PartnershipCompVerdict>>({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Newest-saved first (store appends, so reverse) to match the logged-in view.
      const saves = getLocalSaves().reverse()
      if (saves.length === 0) {
        if (!cancelled) {
          setPartnerships([])
          setAircraft([])
          setSeekers([])
          setLoading(false)
        }
        return
      }
      const result = await hydrateDeviceSaves(saves)
      if (cancelled) return
      setPartnerships(result.partnerships)
      setAircraft(result.aircraft)
      setSeekers(result.seekers)
      setPartnershipSaveCounts(result.partnershipSaveCounts)
      setAircraftSaveCounts(result.aircraftSaveCounts)
      setSeekerSaveCounts(result.seekerSaveCounts)
      setPartnershipVerdicts(result.partnershipVerdicts)
      setAircraftVerdicts(result.aircraftVerdicts)
      setSeekerBudgetVerdicts(result.seekerBudgetVerdicts)
      setLoading(false)
    }

    load()

    // When any heart on this page toggles a device save, prune the now-unsaved
    // cards from the lists in place (no refetch needed for removals).
    const onChange = () => {
      const ids = new Set(getLocalSaves().map((s) => `${s.type}:${s.id}`))
      setPartnerships((prev) => prev.filter((p) => ids.has(`partnership:${p.id}`)))
      setAircraft((prev) => prev.filter((a) => ids.has(`aircraft:${a.id}`)))
      setSeekers((prev) => prev.filter((s) => ids.has(`seeker:${s.id}`)))
    }
    window.addEventListener(LOCAL_SAVES_EVENT, onChange)
    return () => {
      cancelled = true
      window.removeEventListener(LOCAL_SAVES_EVENT, onChange)
    }
  }, [])

  const total = partnerships.length + aircraft.length + seekers.length

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">Loading your saved listings…</div>
    )
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
        <Heart className="mx-auto mb-3 h-8 w-8 text-slate-300" />
        <p className="font-medium text-slate-600">No saved listings yet</p>
        <p className="mt-1 text-sm text-slate-400">
          Browse{' '}
          <Link href="/partnerships" className="text-sky-600 underline-offset-2 hover:underline">
            partnerships
          </Link>
          ,{' '}
          <Link href="/aircraft" className="text-sky-600 underline-offset-2 hover:underline">
            aircraft for sale
          </Link>{' '}
          or{' '}
          <Link href="/partnerships/seeking" className="text-sky-600 underline-offset-2 hover:underline">
            pilots seeking a partnership
          </Link>{' '}
          and tap the{' '}
          <Heart className="inline-block h-3.5 w-3.5 -translate-y-px text-sky-500" aria-hidden="true" />{' '}
          on any listing to save it.
        </p>
        <p className="mx-auto mt-4 max-w-sm text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/auth?next=/saved" className="text-sky-600 underline-offset-2 hover:underline">
            Sign in
          </Link>{' '}
          to see saves synced across your devices.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Honest device-only notice + account push (slice 1's promise, made good). */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 ring-1 ring-sky-100">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">Saved on this device only</p>
            <p className="mt-1 text-sm text-slate-600">
              These aren&apos;t synced to an account — clear your browser or switch devices and
              you may lose them. Create a free account to keep them and get alerts when similar
              listings appear.
            </p>
            <Link
              href="/auth?next=/saved"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              Create a free account to keep these
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {partnerships.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Saved partnerships{' '}
            <span className="text-sm font-normal text-slate-400">({partnerships.length})</span>
          </h2>
          <div className="space-y-4">
            {partnerships.map((p) => (
              <PartnershipCard
                key={p.id}
                p={p}
                saved
                comp={partnershipVerdicts[p.id]?.comp ?? null}
                dealVerdict={partnershipVerdicts[p.id]?.dealVerdict ?? null}
                saveCount={partnershipSaveCounts[p.id] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      {aircraft.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Saved aircraft{' '}
            <span className="text-sm font-normal text-slate-400">({aircraft.length})</span>
          </h2>
          <div className="space-y-4">
            {aircraft.map((a) => (
              <AircraftSaleCard
                key={a.id}
                p={a}
                saved
                comp={aircraftVerdicts[a.id]?.comp ?? null}
                dealVerdict={aircraftVerdicts[a.id]?.dealVerdict ?? null}
                saveCount={aircraftSaveCounts[a.id] ?? 0}
                familyCount={aircraftVerdicts[a.id]?.familyCount ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {seekers.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Saved seeker listings{' '}
            <span className="text-sm font-normal text-slate-400">({seekers.length})</span>
          </h2>
          <div className="space-y-4">
            {seekers.map((s) => (
              <SeekerCard
                key={s.id}
                seeker={s}
                saved
                budgetVerdict={seekerBudgetVerdicts[s.id]}
                saveCount={seekerSaveCounts[s.id] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      <p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-slate-400">
        <Plane className="h-3.5 w-3.5" />
        Looking for more?{' '}
        <Link href="/partnerships" className="text-sky-600 underline-offset-2 hover:underline">
          partnerships
        </Link>{' '}
        <span aria-hidden="true">·</span>{' '}
        <Link href="/aircraft" className="text-sky-600 underline-offset-2 hover:underline">
          aircraft for sale
        </Link>{' '}
        <span aria-hidden="true">·</span>{' '}
        <Link href="/partnerships/seeking" className="text-sky-600 underline-offset-2 hover:underline">
          seeking listings
        </Link>
      </p>
    </div>
  )
}
