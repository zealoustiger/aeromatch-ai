/**
 * Per-alert digest cadence (GOAL.md: "digest vs instant options"). The live send
 * path is a single daily cron (`vercel.json`: `0 8 * * *`) gated per-alert by
 * `last_digest_at` — there's no event-driven/real-time trigger, so "instant" isn't
 * a real option today (offering it would be a fabricated capability). Scoped to
 * the three cadences the architecture actually supports: `daily` (send at most
 * once every ~1 day), `weekly` (send at most once every ~7 days — today's fixed
 * behavior for everyone, still the default), and `monthly` (send at most once
 * every ~28 days — an honest low-touch rung for the long-horizon shopper, still
 * just the same daily cron gated by elapsed days, no new infra).
 *
 * Pure + deterministic: callers pass `nowIso` explicitly (no `Date.now()` inside)
 * so this is testable without the clock — mirrors `priceDrops.ts`.
 */

export type AlertFrequency = 'daily' | 'weekly' | 'monthly'

const INTERVAL_DAYS: Record<AlertFrequency, number> = {
  daily: 1,
  weekly: 7,
  monthly: 28,
}

/** Normalizes any stored/fallback value (including an un-migrated `undefined`) to a valid frequency. */
export function normalizeFrequency(value: string | null | undefined): AlertFrequency {
  return value === 'daily' ? 'daily' : value === 'monthly' ? 'monthly' : 'weekly'
}

const DAY_NAMES = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']

/** Normalizes a stored `digest_day` value to a valid 0(Sun)–6(Sat) weekday, or
 *  `null` for "no preference" (unset, unmigrated column, or a garbage value). */
export function normalizeDigestDay(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6 ? value : null
}

export function digestDayName(digestDay: number | null): string | null {
  return digestDay === null ? null : DAY_NAMES[digestDay]
}

export function intervalDaysFor(frequency: AlertFrequency): number {
  return INTERVAL_DAYS[frequency]
}

/**
 * The next lighter (less frequent) rung on the cadence ladder — daily→weekly,
 * weekly→monthly. `monthly` has no lighter rung and maps to itself (callers
 * that want to know whether stepping is possible at all should check
 * `frequency !== 'monthly'` first, same precedent as the single-alert
 * `frequencyUrl` gate in the digest cron). Used by the combined-digest "Get
 * fewer emails" link, which steps every covered alert down from ITS OWN
 * current cadence rather than applying one literal target to all of them —
 * a single combined send can legitimately cover alerts at different
 * cadences.
 */
export function nextLighterFrequency(frequency: AlertFrequency): AlertFrequency {
  return frequency === 'daily' ? 'weekly' : frequency === 'weekly' ? 'monthly' : 'monthly'
}

/** A weekly digest is "busy" enough to honestly suggest daily cadence at this
 *  many total (new-listing + price-drop) matches in one send. */
export const DIGEST_UPGRADE_THRESHOLD = 5

/**
 * True when a digest is worth offering the one-click "switch to daily"
 * upgrade — only for a weekly-cadence alert (a daily one has no faster
 * cadence left) whose send genuinely cleared the volume bar. Never an
 * upsell on a quiet search.
 */
export function shouldOfferDailyUpgrade(frequency: AlertFrequency, totalMatches: number): boolean {
  return frequency === 'weekly' && totalMatches >= DIGEST_UPGRADE_THRESHOLD
}

/**
 * True when an alert with the given `frequency` and `lastDigestAt` (null if
 * never sent) is due for another send as of `nowIso`.
 *
 * `digestDay` (0=Sun..6=Sat) is an optional weekly-only preference — when set,
 * a weekly alert is due only on its chosen UTC weekday (so sends land on the
 * same day every time instead of drifting), gated by a 6-day-elapsed floor so
 * a cron re-run within the same day never double-sends. `null`/`undefined`
 * (no preference, or the column isn't migrated yet) falls back to the plain
 * elapsed-days check — a weekly alert is never silently skipped either way.
 */
export function isDigestDue(
  lastDigestAt: string | null,
  frequency: AlertFrequency,
  nowIso: string,
  digestDay?: number | null
): boolean {
  if (!lastDigestAt) return true

  const lastMs = new Date(lastDigestAt).getTime()
  const nowMs = new Date(nowIso).getTime()
  if (Number.isNaN(lastMs) || Number.isNaN(nowMs)) return true

  const elapsedMs = nowMs - lastMs
  const normalizedDay = normalizeDigestDay(digestDay)
  if (frequency === 'weekly' && normalizedDay !== null) {
    const minElapsedMs = 6 * 24 * 60 * 60 * 1000
    return elapsedMs >= minElapsedMs && new Date(nowIso).getUTCDay() === normalizedDay
  }

  const intervalMs = intervalDaysFor(frequency) * 24 * 60 * 60 * 1000
  return elapsedMs >= intervalMs
}

/**
 * "Last email sent / next check" expectation line for a `/alerts/manage` row
 * (GOAL.md: a subscriber should be able to trust the alert is alive without
 * sending themselves a sample digest). `last_digest_at` is written by the
 * digest cron but was never surfaced anywhere before this.
 */
export function describeLastDigest(
  lastDigestAt: string | null,
  frequency: AlertFrequency,
  digestDay?: number | null
): string {
  const dayName = frequency === 'weekly' ? digestDayName(normalizeDigestDay(digestDay)) : null
  const cadence = dayName ? `checks weekly, ${dayName}` : `checks ${frequency}`
  if (!lastDigestAt) return `Nothing sent yet — ${cadence}`

  const sentDate = new Date(lastDigestAt)
  if (Number.isNaN(sentDate.getTime())) return `Nothing sent yet — ${cadence}`

  // Pinned to UTC (not host/server local time) since `last_digest_at` is a UTC
  // timestamptz and there's no per-subscriber timezone to render it in —
  // matters here because this must stay deterministic in tests regardless of
  // the machine's TZ.
  const formatted = sentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `Last email ${formatted} · ${cadence}`
}
