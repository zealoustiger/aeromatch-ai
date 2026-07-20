import { createAdminClient } from './supabase-admin'
import {
  getDigestVoteRollup,
  getNotRelevantListingsRollup,
  getInstantInterestRollup,
  getUnsubscribeReasonRollup,
  getRepermissionRollup,
  type NotRelevantListing,
} from './alertScoreboard'
import { getEmailEngagementWeeklyRollup } from './emailEngagement'
import { getAlertMatchCount } from './alertMatchCounts'
import { describeLocalAlertContext } from './alertEditCriteria'
import { getCronRunsSince } from './alertCronHealth'
import type { UnsubscribeReasonRow } from './alertUnsubscribeReasons'

// The date `alert-source-column` shipped — rows from before this never got a
// `source` tag at all. Same fallback label `alertScoreboard.ts` uses.
const UNTAGGED_SOURCE = '(untagged)'

const TOP_SOURCES_LIMIT = 5

// Bounds how many distinct `source_path`s get a live `getAlertMatchCount`
// check per run — the highest-subscriber searches are the ones worth
// chasing inventory for, and this keeps the query volume predictable
// regardless of how many distinct alert searches exist.
const DEMAND_GAP_CHECK_LIMIT = 10

export interface AlertFunnelSourceRow {
  source: string
  createdThisWeek: number
  createdLastWeek: number
}

export interface DemandGapRow {
  sourcePath: string
  label: string
  subscriberCount: number
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
  /** Week-over-week Resend `email.opened`/`email.clicked` webhook counts,
   *  aggregated across all email types — the "does anyone actually read
   *  these" signal `getEmailEngagementRollup` (all-time, per-type) doesn't
   *  answer on its own. Same honest-zero convention: all-zero means either
   *  nothing recorded yet or the `email_engagement_events` table isn't
   *  migrated live, never a fabricated count. */
  emailOpenedThisWeek: number
  emailOpenedLastWeek: number
  emailClickedThisWeek: number
  emailClickedLastWeek: number
  emailOpenedTotal: number
  emailClickedTotal: number
  /** The two "deaf" digest feedback loops batch #6 shipped capture for but
   *  never surfaced: per-listing "Not relevant?" taps
   *  (`feedback.type='digest_listing_vote'`) rolled up by listing over the last
   *  7 days (top by count, with the stored title — never fabricated), and the
   *  "I'd want instant alerts" tap (`instant_alert_interest`) as real this-week
   *  + all-time counts. Empty array / 0s mean genuinely none recorded yet, not a
   *  guessed value. Both read the existing `feedback` table — no new capture
   *  point, no schema change. */
  notRelevantListings: NotRelevantListing[]
  notRelevantTotalThisWeek: number
  instantInterestThisWeek: number
  instantInterestAllTime: number
  /** Top confirmed/live alert searches that currently have ZERO matching
   *  listings — a free inventory-acquisition signal ("N subscribers waiting,
   *  nothing to show them"). Computed by live-verifying the top
   *  `DEMAND_GAP_CHECK_LIMIT` highest-subscriber `source_path`s via
   *  `getAlertMatchCount`; a path that fails to parse or errors is silently
   *  excluded, never guessed at. An empty array can mean either no confirmed
   *  alerts exist yet or every checked search has live matches — the caller
   *  distinguishes those two using `liveTotal`, never a single fabricated
   *  blank state for both. */
  demandWithNoSupply: DemandGapRow[]
  sourceColumnMigrated: boolean
  /** False until the matching `alerts.*_at` migration is applied live — see
   *  supabase/schema.sql's `alerts_unsubscribed_at` / `alerts_paused_bounced_at`
   *  blocks. While false, that status's WoW fields above are always 0 (never
   *  fabricated). */
  unsubscribedAtMigrated: boolean
  pausedAtMigrated: boolean
  bouncedAtMigrated: boolean
  /** Digest-cron reliability, from `alert_cron_runs` (`alertCronHealth.ts`) — lets the
   *  human tell a genuinely quiet week apart from a silently broken cron. Distinct UTC
   *  calendar days with at least one logged run this week (out of 7, cron runs daily),
   *  total emails sent this week vs. last week, and this week's average run duration.
   *  `cronRunsRecorded` is false when zero rows exist at all in the last 14 days —
   *  either the table isn't migrated live yet or the cron simply hasn't logged a run,
   *  same ambiguity `/admin/alerts`'s existing "Last run" panel already lives with;
   *  every numeric field is an honest 0/null in that case, never fabricated. */
  cronRunDaysThisWeek: number
  cronRunsThisWeek: number
  cronRunsLastWeek: number
  cronEmailsSentThisWeek: number
  cronEmailsSentLastWeek: number
  cronAvgDurationMsThisWeek: number | null
  cronRunsRecorded: boolean
  /** Real email-send failures across this week's logged runs (never `null`/fabricated —
   *  `alertCronHealth.ts` reads `send_failures` as `null` per-row when unmigrated, and a
   *  `null` row contributes 0 here, same as a genuinely-zero-failure row; `cronRunsRecorded`
   *  already disambiguates "no data" from "zero" for this whole panel). */
  cronSendFailuresThisWeek: number
  /** "Why people unsubscribe" — the tapped reason chips on `/alerts/status`,
   *  persisted via recordUnsubscribeReasonByToken (see UnsubscribeRecover.tsx).
   *  Empty array means genuinely no reasons recorded yet OR the column isn't
   *  migrated live — `unsubscribeReasonColumnMigrated` disambiguates the two,
   *  same honest-empty-state convention as the other rollups above. */
  unsubscribeReasons: UnsubscribeReasonRow[]
  unsubscribeReasonColumnMigrated: boolean
  /** The `alert-dormant-repermission` "still want these?" email — sent once per
   *  alert (stamped `repermission_sent_at`, ⚠️ human-apply, unmigrated live as of
   *  this writing) to a subscriber who's gone quiet. Counts are real sends, never
   *  fabricated; `repermissionSentAtMigrated` disambiguates "column not live yet"
   *  from "genuinely zero sent" the same way every other `alerts.*_at` field
   *  above does. The three status-breakdown counts answer "did it work?" using
   *  ONLY the current `status` of every alert that ever got one. `frequency_changed_at`
   *  (see `frequencyChangedAtMigrated` below) now separately covers the cadence-downshift
   *  breakdown: `repermissionDowngradedCadenceCount` counts only alerts whose
   *  `frequency_changed_at` is a real timestamp that postdates their own
   *  `repermission_sent_at` — genuine attribution, never a guess. */
  repermissionSentThisWeek: number
  repermissionSentLastWeek: number
  repermissionSentAllTime: number
  repermissionUnsubscribedCount: number
  repermissionPausedCount: number
  repermissionStillLiveCount: number
  repermissionSentAtMigrated: boolean
  /** Count of `repermission_sent_at` alerts whose `frequency_changed_at` postdates that
   *  send — i.e. the subscriber downshifted cadence (rather than unsubscribing/pausing)
   *  after the "still want these?" email. Always 0 when `frequencyChangedAtMigrated` is
   *  false — never fabricated from a column that isn't live yet. */
  repermissionDowngradedCadenceCount: number
  frequencyChangedAtMigrated: boolean
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
  const emailEngagementPromise = getEmailEngagementWeeklyRollup(now)
  const notRelevantPromise = getNotRelevantListingsRollup(now)
  const instantInterestPromise = getInstantInterestRollup(now)
  const unsubscribeReasonsPromise = getUnsubscribeReasonRollup(now)
  const repermissionRollupPromise = getRepermissionRollup(now)
  const cronRunsPromise = getCronRunsSince(now - 14 * DAY_MS)
  // `source`, `unsubscribed_at`, `paused_at`, and `bounced_at` may
  // independently be un-migrated live — retry dropping whichever one the
  // error names, up to once each (order-independent), same graceful-fallback
  // pattern as alertsForOwner.ts's OPTIONAL_COLS loop.
  const baseCols = ['status', 'created_at', 'confirmed_at', 'source_path']
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
    source_path: string | null
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
  const sourcePathSubscribers = new Map<string, number>()

  for (const row of rows) {
    const status = row.status || 'unknown'
    if (LIVE_STATUSES.has(status)) {
      liveTotal++
      if (row.source_path) {
        sourcePathSubscribers.set(row.source_path, (sourcePathSubscribers.get(row.source_path) ?? 0) + 1)
      }
    } else if (status === 'pending') pendingTotal++
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

  const topSourcePaths = [...sourcePathSubscribers.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, DEMAND_GAP_CHECK_LIMIT)
  const demandGapChecks = await Promise.all(
    topSourcePaths.map(async ([sourcePath, subscriberCount]) => {
      const match = await getAlertMatchCount(sourcePath)
      if (!match || match.count > 0) return null
      return {
        sourcePath,
        label: describeLocalAlertContext(sourcePath) ?? sourcePath,
        subscriberCount,
      }
    })
  )
  const demandWithNoSupply: DemandGapRow[] = demandGapChecks.filter((row): row is DemandGapRow => row !== null)

  const voteRollup = await voteRollupPromise
  const emailEngagement = await emailEngagementPromise
  const notRelevant = await notRelevantPromise
  const instantInterest = await instantInterestPromise
  const unsubscribeReasons = await unsubscribeReasonsPromise
  const repermissionRollup = await repermissionRollupPromise
  const cronRuns = await cronRunsPromise

  const cronRunsThisWeekList = cronRuns.filter((r) => new Date(r.createdAt).getTime() >= oneWeekAgo)
  const cronRunsLastWeekList = cronRuns.filter((r) => {
    const t = new Date(r.createdAt).getTime()
    return t >= twoWeeksAgo && t < oneWeekAgo
  })
  const cronRunDaysThisWeek = new Set(
    cronRunsThisWeekList.map((r) => new Date(r.createdAt).toISOString().slice(0, 10))
  ).size
  const cronEmailsSentThisWeek = cronRunsThisWeekList.reduce((sum, r) => sum + r.emailsSent, 0)
  const cronEmailsSentLastWeek = cronRunsLastWeekList.reduce((sum, r) => sum + r.emailsSent, 0)
  const cronSendFailuresThisWeek = cronRunsThisWeekList.reduce((sum, r) => sum + (r.sendFailures ?? 0), 0)
  const cronAvgDurationMsThisWeek = cronRunsThisWeekList.length
    ? Math.round(cronRunsThisWeekList.reduce((sum, r) => sum + r.durationMs, 0) / cronRunsThisWeekList.length)
    : null

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
    emailOpenedThisWeek: emailEngagement.openedThisWeek,
    emailOpenedLastWeek: emailEngagement.openedLastWeek,
    emailClickedThisWeek: emailEngagement.clickedThisWeek,
    emailClickedLastWeek: emailEngagement.clickedLastWeek,
    emailOpenedTotal: emailEngagement.openedTotal,
    emailClickedTotal: emailEngagement.clickedTotal,
    notRelevantListings: notRelevant.topThisWeek,
    notRelevantTotalThisWeek: notRelevant.totalThisWeek,
    instantInterestThisWeek: instantInterest.thisWeek,
    instantInterestAllTime: instantInterest.allTime,
    demandWithNoSupply,
    sourceColumnMigrated,
    unsubscribedAtMigrated,
    pausedAtMigrated,
    bouncedAtMigrated,
    cronRunDaysThisWeek,
    cronRunsThisWeek: cronRunsThisWeekList.length,
    cronRunsLastWeek: cronRunsLastWeekList.length,
    cronEmailsSentThisWeek,
    cronEmailsSentLastWeek,
    cronAvgDurationMsThisWeek,
    cronRunsRecorded: cronRuns.length > 0,
    cronSendFailuresThisWeek,
    unsubscribeReasons: unsubscribeReasons.topReasons,
    unsubscribeReasonColumnMigrated: unsubscribeReasons.reasonColumnMigrated,
    repermissionSentThisWeek: repermissionRollup.sentThisWeek,
    repermissionSentLastWeek: repermissionRollup.sentLastWeek,
    repermissionSentAllTime: repermissionRollup.sentAllTime,
    repermissionUnsubscribedCount: repermissionRollup.unsubscribedCount,
    repermissionPausedCount: repermissionRollup.pausedCount,
    repermissionStillLiveCount: repermissionRollup.stillLiveCount,
    repermissionSentAtMigrated: repermissionRollup.sentAtMigrated,
    repermissionDowngradedCadenceCount: repermissionRollup.downgradedCadenceCount,
    frequencyChangedAtMigrated: repermissionRollup.frequencyChangedAtMigrated,
    computedAt: new Date(now).toISOString(),
  }
}
