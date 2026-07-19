'use client'

import { useState } from 'react'
import { RotateCcw, Check } from 'lucide-react'
import { resumeAlertsByToken } from '@/app/actions'
import { track } from '@/lib/analytics'

/** One-tap "Undo — resume now" on `/alerts/status?state=snoozed` — the
 *  subscriber just clicked a tokenized snooze link from a digest email
 *  footer; this lets them immediately reverse it without a trip to
 *  `/alerts/manage` (same "one honest click either way" bar as
 *  UnsubscribeRecover's own recovery actions). */
export default function SnoozeUndo({ token }: { token: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleUndo() {
    setStatus('sending')
    const result = await resumeAlertsByToken(token)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
      return
    }
    track('alert_snooze_undone', {})
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <div
        className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        role="status"
        aria-live="polite"
      >
        <Check className="h-4 w-4 shrink-0" />
        You&apos;re resumed — alerts are active again.
      </div>
    )
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleUndo}
        disabled={status === 'sending'}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
      >
        <RotateCcw className="h-4 w-4" />
        {status === 'sending' ? 'Resuming…' : 'Undo — resume now'}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
