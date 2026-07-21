'use client'

import { useState, useTransition } from 'react'
import { Bell, BellRing, TrendingDown } from 'lucide-react'
import { updateAlertMode, type AlertMode } from '@/app/actions'

function deriveMode(priceDropOptIn: boolean, newListingOptOut: boolean): AlertMode {
  if (newListingOptOut) return 'drops'
  if (!priceDropOptIn) return 'new'
  return 'both'
}

const NEXT: Record<AlertMode, AlertMode> = { both: 'new', new: 'drops', drops: 'both' }
const LABEL: Record<AlertMode, string> = { both: 'New + drops', new: 'New listings only', drops: 'Price drops only' }
const NEXT_LABEL: Record<AlertMode, string> = {
  both: 'new listings only (no price-drop matches)',
  new: 'price drops only (no new-listing matches)',
  drops: 'new listings + price drops',
}
const ICON: Record<AlertMode, typeof Bell> = { both: BellRing, new: Bell, drops: TrendingDown }
const COLOR: Record<AlertMode, string> = {
  both: 'bg-slate-50 text-slate-500 hover:bg-slate-100',
  new: 'bg-sky-50 text-sky-700 hover:bg-sky-100',
  drops: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
}

/**
 * Persistent per-alert switch (not hidden behind "Edit") for aircraft and
 * partnership alerts — price-drop/new-listing matching only exists for those
 * two types (see alert-digest's countRecentAircraftPriceDrops/
 * countRecentPartnershipPriceDrops and the new_listing_opt_out gate), so this
 * never renders for seeker rows (no price — see /alerts/manage's page.tsx).
 * Cycles through the 3 honest, always-valid combinations on click — never
 * lands on the unreachable "neither" state a pair of independent checkboxes
 * could produce.
 */
export default function AlertModeToggle({
  id,
  priceDropOptIn,
  newListingOptOut,
  token,
}: {
  id: string
  priceDropOptIn: boolean
  newListingOptOut: boolean
  /** Set only on the token-scoped (no-account) `/alerts/manage?token=` path. */
  token?: string
}) {
  const [mode, setMode] = useState<AlertMode>(() => deriveMode(priceDropOptIn, newListingOptOut))
  const [isPending, startTransition] = useTransition()

  function cycle() {
    const prev = mode
    const next = NEXT[mode]
    setMode(next)
    startTransition(async () => {
      const result = await updateAlertMode(id, next, token)
      if (result.error) setMode(prev)
    })
  }

  const Icon = ICON[mode]

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={isPending}
      title={`Switch to ${NEXT_LABEL[mode]}`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${COLOR[mode]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {LABEL[mode]}
    </button>
  )
}
