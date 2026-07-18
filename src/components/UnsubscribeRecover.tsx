'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BellRing, Calendar, Moon, Check, PartyPopper } from 'lucide-react'
import {
  pauseAlertByToken,
  snoozeAlertByToken,
  updateAlertFrequencyByToken,
  markAlertFoundAircraftByToken,
} from '@/app/actions'
import { formatResumeDate } from '@/lib/alertSnooze'
import { track } from '@/lib/analytics'

type Action = 'paused' | 'weekly' | 'snoozed' | 'found'

const UNSUB_REASONS = [
  { key: 'too_many_emails', label: 'Too many emails' },
  { key: 'not_relevant', label: 'Not relevant' },
  { key: 'found_aircraft', label: 'Found my aircraft' },
  { key: 'just_done', label: 'Just done' },
] as const

export default function UnsubscribeRecover({
  token,
  showWeeklyOption = false,
  alertCount = 1,
  sourcePath = null,
}: {
  token: string
  showWeeklyOption?: boolean
  /** How many alerts this token (or comma-separated token list, from a
   *  combined-digest unsubscribe) covers — drives honest "all N" copy. */
  alertCount?: number
  /** The unsubscribed alert's source_path, threaded through only for the
   *  reason-chip analytics event — never rendered. */
  sourcePath?: string | null
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [doneAction, setDoneAction] = useState<Action | null>(null)
  const [resumeDate, setResumeDate] = useState<string | null>(null)
  const [doneCount, setDoneCount] = useState(alertCount)
  const [reason, setReason] = useState<string | null>(null)
  const many = alertCount > 1

  function handleReason(key: string) {
    if (reason) return
    track('alert_unsubscribe_reason', { reason: key, count: alertCount, source_path: sourcePath ?? undefined })
    setReason(key)
  }
  // `/alerts/manage` resolves ownership from a SINGLE alert's token (then shows
  // every alert for that email) — a combined-digest `token` here can be a
  // comma-separated list, so only the first token is valid as that page's `?token=`.
  const manageToken = token.split(',')[0]?.trim() || token

  async function handleRecover(action: Action) {
    setStatus('sending')
    const result =
      action === 'paused'
        ? await pauseAlertByToken(token)
        : action === 'snoozed'
          ? await snoozeAlertByToken(token)
          : action === 'found'
            ? await markAlertFoundAircraftByToken(token)
            : await updateAlertFrequencyByToken(token)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
      return
    }
    track(action === 'found' ? 'alert_found_aircraft' : 'alert_unsubscribe_recovered', { action, count: alertCount })
    setDoneAction(action)
    setDoneCount((result as { count?: number }).count ?? alertCount)
    const rd = (result as { resumeDate?: string | null }).resumeDate ?? null
    setResumeDate(formatResumeDate(rd))
    setStatus('done')
  }

  if (status === 'done') {
    if (doneAction === 'found') {
      return (
        <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p className="flex items-center gap-2 font-medium">
            <PartyPopper className="h-4 w-4 shrink-0" />
            Congrats on the new aircraft! We&apos;ve stopped these emails.
          </p>
          <p className="mt-2">
            <Link href="/partnerships/new" className="font-medium text-sky-700 hover:text-sky-800">
              Flying it with partners? Post a share &rarr;
            </Link>
          </p>
        </div>
      )
    }
    // "You're" for a single alert, "All 3 of your alerts are" for a combined-digest recovery.
    const subject = doneCount > 1 ? `All ${doneCount} of your alerts are` : "You're"
    const message =
      doneAction === 'weekly'
        ? `${subject} on weekly emails now, not gone — you'll still hear about new matches, just less often.`
        : doneAction === 'snoozed' && resumeDate
          ? `${subject} snoozed until ${resumeDate}, not gone — we'll pick back up automatically then.`
          : `${subject} paused, not gone — we'll hold off until you resume from any aircraft page.`
    return (
      <div className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        <Check className="h-4 w-4 shrink-0" />
        {message}
      </div>
    )
  }

  return (
    <div className="mt-6 w-full max-w-sm rounded-lg border border-[#ece6dc] bg-[#f4efe7] px-4 py-4 text-left">
      <p className="text-sm font-medium text-slate-900">Changed your mind?</p>
      <p className="mt-1 text-sm text-slate-600">
        Get fewer emails instead of none — {showWeeklyOption ? 'switch to weekly, snooze, or pause' : 'snooze or pause'}{' '}
        {many ? `all ${alertCount} of your alerts` : 'this alert'} instead of unsubscribing completely.
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
      <div className="mt-3 border-t border-[#ece6dc] pt-3">
        <button
          onClick={() => handleRecover('found')}
          disabled={status === 'sending'}
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-40"
        >
          🎉 Found my aircraft — no need to keep these
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        <Link href={`/alerts/manage?token=${encodeURIComponent(manageToken)}`} className="font-medium text-sky-600 hover:text-sky-700">
          Manage all your alerts
        </Link>
      </p>
      <div className="mt-3 border-t border-[#ece6dc] pt-3">
        {reason ? (
          <p className="text-xs text-slate-500">Thanks — that helps.</p>
        ) : (
          <>
            <p className="text-xs text-slate-500">Mind telling us why?</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {UNSUB_REASONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => handleReason(r.key)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
