import { createAdminClient } from './supabase-admin'

// The date `alert-source-column` shipped — rows from before this never got a
// `source` tag at all. Same fallback label `alertScoreboard.ts` uses.
const UNTAGGED_SOURCE = '(untagged)'

const TOP_SOURCES_LIMIT = 5

export interface AlertFunnelSourceRow {
  source: string
  createdThisWeek: number
  createdLastWeek: number
}

export interface AlertFunnelWeeklySnapshot {
  weekStart: string
  weekEnd: string
  createdThisWeek: number
  createdLastWeek: number
  confirmedThisWeek: number
  confirmedLastWeek: number
  /** Current point-in-time totals, NOT week-over-week — the `alerts` table has
   *  no `unsubscribed_at`/`paused_at` timestamp, so an honest weekly delta for
   *  these statuses can't be computed from what's stored today. */
  liveTotal: number
  pendingTotal: number
  pausedTotal: number
  unsubscribedTotal: number
  bouncedTotal: number
  topSourcesThisWeek: AlertFunnelSourceRow[]
  sourceColumnMigrated: boolean
  computedAt: string
}

const DAY_MS = 86_400_000
const LIVE_STATUSES = new Set(['active', 'confirmed'])

/**
 * Week-over-week alert funnel counts for the Monday admin summary email
 * (GOAL.md: "judge alerts week-over-week"). Reads straight from the `alerts`
 * table via the admin client — DB-derived, not PostHog, same "prove it
 * converts" honesty bar as `alertScoreboard.ts` (which this module is a
 * sibling of, not a replacement for: that one drives the always-on
 * `/admin/alerts` page; this one is scoped to the weekly created/confirmed
 * WoW numbers + a per-source breakdown for the email).
 */
export async function getAlertFunnelWeeklySnapshot(now: number = Date.now()): Promise<AlertFunnelWeeklySnapshot> {
  const admin = createAdminClient()
  let sourceColumnMigrated = true
  let { data, error } = await admin.from('alerts').select('status, source, created_at, confirmed_at')
  if (error?.message?.includes('source')) {
    sourceColumnMigrated = false
    ;({ data, error } = await admin.from('alerts').select('status, created_at, confirmed_at'))
  }
  const rows = (data ?? []) as { status: string | null; source?: string | null; created_at: string | null; confirmed_at: string | null }[]

  const oneWeekAgo = now - 7 * DAY_MS
  const twoWeeksAgo = now - 14 * DAY_MS

  let createdThisWeek = 0
  let createdLastWeek = 0
  let confirmedThisWeek = 0
  let confirmedLastWeek = 0
  let liveTotal = 0
  let pendingTotal = 0
  let pausedTotal = 0
  let unsubscribedTotal = 0
  let bouncedTotal = 0

  const sourceThisWeek = new Map<string, number>()
  const sourceLastWeek = new Map<string, number>()

  for (const row of rows) {
    const status = row.status || 'unknown'
    if (LIVE_STATUSES.has(status)) liveTotal++
    else if (status === 'pending') pendingTotal++
    else if (status === 'paused') pausedTotal++
    else if (status === 'unsubscribed') unsubscribedTotal++
    else if (status === 'bounced') bouncedTotal++

    const source = (sourceColumnMigrated ? row.source : null) || UNTAGGED_SOURCE

    const createdAt = row.created_at ? new Date(row.created_at).getTime() : NaN
    if (!Number.isNaN(createdAt)) {
      if (createdAt >= oneWeekAgo) {
        createdThisWeek++
        sourceThisWeek.set(source, (sourceThisWeek.get(source) ?? 0) + 1)
      } else if (createdAt >= twoWeeksAgo) {
        createdLastWeek++
        sourceLastWeek.set(source, (sourceLastWeek.get(source) ?? 0) + 1)
      }
    }

    const confirmedAt = row.confirmed_at ? new Date(row.confirmed_at).getTime() : NaN
    if (!Number.isNaN(confirmedAt)) {
      if (confirmedAt >= oneWeekAgo) confirmedThisWeek++
      else if (confirmedAt >= twoWeeksAgo) confirmedLastWeek++
    }
  }

  const topSourcesThisWeek: AlertFunnelSourceRow[] = [...sourceThisWeek.entries()]
    .map(([source, createdThisWeekCount]) => ({
      source,
      createdThisWeek: createdThisWeekCount,
      createdLastWeek: sourceLastWeek.get(source) ?? 0,
    }))
    .sort((a, b) => b.createdThisWeek - a.createdThisWeek)
    .slice(0, TOP_SOURCES_LIMIT)

  return {
    weekStart: new Date(oneWeekAgo).toISOString(),
    weekEnd: new Date(now).toISOString(),
    createdThisWeek,
    createdLastWeek,
    confirmedThisWeek,
    confirmedLastWeek,
    liveTotal,
    pendingTotal,
    pausedTotal,
    unsubscribedTotal,
    bouncedTotal,
    topSourcesThisWeek,
    sourceColumnMigrated,
    computedAt: new Date(now).toISOString(),
  }
}
