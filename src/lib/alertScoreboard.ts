import { createAdminClient } from './supabase-admin'
import { classifySourcePath } from './alertSourceFamily'
import { buildWeeklyTrend, type WeeklyTrendPoint } from './alertWeeklyTrend'

// The `alerts` table carries two live-subscriber vocabularies: newer opt-in
// paths land on `confirmed` (+ `confirmed_at`), while older/direct rows use
// `active`. Both mean "an opted-in subscriber who should receive digests", so
// the scoreboard counts them together as "live" — counting only one would show
// a misleading zero when the DB holds real subscribers under the other label.
const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  confirmed: 'Confirmed',
  pending: 'Pending confirmation',
  paused: 'Paused',
  bounced: 'Bounced',
  unsubscribed: 'Unsubscribed',
}

const LIVE_STATUSES = new Set(['active', 'confirmed'])

// The date `alert-source-column` shipped — rows from before this never got a
// `source` tag at all (not a graceful-degrade gap, the column didn't exist).
const UNTAGGED_BUCKET = '(untagged, pre-2026-07-14)'

// Below this many live+pending rows, a confirm-rate percentage is more noise
// than signal (a single pending row reads as "0% confirm rate"). Mirrors the
// `MIN_ALERTS_TO_SHOW`/`MIN_SAVES_TO_SHOW` honesty-floor precedent elsewhere.
const MIN_PLACEMENT_VOLUME_FOR_RATE = 5

export interface AlertStatusCount {
  status: string
  label: string
  count: number
}

export interface AlertPageFamilyCount {
  family: string
  count: number
}

export interface AlertSourceCount {
  source: string
  liveCount: number
  pendingCount: number
  confirmRate: number | null
}

export interface AlertScoreboardSnapshot {
  statusCounts: AlertStatusCount[]
  total: number
  liveTotal: number
  newThisWeek: number
  newLastWeek: number
  topPageFamilies: AlertPageFamilyCount[]
  topSources: AlertSourceCount[]
  sourceColumnMigrated: boolean
  weeklyTrend: WeeklyTrendPoint[]
  computedAt: string
}

export type { WeeklyTrendPoint }

export interface RecentDigestVote {
  vote: 'up' | 'down'
  pagePath: string | null
  createdAt: string
}

export interface DigestVoteRollup {
  upTotal: number
  downTotal: number
  upThisWeek: number
  downThisWeek: number
  upLastWeek: number
  downLastWeek: number
  recentVotes: RecentDigestVote[]
}

export interface NotRelevantListing {
  pagePath: string | null
  title: string
  count: number
}

export interface NotRelevantListingsRollup {
  topThisWeek: NotRelevantListing[]
  totalThisWeek: number
}

export interface InstantInterestRollup {
  thisWeek: number
  allTime: number
}

export async function getAlertScoreboard(): Promise<AlertScoreboardSnapshot> {
  const admin = createAdminClient()
  let sourceColumnMigrated = true
  let { data, error } = await admin
    .from('alerts')
    .select('status, source_path, confirmed_at, created_at, source')
  if (error?.message?.includes('source')) {
    sourceColumnMigrated = false
    ;({ data } = await admin.from('alerts').select('status, source_path, confirmed_at, created_at'))
  }
  const rows = data ?? []

  const statusOrder = ['active', 'confirmed', 'pending', 'paused', 'bounced', 'unsubscribed']
  const counts = new Map<string, number>()
  for (const row of rows) {
    const status = row.status || 'unknown'
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  const knownStatuses = new Set(statusOrder)
  const statusCounts: AlertStatusCount[] = [
    ...statusOrder.map((status) => ({
      status,
      label: STATUS_LABELS[status] ?? status,
      count: counts.get(status) ?? 0,
    })),
    ...[...counts.entries()]
      .filter(([status]) => !knownStatuses.has(status))
      .map(([status, count]) => ({ status, label: status, count })),
  ]

  const total = rows.length

  const now = Date.now()
  const DAY_MS = 86_400_000
  const oneWeekAgo = now - 7 * DAY_MS
  const twoWeeksAgo = now - 14 * DAY_MS

  let liveTotal = 0
  let newThisWeek = 0
  let newLastWeek = 0
  const familyCounts = new Map<string, number>()
  const sourceLiveCounts = new Map<string, number>()
  const sourcePendingCounts = new Map<string, number>()

  for (const row of rows) {
    const source = (sourceColumnMigrated ? (row as { source?: string | null }).source : null) || UNTAGGED_BUCKET

    if (row.status === 'pending') {
      sourcePendingCounts.set(source, (sourcePendingCounts.get(source) ?? 0) + 1)
    }

    if (!LIVE_STATUSES.has(row.status)) continue
    liveTotal++
    sourceLiveCounts.set(source, (sourceLiveCounts.get(source) ?? 0) + 1)
    const family = classifySourcePath(row.source_path)
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1)

    // `confirmed_at` is set by the double-opt-in path; direct/legacy `active`
    // rows may only have `created_at` — fall back so their sign-up week counts.
    const subscribedAt = new Date(row.confirmed_at ?? row.created_at).getTime()
    if (Number.isNaN(subscribedAt)) continue
    if (subscribedAt >= oneWeekAgo) newThisWeek++
    else if (subscribedAt >= twoWeeksAgo) newLastWeek++
  }

  const topPageFamilies = [...familyCounts.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const allSources = new Set([...sourceLiveCounts.keys(), ...sourcePendingCounts.keys()])
  const topSources: AlertSourceCount[] = [...allSources]
    .map((source) => {
      const liveCount = sourceLiveCounts.get(source) ?? 0
      const pendingCount = sourcePendingCounts.get(source) ?? 0
      const volume = liveCount + pendingCount
      return {
        source,
        liveCount,
        pendingCount,
        confirmRate: volume >= MIN_PLACEMENT_VOLUME_FOR_RATE ? liveCount / volume : null,
      }
    })
    .sort((a, b) => b.liveCount - a.liveCount)
    .slice(0, 12)

  const weeklyTrend = buildWeeklyTrend(rows, now)

  return {
    statusCounts,
    total,
    liveTotal,
    newThisWeek,
    newLastWeek,
    topPageFamilies,
    topSources,
    sourceColumnMigrated,
    weeklyTrend,
    computedAt: new Date().toISOString(),
  }
}

const RECENT_VOTES_LIMIT = 6

// `digest-feedback-vote` writes the direction into `message` (no separate
// column) — classify by the emoji prefix rather than adding a new column for
// a value we can already derive.
function classifyVote(message: string | null): 'up' | 'down' | null {
  if (!message) return null
  if (message.startsWith('👍')) return 'up'
  if (message.startsWith('👎')) return 'down'
  return null
}

export async function getDigestVoteRollup(now: number = Date.now()): Promise<DigestVoteRollup> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('feedback')
    .select('message, page_path, created_at')
    .eq('type', 'digest_vote')
    .order('created_at', { ascending: false })
    .limit(500)

  const rows = data ?? []

  const DAY_MS = 86_400_000
  const oneWeekAgo = now - 7 * DAY_MS
  const twoWeeksAgo = now - 14 * DAY_MS

  let upTotal = 0
  let downTotal = 0
  let upThisWeek = 0
  let downThisWeek = 0
  let upLastWeek = 0
  let downLastWeek = 0
  const recentVotes: RecentDigestVote[] = []

  for (const row of rows) {
    const vote = classifyVote(row.message)
    if (!vote) continue

    if (vote === 'up') upTotal++
    else downTotal++

    if (recentVotes.length < RECENT_VOTES_LIMIT) {
      recentVotes.push({ vote, pagePath: row.page_path ?? null, createdAt: row.created_at })
    }

    const votedAt = new Date(row.created_at).getTime()
    if (Number.isNaN(votedAt)) continue
    if (votedAt >= oneWeekAgo) {
      if (vote === 'up') upThisWeek++
      else downThisWeek++
    } else if (votedAt >= twoWeeksAgo) {
      if (vote === 'up') upLastWeek++
      else downLastWeek++
    }
  }

  return { upTotal, downTotal, upThisWeek, downThisWeek, upLastWeek, downLastWeek, recentVotes }
}

// The per-sample "Not relevant?" tap in a digest email writes a
// `digest_listing_vote` feedback row (see api/alerts/digest-feedback/route.ts):
// `message='Not relevant: <title>'`, `page_path=<listing path>`. Batch #6 shipped
// that capture but explicitly deferred reading it — this rolls the last 7 days up
// by `page_path` so the human can finally see which listings subscribers keep
// flagging as off-target. Real counts only; the title is derived from the stored
// message, never fabricated.
const NOT_RELEVANT_PREFIX = 'Not relevant: '
const TOP_NOT_RELEVANT_LIMIT = 5

export async function getNotRelevantListingsRollup(
  now: number = Date.now()
): Promise<NotRelevantListingsRollup> {
  const admin = createAdminClient()
  const DAY_MS = 86_400_000
  const oneWeekAgoIso = new Date(now - 7 * DAY_MS).toISOString()
  const { data } = await admin
    .from('feedback')
    .select('message, page_path, created_at')
    .eq('type', 'digest_listing_vote')
    .gte('created_at', oneWeekAgoIso)
    .order('created_at', { ascending: false })
    .limit(500)

  const rows = data ?? []

  // Group by page_path. Rows arrive newest-first, so the first title seen per
  // path is the most recent — keep that one.
  const UNKNOWN_KEY = '(unknown listing)'
  const byPath = new Map<string, { title: string; count: number }>()
  for (const row of rows) {
    const key = row.page_path ?? UNKNOWN_KEY
    const rawTitle =
      row.message && row.message.startsWith(NOT_RELEVANT_PREFIX)
        ? row.message.slice(NOT_RELEVANT_PREFIX.length).trim()
        : ''
    const existing = byPath.get(key)
    if (existing) existing.count++
    else byPath.set(key, { title: rawTitle || 'this listing', count: 1 })
  }

  const topThisWeek: NotRelevantListing[] = [...byPath.entries()]
    .map(([key, v]) => ({
      pagePath: key === UNKNOWN_KEY ? null : key,
      title: v.title,
      count: v.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_NOT_RELEVANT_LIMIT)

  return { topThisWeek, totalThisWeek: rows.length }
}

// The "I'd want instant alerts" tap (recordInstantAlertInterest in actions.ts)
// writes an `instant_alert_interest` feedback row — the demand signal for the
// blocked Vercel-cron-tier decision on real instant sends. Real this-week +
// all-time tap counts only, never a guessed number.
export async function getInstantInterestRollup(
  now: number = Date.now()
): Promise<InstantInterestRollup> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('feedback')
    .select('created_at')
    .eq('type', 'instant_alert_interest')
    .limit(2000)

  const rows = data ?? []
  const oneWeekAgo = now - 7 * 86_400_000
  let thisWeek = 0
  for (const row of rows) {
    const at = new Date(row.created_at).getTime()
    if (!Number.isNaN(at) && at >= oneWeekAgo) thisWeek++
  }
  return { thisWeek, allTime: rows.length }
}
