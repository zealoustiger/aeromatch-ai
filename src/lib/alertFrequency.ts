/**
 * Per-alert digest cadence (GOAL.md: "digest vs instant options"). The live send
 * path is a single daily cron (`vercel.json`: `0 8 * * *`) gated per-alert by
 * `last_digest_at` — there's no event-driven/real-time trigger, so "instant" isn't
 * a real option today (offering it would be a fabricated capability). Scoped to
 * the two cadences the architecture actually supports: `daily` (send at most once
 * every ~1 day) and `weekly` (send at most once every ~7 days — today's fixed
 * behavior for everyone, still the default).
 *
 * Pure + deterministic: callers pass `nowIso` explicitly (no `Date.now()` inside)
 * so this is testable without the clock — mirrors `priceDrops.ts`.
 */

export type AlertFrequency = 'daily' | 'weekly'

const INTERVAL_DAYS: Record<AlertFrequency, number> = {
  daily: 1,
  weekly: 7,
}

/** Normalizes any stored/fallback value (including an un-migrated `undefined`) to a valid frequency. */
export function normalizeFrequency(value: string | null | undefined): AlertFrequency {
  return value === 'daily' ? 'daily' : 'weekly'
}

export function intervalDaysFor(frequency: AlertFrequency): number {
  return INTERVAL_DAYS[frequency]
}

/**
 * True when an alert with the given `frequency` and `lastDigestAt` (null if
 * never sent) is due for another send as of `nowIso`.
 */
export function isDigestDue(
  lastDigestAt: string | null,
  frequency: AlertFrequency,
  nowIso: string
): boolean {
  if (!lastDigestAt) return true

  const lastMs = new Date(lastDigestAt).getTime()
  const nowMs = new Date(nowIso).getTime()
  if (Number.isNaN(lastMs) || Number.isNaN(nowMs)) return true

  const intervalMs = intervalDaysFor(frequency) * 24 * 60 * 60 * 1000
  return nowMs - lastMs >= intervalMs
}

/**
 * "Last email sent / next check" expectation line for a `/alerts/manage` row
 * (GOAL.md: a subscriber should be able to trust the alert is alive without
 * sending themselves a sample digest). `last_digest_at` is written by the
 * digest cron but was never surfaced anywhere before this.
 */
export function describeLastDigest(lastDigestAt: string | null, frequency: AlertFrequency): string {
  const cadence = `checks ${frequency}`
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
