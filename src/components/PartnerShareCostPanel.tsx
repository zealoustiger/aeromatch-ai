'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Math.round(n)
  )

const HOURS_OPTIONS = [50, 75, 100, 150] as const
type HrsPerYear = (typeof HOURS_OPTIONS)[number]

// Typical piston-GA club/FBO rental rate used for the break-even comparison.
// Labeled on-screen so buyers know the reference.
const REFERENCE_RENTAL_RATE = 150

interface Props {
  buyInPrice: number | null
  monthlyFixed: number | null
  hourlyWet: number | null
  shareType: string | null
}

export default function PartnerShareCostPanel({
  buyInPrice,
  monthlyFixed,
  hourlyWet,
  shareType,
}: Props) {
  const [hrsPerYear, setHrsPerYear] = useState<HrsPerYear>(100)

  // Self-suppress when there are no cost data points to show.
  const hasData = (monthlyFixed && monthlyFixed > 0) || (hourlyWet && hourlyWet > 0)
  if (!hasData) return null

  const fixed = monthlyFixed ?? 0
  const wet = hourlyWet ?? 0

  const annualFixed = fixed * 12
  const annualVariable = wet * hrsPerYear
  const annualTotal = annualFixed + annualVariable
  const perHour = hrsPerYear > 0 ? Math.round(annualTotal / hrsPerYear) : 0
  const monthlyTotal = Math.round(annualTotal / 12)

  // Buy-in break-even vs. renting at the reference rate.
  const rentingAnnual = REFERENCE_RENTAL_RATE * hrsPerYear
  const annualSavings = rentingAnnual - annualTotal
  const breakEvenYears =
    buyInPrice && buyInPrice > 0 && annualSavings > 0
      ? (buyInPrice / annualSavings).toFixed(1)
      : null

  const shareLabel = shareType === '1/2' ? '½' : shareType === '1/3' ? '⅓' : shareType === '1/4' ? '¼' : null

  return (
    <div className="ch-panel p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Wallet className="h-4 w-4" /> Flying cost
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Annual cost{shareLabel ? ` as a ${shareLabel} partner` : ''}, at your flying rate.
      </p>

      {/* Hours/yr toggle */}
      <div className="mb-4 flex flex-wrap gap-2">
        {HOURS_OPTIONS.map((h) => (
          <button
            key={h}
            onClick={() => setHrsPerYear(h)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 transition-colors ${
              hrsPerYear === h
                ? 'bg-sky-600 text-white ring-sky-600'
                : 'bg-white text-slate-600 ring-slate-200 hover:ring-sky-400'
            }`}
          >
            {h} hrs/yr
          </button>
        ))}
      </div>

      {/* Featured result */}
      <div className="mb-4 rounded-xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-extrabold tracking-tight text-sky-900">
            {money(annualTotal)}/yr
          </span>
          <span className="text-sm text-sky-600">{money(monthlyTotal)}/mo</span>
        </div>
        <p className="mt-1 text-sm text-sky-700">
          ≈ <span className="font-semibold text-sky-900">{money(perHour)}</span>{' '}
          per flight hour at {hrsPerYear} hrs/yr
        </p>
      </div>

      {/* Breakdown */}
      <dl className="space-y-2 text-sm">
        {fixed > 0 && (
          <div className="flex justify-between">
            <dt className="text-slate-500">Monthly fixed × 12</dt>
            <dd className="font-medium text-slate-700">{money(annualFixed)}/yr</dd>
          </div>
        )}
        {wet > 0 && (
          <div className="flex justify-between">
            <dt className="text-slate-500">Flying ({hrsPerYear} hrs × {money(wet)}/hr)</dt>
            <dd className="font-medium text-slate-700">{money(annualVariable)}/yr</dd>
          </div>
        )}
      </dl>

      {/* Break-even vs renting */}
      {breakEvenYears !== null ? (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100 text-sm">
          <p className="font-semibold text-emerald-800">
            Save {money(annualSavings)}/yr vs. renting at {money(REFERENCE_RENTAL_RATE)}/hr
          </p>
          {buyInPrice && (
            <p className="mt-0.5 text-emerald-700">
              The {money(buyInPrice)} buy-in recouped in ≈ {breakEvenYears} yrs at this rate
            </p>
          )}
        </div>
      ) : (
        annualSavings <= 0 && rentingAnnual > 0 && (
          <p className="mt-4 text-xs text-slate-400">
            At {hrsPerYear} hrs/yr, renting at {money(REFERENCE_RENTAL_RATE)}/hr would be{' '}
            {money(Math.abs(annualSavings))} cheaper annually — fly more to see partnership savings.
          </p>
        )
      )}

      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Rule of thumb — your costs will vary. Figures from the listing&apos;s stated monthly rate and wet rate.
      </p>
    </div>
  )
}
