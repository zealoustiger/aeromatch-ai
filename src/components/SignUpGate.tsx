'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ArrowRight, X, CheckCircle } from 'lucide-react'
import { joinWaitlist } from '@/app/actions'

interface Props {
  searchParams: string
  onClose: () => void
}

export default function SignUpGate({ searchParams, onClose }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function goToResults() {
    startTransition(() => {
      router.push(`/partnerships?${searchParams}`)
    })
    onClose()
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setErrorMsg('')
    const result = await joinWaitlist(email, searchParams)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    setSubmitted(true)
    setTimeout(goToResults, 1400)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          /* Success state */
          <div className="py-4 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900">You're on the list.</h2>
            <p className="mt-2 text-slate-500">Taking you to your results now…</p>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
              <Bell className="h-6 w-6 text-sky-600" />
            </div>

            {/* Heading */}
            <h2 className="text-xl font-bold text-slate-900">
              Save your search?
            </h2>
            <p className="mt-2 text-slate-500">
              Create a free account and we'll notify you the moment a new listing matches what you're looking for. No spam — just relevant aircraft.
            </p>

            {/* Perks */}
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              {[
                'Email alerts for new matching listings',
                'Save multiple searches',
                "Track listings you're interested in",
              ].map((perk) => (
                <li key={perk} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  {perk}
                </li>
              ))}
            </ul>

            {/* Form */}
            <form onSubmit={handleSignUp} className="mt-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              {errorMsg && (
                <p className="mt-1.5 text-xs text-red-600">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="mt-3 w-full rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
              >
                {isPending ? 'Saving…' : 'Save search & see results'}
              </button>
            </form>

            {/* Skip */}
            <div className="mt-4 text-center">
              <p className="mb-1 text-xs text-slate-400">No account? No problem.</p>
              <button
                onClick={goToResults}
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 underline-offset-2 hover:text-sky-600 hover:underline"
              >
                Skip for now and see results <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
