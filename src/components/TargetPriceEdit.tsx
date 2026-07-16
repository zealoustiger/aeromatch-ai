'use client'

import { useState, useTransition } from 'react'
import { Pencil, X } from 'lucide-react'
import { updateAlertTargetPrice } from '@/app/actions'
import { formatPrice } from '@/lib/utils'

/**
 * Inline set/edit/clear control for a watch alert's `target_price` — the
 * deferred follow-up from `alert-watch-target-price` (that item shipped
 * capture-time target-price entry but no way to change it afterward short of
 * delete-and-recreate). Renders only for watch-type rows (see
 * `/alerts/manage`'s page.tsx) — family-search alerts use `AlertEditForm`
 * instead, which has no target-price concept.
 */
export default function TargetPriceEdit({
  id,
  targetPrice: initialTargetPrice,
  token,
}: {
  id: string
  targetPrice: number | null | undefined
  /** Set only on the token-scoped (no-account) `/alerts/manage?token=` path. */
  token?: string
}) {
  const [targetPrice, setTargetPrice] = useState(initialTargetPrice ?? null)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(initialTargetPrice != null ? String(initialTargetPrice) : '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openEdit() {
    setValue(targetPrice != null ? String(targetPrice) : '')
    setError(null)
    setOpen(true)
  }

  function save(next: number | null) {
    setError(null)
    startTransition(async () => {
      const result = await updateAlertTargetPrice(id, next, token)
      if (result.error) {
        setError(result.error)
        return
      }
      setTargetPrice(next)
      setOpen(false)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) {
      save(null)
      return
    }
    const parsed = parseInt(trimmed, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a positive number.')
      return
    }
    save(parsed)
  }

  if (open) {
    return (
      <form onSubmit={handleSubmit} className="inline-flex flex-wrap items-center gap-1.5">
        <input
          type="number"
          min={1}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Target price"
          aria-label="Target price"
          className="w-32 rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          Save
        </button>
        {targetPrice != null ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => save(null)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Remove
          </button>
        ) : null}
        <button
          type="button"
          disabled={isPending}
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {error ? <span className="w-full text-xs text-red-600">{error}</span> : null}
      </form>
    )
  }

  return (
    <button
      type="button"
      onClick={openEdit}
      title={targetPrice != null ? "Edit this watch's target price" : 'Add a target price to this watch'}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-sky-600 underline-offset-2 hover:underline"
    >
      <Pencil className="h-3 w-3" />
      {targetPrice != null ? `Edit target (${formatPrice(targetPrice)})` : 'Add target price'}
    </button>
  )
}
