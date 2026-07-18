'use client'

import { useState, useTransition } from 'react'
import { Zap } from 'lucide-react'
import { recordInstantAlertInterest } from '@/app/actions'
import { track } from '@/lib/analytics'

/**
 * Honest, non-selectable demand probe next to FrequencyToggle — instant
 * sends aren't a real cadence yet, so this never joins Daily/Weekly as a
 * selectable option; it only records a one-tap interest signal.
 */
export default function InstantInterestNudge({ id, token }: { id: string; token?: string }) {
  const [interested, setInterested] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (interested) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        Thanks — noted!
      </span>
    )
  }

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await recordInstantAlertInterest(id, token)
      if (result.error) {
        setError(result.error)
        return
      }
      track('instant_alert_interest', { alert_id: id })
      setInterested(true)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        title="We check daily today — tap if you'd want within-the-hour alerts"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
      >
        <Zap className="h-3.5 w-3.5" />
        Instant — interested?
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </>
  )
}
