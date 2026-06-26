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

// Mission chips → deep-link to the curated `/aircraft/mission/[slug]` landing pages
// (editorial buyer guidance + the live matching grid), NOT an in-place `q=` filter.
// Slugs map 1:1 to the curated set in `src/lib/missions.ts`; this also adds five
// internal links from the high-traffic /aircraft hub into that family.
interface MissionChip {
  /** Mission slug under /aircraft/mission/ (must match src/lib/missions.ts). */
  slug: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const MISSION_CHIPS: MissionChip[] = [
  { slug: 'ifr', label: 'IFR', icon: Compass },
  { slug: 'glass-cockpit', label: 'Glass cockpit', icon: Compass },
  { slug: 'tailwheel', label: 'Tailwheel', icon: Compass },
  { slug: 'low-time', label: 'Low time', icon: Compass },
  { slug: 'experimental', label: 'Experimental', icon: Compass },
  { slug: 'twin-engine', label: 'Twin-engine', icon: Compass },
  { slug: 'stol', label: 'STOL / Backcountry', icon: Compass },
  { slug: 'turboprop', label: 'Turboprop', icon: Compass },
  { slug: 'floatplane', label: 'Floatplane', icon: Compass },
  { slug: 'aerobatic', label: 'Aerobatic', icon: Compass },
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

  // Mission chips are navigation, not filter toggles: each links to its dedicated
  // landing page. Reuses the same pill styling; active when you're already on it
  // (the bar only renders on /aircraft today, so that's effectively never — but it
  // stays correct if the bar is ever reused on a mission page).
  function renderMissionChip(chip: MissionChip) {
    const href = `/aircraft/mission/${chip.slug}`
    const active = pathname === href
    const Icon = chip.icon
    return (
      <Link
        key={`mission:${chip.slug}`}
        href={href}
        aria-current={active ? 'page' : undefined}
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
        {MISSION_CHIPS.map(renderMissionChip)}
      </div>
    </div>
  )
}
