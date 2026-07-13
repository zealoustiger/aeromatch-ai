'use client'

import { useState, useTransition } from 'react'
import { Wand2 } from 'lucide-react'
import { updateAlertCriteria } from '@/app/actions'
import type { AlertCriteriaFields } from '@/lib/alertEditCriteria'

export interface WidenSuggestion {
  fields: AlertCriteriaFields
  description: string
  count: number
  noun: 'listing' | 'pilot'
}

interface Props {
  id: string
  token?: string
  /** Whether this alert has 0 live matches right now. Deliberately separate
   *  from `suggestion` (rather than folded into a single nullable prop) so the
   *  parent can keep rendering this component at a stable position even after
   *  a successful widen flips this back to `false` — see the note below. */
  dead: boolean
  /** Pre-computed + re-verified server-side (see /alerts/manage) — null means no
   *  single-step widen turned up any real matches; render the honest fallback. */
  suggestion: WidenSuggestion | null
}

/**
 * Rendered for every confirmed, editable alert (not just dead ones) so this
 * component's identity — and its local `applied` state — survives the parent
 * server refresh a successful widen triggers. That refresh recomputes `dead`
 * as `false` (the whole point of widening), which would otherwise unmount a
 * conditionally-rendered instance and erase the confirmation before the user
 * ever sees it. Renders nothing for a live (non-dead) alert that hasn't just
 * been widened this session.
 */
export default function WidenAlertNudge({ id, token, dead, suggestion }: Props) {
  const [applied, setApplied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (applied) {
    return <p className="mt-0.5 text-xs font-medium text-emerald-600">Widened — this alert now watches a broader search.</p>
  }

  if (!dead) return null

  if (!suggestion) {
    return <p className="mt-0.5 text-xs text-slate-400">Nothing close yet — we&apos;ll keep watching.</p>
  }

  function handleWiden() {
    setError(null)
    startTransition(async () => {
      const result = await updateAlertCriteria(id, suggestion!.fields, token)
      if (result.error) {
        setError(result.error)
        return
      }
      setApplied(true)
    })
  }

  return (
    <p className="mt-0.5 text-xs text-slate-500">
      <button
        type="button"
        onClick={handleWiden}
        disabled={isPending}
        className="inline-flex items-center gap-1 font-semibold text-sky-600 underline-offset-2 hover:underline disabled:opacity-50"
      >
        <Wand2 className="h-3 w-3" />
        {isPending
          ? 'Widening…'
          : `${suggestion.description} — ${suggestion.count} ${suggestion.noun}${suggestion.count === 1 ? '' : 's'} match`}
      </button>
      {error ? <span className="ml-2 text-red-600">{error}</span> : null}
    </p>
  )
}
