import { createAdminClient } from './supabase-admin'
import { getDigestVoteRollup } from './alertScoreboard'

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
  /** Real week-over-week unsubscribe/paused/bounced counts, bucketed off
   *  `unsubscribed_at`/`paused_at`/`bounced_at` — only meaningful when the
   *  matching `*AtMigrated` flag (see below) is true. */
  unsubscribedThisWeek: number
  unsubscribedLastWeek: number
  pausedThisWeek: number
  pausedLastWeek: number
  bouncedThisWeek: number
  bouncedLastWeek: number
  /** Current point-in-time totals, NOT week-over-week — always accurate
   *  regardless of migration status (a plain `status` count). */
  liveTotal: number
  pendingTotal: number
  pausedTotal: number
  unsubscribedTotal: number
  bouncedTotal: number
  topSourcesThisWeek: AlertFunnelSourceRow[]
  /** The one direct quality signal subscribers send back — 👍/👎 on the
   *  digest email itself, from the `feedback` table (`type='digest_vote'`,
   *  see `getDigestVoteRollup`). Real counts, not a rate — too low-volume
   *  for a % to be honest yet. */
  digestVotesUpThisWeek: number
  digestVotesDownThisWeek: number
  digestVotesUpLastWeek: number
  digestVotesDownLastWeek: number
  digestVotesUpTotal: number
  digestVotesDownTotal: number
  sourceColumnMigrated: boolean
  /** False until the matching `alerts.*_at` migration is applied live — see
   *  supabase/schema.sql's `alerts_unsubscribed_at` / `alerts_paused_bounced_at`
   *  blocks. While false, that status's WoW fields above are always 0 (never
   *  fabricated). */
  unsubscribedAtMigrated: boolean
  pausedAtMigrated: boolean
  bouncedAtMigrated: boolean
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
  const voteRollupPromise = getDigestVoteRollup(now)
  // `source`, `unsubscribed_at`, `paused_at`, and `bounced_at` may
  // independently be un-migrated live — retry dropping whichever one the
  // error names, up to once each (order-independent), same graceful-fallback
  // pattern as alertsForOwner.ts's OPTIONAL_COLS loop.
  const baseCols = ['status', 'created_at', 'confirmed_at']
  const optionalCols = ['source', 'unsubscribed_at', 'paused_at', 'bounced_at']
  let cols = [...baseCols, ...optionalCols]
  let { data, error } = await admin.from('alerts').select(cols.join(', '))
  for (
    let i = 0;
    i < optionalCols.length && error && optionalCols.some((c) => cols.includes(c) && error!.message?.includes(c));
    i++
  ) {
    cols = cols.filter((c) => !error!.message.includes(c))
    ;({ data, error } = await admin.from('alerts').select(cols.join(', ')))
  }
  const sourceColumnMigrated = cols.includes('source')
  const unsubscribedAtMigrated = cols.includes('unsubscribed_at')
  const pausedAtMigrated = cols.includes('paused_at')
  const bouncedAtMigrated = cols.includes('bounced_at')
  const rows = (data ?? []) as unknown as {
    status: string | null
    source?: string | null
    created_at: string | null
    confirmed_at: string | null
    unsubscribed_at?: string | null
    paused_at?: string | null
    bounced_at?: string | null
  }[]

  const oneWeekAgo = now - 7 * DAY_MS
  const twoWeeksAgo = now - 14 * DAY_MS

  let createdThisWeek = 0
  let createdLastWeek = 0
  let confirmedThisWeek = 0
  let confirmedLastWeek = 0
  let unsubscribedThisWeek = 0
  let unsubscribedLastWeek = 0
  let pausedThisWeek = 0
  let pausedLastWeek = 0
  let bouncedThisWeek = 0
  let bouncedLastWeek = 0
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

    if (unsubscribedAtMigrated) {
      const unsubscribedAt = row.unsubscribed_at ? new Date(row.unsubscribed_at).getTime() : NaN
      if (!Number.isNaN(unsubscribedAt)) {
        if (unsubscribedAt >= oneWeekAgo) unsubscribedThisWeek++
        else if (unsubscribedAt >= twoWeeksAgo) unsubscribedLastWeek++
      }
    }

    if (pausedAtMigrated) {
      const pausedAt = row.paused_at ? new Date(row.paused_at).getTime() : NaN
      if (!Number.isNaN(pausedAt)) {
        if (pausedAt >= oneWeekAgo) pausedThisWeek++
        else if (pausedAt >= twoWeeksAgo) pausedLastWeek++
      }
    }

    if (bouncedAtMigrated) {
      const bouncedAt = row.bounced_at ? new Date(row.bounced_at).getTime() : NaN
      if (!Number.isNaN(bouncedAt)) {
        if (bouncedAt >= oneWeekAgo) bouncedThisWeek++
        else if (bouncedAt >= twoWeeksAgo) bouncedLastWeek++
      }
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

  const voteRollup = await voteRollupPromise

  return {
    weekStart: new Date(oneWeekAgo).toISOString(),
    weekEnd: new Date(now).toISOString(),
    createdThisWeek,
    createdLastWeek,
    confirmedThisWeek,
    confirmedLastWeek,
    unsubscribedThisWeek,
    unsubscribedLastWeek,
    pausedThisWeek,
    pausedLastWeek,
    bouncedThisWeek,
    bouncedLastWeek,
    liveTotal,
    pendingTotal,
    pausedTotal,
    unsubscribedTotal,
    bouncedTotal,
    topSourcesThisWeek,
    digestVotesUpThisWeek: voteRollup.upThisWeek,
    digestVotesDownThisWeek: voteRollup.downThisWeek,
    digestVotesUpLastWeek: voteRollup.upLastWeek,
    digestVotesDownLastWeek: voteRollup.downLastWeek,
    digestVotesUpTotal: voteRollup.upTotal,
    digestVotesDownTotal: voteRollup.downTotal,
    sourceColumnMigrated,
    unsubscribedAtMigrated,
    pausedAtMigrated,
    bouncedAtMigrated,
    computedAt: new Date(now).toISOString(),
  }
}
