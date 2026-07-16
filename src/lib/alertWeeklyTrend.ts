/**
 * Buckets alert rows into an 8-week subscribed/confirmed trend for the
 * `/admin/alerts` scoreboard (GOAL.md: judge conversions week-over-week, not
 * just this-week-vs-last-week). Standalone pure module (no DB import) so it
 * stays unit-testable, same precedent as alertSourceFamily.ts / alertFrequency.ts.
 *
 * Deliberately does NOT trend unsubscribes: the `alerts` table has no
 * `unsubscribed_at` column (only a `status` flip, no timestamp of when), so
 * there's no honest per-week bucket for it — fabricating one from another
 * column would violate GOAL.md's honesty rule.
 */

export interface WeeklyTrendPoint {
  weekLabel: string
  subscribedCount: number
  confirmedCount: number
}

const TREND_WEEKS = 8

export function buildWeeklyTrend(
  rows: Array<{ created_at: string | null | undefined; confirmed_at: string | null | undefined }>,
  now: number,
  weeks = TREND_WEEKS,
): WeeklyTrendPoint[] {
  const DAY_MS = 86_400_000
  const WEEK_MS = 7 * DAY_MS
  const buckets = Array.from({ length: weeks }, () => ({ subscribed: 0, confirmed: 0 }))

  const bucketFor = (iso: string | null | undefined): number | null => {
    if (!iso) return null
    const at = new Date(iso).getTime()
    if (Number.isNaN(at)) return null
    const weeksAgo = Math.floor((now - at) / WEEK_MS)
    if (weeksAgo < 0 || weeksAgo >= weeks) return null
    return weeks - 1 - weeksAgo
  }

  for (const row of rows) {
    const subscribedIdx = bucketFor(row.created_at)
    if (subscribedIdx !== null) buckets[subscribedIdx].subscribed++
    const confirmedIdx = bucketFor(row.confirmed_at)
    if (confirmedIdx !== null) buckets[confirmedIdx].confirmed++
  }

  return buckets.map((bucket, i) => {
    const weeksAgo = weeks - 1 - i
    const weekStart = new Date(now - (weeksAgo + 1) * WEEK_MS)
    return {
      weekLabel: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      subscribedCount: bucket.subscribed,
      confirmedCount: bucket.confirmed,
    }
  })
}
