'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { X } from 'lucide-react'
import SaveSearchButton from './SaveSearchButton'
import AirportAutocompleteInput from './AirportAutocompleteInput'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

const SHARE_TYPES = [
  { value: '1/2', label: '1/2 Share' },
  { value: '1/3', label: '1/3 Share' },
  { value: '1/4', label: '1/4 Share' },
  { value: 'leaseback', label: 'Leaseback' },
  { value: 'dry_lease', label: 'Dry Lease' },
]

// Normalize free text into a deduped list of ICAO/FAA airport codes: split on
// commas/whitespace, uppercase, strip non-alphanumerics, drop anything not 2-4
// chars (so stray punctuation never becomes a bogus code).
function parseAirportCodes(raw: string): string[] {
  const out: string[] = []
  for (const token of raw.split(/[\s,]+/)) {
    const code = token.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length >= 2 && code.length <= 4 && !out.includes(code)) out.push(code)
  }
  return out
}

interface Props {
  initialValues: Record<string, string | undefined>
  /** When set, render an in-panel "Save this search" button above "Clear all
   *  filters" (the base route the saved search reopens). Lets users save where
   *  they tune filters, not just from the top action bar. */
  saveSearchBasePath?: string
}

export default function PartnershipFilters({ initialValues, saveSearchBasePath }: Props) {
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

  // Home airport is multi-select: the `airports` param is a comma-joined list of
  // ICAO codes OR'd together by the query (`.in('home_airport', …)`). Initial codes
  // come from `airports`, falling back to a lone legacy `airport` param so old links /
  // saved searches keep working. Editing consolidates into `airports` and drops the
  // legacy `airport`/`radius` pair to avoid two airport sources fighting.
  const airportCodes = parseAirportCodes(
    initialValues.airports ?? initialValues.airport ?? ''
  )
  const setAirports = useCallback(
    (codes: string[]) => {
      pushParams((params) => {
        params.delete('airport')
        params.delete('radius')
        if (codes.length) params.set('airports', codes.join(','))
        else params.delete('airports')
      })
    },
    [pushParams]
  )

  const removeAirport = useCallback(
    (code: string) => setAirports(airportCodes.filter((c) => c !== code)),
    [airportCodes, setAirports]
  )

  const clearAll = () => {
    startTransition(() => { router.push(pathname) })
  }

  const hasFilters = Object.values(initialValues).some(Boolean)

  return (
    <div className="space-y-5">
      {/* Home airport(s) — multi-select autocomplete. Type city/name/ICAO and pick
          from the dropdown; each picked airport is added as a chip (OR'd in results). */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Home Airport
          {airportCodes.length > 0 && (
            <span className="ml-1.5 font-normal normal-case tracking-normal text-sky-600">
              · {airportCodes.length} selected
            </span>
          )}
        </label>
        {airportCodes.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {airportCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => removeAirport(code)}
                aria-label={`Remove ${code}`}
                className="group inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 py-1 pl-2.5 pr-1.5 font-mono text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
              >
                {code}
                <X className="h-3 w-3 text-sky-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        )}
        <AirportAutocompleteInput
          placeholder="City, airport name, or ICAO code"
          clearAfterSelect
          onSelect={(icao) => {
            if (!icao) return
            const codes = parseAirportCodes(icao)
            if (!codes.length) return
            const next = [...airportCodes]
            for (const code of codes) if (!next.includes(code)) next.push(code)
            if (next.length !== airportCodes.length) setAirports(next)
          }}
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

      {/* Share type */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Share Type
        </label>
        <select
          defaultValue={initialValues.share_type ?? ''}
          onChange={(e) => updateFilter('share_type', e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        >
          <option value="">Any type</option>
          {SHARE_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Aircraft make */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Aircraft Make
        </label>
        <input
          type="text"
          placeholder="e.g. Cessna, Piper"
          defaultValue={initialValues.make ?? ''}
          onChange={(e) => updateFilter('make', e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {/* Max monthly */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Max Monthly Cost
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
          <input
            type="number"
            placeholder="e.g. 500"
            defaultValue={initialValues.max_monthly ?? ''}
            onChange={(e) => updateFilter('max_monthly', e.target.value)}
            className="w-full rounded-md border border-slate-200 pl-7 pr-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      {/* Max buy-in */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Max Buy-In
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
          <input
            type="number"
            placeholder="e.g. 20000"
            defaultValue={initialValues.max_buyin ?? ''}
            onChange={(e) => updateFilter('max_buyin', e.target.value)}
            className="w-full rounded-md border border-slate-200 pl-7 pr-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
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
