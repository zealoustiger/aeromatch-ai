import Link from 'next/link'
import {
  Bell,
  ThumbsUp,
  ThumbsDown,
  Activity,
  AlertTriangle,
  Mail,
  MousePointerClick,
  Flag,
  Zap,
  HelpCircle,
  RotateCcw,
  Target,
} from 'lucide-react'
import {
  getAlertScoreboard,
  getDigestVoteRollup,
  getNotRelevantListingsRollup,
  getInstantInterestRollup,
  getUnsubscribeReasonRollup,
  getRepermissionRollup,
  getDemandSupplyRollup,
} from '@/lib/alertScoreboard'
import { getLastCronRun, getRecentCronRuns } from '@/lib/alertCronHealth'
import { getEmailEngagementRollup } from '@/lib/emailEngagement'
import AdminAlertSubscriberLookup from '@/components/AdminAlertSubscriberLookup'

export const metadata = { title: 'Alert Scoreboard', robots: { index: false } }
export const dynamic = 'force-dynamic'

// Below this many total votes, an up-rate percentage is more noise than
// signal — mirrors the MIN_PLACEMENT_VOLUME_FOR_RATE honesty floor.
const MIN_VOTES_FOR_RATE = 10

// A digest cron that hasn't completed a run in this long is worth a red flag —
// the cron runs daily, so 36h gives one full day of slack before crying wolf.
const STALE_RUN_HOURS = 36

// Admin gate is enforced by src/app/admin/layout.tsx.
export default async function AlertScoreboardPage() {
  const [
    snap,
    votes,
    lastRun,
    recentRuns,
    engagement,
    notRelevant,
    instantInterest,
    unsubscribeReasons,
    repermission,
    demandSupply,
  ] = await Promise.all([
    getAlertScoreboard(),
    getDigestVoteRollup(),
    getLastCronRun(),
    getRecentCronRuns(7),
    getEmailEngagementRollup(),
    getNotRelevantListingsRollup(),
    getInstantInterestRollup(),
    getUnsubscribeReasonRollup(),
    getRepermissionRollup(),
    getDemandSupplyRollup(),
  ])
  const maxEngagement = Math.max(1, ...engagement.map((e) => e.opened + e.clicked))
  const hoursSinceLastRun = lastRun ? (Date.now() - new Date(lastRun.createdAt).getTime()) / (1000 * 60 * 60) : null
  const isStale = hoursSinceLastRun === null || hoursSinceLastRun > STALE_RUN_HOURS
  const updated = new Date(snap.computedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  const maxStatus = Math.max(1, ...snap.statusCounts.map((s) => s.count))
  const maxFamily = Math.max(1, ...snap.topPageFamilies.map((f) => f.count))
  const maxSource = Math.max(1, ...snap.topSources.map((s) => s.liveCount))
  const weekDelta = snap.newThisWeek - snap.newLastWeek
  const maxTrend = Math.max(1, ...snap.weeklyTrend.flatMap((w) => [w.subscribedCount, w.confirmedCount]))
  const hasTrendData = snap.weeklyTrend.some((w) => w.subscribedCount > 0 || w.confirmedCount > 0)

  const voteTotal = votes.upTotal + votes.downTotal
  const voteWeekDelta = votes.upThisWeek + votes.downThisWeek - (votes.upLastWeek + votes.downLastWeek)
  const upRate = voteTotal >= MIN_VOTES_FOR_RATE ? Math.round((votes.upTotal / voteTotal) * 100) : null

  const hasRepermissionSends = repermission.sentAtMigrated && repermission.sentAllTime > 0
  const downgradedCadenceMessage = !repermission.frequencyChangedAtMigrated
    ? 'Cadence-downshift data not available yet — alerts.frequency_changed_at isn’t migrated live.'
    : `${repermission.downgradedCadenceCount} downshifted cadence since the re-permission email.`

  return (
    <div className="space-y-6">
      <Link
        href="/admin/alerts/emails"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-sky-700 hover:underline"
      >
        <Mail className="h-4 w-4" /> Email template gallery →
      </Link>

      <AdminAlertSubscriberLookup />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Activity className="h-5 w-5 text-sky-500" /> Cron health — <code>alert-digest</code>
          </h2>
        </div>

        {!lastRun ? (
          <p className="text-sm text-slate-400">
            No cron run data yet — either the digest cron hasn&apos;t run since this health log
            was added, or the <code>alert_cron_runs</code> table isn&apos;t migrated on the live
            database yet.
          </p>
        ) : (
          <div className="space-y-4">
            {isStale && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0" /> No successful run in over {STALE_RUN_HOURS} hours —
                the digest may be silently broken.
              </div>
            )}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm text-slate-500">
                Last run{' '}
                <time className="font-medium text-slate-800">
                  {new Date(lastRun.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </time>
              </span>
              <span className="text-xs text-slate-400">{Math.round(lastRun.durationMs / 1000)}s</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="text-xl font-bold text-slate-900">{lastRun.processed}</div>
                <div className="text-xs text-slate-500">alerts checked</div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{lastRun.sent}</div>
                <div className="text-xs text-slate-500">alerts sent</div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{lastRun.emailsSent}</div>
                <div className="text-xs text-slate-500">emails sent</div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{lastRun.skipped}</div>
                <div className="text-xs text-slate-500">skipped (no match)</div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{lastRun.notDue}</div>
                <div className="text-xs text-slate-500">not due yet</div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{lastRun.unparseable}</div>
                <div className="text-xs text-slate-500">unparseable</div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{lastRun.remindersSent}</div>
                <div className="text-xs text-slate-500">confirm reminders</div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{lastRun.widenSuggestionsSent}</div>
                <div className="text-xs text-slate-500">widen suggestions</div>
              </div>
            </div>

            {recentRuns.length > 0 && (
              <div className="mt-2">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Last {recentRuns.length} runs
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs text-slate-400">
                        <th className="pb-2 pr-3 font-medium">Date</th>
                        <th className="pb-2 pr-3 font-medium">Emails sent</th>
                        <th className="pb-2 pr-3 font-medium">Send failures</th>
                        <th className="pb-2 pr-3 font-medium">Deferred sends</th>
                        <th className="pb-2 font-medium">Capture self-check</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRuns.map((run) => {
                        const hasFailures = run.sendFailures !== null && run.sendFailures > 0
                        const selfCheckLabel =
                          run.captureSelfCheckOk === null
                            ? '—'
                            : run.captureSelfCheckOk
                              ? 'PASS'
                              : `FAILED at ${run.captureSelfCheckStep ?? 'unknown step'}`
                        return (
                          <tr key={run.id} className="border-b border-slate-50 last:border-0">
                            <td className="py-2 pr-3 text-slate-600">
                              {new Date(run.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="py-2 pr-3 text-slate-800">{run.emailsSent}</td>
                            <td className={`py-2 pr-3 ${hasFailures ? 'font-semibold text-rose-600' : 'text-slate-800'}`}>
                              {run.sendFailures ?? '—'}
                            </td>
                            <td className="py-2 pr-3 text-slate-800">{run.deferredSends ?? '—'}</td>
                            <td
                              className={
                                run.captureSelfCheckOk === false
                                  ? 'py-2 font-semibold text-rose-600'
                                  : 'py-2 text-slate-800'
                              }
                            >
                              {selfCheckLabel}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Bell className="h-5 w-5 text-sky-500" /> Alert funnel — status breakdown
          </h2>
          <span className="text-xs text-slate-400">computed {updated}</span>
        </div>

        <p className="mb-6 text-sm text-slate-500">
          Real counts from the <code>alerts</code> table, {snap.total} row{snap.total === 1 ? '' : 's'} total.
        </p>

        {snap.total === 0 ? (
          <p className="text-sm text-slate-400">No alert subscriptions yet — not enough data.</p>
        ) : (
          <div className="space-y-3">
            {snap.statusCounts.map((row) => (
              <div key={row.status}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-800">{row.label}</span>
                  <span className="text-slate-500">
                    {row.count} {row.count === 1 ? 'alert' : 'alerts'}
                    {snap.total > 0 && (
                      <span className="text-slate-400"> · {Math.round((row.count / snap.total) * 100)}%</span>
                    )}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${(row.count / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">New live subscribers</h2>
        <p className="text-sm text-slate-500">
          Alerts that went live (<span className="font-medium">active</span> or{' '}
          <span className="font-medium">confirmed</span>) in each week, by opt-in date.
        </p>
        {snap.newThisWeek === 0 && snap.newLastWeek === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            No new live alerts in the last 2 weeks — not enough data to say week-over-week.
          </p>
        ) : (
          <div className="mt-3 flex items-end gap-6">
            <div>
              <div className="text-2xl font-bold text-slate-900">{snap.newThisWeek}</div>
              <div className="text-xs text-slate-500">this week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-400">{snap.newLastWeek}</div>
              <div className="text-xs text-slate-500">last week</div>
            </div>
            <div
              className={`pb-1 text-sm font-semibold ${
                weekDelta > 0 ? 'text-emerald-600' : weekDelta < 0 ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              {weekDelta > 0 ? '+' : ''}
              {weekDelta} vs. last week
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">8-week trend</h2>
        <p className="mb-6 text-sm text-slate-500">
          Weekly subscribed vs. confirmed counts, by opt-in date — the week-over-week signal
          GOAL.md asks for, extended past a single this-week/last-week comparison. Unsubscribe
          timestamps aren&apos;t recorded in the <code>alerts</code> table today (only a status
          flip, no date), so that stage isn&apos;t trended here — not enough data to show it
          honestly.
        </p>

        {!hasTrendData ? (
          <p className="text-sm text-slate-400">Not enough data yet across the last 8 weeks.</p>
        ) : (
          <>
            <div className="flex items-end gap-3">
              {snap.weeklyTrend.map((week, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-24 w-full items-end justify-center gap-0.5">
                    <div
                      className="w-2.5 rounded-t bg-sky-500"
                      style={{ height: `${(week.subscribedCount / maxTrend) * 100}%` }}
                      title={`${week.weekLabel}: ${week.subscribedCount} subscribed`}
                    />
                    <div
                      className="w-2.5 rounded-t bg-emerald-500"
                      style={{ height: `${(week.confirmedCount / maxTrend) * 100}%` }}
                      title={`${week.weekLabel}: ${week.confirmedCount} confirmed`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{week.weekLabel}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Subscribed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmed
              </span>
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Which pages convert</h2>
        <p className="mb-6 text-sm text-slate-500">
          Live subscribers (active + confirmed) grouped by the page family they were captured on.
          For the exact widget (bell, chip, footer form, …), see &quot;Top placements&quot; below.
        </p>

        {snap.topPageFamilies.length === 0 ? (
          <p className="text-sm text-slate-400">No live subscribers yet — not enough data.</p>
        ) : (
          <div className="space-y-3">
            {snap.topPageFamilies.map((row) => (
              <div key={row.family}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-800">{row.family}</span>
                  <span className="text-slate-500">
                    {row.count} subscriber{row.count === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${(row.count / maxFamily) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Top placements</h2>
        <p className="mb-6 text-sm text-slate-500">
          Live subscribers (active + confirmed) by the exact widget that captured them, plus
          how many of each placement&apos;s subscribers are still stuck at pending confirmation
          — a high pending share flags a weak double-opt-in funnel for that spot.
          {!snap.sourceColumnMigrated && (
            <>
              {' '}The <code>alerts.source</code> column isn&apos;t migrated on the live database
              yet, so every row below buckets as untagged until a human applies it.
            </>
          )}
        </p>

        {snap.topSources.length === 0 ? (
          <p className="text-sm text-slate-400">No live subscribers yet — not enough data.</p>
        ) : (
          <div className="space-y-3">
            {snap.topSources.map((row) => (
              <div key={row.source}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-800">{row.source}</span>
                  <span className="text-slate-500">
                    {row.liveCount} live · {row.pendingCount} pending
                    {row.confirmRate !== null && (
                      <span className="text-slate-400"> · {Math.round(row.confirmRate * 100)}% confirmed</span>
                    )}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${(row.liveCount / maxSource) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Digest feedback</h2>
        <p className="mb-6 text-sm text-slate-500">
          One-click 👍/👎 votes from the digest email footer — the most honest signal we
          have for &quot;is this the best listing alert email in aviation.&quot;
        </p>

        {voteTotal === 0 ? (
          <p className="text-sm text-slate-400">No digest votes yet — not enough data.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <div className="flex items-center gap-1.5 text-2xl font-bold text-emerald-600">
                  <ThumbsUp className="h-5 w-5" /> {votes.upTotal}
                </div>
                <div className="text-xs text-slate-500">👍 all time</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-2xl font-bold text-rose-600">
                  <ThumbsDown className="h-5 w-5" /> {votes.downTotal}
                </div>
                <div className="text-xs text-slate-500">👎 all time</div>
              </div>
              {upRate !== null && (
                <div>
                  <div className="text-2xl font-bold text-slate-900">{upRate}%</div>
                  <div className="text-xs text-slate-500">👍 rate</div>
                </div>
              )}
              <div
                className={`pb-1 text-sm font-semibold ${
                  voteWeekDelta > 0 ? 'text-emerald-600' : voteWeekDelta < 0 ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                {votes.upThisWeek + votes.downThisWeek} vote{votes.upThisWeek + votes.downThisWeek === 1 ? '' : 's'}{' '}
                this week ({voteWeekDelta > 0 ? '+' : ''}
                {voteWeekDelta} vs. last week)
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
              {votes.recentVotes.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {v.vote === 'up' ? (
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <ThumbsDown className="h-3.5 w-3.5 text-rose-600" />
                    )}
                    <span className="font-mono text-xs text-slate-500">{v.pagePath ?? '/alerts/digest'}</span>
                  </span>
                  <time className="text-xs text-slate-400">
                    {new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </time>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MousePointerClick className="h-5 w-5 text-sky-500" /> Email engagement
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Opens and clicks per email template, from the Resend <code>email.opened</code>/
          <code>email.clicked</code> webhook — which alert emails actually get read.
        </p>

        {engagement.length === 0 ? (
          <p className="text-sm text-slate-400">
            No engagement events received yet — either nobody&apos;s opened/clicked a recent
            email, the <code>email_engagement_events</code> table isn&apos;t migrated on the
            live database yet, or the <code>email.opened</code>/<code>email.clicked</code>{' '}
            events aren&apos;t registered on this webhook endpoint in the Resend dashboard yet.
          </p>
        ) : (
          <div className="space-y-3">
            {engagement.map((row) => (
              <div key={row.emailType}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-800">{row.emailType}</span>
                  <span className="text-slate-500">
                    {row.opened} opened · {row.clicked} clicked
                    {row.recipients > 0 ? ` · ${row.recipients} people` : ''}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${((row.opened + row.clicked) / maxEngagement) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Flag className="h-5 w-5 text-rose-500" /> Least relevant listings this week
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Per-sample &quot;Not relevant?&quot; taps from digest emails, rolled up by listing over
          the last 7 days — which listings subscribers keep flagging as off-target for their
          alert. Real counts only.
        </p>

        {notRelevant.topThisWeek.length === 0 ? (
          <p className="text-sm text-slate-400">No listings flagged as off-target this week.</p>
        ) : (
          <div className="space-y-2">
            {notRelevant.topThisWeek.map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-800">
                  {row.pagePath ? (
                    <Link href={row.pagePath} className="hover:underline">
                      {row.title}
                    </Link>
                  ) : (
                    row.title
                  )}
                </span>
                <span className="shrink-0 text-slate-500">
                  {row.count} flag{row.count === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <HelpCircle className="h-5 w-5 text-slate-400" /> Why people unsubscribe
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          The one-tap reason chips on the unsubscribe page, this week vs. all-time. Real
          counts only.
        </p>

        {!unsubscribeReasons.reasonColumnMigrated ? (
          <p className="text-sm text-slate-400">
            Not available yet — the <code>alerts.unsubscribe_reason</code> column isn&rsquo;t
            migrated live.
          </p>
        ) : unsubscribeReasons.topReasons.length === 0 ? (
          <p className="text-sm text-slate-400">No reasons recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {unsubscribeReasons.topReasons.map((row) => (
              <div key={row.reason} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-800">{row.label}</span>
                <span className="shrink-0 text-slate-500">
                  {row.countThisWeek} this week · {row.countAllTime} all-time
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <RotateCcw className="h-5 w-5 text-sky-500" /> Re-permission lifecycle
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          The &quot;still want these?&quot; email sent to dormant subscribers — did it win
          them back or push them out? Same read the Monday admin email uses, on demand.
        </p>

        {!repermission.sentAtMigrated ? (
          <p className="text-sm text-slate-400">
            Not available yet — the <code>alerts.repermission_sent_at</code> column isn&rsquo;t
            migrated live.
          </p>
        ) : !hasRepermissionSends ? (
          <p className="text-sm text-slate-400">No re-permission emails sent yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <div className="text-2xl font-bold text-slate-900">{repermission.sentThisWeek}</div>
                <div className="text-xs text-slate-500">sent this week</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-400">{repermission.sentLastWeek}</div>
                <div className="text-xs text-slate-500">last week</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{repermission.sentAllTime}</div>
                <div className="text-xs text-slate-500">all time</div>
              </div>
            </div>
            <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm text-slate-500">
              <div>
                Of those: <span className="font-medium text-slate-800">{repermission.unsubscribedCount}</span>{' '}
                unsubscribed, <span className="font-medium text-slate-800">{repermission.pausedCount}</span>{' '}
                paused, <span className="font-medium text-slate-800">{repermission.stillLiveCount}</span> still
                active.
              </div>
              <div>{downgradedCadenceMessage}</div>
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Zap className="h-5 w-5 text-amber-500" /> Instant-alerts interest
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Taps on the &quot;I&apos;d want instant (within-the-hour) alerts&quot; probe — real
          demand data for the still-blocked Vercel cron-tier decision. Nothing is sent instantly
          today; this only accumulates the signal.
        </p>

        {instantInterest.allTime === 0 ? (
          <p className="text-sm text-slate-400">No interest recorded yet — not enough data.</p>
        ) : (
          <div className="flex items-end gap-6">
            <div>
              <div className="text-2xl font-bold text-slate-900">{instantInterest.thisWeek}</div>
              <div className="text-xs text-slate-500">this week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-400">{instantInterest.allTime}</div>
              <div className="text-xs text-slate-500">all time</div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Target className="h-5 w-5 text-indigo-500" /> Demand vs. supply (&quot;most wanted&quot;)
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Live (active/confirmed) alert subscribers grouped by curated make+model family, paired
          with that family&apos;s real live listing count — sorted least-supply-first, then
          most-demand-first. This is the outreach-targeting list for owner acquisition: a family
          with subscribers waiting and few or no live listings is where new supply matters most.
          Only alerts targeting one specific curated model are counted; real small numbers
          (including 0) always render as-is.
        </p>

        {demandSupply.length === 0 ? (
          <p className="text-sm text-slate-400">
            No live subscribers targeting a specific curated make/model yet — not enough data.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {demandSupply.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="font-medium text-slate-800">{row.label}</span>
                <span className={row.liveListingCount === 0 ? 'font-medium text-rose-600' : 'text-slate-500'}>
                  {row.subscriberCount} subscriber{row.subscriberCount === 1 ? '' : 's'} waiting ·{' '}
                  {row.liveListingCount} live listing{row.liveListingCount === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
