'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { computeEarnings } from '@/lib/calculators'

function money(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Math.round(n)
  )
}

interface Props {
  variant?: 'full' | 'compact'
  initialMonthlyFixedTotal?: number | null
  initialSharePrice?: number | null
  initialMonthlyDuesPerShare?: number | null
  initialHourlyWet?: number | null
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  prefix?: string
  suffix?: string
  step?: number
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <span className="mt-1 flex items-center rounded-lg border border-slate-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
        {prefix && <span className="pl-3 text-sm text-slate-400">{prefix}</span>}
        <input
          type="number"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none"
        />
        {suffix && <span className="pr-3 text-sm text-slate-400">{suffix}</span>}
      </span>
    </label>
  )
}

export default function EarningsCalculator({
  variant = 'full',
  initialMonthlyFixedTotal,
  initialSharePrice,
  initialMonthlyDuesPerShare,
  initialHourlyWet,
}: Props) {
  const [monthlyFixedTotal, setMonthlyFixedTotal] = useState(initialMonthlyFixedTotal ?? 960)
  const [sharePrice, setSharePrice] = useState(initialSharePrice ?? 18000)
  const [sharesOffered, setSharesOffered] = useState(2)
  const [monthlyDuesPerShare, setMonthlyDuesPerShare] = useState(initialMonthlyDuesPerShare ?? 320)
  const [hourlyWet, setHourlyWet] = useState(initialHourlyWet ?? 90)
  const [hourlyCost, setHourlyCost] = useState(60)
  const [expectedHoursPerShare, setExpectedHoursPerShare] = useState(10)

  const result = useMemo(
    () =>
      computeEarnings({
        monthlyFixedTotal,
        sharePrice,
        sharesOffered,
        monthlyDuesPerShare,
        hourlyWet,
        hourlyCost,
        expectedHoursPerShare,
      }),
    [monthlyFixedTotal, sharePrice, sharesOffered, monthlyDuesPerShare, hourlyWet, hourlyCost, expectedHoursPerShare]
  )

  const coveragePct = Math.min(100, Math.round(result.fixedCoverage * 100))

  if (variant === 'compact') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
          <TrendingUp className="h-4 w-4" /> What could this offset?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Partners" value={sharesOffered} onChange={setSharesOffered} />
          <NumberField label="Dues / partner" value={monthlyDuesPerShare} onChange={setMonthlyDuesPerShare} prefix="$" suffix="/mo" step={10} />
        </div>
        <dl className="mt-4 space-y-2 border-t border-emerald-100 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Monthly offset</dt>
            <dd className="font-semibold text-slate-900">{money(result.monthlyOffset)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Upfront from buy-ins</dt>
            <dd className="font-semibold text-slate-900">{money(result.upfrontFromBuyIns)}</dd>
          </div>
        </dl>
        <Link
          href="/tools/earnings-calculator"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
        >
          Open full calculator <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Your aircraft & offer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Total monthly fixed" value={monthlyFixedTotal} onChange={setMonthlyFixedTotal} prefix="$" suffix="/mo" step={10} />
          <NumberField label="Buy-in per partner" value={sharePrice} onChange={setSharePrice} prefix="$" step={500} />
          <NumberField label="Partners offered" value={sharesOffered} onChange={setSharesOffered} />
          <NumberField label="Monthly dues / partner" value={monthlyDuesPerShare} onChange={setMonthlyDuesPerShare} prefix="$" suffix="/mo" step={10} />
          <NumberField label="Wet rate charged" value={hourlyWet} onChange={setHourlyWet} prefix="$" suffix="/hr" step={5} />
          <NumberField label="Your cost / hour" value={hourlyCost} onChange={setHourlyCost} prefix="$" suffix="/hr" step={5} />
          <NumberField label="Hours / partner / mo" value={expectedHoursPerShare} onChange={setExpectedHoursPerShare} suffix="hrs" />
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-700">Your offset</h2>
        <div className="space-y-3">
          <Result label="Monthly offset / earnings" value={money(result.monthlyOffset)} big />
          <Result label="Annual offset" value={money(result.annualOffset)} />
          <Result label="— from dues" value={`${money(result.monthlyDuesIncome)}/mo`} />
          <Result label="— from flying margin" value={`${money(result.monthlyHourlyMargin)}/mo`} />
          <Result label="Upfront from buy-ins" value={money(result.upfrontFromBuyIns)} />
        </div>

        <div className="mt-6">
          <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
            <span>Fixed costs covered by dues</span>
            <span>{coveragePct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${coveragePct}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {result.netMonthlyFixedAfterDues > 0
              ? `${money(result.netMonthlyFixedAfterDues)}/mo of your fixed cost is still on you.`
              : `Dues fully cover your fixed cost — ${money(-result.netMonthlyFixedAfterDues)}/mo to spare.`}
            {result.partnersToBreakEvenFixed != null &&
              ` ${result.partnersToBreakEvenFixed} partner${result.partnersToBreakEvenFixed === 1 ? '' : 's'} at these dues fully covers it.`}
          </p>
        </div>
      </div>
    </div>
  )
}

function Result({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={big ? 'text-2xl font-bold text-slate-900' : 'font-semibold text-slate-800'}>{value}</span>
    </div>
  )
}
