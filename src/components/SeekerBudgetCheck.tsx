import { Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { PartnerCompResult } from '@/lib/partnershipComps'
import { formatPrice, formatShareType } from '@/lib/utils'
import { ShareType } from '@/lib/types'

const VERDICT_META = {
  below: {
    label: 'Budget may be tight',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    Icon: TrendingDown,
  },
  near: {
    label: 'Budget looks realistic',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Icon: Minus,
  },
  above: {
    label: 'Comfortably above typical',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Icon: TrendingUp,
  },
}

/**
 * Sidebar panel on a seeker's detail page showing whether their stated max buy-in
 * is realistic for the share size + make they want, based on other active
 * same-make partnerships on ClubHanger. Self-suppresses when `check` is null —
 * caller only renders this when `getSeekerBudgetCheck` returned a result.
 */
export default function SeekerBudgetCheck({
  make,
  shareType,
  result,
}: {
  make: string
  shareType: ShareType
  result: PartnerCompResult
}) {
  const meta = VERDICT_META[result.kind]
  const shareLabel = formatShareType(shareType)
  const headline =
    result.kind === 'near'
      ? `Your budget is around the typical ${make} ${shareLabel.toLowerCase()} buy-in.`
      : result.kind === 'below'
        ? `Typical ${make} ${shareLabel.toLowerCase()} buy-ins run ${formatPrice(Math.abs(result.deltaDollars))} (${result.pct}%) above your budget.`
        : `Your budget is ${formatPrice(Math.abs(result.deltaDollars))} (${result.pct}%) above the typical ${make} ${shareLabel.toLowerCase()} buy-in.`

  // Visual low–high spread bar — same pattern as PartnershipMarketCheck's bar,
  // only when there's a real range (high > low). Positions derive purely from
  // fields already on `result`: the comp low/high/median and the seeker's own
  // budget (recovered as median + signed delta).
  const hasRange = result.high > result.low
  const budget = result.median + result.deltaDollars
  const onBar = (value: number) =>
    Math.max(0, Math.min(100, ((value - result.low) / (result.high - result.low)) * 100))
  const medianPos = onBar(result.median)
  const budgetPos = onBar(budget)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Scale className="h-4 w-4" /> Budget check
      </h2>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ring-1 ${meta.chip}`}
      >
        <meta.Icon className="h-4 w-4" /> {meta.label}
      </span>
      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">{headline}</p>
      <p className="mt-2 text-xs text-slate-500">
        {hasRange ? (
          <>
            {result.count} other active {make} partnership{result.count === 1 ? '' : 's'} range{' '}
            {formatPrice(result.low)}–{formatPrice(result.high)} (median {formatPrice(result.median)}),
            normalized to a {shareLabel.toLowerCase()} — your budget is{' '}
            {result.percentile === 0
              ? 'below all of them'
              : result.percentile === 100
                ? 'above all of them'
                : `above ${result.percentile}% of them`}
            .
          </>
        ) : (
          <>
            Based on the median buy-in ({formatPrice(result.median)}) of {result.count} other active{' '}
            {make} partnership{result.count === 1 ? '' : 's'} on ClubHanger, normalized to a{' '}
            {shareLabel.toLowerCase()}.
          </>
        )}
      </p>
      {hasRange && (
        <div className="mt-3">
          <div
            className="relative h-2 rounded-full bg-gradient-to-r from-emerald-200 via-slate-200 to-amber-200"
            role="img"
            aria-label={`Your budget is priced ${
              result.percentile === 0
                ? 'below all'
                : result.percentile === 100
                  ? 'above all'
                  : `above ${result.percentile}% of`
            } comparable ${make} partnerships, which range ${formatPrice(result.low)} to ${formatPrice(
              result.high
            )} (median ${formatPrice(result.median)}).`}
          >
            {/* median tick */}
            <div
              className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-400"
              style={{ left: `${medianPos}%` }}
            />
            {/* your budget */}
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-600 shadow"
              style={{ left: `${budgetPos}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
            <span>{formatPrice(result.low)}</span>
            <span>{formatPrice(result.high)}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-white bg-sky-600 shadow-sm" />
              your budget
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-0.5 rounded bg-slate-400" />
              median
            </span>
          </div>
        </div>
      )}
      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Share terms vary — not an appraisal or financial advice.
      </p>
    </div>
  )
}
