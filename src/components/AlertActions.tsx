'use client'

import { useState, useTransition } from 'react'
import { Pause, Play, Trash2, Send, Mail, Moon } from 'lucide-react'
import { pauseAlert, resumeAlert, snoozeAlert, deleteAlert, resendAlertConfirmation, sendSampleDigest } from '@/app/actions'

export default function AlertActions({ id, status, token }: { id: string; status: string; token?: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [sampleSent, setSampleSent] = useState(false)

  function handleSendSample() {
    setError(null)
    setSampleSent(false)
    startTransition(async () => {
      const result = await sendSampleDigest(id, token)
      if (result.error) setError(result.error)
      else setSampleSent(true)
    })
  }

  function run(action: (id: string, token?: string) => Promise<{ ok?: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action(id, token)
      if (result.error) setError(result.error)
    })
  }

  function handleDelete() {
    if (!window.confirm('Delete this alert? You can always set it up again.')) return
    run(deleteAlert)
  }

  function handleResend() {
    setError(null)
    setResent(false)
    startTransition(async () => {
      const result = await resendAlertConfirmation(id, token)
      if (result.error) setError(result.error)
      else setResent(true)
    })
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
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
            onClick={() => run(pauseAlert)}
            disabled={isPending}
            title="Pause this alert indefinitely"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <Pause className="h-3.5 w-3.5" />
            Pause
          </button>
          <button
            onClick={() => run(snoozeAlert)}
            disabled={isPending}
            title="Snooze this alert for 30 days, then resume automatically"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <Moon className="h-3.5 w-3.5" />
            Snooze 30 days
          </button>
        </>
      ) : status === 'paused' ? (
        <button
          onClick={() => run(resumeAlert)}
          disabled={isPending}
          title="Resume this alert"
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
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
