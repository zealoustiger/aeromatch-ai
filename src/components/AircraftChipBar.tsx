'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Plane, Tag, Compass } from 'lucide-react'
import type { ComponentType } from 'react'
import type { AircraftFacets } from '@/lib/aircraft-facets'

interface Props {
  /** Live facets — used to surface the top makes as chips. */
  facets?: AircraftFacets
}

// One quick-filter chip: a single existing URL param + value, plus its label.
interface Chip {
  key: string
  value: string
  label: string
  icon: ComponentType<{ className?: string }>
}

// Price-band chips → the existing `max_price` param (lte asking_price).
const PRICE_CHIPS: Chip[] = [
  { key: 'max_price', value: '100000', label: 'Under $100k', icon: Tag },
  { key: 'max_price', value: '250000', label: 'Under $250k', icon: Tag },
  { key: 'max_price', value: '500000', label: 'Under $500k', icon: Tag },
]

// Mission chips → the existing free-text `q` keyword param. Common buyer intents
// that match listing titles/descriptions without any new query logic.
const MISSION_CHIPS: Chip[] = [
  { key: 'q', value: 'IFR', label: 'IFR', icon: Compass },
  { key: 'q', value: 'Glass cockpit', label: 'Glass cockpit', icon: Compass },
  { key: 'q', value: 'Tailwheel', label: 'Tailwheel', icon: Compass },
  { key: 'q', value: 'Low time', label: 'Low time', icon: Compass },
]

const MAX_MAKE_CHIPS = 5

export default function AircraftChipBar({ facets }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const makeChips: Chip[] = (facets?.makes ?? [])
    .slice(0, MAX_MAKE_CHIPS)
    .map((m) => ({ key: 'make', value: m, label: m, icon: Plane }))

  // Build the href for a chip: toggle its param against the *current* URL,
  // preserving every other active filter. Clicking the active chip clears it.
  // Selecting a make also clears any model (mirrors the sidebar's updateMake).
  function hrefFor(chip: Chip, isActive: boolean): string {
    const params = new URLSearchParams(searchParams.toString())
    if (isActive) {
      params.delete(chip.key)
    } else {
      params.set(chip.key, chip.value)
      if (chip.key === 'make') params.delete('model')
    }
    // Changing the result set should always start from page 1.
    params.delete('page')
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
            : 'border-[var(--ch-border)] bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700',
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
          itself overflowing; min-w-0 + overflow-x-auto contain the scroll. */}
      <div
        className="flex gap-2 overflow-x-auto px-4 pb-1 sm:px-6 lg:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Quick filters"
      >
        {makeChips.map(renderChip)}
        {PRICE_CHIPS.map(renderChip)}
        {MISSION_CHIPS.map(renderChip)}
      </div>
    </div>
  )
}
