'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { getMatchSummary, type MatchSummary } from '@/app/matches/actions'

/**
 * Logged-in hook on the homepage: "X partnerships match you" (or N pilots match
 * your listing). Renders nothing for logged-out users or those with no signal.
 * The summary is computed server-side via a server action so no heavy matching
 * runs in the browser.
 */
export default function HomeMatchHook() {
  const [summary, setSummary] = useState<MatchSummary | null>(null)

  useEffect(() => {
    let active = true
    getMatchSummary()
      .then((s) => {
        if (active) setSummary(s)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  if (!summary) return null
  const { asSeeker, asOwner, hasSavedSearch } = summary
  if (asSeeker === 0 && asOwner === 0 && !hasSavedSearch) return null

  let headline: string
  if (asSeeker > 0) {
    headline = `${asSeeker} partnership${asSeeker === 1 ? '' : 's'} match you`
  } else if (asOwner > 0) {
    headline = `${asOwner} pilot${asOwner === 1 ? '' : 's'} match your listing`
  } else {
    headline = 'Pick up where you left off'
  }

  const href = asSeeker > 0 || asOwner > 0 ? '/matches' : '/searches'
  const cta = asSeeker > 0 || asOwner > 0 ? 'View your matches' : 'View saved searches'

  return (
    <div className="border-b border-emerald-100 bg-emerald-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row sm:px-6 lg:px-8">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          {headline}
        </p>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          {cta} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
