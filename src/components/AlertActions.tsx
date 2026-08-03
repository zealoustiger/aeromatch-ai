'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Pause, Play, Trash2, Send, Mail, Moon } from 'lucide-react'
import { pauseAlert, resumeAlert, snoozeAlert, deleteAlert, resendAlertConfirmation, sendSampleDigest } from '@/app/actions'
import { useAlertUndo } from './AlertUndoProvider'

export default function AlertActions({ id, status, token }: { id: string; status: string; token?: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [sampleSent, setSampleSent] = useState(false)
  const [announcement, setAnnouncement] = useState<string | null>(null)
  // Bumped on every SUCCESSFUL non-delete action; a matching effect then moves
  // keyboard/SR focus to this row's status region. Delete deliberately never
  // bumps it — its row unmounts, so the Undo toast (AlertUndoProvider) takes
  // focus instead. A counter (not the announcement string) so repeating the
  // same action still re-triggers the focus move.
  const [focusTick, setFocusTick] = useState(0)
  const statusRef = useRef<HTMLSpanElement>(null)
  const { notifyDeleted } = useAlertUndo()

  // Pause/Resume/Snooze swap out the very button that was clicked (e.g. Pause →
  // Resume), so after the server refresh the acted-on control has unmounted and
  // focus falls back to <body> — a keyboard/SR user loses their place in the
  // list. Move focus to the row's already-announced role="status" region (same
  // role="status" + tabindex="-1" pattern as the alert-capture-focus cycle) so
  // focus stays in-context and the result is read aloud.
  useEffect(() => {
    if (focusTick > 0) statusRef.current?.focus()
  }, [focusTick])

  function handleSendSample() {
    setError(null)
    setSampleSent(false)
    setAnnouncement(null)
    startTransition(async () => {
      const result = await sendSampleDigest(id, token)
      if (result.error) setError(result.error)
      else {
        setSampleSent(true)
        setAnnouncement('Sample digest sent.')
        setFocusTick((n) => n + 1)
      }
    })
  }

  function run(
    action: (id: string, token?: string) => Promise<{ ok?: boolean; error?: string }>,
    successMessage: string
  ) {
    setError(null)
    setAnnouncement(null)
    startTransition(async () => {
      const result = await action(id, token)
      if (result.error) setError(result.error)
      else {
        setAnnouncement(successMessage)
        setFocusTick((n) => n + 1)
      }
    })
  }

  function handleDelete() {
    if (!window.confirm('Delete this alert? You can always set it up again.')) return
    setError(null)
    setAnnouncement(null)
    startTransition(async () => {
      const result = await deleteAlert(id, token)
      if (result.error) {
        setError(result.error)
        return
      }
      setAnnouncement('Alert deleted.')
      if (result.alert) notifyDeleted(result.alert, token)
    })
  }

  function handleResend() {
    setError(null)
    setResent(false)
    setAnnouncement(null)
    startTransition(async () => {
      const result = await resendAlertConfirmation(id, token)
      if (result.error) setError(result.error)
      else {
        setResent(true)
        setAnnouncement('Confirmation email resent.')
        setFocusTick((n) => n + 1)
      }
    })
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span ref={statusRef} tabIndex={-1} className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
      {status === 'pending' ? (
        <button
          onClick={handleResend}
          disabled={isPending}
          title="Resend the confirmation email"
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {resent ? 'Sent!' : 'Resend'}
        </button>
      ) : null}
      {status === 'confirmed' ? (
        <button
          onClick={handleSendSample}
          disabled={isPending}
          title="Email me a sample of what this alert's digest looks like"
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          <Mail className="h-3.5 w-3.5" />
          {sampleSent ? 'Sent!' : 'Send sample'}
        </button>
      ) : null}
      {status === 'confirmed' ? (
        <>
          <button
            onClick={() => run(pauseAlert, 'Alert paused.')}
            disabled={isPending}
            title="Pause this alert indefinitely"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <Pause className="h-3.5 w-3.5" />
            Pause
          </button>
          <button
            onClick={() => run(snoozeAlert, 'Alert snoozed for 30 days.')}
            disabled={isPending}
            title="Snooze this alert for 30 days, then resume automatically"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <Moon className="h-3.5 w-3.5" />
            Snooze 30 days
          </button>
        </>
      ) : status === 'paused' || status === 'bounced' ? (
        <button
          onClick={() => run(resumeAlert, 'Alert resumed.')}
          disabled={isPending}
          title={status === 'bounced' ? 'Resume now that your email is fixed' : 'Resume this alert'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          Resume
        </button>
      ) : null}
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Delete this alert"
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
