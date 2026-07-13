'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import AlertSignup from './AlertSignup'
import { getRecentlyViewed } from '@/lib/recentlyViewed'
import { deriveRecentlyViewedAlertContext } from '@/lib/recentlyViewedAlertContext'
import { getAlertMatchCountForSourcePath } from '@/app/actions'

const DISMISSED_KEY = 'ch_recent_alert_dismissed'

function isDismissed(context: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY)
    const dismissed = raw ? JSON.parse(raw) : []
    return Array.isArray(dismissed) && dismissed.includes(context)
  } catch {
    return false
  }
}

function dismiss(context: string): void {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY)
    const existing = raw ? JSON.parse(raw) : []
    const next: string[] = Array.isArray(existing) ? existing : []
    if (!next.includes(context)) next.push(context)
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
  } catch {
    /* quota / disabled storage — fail soft, dismiss just won't persist */
  }
}

type BannerState =
  | { status: 'hidden' }
  | {
      status: 'ready'
      context: string
      sourcePath: string
      noun: 'aircraft' | 'partnership'
      matchCount: number
    }

/**
 * A dismissible "you've been looking at X" banner for `/aircraft` and `/partnerships`,
 * derived purely from this device's own recently-viewed log (see lib/recentlyViewed.ts)
 * — no account, no server-side tracking. Honesty-gated: only renders once a live match
 * count for the suggested search comes back > 0. Skips rendering entirely when the
 * suggestion would just repeat the page's own active-filter context (`currentContext`),
 * so a visitor never sees two near-identical alert boxes on one page.
 */
export default function RecentlyViewedAlertBanner({ currentContext }: { currentContext?: string }) {
  const [state, setState] = useState<BannerState>({ status: 'hidden' })

  useEffect(() => {
    const derived = deriveRecentlyViewedAlertContext(getRecentlyViewed())
    if (!derived) return
    if (currentContext && derived.context.trim().toLowerCase() === currentContext.trim().toLowerCase()) return
    if (isDismissed(derived.context)) return

    let cancelled = false
    getAlertMatchCountForSourcePath(derived.sourcePath).then((count) => {
      if (cancelled || !count) return
      setState({
        status: 'ready',
        context: derived.context,
        sourcePath: derived.sourcePath,
        noun: derived.noun,
        matchCount: count,
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContext])

  if (state.status !== 'ready') return null

  return (
    <div className="relative mb-6 rounded-xl border border-sky-100 bg-sky-50/70 p-4">
      <button
        type="button"
        onClick={() => {
          dismiss(state.context)
          setState({ status: 'hidden' })
        }}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-slate-400 transition-colors hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-2 pr-6">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <p className="text-sm font-medium text-slate-700">
          You&rsquo;ve been looking at {state.context}{' '}
          {state.noun === 'partnership' ? 'partnerships' : 'listings'}.
        </p>
      </div>
      <AlertSignup
        context={state.context}
        sourcePath={state.sourcePath}
        noun={state.noun}
        source="recent_views"
        matchCount={state.matchCount}
        className="mt-3"
      />
    </div>
  )
}
