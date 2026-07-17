'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle2 } from 'lucide-react'
import { subscribeSignedInAlert, subscribeToAlerts, getExistingAlertForSourcePath } from '@/app/actions'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
import { isLocallySubscribed, addLocalSubscription, getLocalEmail } from '@/lib/alertLocalSubscriptions'
import { createClient } from '@/lib/supabase'

interface Props {
  /** Human-readable thing being watched, e.g. "2019 Cessna 172" — same
   *  convention the page's own watch `AlertSignup` box uses. */
  context?: string
  /** The listing's own `?watch=price` source_path. */
  sourcePath: string
  /** Selector for the page's existing watch `AlertSignup` box — scrolled to
   *  (and its email input focused) when an anonymous visitor with no
   *  remembered email taps Watch, since the button row has no room for a
   *  full email field. */
  fallbackSelector?: string
}

type State = 'loading' | 'offer' | 'pending' | 'watching' | 'one_tap_pending'

/** Compact "Watch"/price-drop-alert button for `ContactBar`'s default button
 *  row on `/partnerships/[id]` — the listing-detail counterpart of
 *  `SavedListingWatchButton`, reusing the exact same subscribe machinery
 *  `MobileStickyAlertBar` already proved (signed-in one-tap, anonymous
 *  remembered-email one-tap, existing-alert dedup). Self-contained (own auth
 *  check) so `ContactBar` doesn't need to thread session state through. */
export default function ContactBarWatchButton({ context, sourcePath, fallbackSelector }: Props) {
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null)
  const [state, setState] = useState<State>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setSignedInEmail(data.user?.email ?? null))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSignedInEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setRememberedEmail(getLocalEmail())
  }, [])

  useEffect(() => {
    let cancelled = false
    if (signedInEmail) {
      getExistingAlertForSourcePath(sourcePath).then((existing) => {
        if (!cancelled) setState(existing ? 'watching' : 'offer')
      })
    } else {
      setState(isLocallySubscribed(sourcePath) ? 'watching' : 'offer')
    }
    return () => {
      cancelled = true
    }
  }, [signedInEmail, sourcePath])

  const viewedRef = useRef(false)
  useEffect(() => {
    if (state !== 'offer' || viewedRef.current) return
    viewedRef.current = true
    track('alert_capture_viewed', {
      context: context || undefined,
      source_path: sourcePath,
      source: 'sticky_bar_detail',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  async function handleClick() {
    if (state === 'pending' || state === 'watching' || state === 'one_tap_pending') return
    track('alert_capture_opened', {
      context: context || undefined,
      source_path: sourcePath,
      source: 'sticky_bar_detail',
    })

    if (signedInEmail) {
      setError('')
      setState('pending')
      const result = await subscribeSignedInAlert(context ?? '', sourcePath, true, 'weekly', 'sticky_bar_detail')
      if (result.error) {
        setError(result.error)
        setState('offer')
        return
      }
      track('alert_subscribed', {
        context: context || undefined,
        source_path: sourcePath,
        source: 'sticky_bar_detail',
        signed_in: true,
      })
      markAlertSubscriber()
      setState('watching')
      return
    }

    if (rememberedEmail) {
      setError('')
      setState('pending')
      const result = await subscribeToAlerts(rememberedEmail, context ?? '', sourcePath, true, 'weekly', 'sticky_bar_detail')
      if (result.error) {
        setError(result.error)
        setState('offer')
        return
      }
      track('alert_subscribed', {
        context: context || undefined,
        source_path: sourcePath,
        source: 'sticky_bar_detail',
        one_tap: true,
      })
      markAlertSubscriber()
      addLocalSubscription(sourcePath)
      setState('one_tap_pending')
      return
    }

    // No known email — defer to the page's own watch alert box rather than
    // trying to squeeze a full email field into the button row.
    if (fallbackSelector && typeof document !== 'undefined') {
      const container = document.querySelector(fallbackSelector)
      container?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = container?.querySelector('input[type="email"]')
      if (input instanceof HTMLInputElement) input.focus()
    }
  }

  if (state === 'loading') return null

  if (state === 'watching') {
    return (
      <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 py-3 text-xs font-semibold text-sky-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Watching
      </span>
    )
  }

  if (state === 'one_tap_pending') {
    return (
      <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-1 py-3 text-xs font-semibold text-sky-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Check email
      </span>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'pending'}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
      >
        <Bell className="h-4 w-4 shrink-0" />
        {state === 'pending' ? '…' : 'Watch'}
      </button>
      {error && <p className="mt-1 text-[10px] text-rose-600">{error}</p>}
    </div>
  )
}
