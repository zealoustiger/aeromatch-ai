'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, Search, TrendingDown, MailCheck } from 'lucide-react'
import AlertSignup from '@/components/AlertSignup'
import AlertBuilder from '@/components/AlertBuilder'
import { formatPrice } from '@/lib/utils'
import type { AlertDigestSample } from '@/lib/email'
import { BASE_INTERESTS, type BaseInterest } from '@/lib/alertsLandingInterests'

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
type Interest = BaseInterest

/** A curated popular-alert candidate the server has confirmed has ≥1 live match
 *  right now (see `src/app/alerts/page.tsx`'s `getPopularChips`). Never rendered
 *  canned — a candidate with 0 live matches is dropped before it reaches this
 *  component at all. */
export interface PopularChip {
  label: string
  context: string
  sourcePath: string
  noun: 'aircraft' | 'partnership' | 'seeker'
  count: number
  /** Distinct confirmed subscribers on this exact alert — set by the server ONLY
   *  when it honestly clears `MIN_CHIP_WATCHERS_TO_SHOW` (see page.tsx). Absent
   *  otherwise, so the chip shows no social-proof line rather than a weak/fake one. */
  watchers?: number
}

/** A rendered interest chip — a curated `PopularChip` (may carry a `watchers`
 *  count) or a broad catch-all `BaseInterest` (never does). */
type LandingInterest = Interest & { watchers?: number }

interface Props {
  /** Server-verified popular alert chips (see `page.tsx`) — honesty-gated, may be
   *  empty (e.g. on a DB error) in which case only the catch-all chips render. */
  popularChips?: PopularChip[]
  /** Real, live-data sample listings per chip source path (see `page.tsx`'s
   *  `getAlertDigestPreview` calls) — "what you'll get" proof shown for the
   *  active chip. A path with no entry (0 live matches, or an unrecognized
   *  path) renders no preview at all — never a fake/placeholder sample. */
  samplesByPath?: Record<string, AlertDigestSample[]>
}

export default function AlertsLanding({ popularChips = [], samplesByPath = {} }: Props) {
  const interests: LandingInterest[] = [
    BASE_INTERESTS[0],
    ...popularChips.map((c) => ({
      label: c.label,
      context: c.context,
      sourcePath: c.sourcePath,
      noun: c.noun,
      source: 'alerts_landing_popular',
      watchers: c.watchers,
    })),
    ...BASE_INTERESTS.slice(1),
  ]
  const [sel, setSel] = useState(0)
  const active = interests[sel]
  const activeSamples = samplesByPath[active.sourcePath] ?? []

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
          {interests.map((it, i) => (
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
              {it.watchers ? (
                <span className={'ml-1.5 font-normal ' + (i === sel ? 'text-sky-100' : 'text-slate-400')}>
                  · {it.watchers} watching
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Live sample preview — proof of what the alert email actually contains,
          shown before asking for an email. Honesty-gated: a chip with 0 live
          matches (not in samplesByPath) renders nothing here at all. */}
      {activeSamples.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-500">
            What you&apos;ll get — real {active.label.toLowerCase()} listings right now:
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {activeSamples.map((s) => (
              <div key={s.url} className="ch-card flex items-center gap-3 bg-white p-2 sm:flex-col sm:items-stretch sm:p-3">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-full">
                  {s.photoUrl && (
                    <Image src={s.photoUrl} alt={s.title} fill sizes="200px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{s.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[s.lookingFor ?? s.shareType, s.location].filter(Boolean).join(' · ')}
                  </p>
                  {s.price != null && <p className="text-sm font-semibold text-sky-700">{formatPrice(s.price)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email capture — remounts per selection so its submit state resets */}
      <AlertSignup key={active.sourcePath} context={active.context} sourcePath={active.sourcePath} noun={active.noun} source={active.source} />

      {/* Want something more specific than the chips above? Build it from scratch. */}
      <AlertBuilder />

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
