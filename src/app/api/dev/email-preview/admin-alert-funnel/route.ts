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
    sourceColumnMigrated: true,
    unsubscribedAtMigrated: true,
    computedAt: '2026-07-18T08:00:00.000Z',
  }

  const { html } = buildAdminAlertFunnelEmail(snapshot, 'https://clubhanger.com/admin/alerts')

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
