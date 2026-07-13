'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BellRing, Calendar, Moon, Check } from 'lucide-react'
import { pauseAlertByToken, snoozeAlertByToken, updateAlertFrequencyByToken } from '@/app/actions'
import { formatResumeDate } from '@/lib/alertSnooze'
import { track } from '@/lib/analytics'

type Action = 'paused' | 'weekly' | 'snoozed'

export default function UnsubscribeRecover({
  token,
  showWeeklyOption = false,
}: {
  token: string
  showWeeklyOption?: boolean
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [doneAction, setDoneAction] = useState<Action | null>(null)
  const [resumeDate, setResumeDate] = useState<string | null>(null)

  async function handleRecover(action: Action) {
    setStatus('sending')
    const result =
      action === 'paused'
        ? await pauseAlertByToken(token)
        : action === 'snoozed'
          ? await snoozeAlertByToken(token)
          : await updateAlertFrequencyByToken(token)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
      return
    }
    track('alert_unsubscribe_recovered', { action })
    setDoneAction(action)
    const rd = (result as { resumeDate?: string | null }).resumeDate ?? null
    setResumeDate(formatResumeDate(rd))
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        <Check className="h-4 w-4 shrink-0" />
        {doneAction === 'weekly'
          ? "You're on weekly emails now, not gone — you'll still hear about new matches, just less often."
          : doneAction === 'snoozed'
            ? resumeDate
              ? `You're snoozed until ${resumeDate}, not gone — we'll pick back up automatically then.`
              : "You're paused, not gone — we'll hold off until you resume from any aircraft page."
            : "You're paused, not gone — we'll hold off until you resume from any aircraft page."}
      </div>
    )
  }

  return (
    <div className="mt-6 w-full max-w-sm rounded-lg border border-[#ece6dc] bg-[#f4efe7] px-4 py-4 text-left">
      <p className="text-sm font-medium text-slate-900">Changed your mind?</p>
      <p className="mt-1 text-sm text-slate-600">
        Get fewer emails instead of none — {showWeeklyOption ? 'switch to weekly, snooze, or pause' : 'snooze or pause'}{' '}
        this alert instead of unsubscribing completely.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {showWeeklyOption && (
          <button
            onClick={() => handleRecover('weekly')}
            disabled={status === 'sending'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
          >
            <Calendar className="h-4 w-4" />
            {status === 'sending' ? 'Switching…' : 'Switch to weekly instead'}
          </button>
        )}
        <button
          onClick={() => handleRecover('snoozed')}
          disabled={status === 'sending'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          <Moon className="h-4 w-4" />
          {status === 'sending' ? 'Snoozing…' : 'Snooze 30 days'}
        </button>
        <button
          onClick={() => handleRecover('paused')}
          disabled={status === 'sending'}
          className={
            showWeeklyOption
              ? 'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40'
              : 'inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-40'
          }
        >
          <BellRing className="h-4 w-4" />
          {status === 'sending' ? 'Pausing…' : 'Pause instead'}
        </button>
      </div>
      {status === 'error' && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}
      <p className="mt-3 text-xs text-slate-500">
        <Link href={`/alerts/manage?token=${encodeURIComponent(token)}`} className="font-medium text-sky-600 hover:text-sky-700">
          Manage all your alerts
        </Link>
      </p>
    </div>
  )
}
