'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import type { AircraftFacets } from '@/lib/aircraft-facets'
import { groupModelVariants } from '@/lib/modelGroups'
import SaveSearchButton from './SaveSearchButton'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

interface Props {
  initialValues: Record<string, string | undefined>
  facets?: AircraftFacets
  /** When set, render an in-panel "Save this search" button above "Clear all
   *  filters" (the base route the saved search reopens). Lets users save where
   *  they tune filters, not just from the top action bar. */
  saveSearchBasePath?: string
}

export default function AircraftSaleFilters({ initialValues, facets, saveSearchBasePath }: Props) {
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

  // Model is multi-select: the `model` param is a comma-joined list. Toggling a
  // model adds/removes it; an empty list drops the param entirely.
  const toggleModel = useCallback(
    (model: string) => {
      pushParams((params) => {
        const current = (params.get('model') ?? '')
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
        const next = current.includes(model)
          ? current.filter((m) => m !== model)
          : [...current, model]
        if (next.length) params.set('model', next.join(','))
        else params.delete('model')
      })
    },
    [pushParams]
  )

  // Roll up a parent "(all)" group: if every member is already selected, remove
  // them all; otherwise add the missing ones. Members carry exact DB strings, so
  // this is just a multi-edit of the same comma-joined `model` param.
  const toggleModelGroup = useCallback(
    (members: string[], allSelected: boolean) => {
      pushParams((params) => {
        const current = new Set(
          (params.get('model') ?? '').split(',').map((m) => m.trim()).filter(Boolean)
        )
        if (allSelected) members.forEach((m) => current.delete(m))
        else members.forEach((m) => current.add(m))
        if (current.size) params.set('model', [...current].join(','))
        else params.delete('model')
      })
    },
    [pushParams]
  )

  const clearAll = () => {
    startTransition(() => { router.push(pathname) })
  }

  const hasFilters = Object.values(initialValues).some(Boolean)

  // Core buying criteria (Price / Year / Total Time) now lead the panel, always
  // visible under Make → Model. State and Airport stay behind the progressive-
  // disclosure "More filters" toggle, which auto-opens when either is active so an
  // active filter is never hidden.
  const SECONDARY_KEYS = ['state', 'airport'] as const
  const secondaryActive = SECONDARY_KEYS.some((k) => initialValues[k])
  const [showMore, setShowMore] = useState(secondaryActive)

  const makes = facets?.makes ?? []
  const selectedMake = initialValues.make ?? ''
  const modelOptions =
    selectedMake && facets?.modelsByMake[selectedMake]
      ? facets.modelsByMake[selectedMake]
      : []
  const selectedModels = (initialValues.model ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  // Roll near-duplicate variants (SR20, Sr20 G2, SR20-G2, …) under one parent so
  // picking "an SR20" is one click. Single-member groups render as plain checkboxes.
  const modelGroups = useMemo(() => groupModelVariants(modelOptions), [modelOptions])
  const selectedModelSet = new Set(selectedModels)

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

      {/* Model — depends on selected make; multi-select so a pilot can search
          several models of a make at once (e.g. SR20 + SR22). */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Model
          {selectedModels.length > 0 && (
            <span className="ml-1.5 font-normal normal-case tracking-normal text-sky-600">
              · {selectedModels.length} selected
            </span>
          )}
        </label>
        {modelOptions.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
            Select a make first
          </p>
        ) : (
          <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border border-slate-200 p-2.5">
            {modelGroups.map((g) =>
              g.members.length === 1 ? (
                // Singleton — render as a plain checkbox (unchanged behaviour).
                <label
                  key={g.key}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedModelSet.has(g.members[0])}
                    onChange={() => toggleModel(g.members[0])}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200"
                  />
                  {g.members[0]}
                </label>
              ) : (
                <ModelGroupRow
                  key={g.key}
                  groupKey={g.key}
                  members={g.members}
                  selected={selectedModelSet}
                  onToggleGroup={toggleModelGroup}
                  onToggleVariant={toggleModel}
                />
              )
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100" />

      {/* Core buying criteria — always visible (promoted out of "More filters"). */}
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
            {/* Airport (ICAO) — resolved server-side to the airport's state, so buyers
                can filter by "near KSFO" without knowing the state. */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Near airport (ICAO)
              </label>
              <input
                type="text"
                placeholder="e.g. KSFO, KHWD"
                maxLength={4}
                defaultValue={initialValues.airport ?? ''}
                onBlur={(e) => updateFilter('airport', e.target.value.toUpperCase().trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = (e.target as HTMLInputElement).value.toUpperCase().trim()
                    updateFilter('airport', v)
                  }
                }}
                className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm uppercase focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              <p className="mt-1 text-xs text-slate-400">4-letter ICAO code — shows aircraft based in that airport&apos;s state</p>
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
          </div>
        )}
      </div>

      {hasFilters && (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          {saveSearchBasePath && <SaveSearchButton fullWidth basePath={saveSearchBasePath} />}
          <button
            onClick={clearAll}
            className="w-full rounded-md border border-slate-200 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * One rolled-up model family: a parent "{key} (all)" checkbox that selects every
 * variant in one click, with the individual variants behind a collapse-by-default
 * "Show N variants" disclosure. The parent reflects all / some (indeterminate) /
 * none of its members being selected.
 */
function ModelGroupRow({
  groupKey,
  members,
  selected,
  onToggleGroup,
  onToggleVariant,
}: {
  groupKey: string
  members: string[]
  selected: Set<string>
  onToggleGroup: (members: string[], allSelected: boolean) => void
  onToggleVariant: (model: string) => void
}) {
  const selectedCount = members.reduce((n, m) => (selected.has(m) ? n + 1 : n), 0)
  const allSelected = selectedCount === members.length
  const someSelected = selectedCount > 0 && !allSelected
  const [open, setOpen] = useState(someSelected)

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected
            }}
            onChange={() => onToggleGroup(members, allSelected)}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200"
          />
          <span>
            {groupKey} <span className="text-slate-400">(all)</span>
          </span>
        </label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="shrink-0 text-xs font-medium text-sky-600 transition-colors hover:text-sky-700"
        >
          {open ? 'Hide' : `Show ${members.length} variants`}
        </button>
      </div>
      {open && (
        <div className="mt-1.5 space-y-1.5 border-l border-slate-100 pl-4">
          {members.map((m) => (
            <label key={m} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={selected.has(m)}
                onChange={() => onToggleVariant(m)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200"
              />
              {m}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
