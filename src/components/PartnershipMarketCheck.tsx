import { Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { PartnerCompResult, PartnershipDealCheck } from '@/lib/partnershipComps'
import { formatPrice } from '@/lib/utils'
import { type DaysOnMarketContext } from '@/lib/daysOnMarket'

const VERDICT_META = {
  below: {
    label: 'Below market',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Icon: TrendingDown,
  },
  near: {
    label: 'Around market',
    chip: 'bg-slate-100 text-slate-700 ring-slate-200',
    Icon: Minus,
  },
  above: {
    label: 'Above market',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    Icon: TrendingUp,
  },
}

const DEAL_META: Record<PartnershipDealCheck['verdict'], { label: string; chip: string; Icon: typeof TrendingDown }> = {
  good: {
    label: 'Good deal',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Icon: TrendingDown,
  },
  fair: {
    label: 'Fair price',
    chip: 'bg-sky-50 text-sky-700 ring-sky-200',
    Icon: Scale,
  },
  high: {
    label: 'Priced high',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    Icon: TrendingUp,
  },
}

/** "Deal check" sub-block — a value judgement narrowed to similar-year + similar-hours
 *  comps, mirroring the aircraft-for-sale detail page's `DealCheck`. Only rendered when
 *  the caller has a non-null verdict (self-suppresses on thin/uncontrolled data). */
function DealCheck({ deal, familyLabel }: { deal: PartnershipDealCheck; familyLabel: string }) {
  const meta = DEAL_META[deal.verdict]
  const dir = deal.deltaDollars < 0 ? 'below' : 'above'
  const hoursLabel = deal.hoursSignal === 'smoh' ? 'similar-year, similar engine-time' : 'similar-year, similar-hours'
  const comparableLabel = deal.hoursSignal === 'smoh' ? 'comparable engine time since overhaul' : 'comparable total time'
  const sentence =
    deal.verdict === 'fair'
      ? `Right around the expected buy-in for ${hoursLabel} ${familyLabel} partnerships this size.`
      : `Buy-in is ${formatPrice(Math.abs(deal.deltaDollars))} (${deal.deltaPct}%) ${dir} the expected price for ${hoursLabel} ${familyLabel} partnerships this size.`
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Deal check</p>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ring-1 ${meta.chip}`}>
        <meta.Icon className="h-4 w-4" /> {meta.label}
      </span>
      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">{sentence}</p>
      <p className="mt-2 text-xs text-slate-500">
        Compared with {deal.compCount} other {familyLabel} partnership{deal.compCount === 1 ? '' : 's'} within
        ±{deal.yearBand} years and {comparableLabel}, normalized for share size — controlling for the two biggest
        value drivers (expected buy-in {formatPrice(deal.median)}).
      </p>
    </div>
  )
}

/**
 * Sidebar panel showing how a partnership's buy-in compares to other active
 * same-make partnerships on ClubHanger. Self-suppresses (renders null) when comp
 * is null — the caller should only pass non-null results.
 */
export default function PartnershipMarketCheck({
  comp,
  make,
  listed,
  daysOnMarket,
  domContext,
  deal,
  familyLabel,
}: {
  comp: PartnerCompResult
  make: string
  listed?: string | null
  daysOnMarket?: number | null
  domContext?: DaysOnMarketContext | null
  /** Year/hours-narrowed value verdict (see `partnershipDealVerdict`). Optional —
   *  renders nothing extra when absent, so existing callers are unaffected. */
  deal?: PartnershipDealCheck | null
  /** "{make} {model}" label for the Deal check copy — required only when `deal` is set. */
  familyLabel?: string
}) {
  const meta = VERDICT_META[comp.kind]
  const dir = comp.deltaDollars < 0 ? 'below' : 'above'
  const headline =
    comp.kind === 'near'
      ? `Buy-in is around the median for ${make} partnerships.`
      : `Buy-in is ${formatPrice(Math.abs(comp.deltaDollars))} (${comp.pct}%) ${dir} the ${make} partnership median.`

  // Visual low–high spread bar — only when there's a real range (high > low), same
  // pattern as the aircraft-for-sale ClubHanger Estimate's bar. Positions derive
  // purely from values already shown: the comp low/high/median and this listing's
  // own buy-in (recovered as median + signed delta).
  const hasRange = comp.high > comp.low
  const buyIn = comp.median + comp.deltaDollars
  const onBar = (value: number) =>
    Math.max(0, Math.min(100, ((value - comp.low) / (comp.high - comp.low)) * 100))
  const medianPos = onBar(comp.median)
  const subjectPos = onBar(buyIn)

  return (
    <div className="ch-panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Scale className="h-4 w-4" /> Partnership market check
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
            {comp.count} other active {make} partnership{comp.count === 1 ? '' : 's'} range{' '}
            {formatPrice(comp.low)}–{formatPrice(comp.high)} (median {formatPrice(comp.median)}) — this one
            is{' '}
            {comp.percentile === 0
              ? 'priced below all of them'
              : comp.percentile === 100
                ? 'priced above all of them'
                : `priced above ${comp.percentile}% of them`}
            .
          </>
        ) : (
          <>
            Based on the median buy-in ({formatPrice(comp.median)}) of {comp.count} other active {make}{' '}
            partnership{comp.count === 1 ? '' : 's'} on ClubHanger.
          </>
        )}
      </p>
      {hasRange && (
        <div className="mt-3">
          <div
            className="relative h-2 rounded-full bg-gradient-to-r from-emerald-200 via-slate-200 to-amber-200"
            role="img"
            aria-label={`This listing's buy-in is priced ${
              comp.percentile === 0
                ? 'below all'
                : comp.percentile === 100
                  ? 'above all'
                  : `above ${comp.percentile}% of`
            } comparable ${make} partnerships, which range ${formatPrice(comp.low)} to ${formatPrice(
              comp.high
            )} (median ${formatPrice(comp.median)}).`}
          >
            {/* median tick */}
            <div
              className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-400"
              style={{ left: `${medianPos}%` }}
            />
            {/* this listing */}
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-600 shadow"
              style={{ left: `${subjectPos}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
            <span>{formatPrice(comp.low)}</span>
            <span>{formatPrice(comp.high)}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-white bg-sky-600 shadow-sm" />
              this listing
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-0.5 rounded bg-slate-400" />
              median
            </span>
          </div>
        </div>
      )}
      <div className="mt-3 border-t border-slate-100 pt-3 space-y-1">
        <p className="text-xs text-slate-400">
          Share types and partner counts vary — compare listing details before deciding. Not an
          appraisal or financial advice.
        </p>
        {listed && (
          <p className="text-xs text-slate-500">
            <span className="font-medium">{listed}</span>
            {domContext && (
              domContext.relative === 'longer'
                ? ` — on the market longer than ~${domContext.percentileLongerThan}% of the ${domContext.compCount} comparable ${make} partnerships listed now${(daysOnMarket ?? 0) >= 30 ? ' — seller may have flexibility' : ''}`
                : domContext.relative === 'shorter'
                  ? ` — listed more recently than ~${100 - domContext.percentileLongerThan}% of the ${domContext.compCount} comparable ${make} partnerships listed now`
                  : ` — on the market about as long as the typical ${make} partnership`
            )}
          </p>
        )}
      </div>
      {deal && familyLabel && <DealCheck deal={deal} familyLabel={familyLabel} />}
    </div>
  )
}
