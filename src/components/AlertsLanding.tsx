'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Search, TrendingDown, MailCheck } from 'lucide-react'
import AlertSignup from '@/components/AlertSignup'

/**
 * /alerts landing — the demand-capture surface the nav "Get alerts" CTA points at.
 * Most visitors are buyers, not sellers, so we ask for the thing they actually want:
 * an email when the right aircraft (or a partnership) is listed.
 *
 * Each interest chip carries a `sourcePath` that `scraper/send-alerts.mjs`'s
 * parseSearch() can actually match (paths under /aircraft or /partnerships with
 * query-param filters) — so every alert set here genuinely fires. The `context` is
 * the human label used in the confirmation copy. Selecting a chip remounts the
 * AlertSignup (keyed on sourcePath) so its state resets cleanly.
 */
interface Interest {
  label: string
  /** Human label for the email copy; '' → general new-listing copy. */
  context: string
  /** Matchable search path (must start with /aircraft or /partnerships). */
  sourcePath: string
  noun: 'aircraft' | 'partnership' | 'seeker'
}

const INTERESTS: Interest[] = [
  { label: 'All aircraft for sale', context: '', sourcePath: '/aircraft', noun: 'aircraft' },
  { label: 'Cessna 172', context: 'Cessna 172', sourcePath: '/aircraft?make=Cessna&model=172', noun: 'aircraft' },
  { label: 'Cirrus SR22', context: 'Cirrus SR22', sourcePath: '/aircraft?make=Cirrus&model=SR22', noun: 'aircraft' },
  { label: 'Piper Cherokee', context: 'Piper Cherokee', sourcePath: '/aircraft?make=Piper&model=Cherokee', noun: 'aircraft' },
  { label: 'Beechcraft Bonanza', context: 'Beechcraft Bonanza', sourcePath: '/aircraft?make=Beechcraft&model=Bonanza', noun: 'aircraft' },
  { label: 'Partnership shares', context: '', sourcePath: '/partnerships', noun: 'partnership' },
  { label: 'Pilots seeking a partnership', context: '', sourcePath: '/partnerships/seeking', noun: 'seeker' },
]

export default function AlertsLanding() {
  const [sel, setSel] = useState(0)
  const active = INTERESTS[sel]

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      {/* Hero */}
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
          <Bell className="h-6 w-6 text-sky-600" />
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Never miss the right aircraft
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
          We watch Barnstormers, Hangar67, AircraftForSale and new partnership shares around the
          clock. Tell us what you&apos;re after and we&apos;ll email you the moment it&apos;s listed —
          before it&apos;s gone.
        </p>
      </div>

      {/* Interest chips */}
      <div className="mt-8">
        <p className="mb-2 text-sm font-medium text-slate-500">What do you want alerts for?</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((it, i) => (
            <button
              key={it.sourcePath}
              onClick={() => setSel(i)}
              className={
                'rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-colors ' +
                (i === sel
                  ? 'bg-sky-600 text-white ring-sky-600'
                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50')
              }
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email capture — remounts per selection so its submit state resets */}
      <AlertSignup key={active.sourcePath} context={active.context} sourcePath={active.sourcePath} noun={active.noun} source="alerts_landing" />

      {/* Trust row */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { icon: MailCheck, text: 'No account needed — just your email.' },
          { icon: TrendingDown, text: 'We flag price drops too, not just new listings.' },
          { icon: Search, text: 'Want finer filters? Set an alert from any search.' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white p-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <span className="text-xs text-slate-600">{text}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        One-click unsubscribe in every email. We never share your address.
      </p>
      <p className="mt-2 text-center text-xs text-slate-400">
        Already set up alerts?{' '}
        <Link href="/alerts/manage" className="text-sky-600 underline-offset-2 hover:underline">
          Manage them
        </Link>
        .
      </p>
    </div>
  )
}
