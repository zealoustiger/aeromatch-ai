'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCircle2, Wand2 } from 'lucide-react'
import {
  subscribeToAlerts,
  subscribeSignedInAlert,
  resendAlertConfirmationByEmail,
  getExistingAlertForSourcePath,
} from '@/app/actions'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
import { isLocallySubscribed, addLocalSubscription } from '@/lib/alertLocalSubscriptions'
import type { AlertFrequency } from '@/lib/alertFrequency'
import { MIN_ALERTS_TO_SHOW } from '@/lib/alertCounts'
import { createClient } from '@/lib/supabase'
import type { SavedSearchAlertDetail } from '@/lib/savedSearchAlerts'

interface Props {
  /** Human-readable thing being alerted on, e.g. "Cessna 172" or "California".
   *  Optional — when omitted/empty the copy reads as a general new-listing alert
   *  (used by the /alerts landing page). */
  context?: string
  /** The page the signup came from, e.g. "/aircraft/cessna/172". */
  sourcePath: string
  /**
   * The kind of listing being alerted on, used in the body copy: "a new {context}
   * {noun} is listed". Defaults to "aircraft" so the for-sale callers are unchanged;
   * partnership pages pass "partnership". Plural is derived for "just relevant …".
   */
  noun?: string
  /** Override the section's outer spacing — default matches the standalone,
   *  below-the-list placement. Callers embedding this inside a tighter container
   *  (e.g. an empty-state card) pass a smaller margin. */
  className?: string
  /** Real confirmed-alert count for this exact `context` (see `lib/alertCounts.ts`).
   *  Only rendered as a social-proof line when it clears `MIN_ALERTS_TO_SHOW` —
   *  below that, or when omitted, no line renders (honesty gate, never fabricated). */
  alertCount?: number
  /** Live count of listings that match this alert's search RIGHT NOW (see
   *  `lib/alertMatchCounts.ts`'s `getAlertMatchCount`) — distinct from `alertCount`
   *  above (which counts other subscribers, not matching inventory). Renders "what
   *  this alert will actually do" copy, including the honest 0-match case. Omit
   *  rather than fabricate when the caller's source_path isn't a recognized shape. */
  matchCount?: number
  /** Which literal placement rendered this box, e.g. "listing_detail",
   *  "make_model_page", "empty_state", "homepage_band" — carried into the
   *  `alert_subscribed` analytics event only (never reaches the DB write) so
   *  conversion can be attributed per-placement instead of just per-`sourcePath`
   *  (which several distinct placements share, e.g. listing-detail and
   *  make/model pages both use `/aircraft?make=…&model=…`). Omit rather than
   *  fabricate a default when a call site doesn't have one. */
  source?: string
  /** True for the single-listing "watch this listing's price" capture point
   *  (`/aircraft/listing/[id]`'s dedicated watch box, `sourcePath` carries
   *  `?watch=price`) — distinct copy (this is about ONE known listing, not a
   *  family search) and hides the price-drop/deal-only checkboxes, neither of
   *  which applies to watching a single already-known listing: price-drop
   *  matching is implicit (the entire point of a watch), and "only good
   *  deals" has no meaning against a single item. */
  watchOnly?: boolean
  /** A single server-verified "loosen the search" alternative to offer when
   *  `matchCount` is 0 — e.g. drop the model to go make-wide (see
   *  `lib/alertMatchCounts.ts`'s `getEmptyStateWidenSuggestion`). Clicking it
   *  swaps this box's active context/sourcePath/matchCount to the widened
   *  search in place (no navigation, no second box) rather than creating a
   *  second alert. Only ever offered pre-subscribe; omit rather than fabricate
   *  when there's no further step to widen or the wider search is also empty. */
  widenSuggestion?: {
    context?: string
    sourcePath: string
    description: string
    count: number
    noun: 'listing' | 'pilot'
  }
}

/** Layers `deal=good` onto a source_path's existing query string when the
 *  visitor checked "only good deals" — mirrors how min_price/max_price/etc.
 *  already ride in source_path, so the cron's parseSourcePath needs no new
 *  storage, just a new query param to read. */
function withDealOnly(sourcePath: string, dealOnly: boolean): string {
  if (!dealOnly) return sourcePath
  return sourcePath.includes('?') ? `${sourcePath}&deal=good` : `${sourcePath}?deal=good`
}

/**
 * Inline, low-friction email capture for new-listing alerts. NOT a modal/popup,
 * no fake urgency — a single email field + button that drops the email + context
 * into the additive `alerts` table (no account required). Sky-blue accent only.
 */
export default function AlertSignup({
  context,
  sourcePath,
  noun = 'aircraft',
  className = 'my-10',
  alertCount,
  matchCount,
  source,
  watchOnly = false,
  widenSuggestion,
}: Props) {
  // Whether the visitor tapped the widen-suggestion link — swaps this box's
  // active context/sourcePath/matchCount to the wider search in place, rather
  // than rendering a second box or navigating away.
  const [widened, setWidened] = useState(false)
  const activeContext = widened && widenSuggestion ? widenSuggestion.context : context
  const activeSourcePath = widened && widenSuggestion ? widenSuggestion.sourcePath : sourcePath
  const activeMatchCount = widened && widenSuggestion ? widenSuggestion.count : matchCount
  // "aircraft" is already plural; everything else just takes an -s.
  const nounPlural = noun === 'aircraft' ? 'aircraft' : `${noun}s`
  const hasMatchCount = typeof activeMatchCount === 'number'
  // General (no-context) alert copy for the /alerts landing; specific copy elsewhere.
  const hasCtx = !!(activeContext && activeContext.trim())
  const showSocialProof = hasCtx && typeof alertCount === 'number' && alertCount >= MIN_ALERTS_TO_SHOW
  // "Price" only means something for aircraft — a partnership watch is on the
  // buy-in share instead (see PartnershipDealSignals/PartnershipCard's own
  // previous_buy_in_price-based copy), so the watch-only wording branches on
  // noun rather than assuming aircraft like the rest of this component's
  // watchOnly copy originally did.
  const watchWord = noun === 'partnership' ? 'buy-in' : 'price'
  const headline = watchOnly
    ? `Alert me if the ${watchWord} drops`
    : hasCtx
      ? `Get alerts for new ${activeContext} listings`
      : 'Get new-listing alerts'
  const subcopy = watchOnly
    ? `We'll email you the moment the ${watchWord} on this listing drops. One email field, no account needed.`
    : hasCtx
      ? `We'll email you when a new ${activeContext} ${noun} is listed. One email field, no account needed.`
      : `We'll email you the moment a new listing appears. One email field, no account needed.`
  const doneCopy = watchOnly
    ? `the ${watchWord} on this listing drops.`
    : hasCtx
      ? `new ${activeContext} listings appear. No spam — just relevant ${nounPlural}.`
      : `new listings appear. No spam — just relevant listings.`
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pending, setPending] = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'pending' | 'sent' | 'error'>('idle')
  const [resendError, setResendError] = useState('')
  // Price-drop matching only exists for aircraft-for-sale alerts today (see
  // alert-digest's countRecentAircraftPriceDrops) — partnerships/seekers have no
  // price-drop tracking, so don't offer a toggle that would silently do nothing.
  const showPriceDropOption = noun === 'aircraft' && !watchOnly
  const [priceDropOptIn, setPriceDropOptIn] = useState(true)
  // "Only good deals" — the first smart-alert type (GOAL.md's "smart, honest
  // alert content" clause). Only exists for aircraft (clubHangerDealVerdict has
  // no partnership/seeker equivalent wired to alerts). Default unchecked — this
  // narrows what fires, so it should be an opt-in, not a surprise. Encoded
  // directly in source_path's query string (deal=good), not a DB column, so the
  // cron's existing parseSourcePath can read it the same way it reads
  // make/model/min_price/etc.
  // Hidden when the caller's own sourcePath already carries `deal=good` (e.g.
  // /aircraft/deals) — the page itself is already deals-only, so offering a
  // "only good deals" checkbox on top of that would read as redundant/confusing.
  const showDealOnlyOption = noun === 'aircraft' && !watchOnly && !sourcePath.includes('deal=good')
  const [dealOnly, setDealOnly] = useState(false)
  const [frequency, setFrequency] = useState<AlertFrequency>('weekly')
  // A signed-in visitor's email is already verified — skip retyping it and
  // subscribe as already-confirmed (no double-opt-in round trip). Read-only
  // client-side session check, same pattern as Nav.tsx.
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  // Distinguishes the confirmed-immediately signed-in path (no "check your
  // inbox" copy — there's nothing pending) from the normal double-opt-in one.
  const [confirmedImmediately, setConfirmedImmediately] = useState(false)
  // Whether the signed-in visitor already has a live alert for this exact
  // sourcePath — when set, the one-click button (a silent idempotent no-op
  // per subscribeSignedInAlert's 23505 handling) is replaced with an honest
  // "already getting alerts" state instead.
  const [existingAlert, setExistingAlert] = useState<SavedSearchAlertDetail | null>(null)
  // Email-only equivalent of `existingAlert` above — no session to query, so this
  // reads the device-local record `alertLocalSubscriptions.ts` writes on a
  // successful signed-out subscribe. Starts false (matches the server-rendered
  // markup) and only flips after mount, so it never causes a hydration mismatch.
  const [locallySubscribed, setLocallySubscribed] = useState(false)

  useEffect(() => {
    setLocallySubscribed(isLocallySubscribed(activeSourcePath))
  }, [activeSourcePath])

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
      setExistingAlert(null)
      return
    }
    let cancelled = false
    getExistingAlertForSourcePath(activeSourcePath).then((detail) => {
      if (!cancelled) setExistingAlert(detail)
    })
    return () => {
      cancelled = true
    }
  }, [signedInEmail, activeSourcePath])

  // Impression denominator for "prove it converts" — fires once when the box
  // actually scrolls into view (not just mounts, since most placements sit
  // below the fold), regardless of which internal state it's rendering.
  // Same payload shape as `alert_subscribed` so the two can be joined per
  // placement to get a real per-surface conversion rate.
  const sectionRef = useRef<HTMLElement>(null)
  const viewedRef = useRef(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (viewedRef.current || !entry.isIntersecting) return
        viewedRef.current = true
        track('alert_capture_viewed', {
          context: context || 'all',
          source_path: sourcePath,
          source,
          match_count: hasMatchCount ? activeMatchCount : undefined,
        })
        observer.disconnect()
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setErrorMsg('')
    setPending(true)
    const effectiveSourcePath = withDealOnly(activeSourcePath, showDealOnlyOption && dealOnly)
    const result = await subscribeToAlerts(
      email,
      activeContext ?? '',
      effectiveSourcePath,
      showPriceDropOption ? priceDropOptIn : true,
      frequency
    )
    setPending(false)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    // Conversion signal for the "alerts vs post" nav experiment.
    track('alert_subscribed', {
      context: activeContext || 'all',
      source_path: effectiveSourcePath,
      source,
      price_drop_opt_in: showPriceDropOption ? priceDropOptIn : undefined,
      frequency,
      alert_count: showSocialProof ? alertCount : undefined,
      match_count: hasMatchCount ? activeMatchCount : undefined,
      deal_only: showDealOnlyOption && dealOnly ? true : undefined,
      widened: widened ? true : undefined,
    })
    // This browser now belongs to a subscriber — the nav's "Get alerts" CTA
    // becomes "My alerts" (see lib/alertSubscriberFlag.ts). Boolean only.
    markAlertSubscriber()
    // Remember THIS capture point specifically, so a return visit to the same
    // page shows "you're already getting alerts for this" instead of a blank
    // form (see lib/alertLocalSubscriptions.ts). Keyed on activeSourcePath, not
    // effectiveSourcePath, to match how the signed-in existingAlert lookup above
    // is keyed — the deal-only checkbox doesn't change which capture point this is.
    addLocalSubscription(activeSourcePath)
    setSubmitted(true)
  }

  async function handleSignedInSubmit() {
    if (pending || !signedInEmail) return
    setErrorMsg('')
    setPending(true)
    const effectiveSourcePath = withDealOnly(activeSourcePath, showDealOnlyOption && dealOnly)
    const result = await subscribeSignedInAlert(
      activeContext ?? '',
      effectiveSourcePath,
      showPriceDropOption ? priceDropOptIn : true,
      frequency
    )
    setPending(false)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    track('alert_subscribed', {
      context: activeContext || 'all',
      source_path: effectiveSourcePath,
      source,
      price_drop_opt_in: showPriceDropOption ? priceDropOptIn : undefined,
      frequency,
      alert_count: showSocialProof ? alertCount : undefined,
      match_count: hasMatchCount ? activeMatchCount : undefined,
      signed_in: true,
      deal_only: showDealOnlyOption && dealOnly ? true : undefined,
      widened: widened ? true : undefined,
    })
    markAlertSubscriber()
    setConfirmedImmediately(true)
    setSubmitted(true)
  }

  async function handleResend() {
    if (resendState === 'pending') return
    setResendState('pending')
    setResendError('')
    const result = await resendAlertConfirmationByEmail(email, activeSourcePath)
    if (result.error) {
      setResendError(result.error)
      setResendState('error')
      return
    }
    setResendState('sent')
  }

  return (
    <section ref={sectionRef} className={`${className} rounded-xl border border-sky-100 bg-sky-50 p-6 shadow-sm`}>
      {submitted && confirmedImmediately ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-sky-600" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">You&rsquo;re set — alerts are on.</h2>
            <p className="mt-1 text-sm text-slate-600">
              We&rsquo;ll email {signedInEmail} the moment {doneCopy}
            </p>
          </div>
        </div>
      ) : submitted ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-sky-600" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">Almost there — check your inbox.</h2>
            <p className="mt-1 text-sm text-slate-600">
              We just emailed you a confirmation link. Click it to start getting alerts when
              {' '}{doneCopy}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {resendState === 'sent' ? (
                'Sent! Check your inbox again in a moment.'
              ) : resendState === 'error' ? (
                resendError
              ) : (
                <>
                  Didn&rsquo;t get it?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendState === 'pending'}
                    className="font-medium text-sky-700 underline-offset-2 hover:underline disabled:opacity-60"
                  >
                    {resendState === 'pending' ? 'Resending…' : 'Resend confirmation email'}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      ) : existingAlert ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-sky-600" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              You&rsquo;re already getting alerts for this.
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              We email {signedInEmail} a {existingAlert.frequency === 'daily' ? 'daily' : 'weekly'} digest when {doneCopy}
            </p>
            <Link
              href="/alerts/manage"
              className="mt-2 inline-block text-sm font-medium text-sky-700 underline-offset-2 hover:underline"
            >
              Manage alerts
            </Link>
          </div>
        </div>
      ) : !signedInEmail && locallySubscribed ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-sky-600" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              You&rsquo;re already getting alerts for this.
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              You subscribed from this browser before — we&rsquo;ll email you when {doneCopy}
            </p>
            <Link
              href="/alerts/manage"
              className="mt-2 inline-block text-sm font-medium text-sky-700 underline-offset-2 hover:underline"
            >
              Manage alerts
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100">
              <Bell className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {headline}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {subcopy}
              </p>
              {hasMatchCount && (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  {activeMatchCount! > 0
                    ? `${activeMatchCount} ${activeMatchCount === 1 ? noun : nounPlural} match${activeMatchCount === 1 ? 'es' : ''} right now — we'll email you when the next one lists.`
                    : `None ${noun === 'aircraft' ? 'for sale' : 'available'} right now — be first to know when one lists.`}
                </p>
              )}
              {!widened && matchCount === 0 && widenSuggestion && (
                <p className="mt-1 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => setWidened(true)}
                    className="inline-flex items-center gap-1 font-semibold text-sky-600 underline-offset-2 hover:underline"
                  >
                    <Wand2 className="h-3 w-3" />
                    {`Or: ${widenSuggestion.description} — ${widenSuggestion.count} ${widenSuggestion.count === 1 ? widenSuggestion.noun : `${widenSuggestion.noun}s`} match now`}
                  </button>
                </p>
              )}
              {showSocialProof && (
                <p className="mt-1 text-xs font-medium text-sky-700">
                  {alertCount} {alertCount === 1 ? 'buyer gets' : 'buyers get'} alerts for {activeContext}
                </p>
              )}
            </div>
          </div>

          {signedInEmail ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleSignedInSubmit}
                disabled={pending}
                className="w-full rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60 sm:w-auto"
              >
                {pending ? 'Saving…' : `Alert me — we'll email ${signedInEmail}`}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              noValidate
            >
              <label htmlFor="alert-email" className="sr-only">
                Email address
              </label>
              <input
                id="alert-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              <button
                type="submit"
                disabled={pending}
                className="shrink-0 rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
              >
                {pending ? 'Saving…' : watchOnly ? `Watch ${watchWord}` : 'Get alerts'}
              </button>
            </form>
          )}
          {showPriceDropOption && (
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={priceDropOptIn}
                onChange={(e) => setPriceDropOptIn(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
              />
              Also alert me when the price drops on a match
            </label>
          )}
          {showDealOnlyOption && (
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={dealOnly}
                onChange={(e) => setDealOnly(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
              />
              Only email me good deals (ClubHanger Deal Check)
            </label>
          )}
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            How often?
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as AlertFrequency)}
              className="rounded border-slate-200 bg-white py-0.5 pl-1.5 pr-6 text-xs text-slate-600 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-100"
            >
              <option value="weekly">Weekly digest</option>
              <option value="daily">Daily digest</option>
            </select>
          </label>
          {errorMsg && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}
        </>
      )}
    </section>
  )
}
