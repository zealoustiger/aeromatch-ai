import type { PartnershipSeeker } from '@/lib/types'
import type { PartnerCompResult } from '@/lib/partnershipComps'

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
  s: PartnershipSeeker,
  budgetCheck: { make: string; result: PartnerCompResult } | null,
): SignalRow[] {
  const rows: SignalRow[] = []

  // 1. Budget vs market — reuses the already-computed getSeekerBudgetCheck verdict.
  // Self-suppresses (row omitted) when budgetCheck is null (ambiguous preference,
  // missing budget, or fewer than 4 comps — the same honesty floor the standalone
  // SeekerBudgetCheck panel already enforces).
  if (budgetCheck) {
    const { make, result } = budgetCheck
    if (result.kind === 'below') {
      rows.push({
        kind: 'negative',
        label: 'Budget may be tight',
        detail: `Typical ${make} partnership buy-ins run above this pilot's stated budget, based on ${result.count} comparable active listings`,
      })
    } else if (result.kind === 'near') {
      rows.push({
        kind: 'positive',
        label: 'Budget looks realistic',
        detail: `Around the typical ${make} partnership buy-in, based on ${result.count} comparable active listings`,
      })
    } else {
      rows.push({
        kind: 'positive',
        label: 'Budget comfortably above typical',
        detail: `Above the typical ${make} partnership buy-in, based on ${result.count} comparable active listings — room to negotiate or consider a larger share`,
      })
    }
  }

  // 2. Aircraft preference specificity — a real make/model/category vs. "open to
  // anything". Neutral either way (openness isn't a red flag), but it tells an
  // owner how targeted a match this pilot is looking for.
  const hasPreference = !!(s.preferred_makes?.length || s.preferred_models || s.aircraft_category)
  if (hasPreference) {
    rows.push({
      kind: 'positive',
      label: 'Specific aircraft preference stated',
      detail: 'This pilot named a make, model, or category — easy to judge fit against your listing',
    })
  } else {
    rows.push({
      kind: 'neutral',
      label: 'Open to any aircraft',
      detail: 'No specific make, model, or category stated — ask what would make this pilot a good match',
    })
  }

  // 3. Experience disclosed — total time AND at least one rating, the same
  // qualification numbers an owner needs to judge whether this pilot is a
  // serious, qualified match.
  const hasExperience = s.total_hours != null && (s.ratings_held?.length ?? 0) > 0
  if (hasExperience) {
    rows.push({
      kind: 'positive',
      label: 'Experience disclosed',
      detail: `${s.total_hours} total hours and ratings held are listed — enough to judge qualification`,
    })
  } else {
    rows.push({
      kind: 'neutral',
      label: 'Experience not fully disclosed',
      detail: 'Total flight time or ratings held are missing — ask before offering a share',
    })
  }

  // 4. Cost transparency — how much of this pilot's budget is disclosed, same
  // shape as the aircraft/partnership panels' "Fully priced"/"Partially priced" rows.
  const hasBuyIn = s.max_buy_in != null
  const hasMonthly = s.max_monthly != null
  const hasHourly = s.max_hourly != null
  if (hasBuyIn && hasMonthly && hasHourly) {
    rows.push({
      kind: 'positive',
      label: 'Fully budgeted',
      detail: 'Max buy-in, monthly, and hourly rate are all stated — easy to tell if your terms fit',
    })
  } else if (hasBuyIn && (hasMonthly || hasHourly)) {
    const missing = hasMonthly ? 'max hourly rate' : 'max monthly'
    rows.push({
      kind: 'neutral',
      label: 'Partially budgeted',
      detail: `${missing.charAt(0).toUpperCase() + missing.slice(1)} not stated — ask for the full picture before offering terms`,
    })
  }

  // 5. Days listed — same freshness read the aircraft/partnership panels include,
  // reusing the same created_at-based day math already driving the page's own
  // "Listed N days ago" header line.
  const days = Math.max(0, Math.floor((Date.now() - new Date(s.created_at).getTime()) / DAY_MS))
  if (days >= 90) {
    const months = Math.floor(days / 30)
    rows.push({
      kind: 'neutral',
      label: `Listed ${months} month${months === 1 ? '' : 's'} ago`,
      detail: 'Been looking a while — may be motivated to move quickly on the right listing',
    })
  } else if (days >= 30) {
    const months = Math.floor(days / 30)
    rows.push({
      kind: 'neutral',
      label: `Listed about ${months} month${months === 1 ? '' : 's'} ago`,
      detail: 'Actively looking for a partnership',
    })
  } else {
    rows.push({
      kind: 'neutral',
      label: days === 0 ? 'Listed today' : `Listed ${days} day${days === 1 ? '' : 's'} ago`,
      detail: 'Fresh to the seeking board',
    })
  }

  return rows
}

/**
 * "How this seeker profile stacks up" — synthesis panel for the seeker detail page,
 * mirroring PartnershipDealSignals/DealScorePanel's pattern on the other two listing
 * types. Renders up to five signals: budget vs market, aircraft-preference specificity,
 * experience disclosed, budget transparency, and days listed. Self-suppresses when
 * fewer than 2 signals are actionable.
 */
export default function SeekerDealSignals({
  s,
  budgetCheck = null,
}: {
  s: PartnershipSeeker
  budgetCheck?: { make: string; result: PartnerCompResult } | null
}) {
  const rows = computeSignals(s, budgetCheck)
  if (rows.length < 2) return null

  const favorable = rows.filter((r) => r.kind === 'positive').length
  const watchOuts = rows.filter((r) => r.kind === 'negative').length
  const summary: { text: string; chip: string }[] = []
  if (favorable > 0)
    summary.push({
      text: `${favorable} in this pilot's favor`,
      chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    })
  if (watchOuts > 0)
    summary.push({
      text: `${watchOuts} to ask about`,
      chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    })

  return (
    <div className="ch-panel p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        How this seeker profile stacks up
      </h2>
      {summary.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {summary.map((sm) => (
            <span
              key={sm.text}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ring-1 ${sm.chip}`}
            >
              {sm.text}
            </span>
          ))}
        </div>
      )}
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
        Based on what this pilot has disclosed. Not a verification or financial advice.
      </p>
    </div>
  )
}
