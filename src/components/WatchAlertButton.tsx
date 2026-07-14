'use client'

import { useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'

interface Props {
  active: boolean
  onToggle: () => void
  className?: string
  /** Per-placement analytics attribution for the impression/open events this
   *  affordance emits — must match the `source` its expanded `AlertSignup` panel
   *  passes to `alert_subscribed` (e.g. "card_watch" / "partnership_card_watch")
   *  so view → open → subscribe joins on one placement. Omit `source`/`sourcePath`
   *  to keep the button purely presentational (fires nothing). */
  source?: string
  sourcePath?: string
  context?: string
}

/** Compact icon-only toggle that expands/collapses an inline `AlertSignup
 *  watchOnly` panel on a listing card — mirrors `SaveListingButton`'s
 *  `variant="icon"` circular treatment so the two stack cleanly. Carries no
 *  subscribe logic itself; the actual capture happens in `AlertSignup`. Emits
 *  the impression (`alert_capture_viewed`) + open (`alert_capture_opened`)
 *  denominator events for its placement — the panel it expands only mounts on
 *  tap, so it can't be the view denominator itself. */
export default function WatchAlertButton({ active, onToggle, className, source, sourcePath, context }: Props) {
  // Impression denominator: fire once when the bell scrolls into view, mirroring
  // AlertSignup's own `alert_capture_viewed` payload shape so bell placements get a
  // real per-surface view count. Attributed callers only (source + sourcePath set).
  const btnRef = useRef<HTMLButtonElement>(null)
  const viewedRef = useRef(false)
  useEffect(() => {
    if (!source || !sourcePath) return
    const el = btnRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (viewedRef.current || !entry.isIntersecting) return
        viewedRef.current = true
        track('alert_capture_viewed', {
          context: context || 'all',
          source_path: sourcePath,
          source,
        })
        observer.disconnect()
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={(e) => {
        // Cards wrap the photo/title in a Link; never navigate when toggling.
        e.preventDefault()
        e.stopPropagation()
        // Middle-funnel step: only on the expand (not the collapse), so
        // view → open → subscribe is a clean per-placement funnel.
        if (source && sourcePath && !active) {
          track('alert_capture_opened', {
            context: context || 'all',
            source_path: sourcePath,
            source,
          })
        }
        onToggle()
      }}
      aria-pressed={active}
      aria-expanded={active}
      aria-label={active ? 'Hide price-drop alert' : 'Alert me if the price drops on this listing'}
      title="Alert me if the price drops"
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm transition-colors hover:text-sky-700',
        active && 'text-sky-600',
        className
      )}
    >
      <Bell className={cn('h-4 w-4', active && 'fill-sky-100')} aria-hidden="true" />
    </button>
  )
}
