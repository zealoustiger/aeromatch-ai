'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle2, Loader2, Users } from 'lucide-react'
import { subscribeSignedInAlert, subscribeToAlerts, getExistingAlertForSourcePath } from '@/app/actions'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
import { isLocallySubscribed, addLocalSubscription, getLocalEmail } from '@/lib/alertLocalSubscriptions'
import { createClient } from '@/lib/supabase'

interface Props {
  /** Human-readable phrase describing the active filters, e.g. "Cessna 172 in
   *  California" — same value already threaded into the page's footer `AlertSignup`. */
  context?: string
  /** Reproducible source path for the active filter set, e.g. "/aircraft?make=Cessna". */
  sourcePath: string
}

/**
 * One-tap "🔔 Alert me for this search" chip for the active-filter toolbar
 * (GOAL.md: one-tap alerts "from any active filter set"). Signed-in visitors
 * subscribe in a single click via the existing `subscribeSignedInAlert`; signed-out
 * visitors are scrolled to the page's existing email-capture `AlertSignup` (same
 * `context`/`sourcePath`) with the email field focused — no separate subscribe path,
 * just a shortcut to the one that already exists below the results.
 */
export default function AlertMeChip({ context, sourcePath }: Props) {
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [hasExistingAlert, setHasExistingAlert] = useState(false)
  const [locallySubscribed, setLocallySubscribed] = useState(false)
  const [justSubscribed, setJustSubscribed] = useState(false)
  // This browser's remembered email (see lib/alertLocalSubscriptions.ts) — lets an
  // anonymous tap subscribe directly instead of scrolling to the page's field.
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null)
  // Distinguishes the just-one-tapped state (still double-opt-in, a confirmation
  // email is pending) from the confirmed "Alerts on" pill signed-in taps get.
  const [justOneTapSubscribed, setJustOneTapSubscribed] = useState(false)
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  // Whether THIS PAGE's own URL carries `?share=alert` (set by ShareAlertButton's
  // copied link) — mirrors AlertSignup's own detection so a subscribe started from
  // the toolbar chip is attributable to the share instead of bucketed with this
  // placement's ordinary `filter_toolbar` conversions. Starts false (matches the
  // server-rendered markup) and only flips after mount, so no hydration mismatch.
  const [isSharedLink, setIsSharedLink] = useState(false)
  const effectiveSource = isSharedLink ? 'shared_alert' : 'filter_toolbar'

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsSharedLink(new URLSearchParams(window.location.search).get('share') === 'alert')
  }, [])

  useEffect(() => {
    setLocallySubscribed(isLocallySubscribed(sourcePath))
  }, [sourcePath])

  useEffect(() => {
    setRememberedEmail(getLocalEmail())
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setSignedInEmail(data.user?.email ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSignedInEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!signedInEmail) {
      setHasExistingAlert(false)
      return
    }
    let cancelled = false
    getExistingAlertForSourcePath(sourcePath).then((detail) => {
      if (!cancelled) setHasExistingAlert(!!detail)
    })
    return () => {
      cancelled = true
    }
  }, [signedInEmail, sourcePath])

  const alreadyOn = hasExistingAlert || locallySubscribed || justSubscribed

  // Impression denominator for this placement — the chip's tap mounts no persistent
  // box, so it needs its own `alert_capture_viewed` (same payload shape as
  // AlertSignup's) to get a real per-surface view count. Only fired while the chip
  // is still an actionable capture (not once it's flipped to the "Alerts on" pill).
  const chipRef = useRef<HTMLButtonElement>(null)
  const viewedRef = useRef(false)
  useEffect(() => {
    if (alreadyOn || viewedRef.current) return
    const el = chipRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (viewedRef.current || !entry.isIntersecting) return
        viewedRef.current = true
        track('alert_capture_viewed', {
          context: context || 'all',
          source_path: sourcePath,
          source: effectiveSource,
        })
        observer.disconnect()
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [alreadyOn, context, sourcePath])

  async function handleClick() {
    if (pending || alreadyOn) return
    // Middle-funnel step so view → open → subscribe is measurable for this
    // placement, whether the tap subscribes directly (signed-in) or scrolls to
    // the email field (signed-out).
    track('alert_capture_opened', {
      context: context || 'all',
      source_path: sourcePath,
      source: effectiveSource,
    })
    if (!signedInEmail && rememberedEmail) {
      setErrorMsg('')
      setPending(true)
      const result = await subscribeToAlerts(rememberedEmail, context ?? '', sourcePath, true, 'weekly', effectiveSource)
      setPending(false)
      if (result.error) {
        setErrorMsg(result.error)
        return
      }
      track('alert_subscribed', {
        context: context || 'all',
        source_path: sourcePath,
        source: effectiveSource,
        one_tap: true,
      })
      markAlertSubscriber()
      addLocalSubscription(sourcePath)
      setJustOneTapSubscribed(true)
      return
    }
    if (!signedInEmail) {
      const el = document.getElementById('alert-email')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.focus()
      }
      return
    }
    setErrorMsg('')
    setPending(true)
    const result = await subscribeSignedInAlert(context ?? '', sourcePath, true, 'weekly', effectiveSource)
    setPending(false)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    track('alert_subscribed', {
      context: context || 'all',
      source_path: sourcePath,
      source: effectiveSource,
      signed_in: true,
    })
    markAlertSubscriber()
    setJustSubscribed(true)
  }

  if (justOneTapSubscribed) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 py-1.5 pl-3 pr-3.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Check {rememberedEmail} to confirm
      </span>
    )
  }

  if (alreadyOn) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 py-1.5 pl-3 pr-3.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Alerts on
      </span>
    )
  }

  return (
    <>
      {isSharedLink && (
        <p className="flex basis-full items-center gap-1.5 text-xs font-medium text-sky-700">
          <Users className="h-3.5 w-3.5 shrink-0" />
          A ClubHanger member shared this alert with you — set up your own below.
        </p>
      )}
      <button
        ref={chipRef}
        type="button"
        onClick={handleClick}
        disabled={pending}
        title={errorMsg || undefined}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-600 py-1.5 pl-3 pr-3.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
        {pending
          ? 'Saving…'
          : errorMsg
            ? 'Try again'
            : rememberedEmail
              ? `Alert me — ${rememberedEmail}`
              : 'Alert me for this search'}
      </button>
    </>
  )
}
