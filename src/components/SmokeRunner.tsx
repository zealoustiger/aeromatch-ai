'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Loader2 } from 'lucide-react'
import { requestSmokeRun } from '@/app/admin/smoke/actions'

// "Run smoke tests" button + live auto-refresh. While a run is queued/running we
// poll the server component every few seconds so per-test results stream in.
export default function SmokeRunner({ active }: { active: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(t)
  }, [active, router])

  return (
    <button
      type="button"
      disabled={pending || active}
      onClick={() => startTransition(async () => { await requestSmokeRun(); router.refresh() })}
      className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60"
    >
      {active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      {active ? 'Running…' : pending ? 'Queueing…' : 'Run smoke tests'}
    </button>
  )
}
