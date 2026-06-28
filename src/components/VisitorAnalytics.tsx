import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Live visitor analytics for the admin Daily Report — first-party data straight
 * from `visitor_threads` (one row = one session). Two dimensions (city, landing
 * page) each shown two ways: day-over-day (yesterday vs the day before) and
 * week-over-week (last 7 full days vs the 7 before that). Bots are excluded;
 * day boundaries are computed in Pacific time so "yesterday" matches how Brian
 * reads the Slack radar. Server component — no client JS, always current.
 */

type Row = {
  city: string | null
  region: string | null
  country: string | null
  first_path: string | null
  created_at: string
}

// Pacific-time offset (minutes, e.g. -420 for PDT) for a given instant, so the
// day buckets stay correct across the DST boundary instead of hardcoding -07/-08.
function ptOffsetMinutes(d: Date): number {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'longOffset',
  })
    .formatToParts(d)
    .find((p) => p.type === 'timeZoneName')?.value
  const m = (name || 'GMT-08:00').match(/GMT([+-])(\d{2}):?(\d{2})?/)
  if (!m) return -480
  const sign = m[1] === '-' ? -1 : 1
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3] || '0', 10))
}

// UTC epoch (ms) of midnight Pacific, `daysAgo` days before today.
function ptMidnight(daysAgo: number, now: Date): number {
  const target = new Date(now.getTime() - daysAgo * 86_400_000)
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(target) // YYYY-MM-DD
  const probe = new Date(`${ymd}T12:00:00Z`)
  const off = ptOffsetMinutes(probe)
  return new Date(`${ymd}T00:00:00Z`).getTime() - off * 60_000
}

function cityLabel(r: Row): string {
  if (r.city && r.region) return `${r.city}, ${r.region}`
  if (r.city) return r.city
  if (r.country) return r.country
  return 'Unknown'
}

// Count sessions per key whose created_at falls in [from, to).
function countBy(
  rows: Row[],
  key: (r: Row) => string,
  from: number,
  to: number
): Map<string, number> {
  const out = new Map<string, number>()
  for (const r of rows) {
    const t = new Date(r.created_at).getTime()
    if (t >= from && t < to) {
      const k = key(r)
      out.set(k, (out.get(k) ?? 0) + 1)
    }
  }
  return out
}

type CmpRow = { label: string; cur: number; prev: number }

// Merge two period maps into sorted comparison rows (current period desc).
function compare(cur: Map<string, number>, prev: Map<string, number>, topN = 8): CmpRow[] {
  const keys = new Set([...cur.keys(), ...prev.keys()])
  return [...keys]
    .map((label) => ({ label, cur: cur.get(label) ?? 0, prev: prev.get(label) ?? 0 }))
    .sort((a, b) => b.cur - a.cur || b.prev - a.prev || a.label.localeCompare(b.label))
    .slice(0, topN)
}

function Delta({ cur, prev }: { cur: number; prev: number }) {
  const d = cur - prev
  if (d === 0) return <span className="text-slate-300">—</span>
  const up = d > 0
  return (
    <span className={up ? 'text-emerald-600' : 'text-rose-600'}>
      {up ? '▲' : '▼'} {Math.abs(d)}
    </span>
  )
}

function CmpTable({
  rows,
  curLabel,
  prevLabel,
  dim,
}: {
  rows: CmpRow[]
  curLabel: string
  prevLabel: string
  dim: string
}) {
  if (rows.length === 0) {
    return <p className="px-1 py-3 text-xs text-slate-400">No visitors in this window.</p>
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
          <th className="py-1.5 pr-2 font-medium">{dim}</th>
          <th className="px-2 py-1.5 text-right font-medium">{curLabel}</th>
          <th className="px-2 py-1.5 text-right font-medium">{prevLabel}</th>
          <th className="py-1.5 pl-2 text-right font-medium">Δ</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-slate-50 last:border-0">
            <td className="py-1.5 pr-2 text-slate-700">
              <span className="block max-w-[16rem] truncate" title={r.label}>
                {r.label}
              </span>
            </td>
            <td className="px-2 py-1.5 text-right font-semibold text-slate-900">{r.cur}</td>
            <td className="px-2 py-1.5 text-right text-slate-400">{r.prev}</td>
            <td className="py-1.5 pl-2 text-right tabular-nums">
              <Delta cur={r.cur} prev={r.prev} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default async function VisitorAnalytics() {
  const now = new Date()
  const t0 = ptMidnight(0, now) // start of today (PT)
  const t1 = ptMidnight(1, now) // start of yesterday
  const t2 = ptMidnight(2, now)
  const t7 = ptMidnight(7, now)
  const t14 = ptMidnight(14, now)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('visitor_threads')
    .select('city, region, country, first_path, created_at')
    .eq('is_bot', false)
    .gte('created_at', new Date(t14).toISOString())
    .order('created_at', { ascending: false })
    .limit(5000)

  if (error) {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Visitor analytics</h2>
        <p className="mt-2 text-sm text-rose-600">Couldn&apos;t load visitor data: {error.message}</p>
      </section>
    )
  }

  const rows = (data ?? []) as Row[]

  // Totals for the header line.
  const total = (from: number, to: number) =>
    rows.filter((r) => {
      const t = new Date(r.created_at).getTime()
      return t >= from && t < to
    }).length

  const yesterday = total(t1, t0)
  const dayBefore = total(t2, t1)
  const last7 = total(t7, t0)
  const prev7 = total(t14, t7)

  // City comparisons.
  const cityDoD = compare(countBy(rows, cityLabel, t1, t0), countBy(rows, cityLabel, t2, t1))
  const cityWoW = compare(countBy(rows, cityLabel, t7, t0), countBy(rows, cityLabel, t14, t7))

  // Landing-page comparisons.
  const pageKey = (r: Row) => r.first_path || '/'
  const pageDoD = compare(countBy(rows, pageKey, t1, t0), countBy(rows, pageKey, t2, t1))
  const pageWoW = compare(countBy(rows, pageKey, t7, t0), countBy(rows, pageKey, t14, t7))

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <h2 className="text-lg font-semibold text-slate-900">Visitor analytics</h2>
        <p className="text-xs text-slate-400">
          Real visitors (bots excluded) · Pacific-day windows ·{' '}
          <span className="font-medium text-slate-500">
            {yesterday} yesterday ({dayBefore} prior) · {last7} last 7d ({prev7} prior)
          </span>
        </p>
      </div>

      {/* By city */}
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Visitors by city</h3>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            Day over day
          </p>
          <CmpTable rows={cityDoD} curLabel="Yest." prevLabel="Prev" dim="City" />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            Week over week
          </p>
          <CmpTable rows={cityWoW} curLabel="Last 7d" prevLabel="Prev 7d" dim="City" />
        </div>
      </div>

      {/* Top pages */}
      <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Top landing pages</h3>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            Day over day
          </p>
          <CmpTable rows={pageDoD} curLabel="Yest." prevLabel="Prev" dim="Page" />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            Week over week
          </p>
          <CmpTable rows={pageWoW} curLabel="Last 7d" prevLabel="Prev 7d" dim="Page" />
        </div>
      </div>
    </section>
  )
}
