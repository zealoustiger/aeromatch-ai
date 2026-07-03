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
        Based on the median buy-in ({formatPrice(result.median)}) of {result.count} other active{' '}
        {make} partnership{result.count === 1 ? '' : 's'} on ClubHanger, normalized to a{' '}
        {shareLabel.toLowerCase()}.
      </p>
      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Share terms vary — not an appraisal or financial advice.
      </p>
    </div>
  )
}
