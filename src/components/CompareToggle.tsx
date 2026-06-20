'use client'

import { Check, GitCompare } from 'lucide-react'
import { useCompareOptional } from './CompareProvider'
import { cn } from '@/lib/utils'

/**
 * Small "Compare" toggle shown on each partnership card. Renders nothing when
 * there's no CompareProvider above it (so the same PartnershipCard can appear on
 * surfaces that don't offer comparison). Selecting adds the listing to the
 * compare tray; deselecting removes it. Blocked at the 3-listing cap.
 */
export default function CompareToggle({
  listingId,
  label,
}: {
  listingId: string
  label: string
}) {
  const compare = useCompareOptional()
  if (!compare) return null

  const selected = compare.isSelected(listingId)
  const blocked = !selected && compare.isFull

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={blocked}
      title={blocked ? `You can compare up to ${3} listings` : undefined}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        compare.toggle(listingId, label)
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
