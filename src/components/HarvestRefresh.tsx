'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

// Refresh control for the photo-harvest status panel. Auto-polls every few seconds
// while a run is live; always offers a manual refresh.
export default function HarvestRefresh({ live }: { live: boolean }) {
  const router = useRouter()
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    if (!live) return
    const t = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(t)
  }, [live, router])

  return (
    <button
      type="button"
      onClick={() => { setSpinning(true); router.refresh(); setTimeout(() => setSpinning(false), 800) }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-700"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${spinning || live ? 'animate-spin' : ''}`} />
      {live ? 'Live — auto-refreshing' : 'Refresh'}
    </button>
  )
}
