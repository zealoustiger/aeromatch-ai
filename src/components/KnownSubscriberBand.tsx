'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { isAlertSubscriber, ALERT_SUBSCRIBER_EVENT } from '@/lib/alertSubscriberFlag'
import { getLocalSourcePaths } from '@/lib/alertLocalSubscriptions'

/**
 * Highest-priority homepage capture-band state: a known subscriber (this device has
 * subscribed to at least one alert before) sees "You're covered" instead of being
 * re-pitched the same generic capture form every visit. Honest: N is exactly how many
 * source_paths this device's local record remembers — no server round-trip, same
 * trust level Nav's "My alerts" swap already uses — so it may undercount (a different
 * device, cleared storage) but never overclaims. `fallback` renders untouched whenever
 * the record is empty, so every other visitor's homepage stays byte-identical.
 */
export default function KnownSubscriberBand({ fallback }: { fallback: ReactNode }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const sync = () => {
      if (!isAlertSubscriber()) {
        setCount(null)
        return
      }
      const paths = getLocalSourcePaths()
      setCount(paths.length > 0 ? paths.length : null)
    }
    sync()
    window.addEventListener(ALERT_SUBSCRIBER_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ALERT_SUBSCRIBER_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  if (!count) return <>{fallback}</>

  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50">
        <CheckCircle2 className="h-6 w-6 text-sky-600" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">You&rsquo;re covered</h2>
      <p className="mt-2 text-lg text-slate-500">
        {count} active alert{count === 1 ? '' : 's'} on this device.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/alerts/manage"
          className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          Manage alerts
        </Link>
        <Link
          href="/alerts"
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Add another alert
        </Link>
      </div>
    </div>
  )
}
