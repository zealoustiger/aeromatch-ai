'use client'

import { useState, useTransition } from 'react'
import { updateMatchAlertOptOut } from '@/app/actions'

// Persistent per-listing switch (not hidden behind "Edit") for the weekly
// `match-alert-digest` email — sits inline with `MatchAlertDisclosure` on
// `/listings`. Only partnerships/seekers get this email (aircraft-for-sale
// rows never render this).
export default function MatchAlertOptOutToggle({
  type,
  id,
  optedOut: initialOptedOut,
}: {
  type: 'partnership' | 'seeker'
  id: string
  optedOut: boolean
}) {
  const [optedOut, setOptedOut] = useState(initialOptedOut)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = !optedOut
    setOptedOut(next)
    startTransition(async () => {
      const result = await updateMatchAlertOptOut(type, id, next)
      if (result.error) setOptedOut(!next)
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className="font-medium text-slate-400 underline decoration-dotted hover:text-slate-600 disabled:opacity-50"
    >
      {optedOut ? '(paused — resume)' : '(pause these emails)'}
    </button>
  )
}
