'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle2, Loader2, Users, X } from 'lucide-react'
import { subscribeSignedInAlert, subscribeToAlerts, getExistingAlertForSourcePath } from '@/app/actions'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
import { isLocallySubscribed, addLocalSubscription, getLocalEmail } from '@/lib/alertLocalSubscriptions'
import { createClient } from '@/lib/supabase'
import { useCompareOptional } from './CompareProvider'

interface Props {
  /** Human-readable phrase describing the active filters, same value threaded
   *  into the page's footer `AlertSignup`. */
  context?: string
  /** Reproducible source path for the active filter set, e.g. "/aircraft?make=Cessna". */
  sourcePath: string
  /** CSS selector for the element whose scroll-into-view reveals the bar.
   *  Defaults to the 8th result card (browse pages' "scrolled past the fold"
   *  signal); detail pages have no repeating cards, so they pass their own
   *  sentinel element's selector instead. */
  revealSelector?: string
  /** Per-placement analytics attribution, e.g. "sticky_bar_detail" to
   *  distinguish a listing-detail bar from the browse-page one. Defaults to
   *  "sticky_bar"; still overridden to "shared_alert" when the page URL
   *  carries `?share=alert`. */
  source?: string
  /** Idle button copy (before any remembered email is known). */
  idleLabel?: string
  /** Idle button copy prefix once a remembered email is known — rendered as
   *  "{emailLabel} — {email}". */
  emailLabel?: string
  /** Copy shown after a signed-in one-tap subscribe succeeds. */
  confirmedLabel?: string
}

const DISMISS_KEY_PREFIX = 'ch_sticky_alert_bar_dismissed:'
/** 0-indexed — shows after the visitor scrolls past the 8th result card. */
const SCROLL_DEPTH_CARD_INDEX = 7
/** visualViewport shrink (px) past which we treat the on-screen keyboard as open. */
const KEYBOARD_SHRINK_THRESHOLD = 150

function hasWindow(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function isDismissed(sourcePath: string): boolean {
  if (!hasWindow()) return false
  try {
    return window.localStorage.getItem(DISMISS_KEY_PREFIX + sourcePath) === '1'
  } catch {
    return false
  }
}

function persistDismissed(sourcePath: string): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(DISMISS_KEY_PREFIX + sourcePath, '1')
  } catch {
    /* quota / disabled storage — fail soft, the bar just re-shows next visit */
  }
}

/**
 * Mobile-only (<768px) sticky bottom bar offering "Get alerts for this search",
 * for visitors who scroll well past the fold on /aircraft or /partnerships without
 * hitting a per-card bell or the footer AlertSignup. Mirrors AlertMeChip's
 * subscribe logic 1:1 — same server actions, same existing-alert checks, same
 * event names — just packaged as a bottom bar instead of a filter-toolbar chip.
 * `revealSelector`/`source`/label props let listing-detail pages reuse the same
 * reveal + one-tap machinery for a listing-scoped "watch this listing" bar
 * instead of the browse-page's "alert for this search" copy.
 */
export default function MobileStickyAlertBar({
  context,
  sourcePath,
  revealSelector,
  source,
  idleLabel = 'Get alerts for this search',
  emailLabel = 'Alert me',
  confirmedLabel = "You'll get alerts for this search",
}: Props) {
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [hasExistingAlert, setHasExistingAlert] = useState(false)
  const [locallySubscribed, setLocallySubscribed] = useState(false)
  const [justSubscribed, setJustSubscribed] = useState(false)
  // This browser's remembered email (see lib/alertLocalSubscriptions.ts) — lets an
  // anonymous tap subscribe directly instead of scrolling to the page's field.
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null)
  // Distinguishes the just-one-tapped state (still double-opt-in, a confirmation
  // email is pending) from the confirmed copy the signed-in tap gets.
  const [justOneTapSubscribed, setJustOneTapSubscribed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [pastScrollDepth, setPastScrollDepth] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  // Whether THIS PAGE's own URL carries `?share=alert` (set by ShareAlertButton's
  // copied link) — mirrors AlertSignup's own detection so a subscribe started from
  // the sticky bar is attributable to the share instead of bucketed with this
  // placement's ordinary `sticky_bar` conversions. Starts false (matches the
  // server-rendered markup) and only flips after mount, so no hydration mismatch.
  const [isSharedLink, setIsSharedLink] = useState(false)
  const effectiveSource = isSharedLink ? 'shared_alert' : (source ?? 'sticky_bar')

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsSharedLink(new URLSearchParams(window.location.search).get('share') === 'alert')
  }, [])

  const compare = useCompareOptional()
  const compareTrayShowing = !!compare && compare.ready && compare.count > 0

  useEffect(() => {
    setLocallySubscribed(isLocallySubscribed(sourcePath))
    setDismissed(isDismissed(sourcePath))
    setPastScrollDepth(false)
    setJustSubscribed(false)
    setJustOneTapSubscribed(false)
  }, [sourcePath])

  useEffect(() => {
    setRememberedEmail(getLocalEmail())
  }, [])

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

  // Scroll-depth gate, sentinel variant (detail pages, `revealSelector` set):
  // reveal once the sentinel has scrolled entirely above the viewport. A plain
  // "is it in view" IntersectionObserver would fire immediately at mount on a
  // listing with a short gallery (sentinel already on-screen on load), showing
  // the bar with zero scroll — so this gates on the element having actually
  // scrolled past, not merely being visible.
  useEffect(() => {
    if (!revealSelector) return
    if (typeof window === 'undefined') return
    let raf = 0
    function check() {
      const target = document.querySelector(revealSelector!)
      if (!target) return
      if (target.getBoundingClientRect().bottom < 0) {
        setPastScrollDepth(true)
        window.removeEventListener('scroll', onScroll)
      }
    }
    function onScroll() {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        check()
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [sourcePath, revealSelector])

  // Scroll-depth gate, card variant (browse pages, default): the results list
  // can still be streaming in when this component mounts (Suspense), so watch
  // for the sentinel card via MutationObserver until it actually exists in the
  // DOM, then switch to a one-shot IntersectionObserver on it.
  useEffect(() => {
    if (revealSelector) return
    if (typeof IntersectionObserver === 'undefined') return
    let intersectionObserver: IntersectionObserver | null = null
    let mutationObserver: MutationObserver | null = null

    function tryObserve() {
      if (intersectionObserver) return
      const target = document.querySelectorAll('article')[SCROLL_DEPTH_CARD_INDEX]
      if (!target) return
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setPastScrollDepth(true)
            intersectionObserver?.disconnect()
            mutationObserver?.disconnect()
          }
        },
        { threshold: 0 }
      )
      intersectionObserver.observe(target)
      mutationObserver?.disconnect()
      mutationObserver = null
    }

    tryObserve()
    if (!intersectionObserver) {
      mutationObserver = new MutationObserver(tryObserve)
      mutationObserver.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      intersectionObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [sourcePath, revealSelector])

  // Keyboard-avoidance: hide whenever the visual viewport shrinks meaningfully
  // (mobile on-screen keyboard open), so the bar never floats over a focused input.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    function handleResize() {
      setKeyboardOpen(window.innerHeight - vv.height > KEYBOARD_SHRINK_THRESHOLD)
    }
    vv.addEventListener('resize', handleResize)
    handleResize()
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  const alreadySubscribed = hasExistingAlert || locallySubscribed
  const visible =
    pastScrollDepth &&
    !dismissed &&
    !keyboardOpen &&
    !compareTrayShowing &&
    (!alreadySubscribed || justSubscribed || justOneTapSubscribed)

  const viewedRef = useRef(false)
  useEffect(() => {
    if (!visible || viewedRef.current) return
    viewedRef.current = true
    track('alert_capture_viewed', {
      context: context || 'all',
      source_path: sourcePath,
      source: effectiveSource,
    })
  }, [visible, context, sourcePath])

  async function handleClick() {
    if (pending || justSubscribed || justOneTapSubscribed) return
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

  function handleDismiss() {
    persistDismissed(sourcePath)
    setDismissed(true)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white pb-safe shadow-[0_-2px_12px_rgba(0,0,0,0.10)] md:hidden">
      {isSharedLink && !justSubscribed && !justOneTapSubscribed && (
        <p className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 pt-2 text-xs font-medium text-sky-700">
          <Users className="h-3.5 w-3.5 shrink-0" />
          A ClubHanger member shared this alert with you — set up your own below.
        </p>
      )}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        {justSubscribed ? (
          <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {confirmedLabel}
          </span>
        ) : justOneTapSubscribed ? (
          <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">Check {rememberedEmail} to confirm</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Bell className="h-4 w-4 shrink-0" />}
            <span className="truncate">
              {pending
                ? 'Saving…'
                : errorMsg
                  ? 'Try again'
                  : rememberedEmail
                    ? `${emailLabel} — ${rememberedEmail}`
                    : idleLabel}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
