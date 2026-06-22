'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getLocalSaves, clearLocalSaves } from '@/lib/localSaves'
import { mergeDeviceSaves } from '@/app/actions'

/**
 * Slice 2 of soft-save. Mounted once globally. When a soft-save visitor (saves
 * held only in this device's localStorage) becomes signed-in — on first load with
 * an existing session, or the moment auth flips to signed-in after a fresh
 * signup — their device saves are merged into their real account and the device
 * store is cleared, making good slice 1's honest "you may lose them" notice.
 *
 * Renders nothing unless a merge actually added listings, in which case it shows
 * a small dismissible confirmation toast.
 */
export default function DeviceSaveSync() {
  const router = useRouter()
  const [merged, setMerged] = useState(0)
  // Guards against the mount-run and the auth-change-run racing into a double merge.
  const running = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function run() {
      if (running.current) return
      const saves = getLocalSaves()
      if (saves.length === 0) return
      const { data } = await supabase.auth.getUser()
      if (cancelled || !data.user) return
      running.current = true
      try {
        const result = await mergeDeviceSaves(saves)
        if (cancelled) return
        if (result && !('error' in result)) {
          // Clear regardless of count: these ids are now reconciled with the
          // account (either inserted or already present), so re-merging is moot.
          clearLocalSaves()
          if (result.merged > 0) {
            setMerged(result.merged)
            router.refresh()
          }
        }
      } finally {
        running.current = false
      }
    }

    run()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) run()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  if (merged === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
        <Heart className="h-4 w-4 shrink-0 fill-sky-400 text-sky-400" aria-hidden="true" />
        <span>
          {merged === 1
            ? '1 saved listing added to your account'
            : `${merged} saved listings added to your account`}
        </span>
        <button
          type="button"
          onClick={() => setMerged(0)}
          aria-label="Dismiss"
          className="-mr-1 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
