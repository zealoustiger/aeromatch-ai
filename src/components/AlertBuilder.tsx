'use client'

import { useEffect, useMemo, useState } from 'react'
import { Wrench, Pencil } from 'lucide-react'
import { getAlertMatchCountForSourcePath } from '@/app/actions'
import { buildAlertCriteriaUpdate, type EditableAlertTarget, type AlertCriteriaFields } from '@/lib/alertEditCriteria'
import AirportChipsInput from '@/components/AirportChipsInput'
import AlertSignup from '@/components/AlertSignup'

// Same 5 options as the browse filter UI (`SeekerFilters`/`HeroSearch`/`NewAlertForm`)
// — small enough that duplicating locally matches the existing convention for this
// constant across the codebase.
const RADIUS = [25, 50, 100, 150, 200]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY',
]

const inputClass =
  'w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100'
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500'

const TYPE_OPTIONS: { type: EditableAlertTarget['type']; label: string; noun: string }[] = [
  { type: 'aircraft', label: 'Aircraft for sale', noun: 'aircraft' },
  { type: 'partnership', label: 'Partnerships', noun: 'partnership' },
  { type: 'seeker', label: 'Seeking a partnership', noun: 'seeker' },
]

interface Locked {
  context: string
  sourcePath: string
  noun: string
  matchCount: number | null
}

/**
 * "Build a custom alert from scratch" on the /alerts landing page — the last open
 * `[P1][goal]` alert-experience gap. The curated interest chips above only cover a
 * handful of popular searches; this lets a visitor wanting e.g. "Mooney M20J under
 * $120k in TX" build that exact alert without first running a browse search to reach
 * a prefilled capture box. Reuses `buildAlertCriteriaUpdate` (the same criteria→
 * source_path builder `/alerts/manage`'s edit form uses) and the existing
 * `AlertSignup` anonymous double-opt-in capture — no new subscribe path, no schema
 * change. "Continue" locks the computed context/sourcePath so `AlertSignup` doesn't
 * remount (and lose in-progress typing) on every criteria tweak.
 */
export default function AlertBuilder() {
  const [open, setOpen] = useState(false)
  const [locked, setLocked] = useState<Locked | null>(null)

  const [type, setType] = useState<EditableAlertTarget['type']>('aircraft')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [state, setState] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minYear, setMinYear] = useState('')
  const [maxYear, setMaxYear] = useState('')
  const [minTt, setMinTt] = useState('')
  const [maxTt, setMaxTt] = useState('')
  const [airports, setAirports] = useState<string[]>([])
  const [radius, setRadius] = useState('')

  const [liveCount, setLiveCount] = useState<number | null>(null)
  const [liveSourcePath, setLiveSourcePath] = useState('')

  const { sourcePath: currentSourcePath, context: currentContext } = useMemo(() => {
    const fields: AlertCriteriaFields =
      type === 'aircraft'
        ? { make, model, state, minPrice, maxPrice, minYear, maxYear, minTt, maxTt }
        : type === 'partnership'
          ? { make, state, airports, radius }
          : { make, model, state, airports, radius }
    return buildAlertCriteriaUpdate(type, null, fields)
  }, [type, make, model, state, minPrice, maxPrice, minYear, maxYear, minTt, maxTt, airports, radius])

  // Debounced live "N match right now" preview as fields change — same real
  // counting logic (`getAlertMatchCount` via the client-callable wrapper) every
  // other live-count surface in this codebase uses, never a client-side guess.
  useEffect(() => {
    if (!open || locked) return
    let cancelled = false
    const handle = setTimeout(() => {
      getAlertMatchCountForSourcePath(currentSourcePath).then((count) => {
        if (!cancelled) {
          setLiveCount(count)
          setLiveSourcePath(currentSourcePath)
        }
      })
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [open, locked, currentSourcePath])

  function handleContinue() {
    const noun = TYPE_OPTIONS.find((o) => o.type === type)?.noun ?? 'aircraft'
    setLocked({
      context: currentContext ?? '',
      sourcePath: currentSourcePath,
      noun,
      // Reuse the last debounced count only if it matches what we're about to lock —
      // otherwise omit rather than show a stale/mismatched number.
      matchCount: liveSourcePath === currentSourcePath ? liveCount : null,
    })
  }

  if (!open) {
    return (
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 underline-offset-2 hover:underline"
        >
          <Wrench className="h-3.5 w-3.5" />
          Build a custom alert from scratch
        </button>
      </div>
    )
  }

  if (locked) {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setLocked(null)}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
        >
          <Pencil className="h-3 w-3" />
          Edit criteria
        </button>
        <AlertSignup
          key={locked.sourcePath}
          context={locked.context || undefined}
          sourcePath={locked.sourcePath}
          noun={locked.noun}
          source="alerts_landing_builder"
          matchCount={locked.matchCount ?? undefined}
        />
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-sm font-medium text-slate-500">Build a custom alert</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => setType(opt.type)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              type === opt.type
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={type === 'partnership' ? 'col-span-2' : ''}>
          <label className={labelClass}>Make</label>
          <input
            type="text"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Any make"
            className={inputClass}
          />
        </div>

        {type !== 'partnership' ? (
          <div>
            <label className={labelClass}>Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Any model"
              className={inputClass}
            />
          </div>
        ) : null}

        <div>
          <label className={labelClass}>State</label>
          <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
            <option value="">Any state</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {type === 'partnership' || type === 'seeker' ? (
          <div className="col-span-2">
            <label className={labelClass}>
              Home airport{airports.length > 0 ? 's' : ''}
              {airports.length > 0 && (
                <span className="ml-1 font-normal normal-case tracking-normal text-sky-600">
                  · {airports.length} selected
                </span>
              )}
            </label>
            <AirportChipsInput codes={airports} onChange={setAirports} inputClassName={inputClass} />
            {airports.length === 1 && (
              <select value={radius} onChange={(e) => setRadius(e.target.value)} className={`${inputClass} mt-2`}>
                <option value="">Exact airport</option>
                {RADIUS.map((r) => (
                  <option key={r} value={r}>
                    Within {r} mi
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : null}

        {type === 'aircraft' ? (
          <>
            <div>
              <label className={labelClass}>Min price ($)</label>
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max price ($)</label>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Min year</label>
              <input
                type="number"
                min={0}
                value={minYear}
                onChange={(e) => setMinYear(e.target.value)}
                placeholder="Min"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max year</label>
              <input
                type="number"
                min={0}
                value={maxYear}
                onChange={(e) => setMaxYear(e.target.value)}
                placeholder="Max"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Min hours (TT)</label>
              <input
                type="number"
                min={0}
                value={minTt}
                onChange={(e) => setMinTt(e.target.value)}
                placeholder="Min"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max hours (TT)</label>
              <input
                type="number"
                min={0}
                value={maxTt}
                onChange={(e) => setMaxTt(e.target.value)}
                placeholder="Max"
                className={inputClass}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Honesty gate: only ever a real, server-verified count for the CURRENT
          fields — nothing renders while the debounce is in flight or stale. */}
      {liveSourcePath === currentSourcePath && liveCount != null ? (
        <p className="mt-3 text-xs font-medium text-emerald-700">
          {liveCount > 0
            ? `${liveCount} ${liveCount === 1 ? 'match' : 'matches'} right now.`
            : `None match right now — be first to know when one lists.`}
        </p>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
