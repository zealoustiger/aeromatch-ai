'use client'

import { useState } from 'react'
import { Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { subscribeSavedSearchAlert } from '@/app/actions'
import { track } from '@/lib/analytics'

interface Props {
  searchId: string
  /** Whether a confirmed alert already exists for this search's source_path. */
  alreadySubscribed: boolean
}

/** One-click "turn this saved search into a real email alert" (see /searches). */
export default function SavedSearchAlertButton({ searchId, alreadySubscribed }: Props) {
  const [subscribed, setSubscribed] = useState(alreadySubscribed)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)

  async function handleClick() {
    if (pending || subscribed) return
    setPending(true)
    setError(false)
    const result = await subscribeSavedSearchAlert(searchId)
    setPending(false)
    if (result.error) {
      setError(true)
      return
    }
    track('alert_subscribed', {
      context: result.context || undefined,
      source_path: result.sourcePath,
      source: 'saved_search',
    })
    setSubscribed(true)
  }

  if (subscribed) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Alerts on
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
      {pending ? 'Turning on…' : error ? 'Try again' : 'Get email alerts'}
    </button>
  )
}
