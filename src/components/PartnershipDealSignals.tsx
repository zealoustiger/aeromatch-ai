import type { Partnership } from '@/lib/types'
import type { PartnerCompResult } from '@/lib/partnershipComps'
import type { ImpliedValueResult } from '@/lib/partnershipImpliedValue'
import type { EngineLifeResult } from '@/lib/engineLife'
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

function computeSignals(
  p: Partnership,
  comp: PartnerCompResult | null,
  impliedValue: ImpliedValueResult | null,
  engineLife: EngineLifeResult | null,
): SignalRow[] {
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

  // 2. Implied full-aircraft value vs. for-sale family median
  // buy_in × total_shares gives the implied aircraft equity; compare to what the same
  // make/model actually asks on the open market. Proprietary cross-silo sanity check —
  // no other listing site fuses partnership share math with for-sale market data.
  if (impliedValue) {
    const iv = formatPrice(impliedValue.impliedValue)
    const med = formatPrice(impliedValue.median)
    const makeLabel = p.make ? ` ${p.make}` : ''
    const sharesExpr =
      p.total_shares && p.buy_in_price
        ? `${p.total_shares} × ${formatPrice(p.buy_in_price)} = `
        : ''
    if (impliedValue.kind === 'below') {
      rows.push({
        kind: 'positive',
        label: 'Implied aircraft value looks favorable',
        detail: `${sharesExpr}${iv} implied value — ${impliedValue.pct}% below the ${med} median of ${impliedValue.count} comparable${makeLabel} aircraft for sale. Buy-in may include reserves; compare closely.`,
      })
    } else if (impliedValue.kind === 'above') {
      rows.push({
        kind: 'neutral',
        label: 'Implied aircraft value above for-sale market',
        detail: `${sharesExpr}${iv} implied value — ${impliedValue.pct}% above the ${med} median of ${impliedValue.count} comparable${makeLabel} aircraft for sale. Ask what the buy-in includes (reserves, improvements).`,
      })
    } else {
      rows.push({
        kind: 'neutral',
        label: 'Implied aircraft value near market',
        detail: `${sharesExpr}${iv} implied value, in line with the ${med} median of ${impliedValue.count} comparable${makeLabel} aircraft for sale.`,
      })
    }
  }

  // 3. Days listed — use posted_at (date-only string) if available, else created_at
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

  // 4. Cost transparency — how much of the cost structure is disclosed
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

  // 5. Engine life vs TBO — reuse the engineLife result already computed on the page.
  // Bands mirror the aircraft DealScorePanel so both surfaces always agree.
  // Self-suppresses (engineLife is null) when smoh or engine_type is missing / unrecognised.
  if (engineLife) {
    const tboHrs = engineLife.tboHours.toLocaleString()
    if (engineLife.beyondTbo) {
      rows.push({
        kind: 'negative',
        label: 'Engine past TBO',
        detail: `${Math.abs(engineLife.remainingHours).toLocaleString()} hrs beyond the ${tboHrs}-hr recommended TBO for the ${engineLife.family} — budget for an overhaul (~${formatPrice(engineLife.overhaulCostUsd)}) or ask about its current inspection status`,
      })
    } else {
      const pct = Math.round((engineLife.remainingHours / engineLife.tboHours) * 100)
      const remHrs = engineLife.remainingHours.toLocaleString()
      if (pct > 40) {
        rows.push({
          kind: 'positive',
          label: 'Engine has life left',
          detail: `${remHrs} hrs to TBO (${pct}% of the ${tboHrs}-hr ${engineLife.family} interval remaining) — an overhaul is well down the road`,
        })
      } else if (pct > 15) {
        rows.push({
          kind: 'neutral',
          label: 'Mid-time engine',
          detail: `${remHrs} hrs to TBO (${pct}% remaining) — a healthy mid-life engine; factor the ~${formatPrice(engineLife.reservePerYear)}/yr overhaul reserve into your budget`,
        })
      } else {
        rows.push({
          kind: 'negative',
          label: 'Approaching TBO',
          detail: `Only ${remHrs} hrs to TBO (${pct}% remaining) — an overhaul (~${formatPrice(engineLife.overhaulCostUsd)}) is on the horizon; ask about engine condition and factor it into your offer`,
        })
      }
    }
  }

  // 6. Spec completeness — whether key engine/airframe fields are on the listing.
  // When specs are present the engine-life and airframe panels below are active;
  // when missing, buyers get a clear "what to ask" prompt. Never negative — missing
  // data is normal on many listings, not a red flag.
  const hasEngineSpecs = p.smoh != null && !!p.engine_type
  const hasAirframeSpecs = p.ttaf != null
  if (hasEngineSpecs) {
    const airframeClause = hasAirframeSpecs ? ' and airframe time (TTAF)' : ''
    rows.push({
      kind: 'positive',
      label: 'Engine specs on listing',
      detail: `SMOH and engine type${airframeClause} are provided — the Engine Life analysis below reflects the actual engine data`,
    })
  } else {
    rows.push({
      kind: 'neutral',
      label: 'Engine/airframe specs not on listing',
      detail: 'Ask the owner for SMOH, engine type, and TTAF — these unlock the Engine Life and Airframe Time analysis panels',
    })
  }

  return rows
}

/**
 * "How this partnership stacks up" — synthesis panel for partnership detail pages.
 *
 * Renders up to six signals: buy-in vs partnership comps, implied aircraft value vs
 * for-sale family median, days listed, cost transparency, engine life (when smoh +
 * engine_type resolve a TBO family), and spec completeness. Self-suppresses when fewer
 * than 2 signals are actionable — never shows a thin or misleading verdict.
 */
export default function PartnershipDealSignals({
  p,
  comp,
  impliedValue = null,
  engineLife = null,
}: {
  p: Partnership
  comp: PartnerCompResult | null
  impliedValue?: ImpliedValueResult | null
  engineLife?: EngineLifeResult | null
}) {
  const rows = computeSignals(p, comp, impliedValue, engineLife)
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
