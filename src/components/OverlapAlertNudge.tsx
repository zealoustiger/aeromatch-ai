'use client'

import { useState, useTransition } from 'react'
import { Copy } from 'lucide-react'
import { deleteAlert } from '@/app/actions'

interface Props {
  id: string
  token?: string
  broaderContext: string
}

/**
 * Rendered under a confirmed alert whose criteria are a strict, exact subset
 * of another confirmed alert's (see `alertOverlap.ts`) — GOAL.md: a combined
 * digest that repeats the same listings across two sections reads as spam.
 * "Remove this one" reuses the existing owner-scoped `deleteAlert` action
 * (same delete path the row's own Delete button uses); "Keep both" just
 * dismisses the nudge for this page view — mirrors `ManageAlertCrossSell`'s
 * local-only dismiss (no need to persist a dismissal server-side).
 */
export default function OverlapAlertNudge({ id, token, broaderContext }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (dismissed) return null

  function handleRemove() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAlert(id, token)
      if (result.error) setError(result.error)
    })
  }

  return (
    <p className="mt-0.5 text-xs text-slate-500">
      <Copy className="mr-1 inline h-3 w-3 text-slate-400" />
      Already covered by your &ldquo;{broaderContext}&rdquo; alert —{' '}
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="font-semibold text-sky-600 underline-offset-2 hover:underline disabled:opacity-50"
      >
        {isPending ? 'Removing…' : 'remove this one'}
      </button>{' '}
      or{' '}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        disabled={isPending}
        className="text-slate-400 underline-offset-2 hover:underline disabled:opacity-50"
      >
        keep both
      </button>
      {error ? <span className="ml-2 text-red-600">{error}</span> : null}
    </p>
  )
}
