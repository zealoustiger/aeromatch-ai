'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Loader2, Check, AlertCircle } from 'lucide-react'

type State =
  | { phase: 'idle' }
  | { phase: 'working' }
  | { phase: 'done'; draftId: string; rehosted: number; attempted: number }
  | { phase: 'error'; message: string }

export default function CaptureClient() {
  const [state, setState] = useState<State>({ phase: 'idle' })
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const hash = window.location.hash.slice(1)
    if (!hash) {
      setState({ phase: 'error', message: 'No data received. Use the bookmarklet on a Facebook post.' })
      return
    }

    let payload: { text?: string; imageUrls?: string[]; postUrl?: string }
    try {
      payload = JSON.parse(decodeURIComponent(hash))
    } catch {
      setState({ phase: 'error', message: 'Could not read the captured data.' })
      return
    }

    // Clear the hash so a refresh doesn't double-submit
    history.replaceState(null, '', window.location.pathname)
    setState({ phase: 'working' })

    fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setState({ phase: 'done', draftId: d.draftId, rehosted: d.imagesRehosted, attempted: d.imagesAttempted })
        } else {
          setState({ phase: 'error', message: d.error ?? 'Upload failed' })
        }
      })
      .catch((e) => setState({ phase: 'error', message: String(e) }))
  }, [])

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      {state.phase === 'working' && (
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="font-medium">Saving the post and re-hosting images…</p>
        </div>
      )}

      {state.phase === 'done' && (
        <div className="flex flex-col items-center gap-3">
          <Check className="h-10 w-10 text-emerald-500" />
          <h1 className="text-xl font-bold text-slate-900">Captured ✓</h1>
          <p className="text-sm text-slate-500">
            Saved {state.rehosted} of {state.attempted} image{state.attempted === 1 ? '' : 's'}.
          </p>
          <Link
            href="/admin/review"
            className="mt-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Review &amp; publish →
          </Link>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h1 className="text-xl font-bold text-slate-900">Couldn’t capture</h1>
          <p className="text-sm text-slate-500">{state.message}</p>
        </div>
      )}
    </div>
  )
}
