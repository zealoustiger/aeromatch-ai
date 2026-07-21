'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { ExternalLink, Pencil, Copy, CheckCircle2, X } from 'lucide-react'
import { getAlertMatchCountForSourcePath, updateAlertCriteria, removeAlertCriteriaParam } from '@/app/actions'
import {
  buildAlertCriteriaUpdate,
  getHiddenCriteria,
  targetToFields,
  type EditableAlertTarget,
  type HiddenCriterion,
} from '@/lib/alertEditCriteria'
import { normalizeFrequency } from '@/lib/alertFrequency'
import type { AircraftFacets } from '@/lib/aircraft-facets'
import { groupModelVariants } from '@/lib/modelGroups'
import { toggleCsvItem } from '@/lib/csvList'
import AlertActions from '@/components/AlertActions'
import NewAlertForm from '@/components/NewAlertForm'
import AirportChipsInput from '@/components/AirportChipsInput'

/** Mirrors `getAlertMatchCount`'s noun choice (`alertMatchCounts.ts`) — aircraft/partnership alerts count listings, seeker alerts count pilots. */
function nounFor(type: EditableAlertTarget['type']): 'listing' | 'pilot' {
  return type === 'seeker' ? 'pilot' : 'listing'
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY',
]

const inputClass =
  'w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100'
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500'

interface Props {
  id: string
  status: string
  sourcePath: string | null
  /** Pre-parsed from `source_path` server-side; null when this alert isn't editable
   *  here (legacy path-segment SEO source, or none) — no Edit button renders then. */
  target: EditableAlertTarget | null
  /** This row's own cadence + price-drop mode — carried into the Duplicate
   *  form's created row (see NewAlertForm's `initial`), invisibly (none of
   *  these are editable fields in this form; all are set via the row's own
   *  toggles after creation, same as any other alert). */
  frequency?: string
  priceDropOptIn?: boolean
  newListingOptOut?: boolean
  /** Set only on the token-scoped (no-account) `/alerts/manage?token=` path. */
  token?: string
  /** Opens the form once on mount instead of waiting for the Edit click —
   *  set by the parent page when this row is the one named by `?edit=<id>`
   *  (the digest email's per-section "Edit this alert" deep link). */
  autoOpen?: boolean
  /** Make → model options for the aircraft Model chip picker (browse-filter
   *  parity). Undefined/empty facets, or a `make` the facets set doesn't know,
   *  falls back to the plain text input — this form must stay usable either way. */
  facets?: AircraftFacets
}

/**
 * Wraps the existing View link + `AlertActions` (Pause/Resume/Delete, unchanged)
 * with a new "Edit" toggle that expands an inline criteria form. Kept as one
 * component (rather than a separate toggle + panel) so the open/pre-filled-field
 * state has a single owner and the whole action cluster stays one flex item in
 * the parent `<li>` row — no fragile multi-child flex-wrap layout needed.
 */
export default function AlertEditForm({
  id,
  status,
  sourcePath,
  target,
  frequency,
  priceDropOptIn,
  newListingOptOut,
  token,
  autoOpen,
  facets,
}: Props) {
  const [open, setOpen] = useState(false)
  // Mutually exclusive with the Edit form below — only one inline form per row.
  const [duplicating, setDuplicating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [announcement, setAnnouncement] = useState<string | null>(null)

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [state, setState] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minYear, setMinYear] = useState('')
  const [maxYear, setMaxYear] = useState('')
  const [airports, setAirports] = useState<string[]>([])
  const [dealOnly, setDealOnly] = useState(false)
  const [hiddenCriteria, setHiddenCriteria] = useState<HiddenCriterion[]>([])
  const [liveCount, setLiveCount] = useState<number | null>(null)

  // Model chip picker (aircraft alerts only) — same variant-grouped multi-select
  // as `AircraftSaleFilters`, keyed off the live `make` field so switching Make
  // mid-edit reloads the right option set. Case-insensitive match against the
  // facets' exact-cased keys since `make` here is free-typed, not a <select>.
  const modelOptions = useMemo(() => {
    if (!facets) return []
    const needle = make.trim().toLowerCase()
    if (!needle) return []
    const matchedMake = Object.keys(facets.modelsByMake).find((m) => m.toLowerCase() === needle)
    return matchedMake ? facets.modelsByMake[matchedMake] : []
  }, [facets, make])
  const modelGroups = useMemo(() => groupModelVariants(modelOptions), [modelOptions])
  const selectedModelSet = useMemo(
    () => new Set(model.split(',').map((m) => m.trim()).filter(Boolean)),
    [model]
  )

  // Debounced live "N listings match right now" preview as the form's own fields
  // change — reuses the same real counting logic as the static per-row count
  // above (`getAlertMatchCount` via the `getAlertMatchCountForSourcePath` action),
  // never a client-side guess. Fails soft to "no preview" on error/unrecognized
  // path, same as the static count; never blocks Save.
  useEffect(() => {
    if (!open || !target) return
    let cancelled = false
    const handle = setTimeout(() => {
      const fields =
        target.type === 'aircraft'
          ? { make, model, state, minPrice, maxPrice, minYear, maxYear, dealOnly }
          : target.type === 'partnership'
            ? { make, state, airports }
            : { make, model, state, airports }
      const { sourcePath: candidatePath } = buildAlertCriteriaUpdate(target.type, sourcePath, fields)
      getAlertMatchCountForSourcePath(candidatePath).then((count) => {
        if (!cancelled) setLiveCount(count)
      })
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [open, target, sourcePath, make, model, state, minPrice, maxPrice, minYear, maxYear, airports, dealOnly])

  function openEdit() {
    if (!target) return
    // Re-seed from the current `target` prop every time the form opens, rather
    // than only at mount, so a just-saved edit (new source_path from the parent
    // server component re-render) is reflected next time this row is reopened.
    setMake(target.make)
    setModel('model' in target ? target.model : '')
    setState('state' in target ? target.state : '')
    setMinPrice('minPrice' in target ? target.minPrice : '')
    setMaxPrice('maxPrice' in target ? target.maxPrice : '')
    setMinYear('minYear' in target ? target.minYear : '')
    setMaxYear('maxYear' in target ? target.maxYear : '')
    setAirports('airports' in target ? target.airports : [])
    setDealOnly('dealOnly' in target ? target.dealOnly : false)
    setHiddenCriteria(getHiddenCriteria(target.type, sourcePath))
    setLiveCount(null)
    setError(null)
    setDuplicating(false)
    setOpen(true)
  }

  // Digest email deep link (`?edit=<id>` on /alerts/manage) — open this row's
  // form once on first render instead of requiring an extra click.
  useEffect(() => {
    if (autoOpen) openEdit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleRemoveHidden(key: string) {
    if (!target) return
    const removed = hiddenCriteria.find((c) => c.key === key)
    startTransition(async () => {
      const result = await removeAlertCriteriaParam(id, key, token)
      if (result.error) {
        setError(result.error)
        return
      }
      setHiddenCriteria((prev) => prev.filter((c) => c.key !== key))
      setSaved(true)
      setAnnouncement(removed ? `Removed "${removed.label}".` : 'Criterion removed.')
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return
    setError(null)
    startTransition(async () => {
      const fields =
        target.type === 'aircraft'
          ? { make, model, state, minPrice, maxPrice, minYear, maxYear, dealOnly }
          : target.type === 'partnership'
            ? { make, state, airports }
            : { make, model, state, airports }
      const result = await updateAlertCriteria(id, fields, token)
      if (result.error) {
        setError(result.error)
        return
      }
      setOpen(false)
      setSaved(true)
      setAnnouncement('Alert updated.')
    })
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto">
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {sourcePath ? (
          <Link
            href={sourcePath}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </Link>
        ) : null}
        <AlertActions id={id} status={status} token={token} />
        {target ? (
          <button
            type="button"
            onClick={() => (open ? setOpen(false) : openEdit())}
            title="Edit this alert's criteria"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <Pencil className="h-3.5 w-3.5" />
            {open ? 'Cancel' : 'Edit'}
          </button>
        ) : null}
        {target ? (
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setDuplicating((d) => !d)
            }}
            title="Create a new alert prefilled from this one"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <Copy className="h-3.5 w-3.5" />
            {duplicating ? 'Cancel' : 'Duplicate'}
          </button>
        ) : null}
      </div>

      {duplicating && target ? (
        <NewAlertForm
          token={token}
          source="manage_duplicate"
          autoOpen
          onClose={() => setDuplicating(false)}
          initial={{
            type: target.type,
            ...targetToFields(target),
            frequency: normalizeFrequency(frequency),
            priceDropOptIn: priceDropOptIn ?? true,
            newListingOptOut: newListingOptOut ?? false,
          }}
        />
      ) : null}

      {open && target ? (
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 sm:w-96"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className={target.type === 'partnership' ? 'col-span-2' : ''}>
              <label className={labelClass}>Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Any make"
                className={inputClass}
              />
            </div>

            {target.type === 'aircraft' && modelOptions.length > 0 ? (
              <div>
                <label className={labelClass}>
                  Model
                  {selectedModelSet.size > 0 && (
                    <span className="ml-1 font-normal normal-case tracking-normal text-sky-600">
                      · {selectedModelSet.size} selected
                    </span>
                  )}
                </label>
                <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {modelGroups.map((g) =>
                    g.members.length === 1 ? (
                      <label
                        key={g.key}
                        className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedModelSet.has(g.members[0])}
                          onChange={() => setModel((m) => toggleCsvItem(m, g.members[0]))}
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
                        onToggleGroup={(members, allSelected) =>
                          setModel((m) => {
                            const current = new Set(m.split(',').map((x) => x.trim()).filter(Boolean))
                            if (allSelected) members.forEach((mem) => current.delete(mem))
                            else members.forEach((mem) => current.add(mem))
                            return [...current].join(', ')
                          })
                        }
                        onToggleVariant={(v) => setModel((m) => toggleCsvItem(m, v))}
                      />
                    )
                  )}
                </div>
              </div>
            ) : target.type !== 'partnership' ? (
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

            {target.type === 'partnership' || target.type === 'seeker' ? (
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
              </div>
            ) : null}

            {target.type === 'aircraft' ? (
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
              </>
            ) : null}
          </div>

          {target.type === 'aircraft' ? (
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={dealOnly}
                onChange={(e) => setDealOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
              />
              Only show good deals
            </label>
          ) : null}

          {hiddenCriteria.length > 0 ? (
            <div className="mt-3">
              <p className={labelClass}>Also applies (from advanced search)</p>
              <div className="flex flex-wrap gap-1.5">
                {hiddenCriteria.map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1.5 text-xs font-medium text-slate-600"
                  >
                    {c.label}
                    <button
                      type="button"
                      onClick={() => handleRemoveHidden(c.key)}
                      disabled={isPending}
                      title={`Remove "${c.label}"`}
                      aria-label={`Remove "${c.label}"`}
                      className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {liveCount !== null ? (
            <p
              className={`mt-3 text-xs ${liveCount > 0 ? 'text-slate-500' : 'text-amber-600'}`}
              role="status"
              aria-live="polite"
            >
              {liveCount > 0
                ? `${liveCount} ${nounFor(target.type)}${liveCount === 1 ? '' : 's'} match${liveCount === 1 ? 'es' : ''} right now`
                : "This alert won't match anything today — consider widening"}
            </p>
          ) : null}

          {error ? (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {saved ? (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <span>Alert updated</span>
            <button
              type="button"
              onClick={() => setSaved(false)}
              aria-label="Dismiss"
              className="-mr-1 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Mirrors `AircraftSaleFilters`' `ModelGroupRow` — same "(all)" parent +
 *  disclosure UX, adapted to toggle local comma-string state instead of a URL
 *  param. */
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
