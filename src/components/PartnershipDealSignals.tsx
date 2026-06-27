import type { Partnership } from '@/lib/types'
import type { PartnerCompResult } from '@/lib/partnershipComps'
import { formatPrice } from '@/lib/utils'

const DAY_MS = 86_400_000

type SignalKind = 'positive' | 'neutral' | 'negative'

interface SignalRow {
  kind: SignalKind
  label: string
  detail: string
}

const DOT: Record<SignalKind, string> = {
  positive: 'bg-emerald-400',
  neutral: 'bg-slate-300',
  negative: 'bg-amber-400',
}
const LABEL_COLOR: Record<SignalKind, string> = {
  positive: 'text-emerald-700',
  neutral: 'text-slate-700',
  negative: 'text-amber-700',
}

function computeSignals(p: Partnership, comp: PartnerCompResult | null): SignalRow[] {
  const rows: SignalRow[] = []

  // 1. Buy-in vs same-make median (from partnerComp, already computed on the page)
  if (comp) {
    const absDelta = formatPrice(Math.abs(comp.deltaDollars))
    const makeLabel = p.make ? ` ${p.make}` : ''
    if (comp.kind === 'below') {
      rows.push({
        kind: 'positive',
        label: 'Buy-in below market',
        detail: `${absDelta} (${comp.pct}%) below the median of ${comp.count} comparable${makeLabel} partnerships`,
      })
    } else if (comp.kind === 'near') {
      rows.push({
        kind: 'neutral',
        label: 'Buy-in around market',
        detail: `Near the median buy-in of ${comp.count} comparable${makeLabel} partnerships`,
      })
    } else {
      rows.push({
        kind: 'negative',
        label: 'Buy-in above market',
        detail: `${absDelta} (${comp.pct}%) above the median of ${comp.count} comparable${makeLabel} partnerships`,
      })
    }
  }

  // 2. Days listed — use posted_at (date-only string) if available, else created_at
  const postedDate = p.posted_at
    ? new Date(`${p.posted_at}T00:00:00`)
    : new Date(p.created_at)
  const days = Math.max(0, Math.floor((Date.now() - postedDate.getTime()) / DAY_MS))

  if (days >= 90) {
    const months = Math.floor(days / 30)
    rows.push({
      kind: 'positive',
      label: `Listed ${months} month${months === 1 ? '' : 's'} ago`,
      detail: 'Long listing cycle — seller may have flexibility on buy-in or terms',
    })
  } else if (days >= 30) {
    const months = Math.floor(days / 30)
    rows.push({
      kind: 'neutral',
      label: `Listed about ${months} month${months === 1 ? '' : 's'} ago`,
      detail: 'Worth asking whether there is negotiating room',
    })
  } else if (days <= 3) {
    rows.push({
      kind: 'neutral',
      label: days === 0 ? 'Listed today' : `Listed ${days} day${days === 1 ? '' : 's'} ago`,
      detail: 'Fresh to market — early in the listing cycle',
    })
  } else {
    rows.push({
      kind: 'neutral',
      label: `Listed ${days} days ago`,
      detail: 'Recently posted',
    })
  }

  // 3. Cost transparency — how much of the cost structure is disclosed
  const hasBuyIn = p.buy_in_price != null
  const hasMonthly = p.monthly_fixed != null
  const hasWet = p.hourly_wet != null

  if (hasBuyIn && hasMonthly && hasWet) {
    rows.push({
      kind: 'positive',
      label: 'Fully priced',
      detail: 'Buy-in, monthly fixed cost, and hourly wet rate are all listed — easy to estimate your total cost',
    })
  } else if (hasBuyIn && (hasMonthly || hasWet)) {
    const missing = hasMonthly ? 'hourly wet rate' : 'monthly fixed cost'
    rows.push({
      kind: 'neutral',
      label: 'Partially priced',
      detail: `${missing.charAt(0).toUpperCase() + missing.slice(1)} not listed — ask the owner for the full cost breakdown`,
    })
  }

  return rows
}

/**
 * "How this partnership stacks up" — synthesis panel for partnership detail pages.
 *
 * Mirrors the aircraft DealScorePanel: renders up to three signals (buy-in vs market,
 * days listed, cost transparency) in the main column, above the description. Self-
 * suppresses when fewer than 2 signals are actionable — never shows a thin or
 * misleading verdict. Uses only data already fetched on the detail page; no new DB reads.
 */
export default function PartnershipDealSignals({
  p,
  comp,
}: {
  p: Partnership
  comp: PartnerCompResult | null
}) {
  const rows = computeSignals(p, comp)
  if (rows.length < 2) return null

  return (
    <div className="ch-panel p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        How this partnership stacks up
      </h2>
      <ul className="space-y-3">
        {rows.map((row, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[row.kind]}`} />
            <div>
              <p className={`text-sm font-semibold ${LABEL_COLOR[row.kind]}`}>{row.label}</p>
              <p className="text-xs leading-relaxed text-slate-500">{row.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Based on current ClubHanger listings. Share types and partner counts vary — read the full listing for complete context. Not financial advice.
      </p>
    </div>
  )
}
