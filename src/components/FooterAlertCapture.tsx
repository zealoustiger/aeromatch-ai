'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCircle2 } from 'lucide-react'
import { subscribeToAlerts } from '@/app/actions'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
import { addLocalSubscription, getLocalEmail, setLocalEmail } from '@/lib/alertLocalSubscriptions'

const SOURCE_PATH = '/'
const SOURCE = 'footer'

/**
 * Slim, site-wide email capture — renders inside `Footer.tsx`, so it's the one
 * alert entry point present on literally every page. Deliberately a thin island:
 * no signed-in detection, no match count, no IntersectionObserver — those live
 * in the full `AlertSignup`. Still reuses the remembered-email one-tap pattern
 * (`getLocalEmail`) so a returning subscriber gets a true one-tap here too.
 */
export default function FooterAlertCapture() {
  const [email, setEmail] = useState('')
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null)
  const [useManualEmail, setUseManualEmail] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setRememberedEmail(getLocalEmail())
  }, [])

  async function subscribe(targetEmail: string, oneTap: boolean) {
    if (pending) return
    setErrorMsg('')
    setPending(true)
    const result = await subscribeToAlerts(targetEmail, '', SOURCE_PATH, true, 'weekly', SOURCE)
    setPending(false)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    track('alert_subscribed', {
      context: 'all',
      source_path: SOURCE_PATH,
      source: SOURCE,
      one_tap: oneTap || undefined,
    })
    markAlertSubscriber()
    addLocalSubscription(SOURCE_PATH)
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
      <div className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600" />
        Check {confirmedEmail} to confirm — you&rsquo;ll hear about new listings.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
        <Bell className="h-4 w-4 shrink-0 text-sky-600" />
        Get email alerts for new listings
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
