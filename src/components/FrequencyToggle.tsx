'use client'

import { useState, useTransition } from 'react'
import { Clock, Zap } from 'lucide-react'
import { updateAlertFrequency, updateAlertDigestDay } from '@/app/actions'
import { normalizeDigestDay, type AlertFrequency } from '@/lib/alertFrequency'

const DAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

const CYCLE: Record<AlertFrequency, AlertFrequency> = {
  instant: 'daily',
  daily: 'weekly',
  weekly: 'monthly',
  monthly: 'instant',
}

const LABEL: Record<AlertFrequency, string> = {
  instant: 'Instant',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

const CLASSES: Record<AlertFrequency, string> = {
  instant: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
  daily: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  weekly: 'bg-slate-50 text-slate-500 hover:bg-slate-100',
  monthly: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
}

/**
 * Persistent per-alert digest-cadence switch (not hidden behind "Edit"),
 * mirrors AlertModeToggle's pattern — but renders for every alert type (unlike
 * price-drop/new-listing mode, cadence isn't aircraft-only). Clicking cycles
 * daily → weekly → monthly → daily. When cadence is weekly, also offers an
 * optional day-of-week picker so the digest lands on the same day every time
 * instead of drifting with "whenever 7 days have elapsed" (see
 * src/lib/alertFrequency.ts's isDigestDue) — monthly has no day preference,
 * same as daily.
 */
export default function FrequencyToggle({
  id,
  frequency: initial,
  digestDay: initialDigestDay,
  token,
}: {
  id: string
  frequency: AlertFrequency
  digestDay?: number | null
  /** Set only on the token-scoped (no-account) `/alerts/manage?token=` path. */
  token?: string
}) {
  const [frequency, setFrequency] = useState(initial)
  const [digestDay, setDigestDay] = useState(normalizeDigestDay(initialDigestDay))
  const [isPending, startTransition] = useTransition()
  const [isDayPending, startDayTransition] = useTransition()
  const [announcement, setAnnouncement] = useState<string | null>(null)

  function toggle() {
    const next: AlertFrequency = CYCLE[frequency]
    const previous = frequency
    setFrequency(next)
    setAnnouncement(null)
    startTransition(async () => {
      const result = await updateAlertFrequency(id, next, token)
      if (result.error) {
        setFrequency(previous)
        setAnnouncement(`Could not change digest frequency — still ${previous}.`)
      } else {
        setAnnouncement(`Digest frequency set to ${next}.`)
      }
    })
  }

  function changeDay(value: string) {
    const next = value === '' ? null : Number(value)
    const previous = digestDay
    setDigestDay(next)
    setAnnouncement(null)
    startDayTransition(async () => {
      const result = await updateAlertDigestDay(id, next, token)
      if (result.error) {
        setDigestDay(previous)
        setAnnouncement('Could not change digest day.')
      } else {
        setAnnouncement(
          next === null ? 'Digest day preference cleared.' : `Digest day set to ${DAY_OPTIONS[next].label}.`
        )
      }
    })
  }

  return (
    <>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        title={`Switch to ${LABEL[CYCLE[frequency]]}`}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${CLASSES[frequency]}`}
      >
        {frequency === 'instant' ? <Zap className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
        {LABEL[frequency]}
      </button>
      {frequency === 'instant' ? (
        // Honest cadence copy — never claim real-time. The instant cron sweeps
        // roughly every 15 minutes (vercel.json: /api/cron/alert-instant).
        <span className="shrink-0 text-xs text-slate-400">checked about every 15 min</span>
      ) : null}
      {frequency === 'weekly' ? (
        <label className="inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
          <span className="sr-only">Digest day</span>
          <select
            value={digestDay ?? ''}
            onChange={(e) => changeDay(e.target.value)}
            disabled={isDayPending}
            title="Pick which day your weekly digest arrives — we send around 8:00 UTC"
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-600 disabled:opacity-50"
          >
            <option value="">Any day</option>
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <span className="text-slate-400">around 8:00 UTC</span>
        </label>
      ) : null}
    </>
  )
}
