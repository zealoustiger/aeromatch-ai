'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Plane, Users, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'

interface Props {
  /** Makes with live active partnerships (most-listed first), surfaced as chips. */
  makes?: string[]
}

// One quick-filter chip: a single existing URL param + value, plus its label.
interface Chip {
  key: string
  value: string
  label: string
  icon: ComponentType<{ className?: string }>
}

// Share-type chips → the existing `share_type` param (eq match in the query).
const SHARE_CHIPS: Chip[] = [
  { key: 'share_type', value: '1/2', label: '1/2 Share', icon: Users },
  { key: 'share_type', value: '1/3', label: '1/3 Share', icon: Users },
  { key: 'share_type', value: 'leaseback', label: 'Leaseback', icon: Users },
]

// Budget chips → the existing `max_monthly` param (lte monthly_fixed).
const PRICE_CHIPS: Chip[] = [
  { key: 'max_monthly', value: '300', label: 'Under $300/mo', icon: Wallet },
  { key: 'max_monthly', value: '500', label: 'Under $500/mo', icon: Wallet },
  { key: 'max_monthly', value: '750', label: 'Under $750/mo', icon: Wallet },
]

const MAX_MAKE_CHIPS = 5

/**
 * Airbnb-style quick-filter chip bar for `/partnerships` — a horizontally-scrolling
 * row of one-tap chips that set the page's EXISTING filter URL params (make /
 * share type / budget). Mirrors `AircraftChipBar`: toggling a chip preserves every
 * other active filter; clicking the active chip clears it. No new param, no backend.
 */
export default function PartnershipChipBar({ makes }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const makeChips: Chip[] = (makes ?? [])
    .slice(0, MAX_MAKE_CHIPS)
    .map((m) => ({ key: 'make', value: m, label: m, icon: Plane }))

  // Build the href for a chip: toggle its param against the *current* URL,
  // preserving every other active filter. Clicking the active chip clears it.
  function hrefFor(chip: Chip, isActive: boolean): string {
    const params = new URLSearchParams(searchParams.toString())
    if (isActive) {
      params.delete(chip.key)
    } else {
      params.set(chip.key, chip.value)
    }
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function isChipActive(chip: Chip): boolean {
    return (searchParams.get(chip.key) ?? '') === chip.value
  }

  function renderChip(chip: Chip) {
    const active = isChipActive(chip)
    const Icon = chip.icon
    return (
      <Link
        key={`${chip.key}:${chip.value}`}
        href={hrefFor(chip, active)}
        scroll={false}
        aria-pressed={active}
        className={[
          'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
          active
            ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
            : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700',
        ].join(' ')}
      >
        <Icon className="h-4 w-4" />
        {chip.label}
      </Link>
    )
  }

  return (
    <div className="mb-6 -mx-4 sm:-mx-6 lg:mx-0">
      {/* Horizontally-scrolling chip strip. Negative margins let it bleed to the
          screen edges on mobile so chips can scroll off-screen without the page
          itself overflowing; overflow-x-auto contains the scroll. */}
      <div
        className="flex gap-2 overflow-x-auto px-4 pb-1 sm:px-6 lg:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Quick filters"
      >
        {makeChips.map(renderChip)}
        {SHARE_CHIPS.map(renderChip)}
        {PRICE_CHIPS.map(renderChip)}
      </div>
    </div>
  )
}
