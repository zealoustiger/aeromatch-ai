'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Calculator, ArrowRight } from 'lucide-react'
import { computeCost } from '@/lib/calculators'

function money(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Math.round(n)
  )
}

interface Props {
  variant?: 'full' | 'compact'
  initialBuyIn?: number | null
  initialMonthlyFixed?: number | null
  initialHourlyWet?: number | null
  initialHoursPerMonth?: number
  shareFraction?: number | null
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
      <span className="mt-1 flex items-center rounded-lg border border-slate-300 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
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

export default function CostCalculator({
  variant = 'full',
  initialBuyIn,
  initialMonthlyFixed,
  initialHourlyWet,
  initialHoursPerMonth = 10,
  shareFraction = null,
}: Props) {
  const [buyIn, setBuyIn] = useState(initialBuyIn ?? 18000)
  const [monthlyFixed, setMonthlyFixed] = useState(initialMonthlyFixed ?? 320)
  const [hourlyWet, setHourlyWet] = useState(initialHourlyWet ?? 90)
  const [hoursPerMonth, setHoursPerMonth] = useState(initialHoursPerMonth)
  const [rentalRate, setRentalRate] = useState(160)
  const [capitalPct, setCapitalPct] = useState(5)

  const result = useMemo(
    () =>
      computeCost({
        buyIn,
        monthlyFixed,
        hourlyWet,
        hoursPerMonth,
        shareFraction,
        capitalRate: capitalPct / 100,
        rentalRate,
      }),
    [buyIn, monthlyFixed, hourlyWet, hoursPerMonth, shareFraction, capitalPct, rentalRate]
  )

  if (variant === 'compact') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          <Calculator className="h-4 w-4" /> Cost estimator
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Hours / month" value={hoursPerMonth} onChange={setHoursPerMonth} suffix="hrs" />
          <NumberField label="Wet rate" value={hourlyWet} onChange={setHourlyWet} prefix="$" suffix="/hr" />
        </div>
        <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">All-in monthly</dt>
            <dd className="font-semibold text-slate-900">{money(result.operatingMonthly)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">True cost / hour</dt>
            <dd className="font-semibold text-slate-900">{money(result.trueCostPerHour)}/hr</dd>
          </div>
          {result.vsRentingMonthlySavings > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>vs. renting @ {money(rentalRate)}/hr</dt>
              <dd className="font-semibold">save {money(result.vsRentingMonthlySavings)}/mo</dd>
            </div>
          )}
        </dl>
        <Link
          href="/tools/cost-calculator"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
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
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Your numbers</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Buy-in (one-time)" value={buyIn} onChange={setBuyIn} prefix="$" step={500} />
          <NumberField label="Monthly fixed" value={monthlyFixed} onChange={setMonthlyFixed} prefix="$" suffix="/mo" step={10} />
          <NumberField label="Wet rate" value={hourlyWet} onChange={setHourlyWet} prefix="$" suffix="/hr" step={5} />
          <NumberField label="Hours / month" value={hoursPerMonth} onChange={setHoursPerMonth} suffix="hrs" />
          <NumberField label="Comparable rental rate" value={rentalRate} onChange={setRentalRate} prefix="$" suffix="/hr" step={5} />
          <NumberField label="Capital opportunity cost" value={capitalPct} onChange={setCapitalPct} suffix="%/yr" />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          “Capital opportunity cost” estimates what your buy-in could earn elsewhere — set it to 0 to ignore.
        </p>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-sky-700">Your cost</h2>
        <div className="space-y-3">
          <Result label="All-in monthly (operating)" value={money(result.operatingMonthly)} big />
          <Result label="Annual" value={money(result.annual)} />
          <Result label="With capital opportunity cost" value={`${money(result.allInMonthly)}/mo`} />
          <Result label="True cost per hour" value={`${money(result.trueCostPerHour)}/hr`} />
        </div>

        <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-sky-700">How it compares (monthly)</h3>
        <div className="space-y-2 text-sm">
          <CompareRow label="Renting this aircraft" them={result.rentingMonthly} you={result.operatingMonthly} savings={result.vsRentingMonthlySavings} />
          {result.fullOwnershipMonthly != null && (
            <CompareRow
              label="Owning it outright"
              them={result.fullOwnershipMonthly}
              you={result.operatingMonthly}
              savings={result.vsFullOwnershipMonthlySavings ?? 0}
            />
          )}
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

function CompareRow({ label, them, you, savings }: { label: string; them: number; you: number; savings: number }) {
  const cheaper = savings > 0
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
      <span className="text-slate-600">{label}</span>
      <span className="text-right">
        <span className="block font-semibold text-slate-800">{money(them)}/mo</span>
        <span className={cheaper ? 'text-xs font-medium text-emerald-600' : 'text-xs font-medium text-amber-600'}>
          {cheaper ? `save ${money(savings)}/mo` : `+${money(Math.abs(savings))}/mo`}
        </span>
      </span>
    </div>
  )
}
