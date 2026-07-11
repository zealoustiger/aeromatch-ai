'use client'

import { useState, useTransition } from 'react'
import { TrendingDown } from 'lucide-react'
import { updateAlertPriceDropOptIn } from '@/app/actions'

/**
 * Persistent per-alert switch (not hidden behind "Edit") for aircraft-type
 * alerts only — price-drop matching doesn't exist for partnerships/seekers, so
 * this never renders for those rows (see /alerts/manage's page.tsx).
 */
export default function PriceDropToggle({ id, enabled: initialEnabled }: { id: string; enabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      const result = await updateAlertPriceDropOptIn(id, next)
      if (result.error) setEnabled(!next)
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      title={enabled ? 'Turn off price-drop alerts for this search' : 'Turn on price-drop alerts for this search'}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        enabled ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
      }`}
    >
      <TrendingDown className="h-3.5 w-3.5" />
      Price drops: {enabled ? 'On' : 'Off'}
    </button>
  )
}
