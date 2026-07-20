'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle2, X } from 'lucide-react'
import { createManageAlert } from '@/app/actions'
import { track } from '@/lib/analytics'
import type { EditableAlertTarget } from '@/lib/alertEditCriteria'
import type { AlertFrequency } from '@/lib/alertFrequency'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY',
]

const inputClass =
  'w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100'
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500'

const TYPE_OPTIONS: { type: EditableAlertTarget['type']; label: string }[] = [
  { type: 'aircraft', label: 'Aircraft for sale' },
  { type: 'partnership', label: 'Partnerships' },
  { type: 'seeker', label: 'Seeking a partnership' },
]

interface InitialValues {
  type: EditableAlertTarget['type']
  make?: string
  model?: string
  state?: string
  minPrice?: string
  maxPrice?: string
  airport?: string
  /** Present on an aircraft `EditableAlertTarget` (via `targetToFields`) but
   *  unused here — this form has no "good deals only" field of its own. */
  dealOnly?: boolean
  frequency?: AlertFrequency
  priceDropOptIn?: boolean
  newListingOptOut?: boolean
}

interface Props {
  /** Set only on the token-scoped (no-account) `/alerts/manage?token=` path. */
  token?: string
  /** Prefill from a source row (see AlertEditForm's "Duplicate" button) —
   *  criteria fields shown in the form, plus `frequency`/`priceDropOptIn`/
   *  `newListingOptOut` carried through to `createManageAlert` invisibly (this
   *  form has no cadence/price-drop-mode fields of its own; those are set via
   *  the row's own toggle after creation, same as any other alert). */
  initial?: InitialValues
  /** Tags the created row's `alerts.source` + the `alert_subscribed` event.
   *  Defaults to 'manage_new' (the plain "+ New alert" flow). */
  source?: string
  /** Mount already open, prefilled, with no collapsed "+ New alert" trigger —
   *  used when a parent (AlertEditForm's Duplicate button) owns visibility. */
  autoOpen?: boolean
  /** Called on Cancel and after a successful create, only relevant in
   *  `autoOpen` mode where the parent owns whether this is mounted at all. */
  onClose?: () => void
}

/**
 * The manage page could edit/pause/delete an alert but not create one — a
 * subscriber wanting one more alert had to go hunt for a capture box elsewhere
 * on the site. This mirrors AlertEditForm's inline-form shape, plus a listing-type
 * selector up front (an existing alert already knows its type from source_path;
 * a new one doesn't).
 */
export default function NewAlertForm({ token, initial, source, autoOpen, onClose }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(!!autoOpen)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)
  const [announcement, setAnnouncement] = useState<string | null>(null)

  const [type, setType] = useState<EditableAlertTarget['type']>(initial?.type ?? 'aircraft')
  const [make, setMake] = useState(initial?.make ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [state, setState] = useState(initial?.state ?? '')
  const [minPrice, setMinPrice] = useState(initial?.minPrice ?? '')
  const [maxPrice, setMaxPrice] = useState(initial?.maxPrice ?? '')
  const [airport, setAirport] = useState(initial?.airport ?? '')

  function reset() {
    setType(initial?.type ?? 'aircraft')
    setMake(initial?.make ?? '')
    setModel(initial?.model ?? '')
    setState(initial?.state ?? '')
    setMinPrice(initial?.minPrice ?? '')
    setMaxPrice(initial?.maxPrice ?? '')
    setAirport(initial?.airport ?? '')
    setError(null)
  }

  function handleCancel() {
    setOpen(false)
    reset()
    onClose?.()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const fields =
        type === 'aircraft'
          ? { make, model, state, minPrice, maxPrice }
          : type === 'partnership'
            ? { make, state, airport }
            : { make, model, state, airport }
      const result = await createManageAlert(type, fields, token, {
        frequency: initial?.frequency,
        priceDropOptIn: initial?.priceDropOptIn,
        newListingOptOut: initial?.newListingOptOut,
        source: source ?? 'manage_new',
      })
      if (result.error) {
        setError(result.error)
        return
      }
      if (!result.alreadyExisted) {
        track('alert_subscribed', { source: source ?? 'manage_new', alert_type: type, signed_in: !token })
      }
      setOpen(false)
      reset()
      setCreated(true)
      setAnnouncement('Alert created.')
      router.refresh()
      onClose?.()
    })
  }

  return (
    <div className="mb-4">
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
      {open ? (
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="mb-3">
            <label className={labelClass}>Alert for</label>
            <div className="flex flex-wrap gap-1.5">
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
              <div>
                <label className={labelClass}>Home airport</label>
                <input
                  type="text"
                  value={airport}
                  onChange={(e) => setAirport(e.target.value.toUpperCase())}
                  placeholder="e.g. KHWD"
                  className={inputClass}
                />
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
              </>
            ) : null}
          </div>

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
              {isPending ? 'Creating…' : 'Create alert'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : autoOpen ? null : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
        >
          <Plus className="h-3.5 w-3.5" />
          New alert
        </button>
      )}

      {created ? (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <span>Alert created</span>
            <button
              type="button"
              onClick={() => setCreated(false)}
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
