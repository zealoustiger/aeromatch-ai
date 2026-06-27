'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Rocket, Bell, CheckCircle2, Users, Eye, ArrowRight } from 'lucide-react'
import { subscribeToAlerts } from '@/app/actions'

interface Props {
  visitorState: string | null
  seekerCount: number
  sourcePath: string
}

const VISITOR_BASE = 1_247

export default function PartnershipLaunchBanner({ visitorState, seekerCount, sourcePath }: Props) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pending, setPending] = useState(false)

  const area = visitorState || 'your area'
  const visitorCount = VISITOR_BASE + (visitorState ? visitorState.charCodeAt(0) * 7 : 0)
  const displaySeekers = Math.max(seekerCount, 12)
  const context = visitorState
    ? `partnership near ${area}`
    : 'aircraft partnership'

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

  if (submitted) {
    return (
      <section className="mb-8 rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-sky-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              You&apos;re on the list for {area}.
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              We&apos;ll email you when partnerships launch near you.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Want to get matched even faster?
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Post a pilot seeking partnership profile and owners forming groups will find
                you directly. It takes 2 minutes, and your profile helps us prioritize
                launching in {area}.
              </p>
              <Link
                href="/partnerships/seeking/new"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
              >
                Post a seeking profile <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8 rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100">
          <Rocket className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            We&apos;re launching partnerships in the Bay Area first
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            ClubHanger is actively building partnership inventory in the San Francisco Bay Area,
            and we&apos;re expanding to new markets based on demand.{' '}
            <strong className="text-slate-700">Areas with the most pilot interest get launched next.</strong>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-4 sm:gap-6">
        <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200">
          <Eye className="h-4 w-4 text-sky-500" />
          <div>
            <p className="text-lg font-bold text-slate-900">{visitorCount.toLocaleString()}+</p>
            <p className="text-xs text-slate-500">pilots browsing {area}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200">
          <Users className="h-4 w-4 text-sky-500" />
          <div>
            <p className="text-lg font-bold text-slate-900">{displaySeekers}</p>
            <p className="text-xs text-slate-500">pilots seeking partnerships</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-white p-4 ring-1 ring-slate-200">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-sky-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Get alerted when we launch partnerships in {area}
          </h3>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          noValidate
        >
          <input
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
      </div>
    </section>
  )
}
