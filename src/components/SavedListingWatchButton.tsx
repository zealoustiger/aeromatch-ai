'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle2 } from 'lucide-react'
import { subscribeSignedInAlert, getExistingAlertForSourcePath } from '@/app/actions'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
import { cn } from '@/lib/utils'

interface Props {
  /** Human-readable thing being watched, e.g. "2019 Cessna 172" — same convention
   *  the detail pages' own watch offer uses. */
  context?: string
  /** The listing's own `?watch=price` source_path, e.g.
   *  `/aircraft/listing/<id>?watch=price` or `/partnerships/<id>?watch=price`. */
  sourcePath: string
  className?: string
}

/** Per-row watch offer on `/saved` — a signed-in user's hearted listings are their
 *  highest-intent set, but saving alone captures no alert. Reuses the exact
 *  `subscribeSignedInAlert`/`getExistingAlertForSourcePath` machinery
 *  `SaveListingButton`'s save→watch cross-sell already proved, just triggered by
 *  page load here instead of a fresh save (so it also covers rows saved before
 *  this shipped, or saved from a device/offline flow that skipped the prompt). */
export default function SavedListingWatchButton({ context, sourcePath, className }: Props) {
  const [state, setState] = useState<'loading' | 'offer' | 'subscribing' | 'watching'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getExistingAlertForSourcePath(sourcePath).then((existing) => {
      if (!cancelled) setState(existing ? 'watching' : 'offer')
    })
    return () => {
      cancelled = true
    }
  }, [sourcePath])

  // One-shot impression so this placement's view→subscribe conversion is
  // computable in the /admin/alerts funnel, matching every other watch-offer
  // surface (ContactBarWatchButton, MobileStickyAlertBar).
  const viewedRef = useRef(false)
  useEffect(() => {
    if (state !== 'offer' || viewedRef.current) return
    viewedRef.current = true
    track('alert_capture_viewed', {
      context: context || undefined,
      source_path: sourcePath,
      source: 'saved_page_watch',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  async function handleSubscribe() {
    if (state === 'subscribing') return
    track('alert_capture_opened', {
      context: context || undefined,
      source_path: sourcePath,
      source: 'saved_page_watch',
    })
    setError('')
    setState('subscribing')
    const result = await subscribeSignedInAlert(context ?? '', sourcePath, true, 'weekly', 'saved_page_watch')
    if (result.error) {
      setError(result.error)
      setState('offer')
      return
    }
    track('alert_subscribed', {
      context: context || undefined,
      source_path: sourcePath,
      source: 'saved_page_watch',
      signed_in: true,
    })
    markAlertSubscriber()
    setState('watching')
  }

  if (state === 'loading') return null

  if (state === 'watching') {
    return (
      <p className={cn('flex items-center gap-1.5 text-xs text-sky-700', className)}>
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Watching for price drops
      </p>
    )
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={state === 'subscribing'}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-800 disabled:opacity-60"
      >
        <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {state === 'subscribing' ? 'Saving…' : 'Email me if the price drops'}
      </button>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  )
}
