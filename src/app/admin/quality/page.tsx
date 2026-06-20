import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import type { AircraftForSale } from '@/lib/types'
import {
  explainQuality,
  gradeFromScore,
  gradeMeta,
  type Grade,
} from '@/lib/listingQuality'

export const metadata = { title: 'Listing quality', robots: { index: false } }
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

type SearchParams = Record<string, string | undefined>
const GRADES: Grade[] = ['A', 'B', 'C']

function gradeBounds(grade: Grade): { gte?: number; lt?: number } {
  if (grade === 'A') return { gte: 78 }
  if (grade === 'B') return { gte: 50, lt: 78 }
  return { lt: 50 }
}

export default async function QualityAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const grade = (['A', 'B', 'C'].includes((params.grade ?? '').toUpperCase())
    ? (params.grade as string).toUpperCase()
    : 'C') as Grade
  const sourceFilter = params.source || ''

  // ── Auth (mirrors /admin/review) ──
  const supabase = await createServerSupabaseClient()
  const { data: userData } = await supabase.auth.getUser()
  const email = userData.user?.email?.toLowerCase()
  const allowed = email && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email))
  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Admin only</h1>
        <p className="mt-2 text-sm text-slate-500">
          {email ? 'This account is not an admin.' : 'Sign in with an admin account.'}
        </p>
        <Link
          href="/auth?next=/admin/quality"
          className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const admin = createAdminClient()

  // ── Distribution: counts per grade per source (active only) ──
  const { data: dist } = await admin
    .from('aircraft_for_sale')
    .select('source, quality_score')
    .eq('status', 'active')
    .limit(10000)

  const bySource = new Map<string, { A: number; B: number; C: number; sum: number; n: number }>()
  for (const r of dist ?? []) {
    const g = gradeFromScore(r.quality_score)
    const row = bySource.get(r.source) ?? { A: 0, B: 0, C: 0, sum: 0, n: 0 }
    row[g]++
    row.sum += r.quality_score ?? 0
    row.n++
    bySource.set(r.source, row)
  }
  const sources = [...bySource.keys()].sort()
  const totals = { A: 0, B: 0, C: 0, sum: 0, n: 0 }
  for (const v of bySource.values()) {
    totals.A += v.A; totals.B += v.B; totals.C += v.C; totals.sum += v.sum; totals.n += v.n
  }

  // ── Debug list: worst-first within the selected grade (+ optional source) ──
  const bounds = gradeBounds(grade)
  let q = admin
    .from('aircraft_for_sale')
    .select('*')
    .eq('status', 'active')
    .order('quality_score', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(60)
  if (bounds.gte != null) q = q.gte('quality_score', bounds.gte)
  if (bounds.lt != null) q = q.lt('quality_score', bounds.lt)
  if (sourceFilter) q = q.eq('source', sourceFilter)
  const { data: listings } = await q
  const rows = (listings ?? []) as AircraftForSale[]

  const tabHref = (next: Partial<{ grade: string; source: string }>) => {
    const sp = new URLSearchParams()
    sp.set('grade', next.grade ?? grade)
    const src = next.source !== undefined ? next.source : sourceFilter
    if (src) sp.set('source', src)
    return `/admin/quality?${sp.toString()}`
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listing quality</h1>
          <p className="mt-1 text-sm text-slate-500">
            Grade A ≥ 78 · B ≥ 50 · C &lt; 50. Inspect low-quality listings to see which signals
            are missing and whether the parser can be improved.
          </p>
        </div>
        <Link href="/admin/review" className="text-sm font-medium text-sky-600 hover:text-sky-700">
          Drafts review →
        </Link>
      </div>

      {/* Distribution table */}
      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Source</th>
              <th className="px-4 py-2.5 font-semibold text-emerald-700">A</th>
              <th className="px-4 py-2.5 font-semibold text-amber-700">B</th>
              <th className="px-4 py-2.5 font-semibold text-rose-700">C</th>
              <th className="px-4 py-2.5 font-semibold">Total</th>
              <th className="px-4 py-2.5 font-semibold">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sources.map((s) => {
              const v = bySource.get(s)!
              return (
                <tr key={s} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{s}</td>
                  <td className="px-4 py-2.5 text-slate-600">{v.A}</td>
                  <td className="px-4 py-2.5 text-slate-600">{v.B}</td>
                  <td className="px-4 py-2.5 text-slate-600">{v.C}</td>
                  <td className="px-4 py-2.5 text-slate-600">{v.n}</td>
                  <td className="px-4 py-2.5 text-slate-600">{Math.round(v.sum / Math.max(1, v.n))}</td>
                </tr>
              )
            })}
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
              <td className="px-4 py-2.5 text-slate-800">All</td>
              <td className="px-4 py-2.5 text-slate-700">{totals.A}</td>
              <td className="px-4 py-2.5 text-slate-700">{totals.B}</td>
              <td className="px-4 py-2.5 text-slate-700">{totals.C}</td>
              <td className="px-4 py-2.5 text-slate-700">{totals.n}</td>
              <td className="px-4 py-2.5 text-slate-700">{Math.round(totals.sum / Math.max(1, totals.n))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Grade</span>
        {GRADES.map((g) => (
          <Link
            key={g}
            href={tabHref({ grade: g })}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ring-1 ${
              g === grade
                ? 'bg-slate-900 text-white ring-slate-900'
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {g}
          </Link>
        ))}
        <span className="ml-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Source</span>
        <Link
          href={tabHref({ source: '' })}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ring-1 ${
            !sourceFilter ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
          }`}
        >
          All
        </Link>
        {sources.map((s) => (
          <Link
            key={s}
            href={tabHref({ source: s })}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ring-1 ${
              s === sourceFilter ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Debug list */}
      <p className="mb-3 text-sm text-slate-500">
        Showing {rows.length} lowest-scoring Grade {grade}
        {sourceFilter ? ` · ${sourceFilter}` : ''} listings (worst first).
      </p>
      <div className="space-y-3">
        {rows.map((r) => {
          const ex = explainQuality(r)
          const gm = gradeMeta(ex.grade)
          return (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${gm.chip}`}>
                      {ex.score}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      {r.source}
                    </span>
                    <h3 className="truncate text-sm font-semibold text-slate-900">{r.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {[r.year, r.make, r.model].filter(Boolean).join(' ') || '—'}
                    {r.location ? ` · ${r.location}` : ''}
                    {r.price_text ? ` · ${r.price_text}` : ' · no price'}
                  </p>
                </div>
                {r.source_url && (
                  <a
                    href={r.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-600 ring-1 ring-sky-200 hover:bg-sky-50"
                  >
                    Compare to source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {/* Signal breakdown */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ex.signals.map((s) => (
                  <span
                    key={s.key}
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      s.present
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-600 line-through decoration-rose-300'
                    }`}
                    title={`${s.points} pts`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No Grade {grade} listings{sourceFilter ? ` from ${sourceFilter}` : ''}.
          </div>
        )}
      </div>
    </div>
  )
}
