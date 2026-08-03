'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { restoreAlert } from '@/app/actions'
import { track } from '@/lib/analytics'

type AlertSnapshot = Record<string, unknown> & { id: string; context?: string | null }

type UndoState = { alert: AlertSnapshot; token?: string } | null

const AlertUndoContext = createContext<{
  notifyDeleted: (alert: AlertSnapshot, token?: string) => void
  deletedIds: Set<string>
} | null>(null)

/** Called by AlertActions right after a successful delete. Must run inside AlertUndoProvider. */
export function useAlertUndo() {
  const ctx = useContext(AlertUndoContext)
  if (!ctx) throw new Error('useAlertUndo must be used within AlertUndoProvider')
  return ctx
}

/** Hides a server-rendered row the instant its own delete succeeds, purely
 *  client-side — see the comment on deleteAlert (actions.ts) for why this
 *  can't wait for a server refetch. Stays hidden until Undo re-adds the row
 *  (or, if never undone, until the next real navigation reflects the DB). */
export function AlertRowVisibility({ id, children }: { id: string; children: React.ReactNode }) {
  const { deletedIds } = useAlertUndo()
  if (deletedIds.has(id)) return null
  return <>{children}</>
}

const UNDO_WINDOW_MS = 8000

/**
 * Wraps the /alerts/manage list. Deleting a row can't rely on the usual
 * revalidatePath-then-remount flow (see deleteAlert's comment), so both the
 * "hide this row" state and the "Undo" toast live here, at a stable position
 * outside any one row, surviving whatever the row's own subtree does.
 */
export default function AlertUndoProvider({ children }: { children: React.ReactNode }) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<UndoState>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastRef = useRef<HTMLDivElement>(null)

  // A deleted row unmounts (AlertRowVisibility), so the acted-on control and its
  // own role="status" announcement vanish — without this, keyboard/SR focus
  // falls back to <body>. Move focus to this toast (already role="status") the
  // moment it appears so the deletion is announced in-context and its Undo
  // control is one Tab away. Keyed on the deleted alert's id so a second delete
  // (a new toast) re-moves focus.
  useEffect(() => {
    if (pending) toastRef.current?.focus()
  }, [pending?.alert.id])

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPending(null)
    setRestoreError(null)
  }, [])

  const notifyDeleted = useCallback((alert: AlertSnapshot, token?: string) => {
    setDeletedIds((prev) => new Set(prev).add(alert.id))
    if (timerRef.current) clearTimeout(timerRef.current)
    setRestoreError(null)
    setPending({ alert, token })
    timerRef.current = setTimeout(() => setPending(null), UNDO_WINDOW_MS)
  }, [])

  async function handleUndo() {
    if (!pending) return
    setRestoring(true)
    const result = await restoreAlert(pending.alert, pending.token)
    setRestoring(false)
    if (result.error) {
      setRestoreError(result.error)
      return
    }
    track('alert_delete_undone', {})
    setDeletedIds((prev) => {
      const next = new Set(prev)
      next.delete(pending.alert.id)
      return next
    })
    dismissToast()
  }

  return (
    <AlertUndoContext.Provider value={{ notifyDeleted, deletedIds }}>
      {children}
      {pending ? (
        <div
          ref={toastRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          // Anchored left (not right) at every breakpoint — the site's
          // FeedbackWidget lives in the bottom-right corner (bottom-24/right-4
          // on mobile, bottom-5/right-5 on lg+) and this toast would otherwise
          // sit directly under/over it and steal its tap target at desktop
          // widths (both land on bottom-5/right-5 there).
          className="fixed inset-x-4 bottom-5 z-40 mx-auto max-w-md rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg sm:inset-x-auto sm:left-5 sm:right-auto"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate">
              {pending.alert.context ? `"${pending.alert.context}" alert deleted.` : 'Alert deleted.'}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={restoring}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 font-semibold transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {restoring ? 'Restoring…' : 'Undo'}
              </button>
              <button
                onClick={dismissToast}
                aria-label="Dismiss"
                className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {restoreError ? <p className="mt-1 text-xs text-red-300">{restoreError}</p> : null}
        </div>
      ) : null}
    </AlertUndoContext.Provider>
  )
}
