'use client'

import { useState, useTransition } from 'react'
import { Clock } from 'lucide-react'
import { updateAlertFrequency } from '@/app/actions'
import type { AlertFrequency } from '@/lib/alertFrequency'

/**
 * Persistent per-alert digest-cadence switch (not hidden behind "Edit"),
 * mirrors PriceDropToggle's pattern — but renders for every alert type (unlike
 * price-drop, cadence isn't aircraft-only).
 */
export default function FrequencyToggle({ id, frequency: initial }: { id: string; frequency: AlertFrequency }) {
  const [frequency, setFrequency] = useState(initial)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next: AlertFrequency = frequency === 'daily' ? 'weekly' : 'daily'
    setFrequency(next)
    startTransition(async () => {
      const result = await updateAlertFrequency(id, next)
      if (result.error) setFrequency(frequency)
    })
  }

  return (
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
  )
}
