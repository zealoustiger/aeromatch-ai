'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import type { AircraftFacets } from '@/lib/aircraft-facets'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

interface Props {
  initialValues: Record<string, string | undefined>
  facets?: AircraftFacets
}

export default function AircraftSaleFilters({ initialValues, facets }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  const updateFilter = useCallback(
    (key: string, value: string) => {
      pushParams((params) => {
        if (value) params.set(key, value)
        else params.delete(key)
      })
    },
    [pushParams]
  )

  // Changing make also clears any model from a different make.
  const updateMake = useCallback(
    (value: string) => {
      pushParams((params) => {
        if (value) params.set('make', value)
        else params.delete('make')
        params.delete('model')
      })
    },
    [pushParams]
  )

  const clearAll = () => {
    startTransition(() => { router.push(pathname) })
  }

  const hasFilters = Object.values(initialValues).some(Boolean)

  // Secondary, Controller-style dimensions live behind a progressive-disclosure
  // toggle so the panel leads cleanly with Make → Model. Auto-open when any of
  // them is already active, so an active filter is never hidden.
  const SECONDARY_KEYS = [
    'state', 'min_price', 'max_price', 'min_year', 'max_year', 'min_tt', 'max_tt',
  ] as const
  const secondaryActive = SECONDARY_KEYS.some((k) => initialValues[k])
  const [showMore, setShowMore] = useState(secondaryActive)

  const makes = facets?.makes ?? []
  const selectedMake = initialValues.make ?? ''
  const modelOptions =
    selectedMake && facets?.modelsByMake[selectedMake]
      ? facets.modelsByMake[selectedMake]
      : []

  return (
    <div className="space-y-5">
      {/* Make — primary search path */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Make
        </label>
        {makes.length > 0 ? (
          <select
            value={selectedMake}
            onChange={(e) => updateMake(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          >
            <option value="">All makes</option>
            {makes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        ) : (
          // Fallback when facets are unavailable: keep search working via free text.
          <input
            type="text"
            placeholder="e.g. Cessna, Cirrus"
            defaultValue={selectedMake}
            onChange={(e) => updateMake(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        )}
      </div>

      {/* Model — depends on selected make */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Model
        </label>
        <select
          value={initialValues.model ?? ''}
          onChange={(e) => updateFilter('model', e.target.value)}
          disabled={modelOptions.length === 0}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">
            {selectedMake ? 'All models' : 'Select a make first'}
          </option>
          {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="border-t border-slate-100" />

      {/* Sort */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sort by
        </label>
        <select
          defaultValue={initialValues.sort ?? ''}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        >
          <option value="">Newest</option>
          <option value="reduced">Recently price-dropped</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {/* Listing quality */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Listing quality
        </label>
        <select
          defaultValue={initialValues.min_grade ?? ''}
          onChange={(e) => updateFilter('min_grade', e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        >
          <option value="">All listings</option>
          <option value="B">Grade B &amp; up (hide sparse)</option>
          <option value="A">Grade A only (most complete)</option>
        </select>
      </div>

      {/* Price drops only */}
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          defaultChecked={!!initialValues.drops}
          onChange={(e) => updateFilter('drops', e.target.checked ? '1' : '')}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
        />
        Price drops only
      </label>

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

      <div className="border-t border-slate-100" />

      {/* More filters — progressive disclosure for the secondary dimensions */}
      <div>
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
        >
          More filters
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`}
          />
        </button>

        {showMore && (
          <div className="mt-4 space-y-5">
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

            {/* Price range */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price ($)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  aria-label="Minimum price"
                  placeholder="Min"
                  defaultValue={initialValues.min_price ?? ''}
                  onChange={(e) => updateFilter('min_price', e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <span className="text-sm text-slate-400">–</span>
                <input
                  type="number"
                  aria-label="Maximum price"
                  placeholder="Max"
                  defaultValue={initialValues.max_price ?? ''}
                  onChange={(e) => updateFilter('max_price', e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Year range */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Year
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  aria-label="Earliest year"
                  placeholder="Min"
                  defaultValue={initialValues.min_year ?? ''}
                  onChange={(e) => updateFilter('min_year', e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <span className="text-sm text-slate-400">–</span>
                <input
                  type="number"
                  aria-label="Latest year"
                  placeholder="Max"
                  defaultValue={initialValues.max_year ?? ''}
                  onChange={(e) => updateFilter('max_year', e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Total time range (airframe hours) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Time (hrs)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  aria-label="Minimum total time"
                  placeholder="Min"
                  defaultValue={initialValues.min_tt ?? ''}
                  onChange={(e) => updateFilter('min_tt', e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <span className="text-sm text-slate-400">–</span>
                <input
                  type="number"
                  aria-label="Maximum total time"
                  placeholder="Max"
                  defaultValue={initialValues.max_tt ?? ''}
                  onChange={(e) => updateFilter('max_tt', e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>
        )}
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
