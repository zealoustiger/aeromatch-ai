'use client'

import { useEffect, useState, useTransition } from 'react'
import { Plane } from 'lucide-react'
import { pauseAllAlerts, resumeAllAlerts } from '@/app/actions'

const DEFAULT_VACATION_DAYS = 14

function isoDatePlusDays(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// Bulk pause/resume for a subscriber with several alerts (GOAL.md: "fewer,
// not none" — this is the alternative to snoozing every row one at a time,
// or rage-unsubscribing when a simpler bulk option isn't offered). Mirrors
// AlertActions' pending/error pattern; works identically for the
// session-scoped and token-scoped (`?token=`) manage views via the same
// optional `token` prop every other alert action here already threads
// through.
export default function VacationModeControl({
  token,
  activeCount,
  pausedCount,
}: {
  token?: string
  activeCount: number
  pausedCount: number
}) {
  const [isPending, startTransition] = useTransition()
  // Computed client-side only, after mount — a server-rendered "today" can
  // differ from the client's by the time it hydrates, which would mismatch
  // a controlled <input type="date">'s value/min attributes.
  const [untilDate, setUntilDate] = useState('')
  const [minDate, setMinDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setUntilDate(isoDatePlusDays(DEFAULT_VACATION_DAYS))
    setMinDate(isoDatePlusDays(1))
  }, [])

  function handlePauseAll() {
    if (!untilDate) return
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const untilIso = new Date(`${untilDate}T00:00:00Z`).toISOString()
      const result = await pauseAllAlerts(untilIso, token)
      if (result.error) {
        setError(result.error)
      } else if (!result.count) {
        setMessage('Nothing to pause — every alert is already paused.')
      } else {
        const n = `${result.count} alert${result.count === 1 ? '' : 's'}`
        setMessage(result.dateApplied ? `Paused ${n} until ${formatDate(untilIso)}.` : `Paused ${n}.`)
      }
    })
  }

  function handleResumeAll() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await resumeAllAlerts(token)
      if (result.error) setError(result.error)
      else if (result.count) setMessage(`Resumed ${result.count} alert${result.count === 1 ? '' : 's'}.`)
    })
  }

  if (activeCount === 0 && pausedCount === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3">
      <Plane className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <p className="text-sm text-slate-600">Going away for a while?</p>
      {activeCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="vacation-until">
            Pause every alert until
          </label>
          <input
            id="vacation-until"
            type="date"
            value={untilDate}
            min={minDate || undefined}
            onChange={(e) => setUntilDate(e.target.value)}
            disabled={isPending}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
          />
          <button
            onClick={handlePauseAll}
            disabled={isPending || !untilDate}
            className="rounded-lg bg-slate-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            Pause all ({activeCount})
          </button>
        </div>
      ) : null}
      {pausedCount > 0 ? (
        <button
          onClick={handleResumeAll}
          disabled={isPending}
          className="rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50"
        >
          Resume all ({pausedCount})
        </button>
      ) : null}
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
      {message ? <p className="w-full text-xs text-emerald-600">{message}</p> : null}
    </div>
  )
}
