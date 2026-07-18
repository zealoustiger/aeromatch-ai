'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { requestAlertEmailChange, cancelAlertEmailChange } from '@/app/actions'
import { suggestEmailFix } from '@/lib/suggestEmailFix'

/**
 * "Update email" on `/alerts/manage` — owner-level, not per-row, so it lives
 * once near the top of the page rather than on each alert. Collapsed behind a
 * text link until either opened or a change is already pending (server-known
 * via `pendingEmail`), so it doesn't clutter the page for the common case of
 * a subscriber who never needs it.
 */
export default function UpdateAlertEmailForm({
  token,
  pendingEmail,
}: {
  token?: string
  pendingEmail: string | null
}) {
  const [open, setOpen] = useState(!!pendingEmail)
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  // Suggest-only "did you mean gmail.com?" — never auto-corrects, never blocks
  // submission of the as-typed address (see lib/suggestEmailFix.ts). Matters more
  // here than most capture points: a typo silently misroutes every future alert.
  const emailSuggestion = suggestEmailFix(email)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await requestAlertEmailChange(email, token)
      if (result.error) setError(result.error)
      else setSent(true)
    })
  }

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await cancelAlertEmailChange(token)
      if (result.error) setError(result.error)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
      >
        Change the email these alerts go to
      </button>
    )
  }

  if (pendingEmail) {
    return (
      <div className="mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
        <p>
          We sent a confirmation to <strong>{pendingEmail}</strong> — click the link there to
          finish moving your alerts. Until then, everything keeps going to this address.
        </p>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="mt-1.5 font-medium text-amber-700 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Cancel this change
        </button>
        {error ? <p className="mt-1 text-red-600">{error}</p> : null}
      </div>
    )
  }

  if (sent) {
    return (
      <p className="mt-2 text-xs text-emerald-700">
        Check your new inbox — click the confirmation link there to finish moving your alerts.
      </p>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 sm:flex-row" noValidate>
        <label htmlFor="new-alert-email" className="sr-only">
          New email address
        </label>
        <input
          id="new-alert-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="new@email.com"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          enterKeyHint="send"
          className="w-full flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
        <button
          type="submit"
          disabled={isPending || !email}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          <Mail className="h-3.5 w-3.5" />
          {isPending ? 'Sending…' : 'Send confirmation'}
        </button>
        {error ? <p className="text-xs text-red-600 sm:w-full">{error}</p> : null}
      </form>
      {emailSuggestion && (
        <button
          type="button"
          onClick={() => setEmail(emailSuggestion)}
          className="mt-1.5 block text-xs font-medium text-sky-700 underline-offset-2 hover:underline"
        >
          Did you mean <span className="font-semibold">{emailSuggestion}</span>?
        </button>
      )}
    </div>
  )
}
