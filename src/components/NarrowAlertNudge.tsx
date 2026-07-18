'use client'

import { useState, useTransition } from 'react'
import { Filter } from 'lucide-react'
import { updateAlertCriteria } from '@/app/actions'
import type { AlertCriteriaFields } from '@/lib/alertEditCriteria'

export interface NarrowSuggestion {
  fields: AlertCriteriaFields
  description: string
  count: number
  noun: 'listing' | 'pilot'
}

interface Props {
  id: string
  token?: string
  /** Pre-computed + re-verified server-side (see /alerts/manage's
   *  `getNarrowSuggestions`) — empty means either the alert isn't over the
   *  high-volume threshold or no single-step tightener turned up a real,
   *  smaller live count. Renders nothing in that case. */
  suggestions: NarrowSuggestion[]
}

/**
 * The honest inverse of `WidenAlertNudge` — a confirmed alert matching a very
 * large number of live listings gets 1-2 one-tap tighteners instead of a
 * bloated, spam-reading digest (GOAL.md: never-spam cuts both ways).
 */
export default function NarrowAlertNudge({ id, token, suggestions }: Props) {
  const [applied, setApplied] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (applied) {
    return (
      <p className="mt-0.5 text-xs font-medium text-emerald-600">
        Narrowed to {applied} — fewer, better-matched emails.
      </p>
    )
  }

  if (suggestions.length === 0) return null

  function handleNarrow(suggestion: NarrowSuggestion) {
    setError(null)
    startTransition(async () => {
      const result = await updateAlertCriteria(id, suggestion.fields, token)
      if (result.error) {
        setError(result.error)
        return
      }
      setApplied(suggestion.description)
    })
  }

  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1">
        <Filter className="h-3 w-3 text-slate-400" />
        Matching a lot right now — narrow it?
      </span>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.description}
          type="button"
          onClick={() => handleNarrow(suggestion)}
          disabled={isPending}
          className="font-semibold text-sky-600 underline-offset-2 hover:underline disabled:opacity-50"
        >
          {suggestion.description} — {suggestion.count} {suggestion.noun}
          {suggestion.count === 1 ? '' : 's'}
        </button>
      ))}
      {error ? <span className="text-red-600">{error}</span> : null}
    </p>
  )
}
