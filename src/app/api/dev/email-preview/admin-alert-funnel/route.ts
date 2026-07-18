import { buildAdminAlertFunnelEmail } from '@/lib/email'
import type { AlertFunnelWeeklySnapshot } from '@/lib/alertFunnelWeekly'

export const dynamic = 'force-dynamic'

/**
 * Dev-only preview of the Monday admin alert-funnel weekly summary — renders
 * the built HTML against a static fixture snapshot so it can be eyeballed in
 * a browser without touching the DB or waiting for a Monday cron run.
 * Already excluded from crawling by `robots.ts`'s blanket `/api` disallow;
 * not linked from any nav.
 */
export async function GET() {
  const snapshot: AlertFunnelWeeklySnapshot = {
    weekStart: '2026-07-11T08:00:00.000Z',
    weekEnd: '2026-07-18T08:00:00.000Z',
    createdThisWeek: 14,
    createdLastWeek: 9,
    confirmedThisWeek: 8,
    confirmedLastWeek: 6,
    unsubscribedThisWeek: 3,
    unsubscribedLastWeek: 5,
    pausedThisWeek: 2,
    pausedLastWeek: 1,
    bouncedThisWeek: 1,
    bouncedLastWeek: 1,
    liveTotal: 142,
    pendingTotal: 11,
    pausedTotal: 5,
    unsubscribedTotal: 23,
    bouncedTotal: 2,
    topSourcesThisWeek: [
      { source: 'card_watch', createdThisWeek: 6, createdLastWeek: 3 },
      { source: 'filter_toolbar', createdThisWeek: 4, createdLastWeek: 4 },
      { source: 'digest_cross_sell', createdThisWeek: 2, createdLastWeek: 1 },
      { source: '(untagged)', createdThisWeek: 2, createdLastWeek: 1 },
    ],
    digestVotesUpThisWeek: 5,
    digestVotesDownThisWeek: 1,
    digestVotesUpLastWeek: 3,
    digestVotesDownLastWeek: 2,
    digestVotesUpTotal: 19,
    digestVotesDownTotal: 6,
    emailOpenedThisWeek: 27,
    emailOpenedLastWeek: 21,
    emailClickedThisWeek: 9,
    emailClickedLastWeek: 6,
    emailOpenedTotal: 143,
    emailClickedTotal: 48,
    notRelevantListings: [
      { pagePath: '/aircraft/listing/abc123', title: '1978 Cessna 172N — $89,500', count: 3 },
      { pagePath: '/partnerships/def456', title: 'Cirrus SR22 1/4 share — KPAO', count: 2 },
    ],
    notRelevantTotalThisWeek: 5,
    instantInterestThisWeek: 4,
    instantInterestAllTime: 17,
    demandWithNoSupply: [
      { sourcePath: '/aircraft?make=Mooney&state=OH', label: 'Mooney in Ohio', subscriberCount: 4 },
      { sourcePath: '/partnerships?make=Diamond', label: 'Diamond', subscriberCount: 2 },
    ],
    sourceColumnMigrated: true,
    unsubscribedAtMigrated: true,
    pausedAtMigrated: true,
    bouncedAtMigrated: true,
    computedAt: '2026-07-18T08:00:00.000Z',
  }

  const { html } = buildAdminAlertFunnelEmail(snapshot, 'https://clubhanger.com/admin/alerts')

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
