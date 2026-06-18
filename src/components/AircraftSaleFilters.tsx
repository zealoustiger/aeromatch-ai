'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

interface Props {
  initialValues: Record<string, string | undefined>
}

export default function AircraftSaleFilters({ initialValues }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  const clearAll = () => {
    startTransition(() => { router.push(pathname) })
  }

  const hasFilters = Object.values(initialValues).some(Boolean)

  return (
    <div className="space-y-5">
      {/* Keyword search */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search
        </label>
        <input
          type="text"
          placeholder="e.g. G1000, low time, IFR"
          defaultValue={initialValues.q ?? ''}
          onChange={(e) => updateFilter('q', e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {/* Make */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Aircraft Make
        </label>
        <input
          type="text"
          placeholder="e.g. Cessna, Cirrus"
          defaultValue={initialValues.make ?? ''}
          onChange={(e) => updateFilter('make', e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {/* State */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          State
        </label>
        <select
          defaultValue={initialValues.state ?? ''}
          onChange={(e) => updateFilter('state', e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        >
          <option value="">All states</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Max price */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Max Price
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
          <input
            type="number"
            placeholder="e.g. 150000"
            defaultValue={initialValues.max_price ?? ''}
            onChange={(e) => updateFilter('max_price', e.target.value)}
            className="w-full rounded-md border border-slate-200 py-2 pl-7 pr-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      {/* Min year */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Year (min)
        </label>
        <input
          type="number"
          placeholder="e.g. 2000"
          defaultValue={initialValues.min_year ?? ''}
          onChange={(e) => updateFilter('min_year', e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="w-full rounded-md border border-slate-200 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
