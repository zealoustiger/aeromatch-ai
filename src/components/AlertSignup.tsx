'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCircle2 } from 'lucide-react'
import {
  subscribeToAlerts,
  subscribeSignedInAlert,
  resendAlertConfirmationByEmail,
  getExistingAlertForSourcePath,
} from '@/app/actions'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
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
  /** Which literal placement rendered this box, e.g. "listing_detail",
   *  "make_model_page", "empty_state", "homepage_band" — carried into the
   *  `alert_subscribed` analytics event only (never reaches the DB write) so
   *  conversion can be attributed per-placement instead of just per-`sourcePath`
   *  (which several distinct placements share, e.g. listing-detail and
   *  make/model pages both use `/aircraft?make=…&model=…`). Omit rather than
   *  fabricate a default when a call site doesn't have one. */
  source?: string
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
  source,
}: Props) {
  // "aircraft" is already plural; everything else just takes an -s.
  const nounPlural = noun === 'aircraft' ? 'aircraft' : `${noun}s`
  // General (no-context) alert copy for the /alerts landing; specific copy elsewhere.
  const hasCtx = !!(context && context.trim())
  const showSocialProof = hasCtx && typeof alertCount === 'number' && alertCount >= MIN_ALERTS_TO_SHOW
  const headline = hasCtx ? `Get alerts for new ${context} listings` : 'Get new-listing alerts'
  const subcopy = hasCtx
    ? `We'll email you when a new ${context} ${noun} is listed. One email field, no account needed.`
    : `We'll email you the moment a new listing appears. One email field, no account needed.`
  const doneCopy = hasCtx
    ? `new ${context} listings appear. No spam — just relevant ${nounPlural}.`
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
  const showPriceDropOption = noun === 'aircraft'
  const [priceDropOptIn, setPriceDropOptIn] = useState(true)
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
    getExistingAlertForSourcePath(sourcePath).then((detail) => {
      if (!cancelled) setExistingAlert(detail)
    })
    return () => {
      cancelled = true
    }
  }, [signedInEmail, sourcePath])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setErrorMsg('')
    setPending(true)
    const result = await subscribeToAlerts(
      email,
      context ?? '',
      sourcePath,
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
      context: context || 'all',
      source_path: sourcePath,
      source,
      price_drop_opt_in: showPriceDropOption ? priceDropOptIn : undefined,
      frequency,
      alert_count: showSocialProof ? alertCount : undefined,
    })
    // This browser now belongs to a subscriber — the nav's "Get alerts" CTA
    // becomes "My alerts" (see lib/alertSubscriberFlag.ts). Boolean only.
    markAlertSubscriber()
    setSubmitted(true)
  }

  async function handleSignedInSubmit() {
    if (pending || !signedInEmail) return
    setErrorMsg('')
    setPending(true)
    const result = await subscribeSignedInAlert(
      context ?? '',
      sourcePath,
      showPriceDropOption ? priceDropOptIn : true,
      frequency
    )
    setPending(false)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    track('alert_subscribed', {
      context: context || 'all',
      source_path: sourcePath,
      source,
      price_drop_opt_in: showPriceDropOption ? priceDropOptIn : undefined,
      frequency,
      alert_count: showSocialProof ? alertCount : undefined,
      signed_in: true,
    })
    markAlertSubscriber()
    setConfirmedImmediately(true)
    setSubmitted(true)
  }

  async function handleResend() {
    if (resendState === 'pending') return
    setResendState('pending')
    setResendError('')
    const result = await resendAlertConfirmationByEmail(email, sourcePath)
    if (result.error) {
      setResendError(result.error)
      setResendState('error')
      return
    }
    setResendState('sent')
  }

  return (
    <section className={`${className} rounded-xl border border-sky-100 bg-sky-50 p-6 shadow-sm`}>
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
              {showSocialProof && (
                <p className="mt-1 text-xs font-medium text-sky-700">
                  {alertCount} {alertCount === 1 ? 'buyer gets' : 'buyers get'} alerts for {context}
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
                {pending ? 'Saving…' : 'Get alerts'}
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
