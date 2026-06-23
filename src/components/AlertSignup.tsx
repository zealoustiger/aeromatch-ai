'use client'

import { useState } from 'react'
import { Bell, CheckCircle2 } from 'lucide-react'
import { subscribeToAlerts } from '@/app/actions'

interface Props {
  /** Human-readable thing being alerted on, e.g. "Cessna 172" or "California". */
  context: string
  /** The page the signup came from, e.g. "/aircraft/cessna/172". */
  sourcePath: string
}

/**
 * Inline, low-friction email capture for new-listing alerts. NOT a modal/popup,
 * no fake urgency — a single email field + button that drops the email + context
 * into the additive `alerts` table (no account required). Sky-blue accent only.
 */
export default function AlertSignup({ context, sourcePath }: Props) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setErrorMsg('')
    setPending(true)
    const result = await subscribeToAlerts(email, context, sourcePath)
    setPending(false)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    setSubmitted(true)
  }

  return (
    <section className="my-10 rounded-xl border border-sky-100 bg-sky-50 p-6 shadow-sm">
      {submitted ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-sky-600" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">Almost there — check your inbox.</h2>
            <p className="mt-1 text-sm text-slate-600">
              We just emailed you a confirmation link. Click it to start getting alerts when
              new {context} listings appear. No spam — just relevant aircraft.
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
                Get alerts for new {context} listings
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                We&apos;ll email you when a new {context} aircraft is listed. One email field, no
                account needed.
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
          {errorMsg && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}
        </>
      )}
    </section>
  )
}
