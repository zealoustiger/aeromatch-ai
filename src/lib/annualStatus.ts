/**
 * Annual-inspection status — a proprietary, honesty-gated buyer read on the
 * `annual_due` column.
 *
 * A 14 CFR 91.409 annual inspection is required every 12 calendar months; an
 * out-of-annual aircraft can't fly until a fresh one is signed off (~$2,500+).
 * Listing sites print the raw annual date; we synthesize the *decision* a shopper
 * actually wants — "is a fresh annual an imminent cost on this airplane?"
 *
 * `annual_due` is normalized to a first-of-month ISO date by the spec extractor
 * (`scraper/lib/extract-specs.mjs` → parseAnnualDate), because listings only ever
 * state a month + year. So we reason at MONTH granularity (never a day count) and
 * self-suppress on anything we can't parse to a real year+month — never a
 * fabricated status. A confident-but-wrong number is a loss.
 */

export type AnnualState = 'current' | 'soon' | 'overdue'

export interface AnnualStatusResult {
  /** Friendly month label, e.g. "Nov 2025". */
  dueLabel: string
  /** Signed whole-month delta from `now` to the due month (+future, 0 this month, −past). */
  monthsFromNow: number
  state: AnnualState
  headline: string
  detail: string
}

// Mirrors the annual-inspection assumption in the cost model (calculators.ts).
const ANNUAL_COST_USD = 2500

// Plausibility window. An annual is a 12-month cycle, so a stated due date far
// outside this range almost certainly reflects a mis-parse or a long-stale row —
// asserting a status from it would mislead, so we suppress instead.
const MAX_MONTHS_AHEAD = 15
const MAX_MONTHS_PAST = 36

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Parse a stored `annual_due` value to { year, month(1-12) } or null. */
function parseYearMonth(raw: string): { year: number; month: number } | null {
  // Normalized form is "YYYY-MM-DD"; also accept a bare "YYYY-MM".
  const m = raw.trim().match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (month < 1 || month > 12) return null
  return { year, month }
}

/**
 * Friendly "Mon YYYY" label for a stored annual_due value, for the spec row.
 * Returns the raw string unchanged when it isn't a parseable year+month, so a
 * legacy free-text value still displays as-is (never blanked).
 */
export function formatAnnualDueLabel(raw: string): string {
  const ym = parseYearMonth(raw)
  return ym ? `${MONTH_LABELS[ym.month - 1]} ${ym.year}` : raw
}

export function computeAnnualStatus(
  annualDue: string | null | undefined,
  now: Date,
): AnnualStatusResult | null {
  if (typeof annualDue !== 'string') return null
  const due = parseYearMonth(annualDue)
  if (!due) return null

  const nowYear = now.getUTCFullYear()
  const nowMonth = now.getUTCMonth() + 1 // 1-12
  const monthsFromNow = (due.year - nowYear) * 12 + (due.month - nowMonth)

  // Out of the plausible annual window → suppress (don't assert a stale status).
  if (monthsFromNow > MAX_MONTHS_AHEAD || monthsFromNow < -MAX_MONTHS_PAST) return null

  const dueLabel = `${MONTH_LABELS[due.month - 1]} ${due.year}`
  const money = `~$${ANNUAL_COST_USD.toLocaleString()}`

  let state: AnnualState
  let headline: string
  let detail: string

  if (monthsFromNow >= 2) {
    state = 'current'
    headline = `Annual inspection current through ${dueLabel}`
    detail =
      `The listing states the next annual is due ${dueLabel} — roughly ${monthsFromNow} ` +
      `months of inspection time remaining. Budget ${money} for the annual when it comes due.`
  } else if (monthsFromNow >= 0) {
    state = 'soon'
    const when = monthsFromNow === 0 ? 'this month' : 'next month'
    headline = `Annual inspection due ${when}`
    detail =
      `The listing states the next annual is due ${dueLabel} (${when}) — plan on a fresh ` +
      `annual (${money}) soon after purchase, or ask whether it has already been completed.`
  } else {
    state = 'overdue'
    const ago = Math.abs(monthsFromNow)
    headline = 'Annual inspection may be overdue'
    detail =
      `The listing states the annual was due ${dueLabel}, about ${ago} ` +
      `month${ago === 1 ? '' : 's'} ago — confirm the aircraft has a current annual, and ` +
      `budget ${money} if it still needs one.`
  }

  return { dueLabel, monthsFromNow, state, headline, detail }
}
