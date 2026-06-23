'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Plane, Award, Gauge } from 'lucide-react'
import type { ComponentType } from 'react'

interface Props {
  /** Makes seekers are looking for (most-wanted first), surfaced as chips. */
  makes?: string[]
}

interface Chip {
  key: string
  value: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const RATING_CHIPS: Chip[] = [
  { key: 'rating', value: 'IFR', label: 'IFR-rated', icon: Award },
  { key: 'rating', value: 'Commercial', label: 'Commercial', icon: Award },
]
const HOURS_CHIPS: Chip[] = [
  { key: 'min_hours', value: '250', label: '250+ hrs', icon: Gauge },
  { key: 'min_hours', value: '500', label: '500+ hrs', icon: Gauge },
]
const MAX_MAKE_CHIPS = 5

/** Airbnb-style quick-filter chip bar for /partnerships/seeking — one-tap chips
 *  that set the page's existing filter params (make / rating / min hours),
 *  preserving every other active filter. Mirrors PartnershipChipBar. */
export default function SeekerChipBar({ makes }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const makeChips: Chip[] = (makes ?? []).slice(0, MAX_MAKE_CHIPS).map((m) => ({ key: 'make', value: m, label: m, icon: Plane }))

  function hrefFor(chip: Chip, isActive: boolean): string {
    const params = new URLSearchParams(searchParams.toString())
    if (isActive) params.delete(chip.key)
    else params.set(chip.key, chip.value)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }
  const isActive = (chip: Chip) => (searchParams.get(chip.key) ?? '') === chip.value

  function renderChip(chip: Chip) {
    const active = isActive(chip)
    const Icon = chip.icon
    return (
      <Link
        key={`${chip.key}:${chip.value}`}
        href={hrefFor(chip, active)}
        scroll={false}
        aria-pressed={active}
        className={[
          'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
          active ? 'border-sky-500 bg-sky-500 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700',
        ].join(' ')}
      >
        <Icon className="h-4 w-4" />
        {chip.label}
      </Link>
    )
  }

  return (
    <div className="mb-6 -mx-4 sm:-mx-6 lg:mx-0">
      <div
        className="flex gap-2 overflow-x-auto px-4 pb-1 sm:px-6 lg:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Quick filters"
      >
        {makeChips.map(renderChip)}
        {RATING_CHIPS.map(renderChip)}
        {HOURS_CHIPS.map(renderChip)}
      </div>
    </div>
  )
}
