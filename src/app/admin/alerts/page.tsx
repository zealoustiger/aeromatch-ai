import { Bell, ThumbsUp, ThumbsDown } from 'lucide-react'
import { getAlertScoreboard, getDigestVoteRollup } from '@/lib/alertScoreboard'

export const metadata = { title: 'Alert Scoreboard', robots: { index: false } }
export const dynamic = 'force-dynamic'

// Below this many total votes, an up-rate percentage is more noise than
// signal — mirrors the MIN_PLACEMENT_VOLUME_FOR_RATE honesty floor.
const MIN_VOTES_FOR_RATE = 10

// Admin gate is enforced by src/app/admin/layout.tsx.
export default async function AlertScoreboardPage() {
  const [snap, votes] = await Promise.all([getAlertScoreboard(), getDigestVoteRollup()])
  const updated = new Date(snap.computedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  const maxStatus = Math.max(1, ...snap.statusCounts.map((s) => s.count))
  const maxFamily = Math.max(1, ...snap.topPageFamilies.map((f) => f.count))
  const maxSource = Math.max(1, ...snap.topSources.map((s) => s.liveCount))
  const weekDelta = snap.newThisWeek - snap.newLastWeek

  const voteTotal = votes.upTotal + votes.downTotal
  const voteWeekDelta = votes.upThisWeek + votes.downThisWeek - (votes.upLastWeek + votes.downLastWeek)
  const upRate = voteTotal >= MIN_VOTES_FOR_RATE ? Math.round((votes.upTotal / voteTotal) * 100) : null

  return (
    <div className="space-y-6">
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
    </div>
  )
}
