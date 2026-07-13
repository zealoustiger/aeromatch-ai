'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

/**
 * Fires the funnel event that closes viewed → subscribed → confirmed/unsubscribed
 * per-placement measurement. Gated on a sessionStorage flag keyed by (event, token)
 * so a refresh of the confirm/unsubscribe link never double-counts.
 */
export default function AlertStatusTracker({
  event,
  token,
  sourcePath,
  context,
  source,
}: {
  event: 'alert_confirmed' | 'alert_unsubscribed' | 'alert_subscribed'
  token: string
  sourcePath?: string | null
  /** Extra properties for `alert_subscribed` — matches every other capture
   *  point's `{ context, source_path, source }` event shape. */
  context?: string | null
  source?: string
}) {
  useEffect(() => {
    const key = `ch_alert_status_fired_${event}_${token}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      /* sessionStorage unavailable — fire anyway, worst case double-counts */
    }
    track(event, {
      source_path: sourcePath ?? undefined,
      context: context ?? undefined,
      source: source ?? undefined,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
