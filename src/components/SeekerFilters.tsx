'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { X } from 'lucide-react'

const RADIUS = [25, 50, 100, 150, 200]

// Normalize free text into a deduped list of ICAO/FAA airport codes: split on
// commas/whitespace, uppercase, strip non-alphanumerics, drop anything not 2-4
// chars (so stray punctuation never becomes a bogus code). Mirrors PartnershipFilters.
function parseAirportCodes(raw: string): string[] {
  const out: string[] = []
  for (const token of raw.split(/[\s,]+/)) {
    const code = token.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length >= 2 && code.length <= 4 && !out.includes(code)) out.push(code)
  }
  return out
}
const RATINGS = ['PPL', 'IFR', 'Commercial', 'CFI', 'ATP', 'Complex']
const SHARE_TYPES = [
  { value: '1/2', label: '1/2 Share' },
  { value: '1/3', label: '1/3 Share' },
  { value: '1/4', label: '1/4 Share' },
]
const HOURS = [100, 250, 500, 1000]

interface Props {
  initialValues: Record<string, string | undefined>
  /** Makes seekers are looking for, for the make filter (values match stored data). */
  makes?: string[]
}

export default function SeekerFilters({ initialValues, makes = [] }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, searchParams]
  )

  const update = useCallback(
    (key: string, value: string) => {
      pushParams((params) => {
        if (value) params.set(key, value)
        else params.delete(key)
        // Radius is meaningless without an airport — drop it when airport clears.
        if (key === 'airport' && !value) params.delete('radius')
      })
    },
    [pushParams]
  )

  // Make / Rating are multi-select: the param is a comma-joined list. Toggling a
  // value adds/removes it; an empty list drops the param entirely.
  const toggleMulti = useCallback(
    (key: string, value: string) => {
      pushParams((params) => {
        const current = (params.get(key) ?? '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value]
        if (next.length) params.set(key, next.join(','))
        else params.delete(key)
      })
    },
    [pushParams]
  )

  // Home airport is multi-select: the `airports` param is a comma-joined list of
  // ICAO codes OR'd by the query (`.in('home_airport', …)`). Initial codes come from
  // `airports`, falling back to a lone legacy `airport` param so old links / saved
  // searches keep working. The radius dropdown only applies to a single airport
  // (radius around several centers is ambiguous), so we surface it only then.
  const airportCodes = parseAirportCodes(initialValues.airports ?? initialValues.airport ?? '')
  const [airportDraft, setAirportDraft] = useState('')

  const setAirports = useCallback(
    (codes: string[]) => {
      pushParams((params) => {
        params.delete('airport')
        if (codes.length) params.set('airports', codes.join(','))
        else params.delete('airports')
        // Radius is only meaningful around a single airport — drop it otherwise.
        if (codes.length !== 1) params.delete('radius')
      })
    },
    [pushParams]
  )

  // Add whatever codes the draft text holds (split on comma/space), deduped against
  // the current list; clears the input. No-op when the draft yields nothing new.
  const commitAirportDraft = useCallback(() => {
    const additions = parseAirportCodes(airportDraft)
    setAirportDraft('')
    if (!additions.length) return
    const next = [...airportCodes]
    for (const code of additions) if (!next.includes(code)) next.push(code)
    if (next.length !== airportCodes.length) setAirports(next)
  }, [airportDraft, airportCodes, setAirports])

  const removeAirport = useCallback(
    (code: string) => setAirports(airportCodes.filter((c) => c !== code)),
    [airportCodes, setAirports]
  )

  const clearAll = () => startTransition(() => router.push(pathname))
  const hasFilters = Object.values(initialValues).some(Boolean)
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500'
  const fieldCls = 'w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100'
  const checkboxCls = 'h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200'

  const selectedMakes = new Set(
    (initialValues.make ?? '').split(',').map((m) => m.trim()).filter(Boolean)
  )
  const selectedRatings = new Set(
    (initialValues.rating ?? '').split(',').map((r) => r.trim()).filter(Boolean)
  )

  return (
    <div className="space-y-5">
      {/* Aircraft make wanted — the owner's first question ("do they want MY type of
          plane?"), so it leads. Multi-select: an owner may accept several makes. */}
      <div>
        <label className={labelCls}>
          Aircraft Make Wanted
          {selectedMakes.size > 0 && (
            <span className="ml-1.5 font-normal normal-case tracking-normal text-sky-600">
              · {selectedMakes.size} selected
            </span>
          )}
        </label>
        {makes.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
            No makes to filter yet
          </p>
        ) : (
          <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border border-slate-200 p-2.5">
            {makes.map((m) => (
              <label key={m} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedMakes.has(m)}
                  onChange={() => toggleMulti('make', m)}
                  className={checkboxCls}
                />
                {m}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Home airport(s) — multi-select. Type a code and press Enter/comma/space (or
          blur) to add it as a chip; airports entered here are OR'd in the results.
          Radius applies only when a single airport is selected. */}
      <div>
        <label className={labelCls}>
          Near Home Airport
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
        <input
          type="text"
          placeholder="e.g. KAUS, KDAL — Enter to add"
          value={airportDraft}
          onChange={(e) => setAirportDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              commitAirportDraft()
            }
          }}
          onBlur={commitAirportDraft}
          className={`${fieldCls} font-mono uppercase`}
        />
        {airportCodes.length === 1 && (
          <select
            defaultValue={initialValues.radius ?? ''}
            onChange={(e) => update('radius', e.target.value)}
            className={`${fieldCls} mt-2`}
          >
            <option value="">Exact airport</option>
            {RADIUS.map((r) => <option key={r} value={r}>Within {r} mi</option>)}
          </select>
        )}
      </div>

      {/* Rating held — multi-select: an owner may accept any of several ratings. */}
      <div>
        <label className={labelCls}>
          Rating Held
          {selectedRatings.size > 0 && (
            <span className="ml-1.5 font-normal normal-case tracking-normal text-sky-600">
              · {selectedRatings.size} selected
            </span>
          )}
        </label>
        <div className="space-y-1.5 rounded-md border border-slate-200 p-2.5">
          {RATINGS.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={selectedRatings.has(r)}
                onChange={() => toggleMulti('rating', r)}
                className={checkboxCls}
              />
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* Min total hours */}
      <div>
        <label className={labelCls}>Min Total Hours</label>
        <select defaultValue={initialValues.min_hours ?? ''} onChange={(e) => update('min_hours', e.target.value)} className={fieldCls}>
          <option value="">Any experience</option>
          {HOURS.map((h) => <option key={h} value={h}>{h}+ hours</option>)}
        </select>
      </div>

      {/* Preferred share type */}
      <div>
        <label className={labelCls}>Preferred Share</label>
        <select defaultValue={initialValues.share_type ?? ''} onChange={(e) => update('share_type', e.target.value)} className={fieldCls}>
          <option value="">Any share</option>
          {SHARE_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {hasFilters && (
        <button onClick={clearAll} className="w-full rounded-md border border-slate-200 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50">
          Clear all filters
        </button>
      )}
    </div>
  )
}
