'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Wallet, ArrowRight } from 'lucide-react'
import { ASSUMED_HOURS_PER_YEAR, type ShareCostRow } from '@/lib/calculators'

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Math.round(n)
  )

const TOGGLE_LABELS: Record<number, string> = {
  1: 'Sole owner',
  2: '1/2 share',
  3: '1/3 share',
  4: '1/4 share',
}

export default function ShareCostPanel({
  rows,
  withEngineReserve,
}: {
  rows: ShareCostRow[]
  withEngineReserve: boolean
}) {
  const [selected, setSelected] = useState(1)
  const selectedRow = rows.find((r) => r.shares === selected) ?? rows[0]

  return (
    <div className="ch-panel p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Wallet className="h-4 w-4" /> Cost to own
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Rule-of-thumb estimates — insurance ≈ 1% of price, hangar $7,500/yr, annual
        inspection $2,500/yr, 100 hrs/yr fuel + oil.
        {withEngineReserve && ' Engine reserve from the panel above is folded into the split.'}
        {' '}Your actual costs will vary.
      </p>

      {/* Share-type toggle */}
      <div className="mb-5 flex flex-wrap gap-2">
        {rows.map((row) => (
          <button
            key={row.shares}
            onClick={() => setSelected(row.shares)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 transition-colors ${
              selected === row.shares
                ? 'bg-sky-600 text-white ring-sky-600'
                : 'bg-white text-slate-600 ring-slate-200 hover:ring-sky-400'
            }`}
          >
            {TOGGLE_LABELS[row.shares]}
          </button>
        ))}
      </div>

      {/* Featured scenario for selected share type */}
      {selectedRow && (
        <div className="mb-5 rounded-xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
          <p className="text-sm font-medium text-sky-800">
            As a{' '}
            <span className="font-bold">
              {TOGGLE_LABELS[selected]?.toLowerCase() ?? ''}
            </span>
          </p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-2xl font-extrabold tracking-tight text-sky-900">
              {money(selectedRow.totalMonthly)}/mo
            </span>
            <span className="text-sm text-sky-600">{money(selectedRow.totalAnnual)}/yr</span>
          </div>
          <p className="mt-1.5 text-sm text-sky-700">
            ≈ <span className="font-semibold text-sky-900">{money(selectedRow.costPerHour)}</span> per
            flight hour{' '}
            <span className="text-sky-600">
              at {ASSUMED_HOURS_PER_YEAR} hrs/yr — flying fewer hours raises this (fixed costs
              spread over fewer hours)
            </span>
          </p>
          <p className="mt-2 border-t border-sky-100 pt-2 text-sm text-sky-700">
            {selected === 1 ? (
              <>
                <span className="font-semibold text-sky-900">{money(selectedRow.buyInPerShare)}</span>{' '}
                to buy (the asking price)
              </>
            ) : (
              <>
                ≈ <span className="font-semibold text-sky-900">{money(selectedRow.buyInPerShare)}</span>{' '}
                one-time to buy in (asking price ÷ {selected})
              </>
            )}
          </p>
        </div>
      )}

      {/* All-scenarios comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-2 text-left text-xs font-medium text-slate-400">Ownership</th>
              <th className="pb-2 text-right text-xs font-medium text-slate-400">Buy-in</th>
              <th className="pb-2 text-right text-xs font-medium text-slate-400">Monthly</th>
              <th className="pb-2 text-right text-xs font-medium text-slate-400">Annual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr
                key={row.shares}
                onClick={() => setSelected(row.shares)}
                className={`cursor-pointer transition-colors ${
                  row.shares === selected
                    ? 'bg-sky-50/60 text-slate-800'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <td className="py-2.5 font-medium">{row.label}</td>
                <td className="py-2.5 text-right tabular-nums text-slate-500">
                  {money(row.buyInPerShare)}
                </td>
                <td
                  className={`py-2.5 text-right tabular-nums ${
                    row.shares === selected
                      ? 'font-extrabold text-sky-900'
                      : 'font-semibold'
                  }`}
                >
                  {money(row.totalMonthly)}/mo
                </td>
                <td className="py-2.5 text-right tabular-nums text-slate-400">
                  {money(row.totalAnnual)}/yr
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Buy-in is the asking price split evenly across partners — what you'd each pay to
        acquire the aircraft (the real figure is negotiated). Fixed costs (insurance, hangar,
        inspection{withEngineReserve ? ', engine reserve' : ''}) split equally by number of
        partners; fuel/oil is per-pilot since each partner flies their own hours.
      </p>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        <Link
          href="/tools/cost-calculator"
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          Run your own numbers <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/partnerships"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Find a co-owner on ClubHanger <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
