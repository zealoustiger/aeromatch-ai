import { createAdminClient } from './supabase-admin'
import { classifySourcePath } from './alertSourceFamily'

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
  computedAt: string
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

  return {
    statusCounts,
    total,
    liveTotal,
    newThisWeek,
    newLastWeek,
    topPageFamilies,
    topSources,
    sourceColumnMigrated,
    computedAt: new Date().toISOString(),
  }
}
