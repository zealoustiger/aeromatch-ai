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

type CmpRow = { label: string; yest: number; dod: number; week: number; wow: number }

// Build one combined row set per key: yesterday + its d/d delta, and last-7d + its
// w/w delta. Sorted by the 7-day figure (steadier signal), then yesterday.
function combined(
  rows: Row[],
  key: (r: Row) => string,
  b: { t0: number; t1: number; t2: number; t7: number; t14: number },
  topN = 10
): CmpRow[] {
  const yest = countBy(rows, key, b.t1, b.t0)
  const prevD = countBy(rows, key, b.t2, b.t1)
  const wk = countBy(rows, key, b.t7, b.t0)
  const prevW = countBy(rows, key, b.t14, b.t7)
  const keys = new Set([...yest.keys(), ...prevD.keys(), ...wk.keys(), ...prevW.keys()])
  return [...keys]
    .map((label) => {
      const y = yest.get(label) ?? 0
      const w = wk.get(label) ?? 0
      return { label, yest: y, dod: y - (prevD.get(label) ?? 0), week: w, wow: w - (prevW.get(label) ?? 0) }
    })
    .sort((a, b2) => b2.week - a.week || b2.yest - a.yest || a.label.localeCompare(b2.label))
    .slice(0, topN)
}

function Delta({ d }: { d: number }) {
  if (d === 0) return <span className="text-slate-300">—</span>
  const up = d > 0
  return (
    <span className={up ? 'text-emerald-600' : 'text-rose-600'}>
      {up ? '▲' : '▼'} {Math.abs(d)}
    </span>
  )
}

// One table that folds both windows together: current value + delta for each.
function CmpTable({ rows, dim }: { rows: CmpRow[]; dim: string }) {
  if (rows.length === 0) {
    return <p className="px-1 py-3 text-xs text-slate-400">No visitors in this window.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-medium text-slate-400">
            <th className="py-1.5 pr-2 text-left font-medium">{dim}</th>
            <th className="px-2 py-1.5 text-right font-medium">Yest.</th>
            <th className="px-2 py-1.5 text-right font-medium">Δ d/d</th>
            <th className="px-2 py-1.5 text-right font-medium">Last 7d</th>
            <th className="py-1.5 pl-2 text-right font-medium">Δ w/w</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-slate-50 last:border-0">
              <td className="py-1.5 pr-2 text-slate-700">
                <span className="block max-w-[18rem] truncate" title={r.label}>
                  {r.label}
                </span>
              </td>
              <td className="px-2 py-1.5 text-right font-semibold text-slate-900">{r.yest}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                <Delta d={r.dod} />
              </td>
              <td className="px-2 py-1.5 text-right font-semibold text-slate-900">{r.week}</td>
              <td className="py-1.5 pl-2 text-right tabular-nums">
                <Delta d={r.wow} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

  // Combined comparisons (each folds day-over-day + week-over-week into one table).
  const bounds = { t0, t1, t2, t7, t14 }
  const cityRows = combined(rows, cityLabel, bounds)
  const pageRows = combined(rows, (r: Row) => r.first_path || '/', bounds)

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

      <p className="mb-3 text-xs text-slate-400">
        <span className="font-medium text-slate-500">Δ d/d</span> = yesterday vs. the day before ·{' '}
        <span className="font-medium text-slate-500">Δ w/w</span> = last 7 days vs. the prior 7
      </p>

      {/* By city */}
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Visitors by city</h3>
      <CmpTable rows={cityRows} dim="City" />

      {/* Top pages */}
      <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Top landing pages</h3>
      <CmpTable rows={pageRows} dim="Page" />
    </section>
  )
}
