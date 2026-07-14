'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle2, Plane, Users } from 'lucide-react'
import { saveSearch, subscribeToAlerts } from '@/app/actions'
import { autoNameSearch } from '@/lib/savedSearchName'
import { track } from '@/lib/analytics'
import AirportFormInput from './AirportFormInput'

type Marketplace = 'aircraft' | 'partnerships'

/**
 * One-screen "what are you looking for?" quick start shown on `/searches` when a
 * signed-in user has zero saved searches — the default landing spot for a brand new
 * signup. Replaces a static dead-end with a real action: one submit both saves a
 * search AND turns on email alerts for it, using the account's own email (no extra
 * field needed).
 */
export default function QuickStartSearchForm({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [marketplace, setMarketplace] = useState<Marketplace>('aircraft')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Impression denominator for "prove it converts" — same fire-once-on-scroll-
  // into-view instrumentation as AlertSignup (this form has its own inline
  // alert capture, so it needs its own event rather than sharing that
  // component). Uses the pre-interaction default (aircraft, no filters) as
  // source_path since nothing's been picked yet at impression time.
  const viewedRef = useRef(false)
  useEffect(() => {
    const el = formRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (viewedRef.current || !entry.isIntersecting) return
        viewedRef.current = true
        track('alert_capture_viewed', { context: 'all', source_path: '/aircraft', source: 'saved_search' })
        observer.disconnect()
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    setErrorMsg('')

    const form = new FormData(e.currentTarget)
    const make = (form.get('make') as string)?.trim()
    const airport = (form.get('airport') as string)?.trim()
    const budget = (form.get('budget') as string)?.trim()

    const path = marketplace === 'aircraft' ? '/aircraft' : '/partnerships'
    const qs = new URLSearchParams()
    if (make) qs.set('make', make)
    if (marketplace === 'partnerships' && airport) qs.set('airport', airport.toUpperCase())
    if (budget && Number.isFinite(Number(budget)) && Number(budget) > 0) {
      qs.set(marketplace === 'aircraft' ? 'max_price' : 'max_monthly', budget)
    }
    const params = qs.toString()
    const sourcePath = params ? `${path}?${params}` : path
    const context = marketplace === 'partnerships' && airport
      ? [make, `near ${airport.toUpperCase()}`].filter(Boolean).join(' ')
      : make || ''

    setPending(true)
    const name = autoNameSearch(params, path)
    const searchResult = await saveSearch(name, params, path)
    if (searchResult.error && !/already have a search/i.test(searchResult.error)) {
      setPending(false)
      setErrorMsg(searchResult.error)
      return
    }
    const alertResult = await subscribeToAlerts(userEmail, context, sourcePath, true, 'weekly', 'saved_search')
    setPending(false)
    if (alertResult.error) {
      setErrorMsg(alertResult.error)
      return
    }
    track('alert_subscribed', { context: context || 'all', source_path: sourcePath, source: 'saved_search' })
    setDone(true)
    router.refresh()
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-sky-600" />
        <p className="font-semibold text-slate-800">You're all set.</p>
        <p className="mt-1 text-sm text-slate-600">
          We saved your search and you'll get an email at {userEmail} when new listings match.
        </p>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100">
          <Bell className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">What are you looking for?</p>
          <p className="mt-1 text-sm text-slate-500">
            Tell us once and we'll save the search and email you when new listings match — no
            extra steps.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2" role="group" aria-label="Marketplace">
        <button
          type="button"
          onClick={() => setMarketplace('aircraft')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            marketplace === 'aircraft'
              ? 'border-sky-400 bg-sky-50 text-sky-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Plane className="h-4 w-4" /> Aircraft for sale
        </button>
        <button
          type="button"
          onClick={() => setMarketplace('partnerships')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            marketplace === 'partnerships'
              ? 'border-sky-400 bg-sky-50 text-sky-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" /> Partnerships
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="qs-make" className="mb-1 block text-xs font-medium text-slate-500">
            Make <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="qs-make"
            name="make"
            type="text"
            placeholder="Cessna, Cirrus, Piper…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base sm:text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        {marketplace === 'partnerships' ? (
          <div>
            <label htmlFor="qs-airport" className="mb-1 block text-xs font-medium text-slate-500">
              Home airport <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <AirportFormInput name="airport" />
          </div>
        ) : (
          <div>
            <label htmlFor="qs-budget-aircraft" className="mb-1 block text-xs font-medium text-slate-500">
              Max price <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="qs-budget-aircraft"
              name="budget"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="150000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base sm:text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
        )}
      </div>

      {marketplace === 'partnerships' && (
        <div className="mt-3">
          <label htmlFor="qs-budget-partnership" className="mb-1 block text-xs font-medium text-slate-500">
            Max monthly <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="qs-budget-partnership"
            name="budget"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="800"
            className="w-full max-w-[10rem] rounded-lg border border-slate-200 px-3 py-2.5 text-base sm:text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60 sm:w-auto"
      >
        {pending ? 'Saving…' : 'Save search & get alerts'}
      </button>
      {errorMsg && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}
    </form>
  )
}
