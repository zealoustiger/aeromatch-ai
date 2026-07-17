'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { isAlertSubscriber, ALERT_SUBSCRIBER_EVENT } from '@/lib/alertSubscriberFlag'
import { getLocalSourcePaths, readAndStampVisit } from '@/lib/alertLocalSubscriptions'
import { getNewAlertMatchesBreakdownForPaths, type AlertRecapItem } from '@/app/actions'

/**
 * Known-subscriber-only homepage module: "N new since your last visit," broken
 * out per remembered search, each linking straight to that search (or
 * `/alerts/manage`). Anonymous visitors — and a subscriber's first-ever visit,
 * which has no prior stamp to compare against — render nothing, so the page
 * stays byte-identical for everyone else (GOAL.md: never count "since forever").
 *
 * Shares `readAndStampVisit`'s once-per-page-load cache with `Nav`'s own "N new"
 * pill so the two never disagree on what counts as "new" for this visit.
 */
export default function HomepageAlertRecap() {
  const [subscriber, setSubscriber] = useState(false)
  const [items, setItems] = useState<AlertRecapItem[] | null>(null)

  useEffect(() => {
    const sync = () => setSubscriber(isAlertSubscriber())
    sync()
    window.addEventListener(ALERT_SUBSCRIBER_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ALERT_SUBSCRIBER_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    if (!subscriber) {
      setItems(null)
      return
    }
    const lastVisitAt = readAndStampVisit()
    if (!lastVisitAt) return
    const paths = getLocalSourcePaths()
    if (paths.length === 0) return
    let cancelled = false
    getNewAlertMatchesBreakdownForPaths(paths, lastVisitAt).then((result) => {
      if (!cancelled) setItems(result)
    })
    return () => {
      cancelled = true
    }
  }, [subscriber])

  if (!items || items.length === 0) return null

  return (
    <section className="border-b border-sky-100 bg-sky-50/70">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Bell className="h-4 w-4 shrink-0 text-sky-600" />
          Since your last visit
        </div>
        <ul className="mt-2 space-y-1.5">
          {items.map((item) => (
            <li key={item.sourcePath} className="text-sm text-slate-700">
              <Link
                href={item.sourcePath}
                className="font-medium text-sky-700 underline-offset-2 hover:underline"
              >
                {item.label}
              </Link>
              {' — '}
              {item.count} new {item.noun}
              {item.count === 1 ? '' : 's'}
            </li>
          ))}
        </ul>
        <Link
          href="/alerts/manage"
          className="mt-2 inline-block text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
        >
          Manage your alerts
        </Link>
      </div>
    </section>
  )
}
