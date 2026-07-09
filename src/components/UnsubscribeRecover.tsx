'use client'

import { useState } from 'react'
import { BellRing, Check } from 'lucide-react'
import { pauseAlertByToken } from '@/app/actions'
import { track } from '@/lib/analytics'

export default function UnsubscribeRecover({ token }: { token: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handlePause() {
    setStatus('sending')
    const result = await pauseAlertByToken(token)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
      return
    }
    track('alert_unsubscribe_recovered')
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        <Check className="h-4 w-4 shrink-0" />
        You&apos;re paused, not gone — we&apos;ll hold off until you resume from any
        aircraft page.
      </div>
    )
  }

  return (
    <div className="mt-6 w-full max-w-sm rounded-lg border border-[#ece6dc] bg-[#f4efe7] px-4 py-4 text-left">
      <p className="text-sm font-medium text-slate-900">Changed your mind?</p>
      <p className="mt-1 text-sm text-slate-600">
        Get fewer emails instead of none — pause this alert instead of unsubscribing
        completely.
      </p>
      <button
        onClick={handlePause}
        disabled={status === 'sending'}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
      >
        <BellRing className="h-4 w-4" />
        {status === 'sending' ? 'Pausing…' : 'Pause instead'}
      </button>
      {status === 'error' && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}
    </div>
  )
}
