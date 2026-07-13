'use client'

import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  active: boolean
  onToggle: () => void
  className?: string
}

/** Compact icon-only toggle that expands/collapses an inline `AlertSignup
 *  watchOnly` panel on a listing card — mirrors `SaveListingButton`'s
 *  `variant="icon"` circular treatment so the two stack cleanly. Carries no
 *  subscribe logic itself; the actual capture happens in `AlertSignup`. */
export default function WatchAlertButton({ active, onToggle, className }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // Cards wrap the photo/title in a Link; never navigate when toggling.
        e.preventDefault()
        e.stopPropagation()
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
