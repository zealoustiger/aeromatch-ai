'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { deleteAllAlerts } from '@/app/actions'

const CONFIRM_WORD = 'DELETE'

// Collapsed "delete everything" affordance (GOAL.md: the unsubscribe promise
// should be credible, not "delete rows one by one and take our word the rest
// are gone"). Typed-confirmation gated — the button stays disabled until the
// visitor types CONFIRM_WORD, a stronger bar than the single-row delete's
// plain window.confirm. Same owner trust boundary as every other bulk alert
// action (VacationModeControl's pauseAllAlerts/resumeAllAlerts): the token or
// signed-in session proves the email server-side, not this component.
export default function DeleteAllAlertsControl({ token, email, count }: { token?: string; email: string; count: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deletedCount, setDeletedCount] = useState<number | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAllAlerts(token)
      if (result.error) {
        setError(result.error)
        return
      }
      // Token-scoped ownership is proven by looking up the SAME row we just
      // deleted (see resolveOwnerEmail) — the token is now dead, so the
      // page's own automatic post-action refresh would re-resolve it to
      // nothing and show the generic "this link is no longer valid" wall
      // in place of this confirmation. Route to a dedicated `?deleted=`
      // state instead, which the page renders regardless of token validity.
      // The signed-in path has no such trap (the session still resolves the
      // same email with zero rows left) — plain revalidate + inline message.
      if (token) {
        router.push(`/alerts/manage?deleted=${result.count ?? 0}`)
      } else {
        setDeletedCount(result.count ?? 0)
      }
    })
  }

  if (deletedCount !== null) {
    return (
      <p
        className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
        role="status"
        aria-live="polite"
      >
        Deleted {deletedCount} alert{deletedCount === 1 ? '' : 's'} for <strong>{email}</strong>. Nothing else is
        stored for this address on ClubHanger.
      </p>
    )
  }

  if (count === 0) return null

  if (!open) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-4">
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-slate-400 underline-offset-2 hover:text-red-600 hover:underline"
        >
          Delete all my alerts &amp; data
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-xl border border-red-200 bg-red-50/60 px-4 py-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-red-800">
            This permanently deletes all {count} alert{count === 1 ? '' : 's'} for {email} — every saved search,
            price-drop watch, and frequency setting. This can&apos;t be undone; you&apos;d have to set them up again
            from scratch.
          </p>
          <label htmlFor="delete-all-confirm" className="mt-3 block text-xs font-medium text-slate-600">
            Type {CONFIRM_WORD} to confirm
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <input
              id="delete-all-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isPending}
              autoComplete="off"
              spellCheck={false}
              className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
            />
            <button
              onClick={handleDelete}
              disabled={isPending || confirmText !== CONFIRM_WORD}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete everything
            </button>
            <button
              onClick={() => {
                setOpen(false)
                setConfirmText('')
                setError(null)
              }}
              disabled={isPending}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
