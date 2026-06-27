import { Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { PartnerCompResult } from '@/lib/partnershipComps'
import { formatPrice } from '@/lib/utils'

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

/**
 * Sidebar panel showing how a partnership's buy-in compares to other active
 * same-make partnerships on ClubHanger. Self-suppresses (renders null) when comp
 * is null — the caller should only pass non-null results.
 */
export default function PartnershipMarketCheck({
  comp,
  make,
}: {
  comp: PartnerCompResult
  make: string
}) {
  const meta = VERDICT_META[comp.kind]
  const dir = comp.deltaDollars < 0 ? 'below' : 'above'
  const headline =
    comp.kind === 'near'
      ? `Buy-in is around the median for ${make} partnerships.`
      : `Buy-in is ${formatPrice(Math.abs(comp.deltaDollars))} (${comp.pct}%) ${dir} the ${make} partnership median.`

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
        Based on the median buy-in ({formatPrice(comp.median)}) of {comp.count} other active {make}{' '}
        partnership{comp.count === 1 ? '' : 's'} on ClubHanger.
      </p>
      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Share types and partner counts vary — compare listing details before deciding. Not an
        appraisal or financial advice.
      </p>
    </div>
  )
}
