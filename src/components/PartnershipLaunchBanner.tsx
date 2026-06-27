'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'
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
      <section className="my-4 rounded-lg border border-violet-200 bg-violet-50/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-600" />
          <span className="text-slate-700">
            You&apos;re on the list for <strong>{area}</strong> &mdash; we&apos;ll email you when partnerships launch.
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
          <span className="text-sm text-slate-600">
            Want to get matched faster?{' '}
            <Link
              href="/partnerships/seeking/new"
              className="inline-flex items-center gap-0.5 font-semibold text-violet-700 hover:text-violet-800 hover:underline"
            >
              Post a seeking profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </span>
        </div>
      </section>
    )
  }

  return (
    <section className="my-4 rounded-lg border border-violet-200 bg-violet-50/60 px-4 py-3">
      <p className="text-sm leading-relaxed text-slate-700">
        We&apos;re in beta near <strong className="text-violet-700">{area}</strong>.
        This month, we&apos;ve had <strong className="text-violet-700">{visitorCount.toLocaleString()}+ pilot visitors</strong> and{' '}
        <strong className="text-violet-700">{displaySeekers} are actively seeking</strong> partnerships in this location.
        Get email alerts when more post. Alert demand helps us prioritize next launch locations.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-2 flex items-center gap-2"
        noValidate
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          className="w-48 rounded-md border border-violet-200 bg-white px-3 py-1.5 text-sm placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 sm:w-56"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Get alerts'}
        </button>
        {errorMsg && <span className="text-xs text-red-600">{errorMsg}</span>}
      </form>
    </section>
  )
}
