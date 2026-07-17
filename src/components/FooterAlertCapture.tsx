'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell, CheckCircle2 } from 'lucide-react'
import { subscribeToAlerts } from '@/app/actions'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
import { deriveFooterAlertTarget } from '@/lib/footerAlertContext'
import {
  addLocalSubscription,
  getLocalEmail,
  isLocallySubscribed,
  setLocalEmail,
} from '@/lib/alertLocalSubscriptions'

const SOURCE = 'footer'

/**
 * Slim, site-wide email capture — renders inside `Footer.tsx`, so it's the one
 * alert entry point present on literally every page. Deliberately a thin island:
 * no signed-in detection, no match count — those live in the full `AlertSignup`.
 * Still reuses the remembered-email one-tap pattern (`getLocalEmail`) so a
 * returning subscriber gets a true one-tap here too, and tracks impressions the
 * same way `AlertSignup` does so footer conversion is measurable.
 *
 * Context-aware: `deriveFooterAlertTarget` reads the current pathname so a
 * make/model/state hub gets a real, matchable, page-scoped alert instead of
 * always the generic site-wide one — see that module for which path shapes
 * resolve to what. The root layout doesn't remount Footer across client-side
 * navigations, so every stateful bit here keys off `sourcePath` and resets
 * when it changes (a subscribe confirmation from the last page shouldn't
 * bleed into the next one).
 */
export default function FooterAlertCapture() {
  const pathname = usePathname()
  const { sourcePath, context } = useMemo(() => deriveFooterAlertTarget(pathname || '/'), [pathname])

  const [email, setEmail] = useState('')
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null)
  const [useManualEmail, setUseManualEmail] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [locallySubscribed, setLocallySubscribed] = useState(false)

  useEffect(() => {
    setRememberedEmail(getLocalEmail())
    // A subscribe at the generic `/` capture (or one from a prior page this
    // session) already covers this visitor everywhere — never re-nag just
    // because this render's sourcePath is more specific.
    setLocallySubscribed(isLocallySubscribed('/') || isLocallySubscribed(sourcePath))
    setSubmitted(false)
    setConfirmedEmail('')
    setUseManualEmail(false)
    setErrorMsg('')
  }, [sourcePath])

  // Impression denominator for "prove it converts" — same payload shape/pattern as
  // AlertSignup's own tracked impression, so footer view→subscribe conversion is
  // measurable like every other capture point. Fires once per sourcePath (a client
  // navigation to a new context is a fresh impression, not a re-fire of the old one).
  const rootRef = useRef<HTMLDivElement>(null)
  const viewedRef = useRef(false)
  useEffect(() => {
    viewedRef.current = false
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (viewedRef.current || !entry.isIntersecting) return
        viewedRef.current = true
        track('alert_capture_viewed', { context: context ?? 'all', source_path: sourcePath, source: SOURCE })
        observer.disconnect()
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [sourcePath, context])

  async function subscribe(targetEmail: string, oneTap: boolean) {
    if (pending) return
    setErrorMsg('')
    setPending(true)
    const result = await subscribeToAlerts(targetEmail, context ?? '', sourcePath, true, 'weekly', SOURCE)
    setPending(false)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    track('alert_subscribed', {
      context: context ?? 'all',
      source_path: sourcePath,
      source: SOURCE,
      one_tap: oneTap || undefined,
    })
    markAlertSubscriber()
    addLocalSubscription(sourcePath)
    setLocalEmail(targetEmail)
    setConfirmedEmail(targetEmail)
    setSubmitted(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void subscribe(email, false)
  }

  function handleOneTap() {
    if (!rememberedEmail) return
    void subscribe(rememberedEmail, true)
  }

  if (submitted) {
    return (
      <div ref={rootRef} className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600" />
        Check {confirmedEmail} to confirm — you&rsquo;ll hear about new {context ?? 'listings'}.
      </div>
    )
  }

  if (locallySubscribed) {
    return (
      <div ref={rootRef} className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600" />
        You&rsquo;re getting alerts —{' '}
        <Link href="/alerts/manage" className="font-medium text-sky-700 underline-offset-2 hover:underline">
          manage them
        </Link>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
        <Bell className="h-4 w-4 shrink-0 text-sky-600" />
        Get email alerts for new {context ?? 'listings'}
      </div>
      {rememberedEmail && !useManualEmail ? (
        <div className="mt-3 flex items-center gap-2 sm:mt-0">
          <button
            type="button"
            onClick={handleOneTap}
            disabled={pending}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
          >
            {pending ? 'Saving…' : `Alert me — ${rememberedEmail}`}
          </button>
          <button
            type="button"
            onClick={() => setUseManualEmail(true)}
            className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
          >
            Not you?
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:mt-0 sm:w-auto sm:flex-row">
          <label htmlFor="footer-alert-email" className="sr-only">
            Email address
          </label>
          <input
            id="footer-alert-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 sm:w-56"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Get alerts'}
          </button>
        </form>
      )}
      {errorMsg && <p className="mt-2 text-xs text-red-600 sm:basis-full">{errorMsg}</p>}
    </div>
  )
}
