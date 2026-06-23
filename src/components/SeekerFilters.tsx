'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY',
]
const RADIUS = [25, 50, 100, 150, 200]
const RATINGS = ['PPL', 'IFR', 'Commercial', 'CFI', 'ATP', 'Complex']
const SHARE_TYPES = [
  { value: '1/2', label: '1/2 Share' },
  { value: '1/3', label: '1/3 Share' },
  { value: '1/4', label: '1/4 Share' },
]
const HOURS = [100, 250, 500, 1000]

interface Props {
  initialValues: Record<string, string | undefined>
  /** Makes seekers are looking for, for the make dropdown (values match stored data). */
  makes?: string[]
}

export default function SeekerFilters({ initialValues, makes = [] }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      // Radius is meaningless without an airport — drop it when airport clears.
      if (key === 'airport' && !value) params.delete('radius')
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, searchParams]
  )

  const clearAll = () => startTransition(() => router.push(pathname))
  const hasFilters = Object.values(initialValues).some(Boolean)
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500'
  const fieldCls = 'w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100'

  return (
    <div className="space-y-5">
      {/* Home airport + radius */}
      <div>
        <label className={labelCls}>Near Home Airport</label>
        <input
          type="text"
          placeholder="e.g. KAUS"
          defaultValue={initialValues.airport ?? ''}
          onChange={(e) => update('airport', e.target.value.toUpperCase())}
          className={`${fieldCls} font-mono`}
          maxLength={4}
        />
        <select
          defaultValue={initialValues.radius ?? ''}
          onChange={(e) => update('radius', e.target.value)}
          className={`${fieldCls} mt-2`}
        >
          <option value="">Exact airport</option>
          {RADIUS.map((r) => <option key={r} value={r}>Within {r} mi</option>)}
        </select>
      </div>

      {/* State */}
      <div>
        <label className={labelCls}>State</label>
        <select defaultValue={initialValues.state ?? ''} onChange={(e) => update('state', e.target.value)} className={fieldCls}>
          <option value="">All states</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Aircraft make wanted */}
      <div>
        <label className={labelCls}>Aircraft Make Wanted</label>
        <select defaultValue={initialValues.make ?? ''} onChange={(e) => update('make', e.target.value)} className={fieldCls}>
          <option value="">Any make</option>
          {makes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Rating held */}
      <div>
        <label className={labelCls}>Rating Held</label>
        <select defaultValue={initialValues.rating ?? ''} onChange={(e) => update('rating', e.target.value)} className={fieldCls}>
          <option value="">Any rating</option>
          {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
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
