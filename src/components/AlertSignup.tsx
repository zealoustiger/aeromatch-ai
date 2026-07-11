'use client'

import { useState } from 'react'
import { Bell, CheckCircle2 } from 'lucide-react'
import { subscribeToAlerts } from '@/app/actions'
import { track } from '@/lib/analytics'

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
}

/**
 * Inline, low-friction email capture for new-listing alerts. NOT a modal/popup,
 * no fake urgency — a single email field + button that drops the email + context
 * into the additive `alerts` table (no account required). Sky-blue accent only.
 */
export default function AlertSignup({ context, sourcePath, noun = 'aircraft', className = 'my-10' }: Props) {
  // "aircraft" is already plural; everything else just takes an -s.
  const nounPlural = noun === 'aircraft' ? 'aircraft' : `${noun}s`
  // General (no-context) alert copy for the /alerts landing; specific copy elsewhere.
  const hasCtx = !!(context && context.trim())
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
  // Price-drop matching only exists for aircraft-for-sale alerts today (see
  // alert-digest's countRecentAircraftPriceDrops) — partnerships/seekers have no
  // price-drop tracking, so don't offer a toggle that would silently do nothing.
  const showPriceDropOption = noun === 'aircraft'
  const [priceDropOptIn, setPriceDropOptIn] = useState(true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setErrorMsg('')
    setPending(true)
    const result = await subscribeToAlerts(email, context ?? '', sourcePath, showPriceDropOption ? priceDropOptIn : true)
    setPending(false)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    // Conversion signal for the "alerts vs post" nav experiment.
    track('alert_subscribed', {
      context: context || 'all',
      source_path: sourcePath,
      price_drop_opt_in: showPriceDropOption ? priceDropOptIn : undefined,
    })
    setSubmitted(true)
  }

  return (
    <section className={`${className} rounded-xl border border-sky-100 bg-sky-50 p-6 shadow-sm`}>
      {submitted ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-sky-600" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">Almost there — check your inbox.</h2>
            <p className="mt-1 text-sm text-slate-600">
              We just emailed you a confirmation link. Click it to start getting alerts when
              {' '}{doneCopy}
            </p>
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
            </div>
          </div>

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
          {errorMsg && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}
        </>
      )}
    </section>
  )
}
