'use client'

import { useState, useTransition } from 'react'
import { Clock } from 'lucide-react'
import { updateAlertFrequency } from '@/app/actions'
import type { AlertFrequency } from '@/lib/alertFrequency'

/**
 * Persistent per-alert digest-cadence switch (not hidden behind "Edit"),
 * mirrors AlertModeToggle's pattern — but renders for every alert type (unlike
 * price-drop/new-listing mode, cadence isn't aircraft-only).
 */
export default function FrequencyToggle({
  id,
  frequency: initial,
  token,
}: {
  id: string
  frequency: AlertFrequency
  /** Set only on the token-scoped (no-account) `/alerts/manage?token=` path. */
  token?: string
}) {
  const [frequency, setFrequency] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [announcement, setAnnouncement] = useState<string | null>(null)

  function toggle() {
    const next: AlertFrequency = frequency === 'daily' ? 'weekly' : 'daily'
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

  return (
    <>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        title={frequency === 'daily' ? 'Switch to a weekly digest' : 'Switch to a daily digest'}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          frequency === 'daily' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
        }`}
      >
        <Clock className="h-3.5 w-3.5" />
        {frequency === 'daily' ? 'Daily' : 'Weekly'}
      </button>
    </>
  )
}
