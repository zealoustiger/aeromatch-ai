'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle2, Loader2, X } from 'lucide-react'
import { subscribeSignedInAlert, getExistingAlertForSourcePath } from '@/app/actions'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
import { isLocallySubscribed } from '@/lib/alertLocalSubscriptions'
import { createClient } from '@/lib/supabase'
import { useCompareOptional } from './CompareProvider'

interface Props {
  /** Human-readable phrase describing the active filters, same value threaded
   *  into the page's footer `AlertSignup`. */
  context?: string
  /** Reproducible source path for the active filter set, e.g. "/aircraft?make=Cessna". */
  sourcePath: string
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
 */
export default function MobileStickyAlertBar({ context, sourcePath }: Props) {
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [hasExistingAlert, setHasExistingAlert] = useState(false)
  const [locallySubscribed, setLocallySubscribed] = useState(false)
  const [justSubscribed, setJustSubscribed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [pastScrollDepth, setPastScrollDepth] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const compare = useCompareOptional()
  const compareTrayShowing = !!compare && compare.ready && compare.count > 0

  useEffect(() => {
    setLocallySubscribed(isLocallySubscribed(sourcePath))
    setDismissed(isDismissed(sourcePath))
    setPastScrollDepth(false)
    setJustSubscribed(false)
  }, [sourcePath])

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

  // Scroll-depth gate: the results list can still be streaming in when this
  // component mounts (Suspense), so watch for the sentinel card via
  // MutationObserver until it actually exists in the DOM, then switch to a
  // one-shot IntersectionObserver on it.
  useEffect(() => {
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
  }, [sourcePath])

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
    pastScrollDepth && !dismissed && !keyboardOpen && !compareTrayShowing && (!alreadySubscribed || justSubscribed)

  const viewedRef = useRef(false)
  useEffect(() => {
    if (!visible || viewedRef.current) return
    viewedRef.current = true
    track('alert_capture_viewed', {
      context: context || 'all',
      source_path: sourcePath,
      source: 'sticky_bar',
    })
  }, [visible, context, sourcePath])

  async function handleClick() {
    if (pending || justSubscribed) return
    track('alert_capture_opened', {
      context: context || 'all',
      source_path: sourcePath,
      source: 'sticky_bar',
    })
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
    const result = await subscribeSignedInAlert(context ?? '', sourcePath, true, 'weekly', 'sticky_bar')
    setPending(false)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    track('alert_subscribed', {
      context: context || 'all',
      source_path: sourcePath,
      source: 'sticky_bar',
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
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        {justSubscribed ? (
          <span className="flex flex-1 items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            You&apos;ll get alerts for this search
          </span>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            {pending ? 'Saving…' : errorMsg ? 'Try again' : 'Get alerts for this search'}
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
