'use client'

import { Check, GitCompare } from 'lucide-react'
import { useCompareOptional, MAX_COMPARE, type CompareType } from './CompareProvider'
import { cn } from '@/lib/utils'

/**
 * Small "Compare" toggle shown on each listing card (partnerships + aircraft).
 * Renders nothing when there's no CompareProvider above it (so the same card can
 * appear on surfaces that don't offer comparison). Selecting adds the listing to
 * the compare tray; deselecting removes it. Blocked at the 3-listing cap.
 *
 * The `type` distinguishes the two marketplaces so they never mix into one
 * comparison; selecting a listing of a different type than what's currently in
 * the tray replaces the prior selection (handled in CompareProvider).
 */
export default function CompareToggle({
  listingId,
  label,
  type,
}: {
  listingId: string
  label: string
  type: CompareType
}) {
  const compare = useCompareOptional()
  if (!compare) return null

  const selected = compare.isSelected(listingId, type)
  // Only at the cap *within the same type* can a new add be blocked; selecting
  // the other type replaces the selection rather than being blocked.
  const sameType = compare.type === null || compare.type === type
  const blocked = !selected && sameType && compare.isFull

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={blocked}
      title={blocked ? `You can compare up to ${MAX_COMPARE} listings` : undefined}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        compare.toggle(listingId, label, type)
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 transition-colors',
        selected
          ? 'bg-sky-600 text-white ring-sky-600 hover:bg-sky-700'
          : blocked
            ? 'cursor-not-allowed bg-slate-50 text-slate-300 ring-slate-200'
            : 'bg-white text-sky-700 ring-sky-200 hover:bg-sky-50'
      )}
    >
      {selected ? <Check className="h-3.5 w-3.5" /> : <GitCompare className="h-3.5 w-3.5" />}
      {selected ? 'Comparing' : 'Compare'}
    </button>
  )
}
