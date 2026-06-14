'use client'

import { useState, useId } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Tier the badge color by score so a glance conveys strength of fit. */
function tier(score: number): string {
  if (score >= 85) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (score >= 70) return 'bg-sky-50 text-sky-700 ring-sky-200'
  if (score >= 50) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

/**
 * Compact "92% match" badge with an accessible tooltip listing the top reasons.
 * Tooltip is keyboard-focusable and reachable on hover/focus; reasons are also
 * exposed via aria-label so screen readers get them without the visual popover.
 */
export default function MatchScore({
  score,
  reasons = [],
  className,
}: {
  score: number
  reasons?: string[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const top = reasons.slice(0, 4)
  const label = `${score}% match${top.length ? `: ${top.join('; ')}` : ''}`

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={top.length ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 transition-colors',
          tier(score)
        )}
      >
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        {score}% match
      </button>

      {top.length > 0 && (
        <span
          role="tooltip"
          id={tooltipId}
          className={cn(
            'pointer-events-none absolute left-0 top-full z-20 mt-1 w-60 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs shadow-lg transition-opacity',
            open ? 'opacity-100' : 'opacity-0'
          )}
        >
          <span className="mb-1 block font-semibold text-slate-700">Why this matches</span>
          <ul className="space-y-1 text-slate-600">
            {top.map((r, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-emerald-500" aria-hidden="true">
                  ✓
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </span>
      )}
    </span>
  )
}
