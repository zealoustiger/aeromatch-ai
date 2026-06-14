'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

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

interface Props {
  initialValues: Record<string, string | undefined>
}

export default function PartnershipFilters({ initialValues }: Props) {
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
      {/* Airport */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Home Airport (ICAO)
        </label>
        <input
          type="text"
          placeholder="e.g. KAUS, KDAL"
          defaultValue={initialValues.airport ?? ''}
          onChange={(e) => updateFilter('airport', e.target.value.toUpperCase())}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-mono focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          maxLength={4}
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

      {/* Max wet rate ($/hr) */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Max Wet Rate
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
          <input
            type="number"
            placeholder="e.g. 120"
            defaultValue={initialValues.max_hourly ?? ''}
            onChange={(e) => updateFilter('max_hourly', e.target.value)}
            className="w-full rounded-md border border-slate-200 pl-7 pr-12 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">/hr</span>
        </div>
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
