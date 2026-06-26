import { CheckCircle2, XCircle, MinusCircle, Clock, Loader2, AlertTriangle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import SmokeRunner from '@/components/SmokeRunner'

export const metadata = { title: 'Smoke Tests', robots: { index: false } }
export const dynamic = 'force-dynamic'

// The five production flows, in display order. We match a run's recorded test
// rows (by Playwright title substring) to these so the admin sees friendly,
// stably-ordered results — and "pending" placeholders while a run is in flight.
const FLOWS = [
  { key: 'homepage', label: 'Homepage loads with photos' },
  { key: 'sign up', label: 'Sign up (magic link) creates account' },
  { key: 'partnership', label: 'Post a partnership' },
  { key: 'aircraft', label: 'Post an aircraft listing' },
  { key: 'seeker', label: 'Post a seeker listing' },
]

type Run = {
  id: string
  status: string
  created_at: string
  started_at: string | null
  finished_at: string | null
  passed: number
  failed: number
  skipped: number
  base_url: string | null
  requested_email: string | null
  error: string | null
}
type TestRow = { name: string; status: string; duration_ms: number | null; error: string | null }

function fmt(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function TestStatusIcon({ status }: { status?: string }) {
  if (status === 'passed') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  if (status === 'skipped') return <MinusCircle className="h-5 w-5 text-amber-500" />
  if (status === 'failed' || status === 'timedOut' || status === 'interrupted')
    return <XCircle className="h-5 w-5 text-rose-500" />
  return <Clock className="h-5 w-5 text-slate-300" />
}

function RunBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    requested: 'bg-slate-100 text-slate-600 ring-slate-200',
    running: 'bg-sky-50 text-sky-700 ring-sky-200',
    passed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    failed: 'bg-rose-50 text-rose-700 ring-rose-200',
    error: 'bg-rose-50 text-rose-700 ring-rose-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${map[status] ?? map.requested}`}>
      {(status === 'running' || status === 'requested') && <Loader2 className="h-3 w-3 animate-spin" />}
      {status}
    </span>
  )
}

export default async function SmokePage() {
  const admin = createAdminClient()
  const { data: runsData } = await admin
    .from('smoke_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(12)
  const runs = (runsData ?? []) as Run[]
  const latest = runs[0]

  const { data: testData } = latest
    ? await admin.from('smoke_tests').select('name, status, duration_ms, error').eq('run_id', latest.id)
    : { data: [] as TestRow[] }
  const tests = (testData ?? []) as TestRow[]
  const findTest = (key: string) => tests.find((t) => t.name.toLowerCase().includes(key))

  const active = !!latest && (latest.status === 'requested' || latest.status === 'running')

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Production smoke tests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Runs the 5 critical flows against <span className="font-medium">clubhanger.com</span>. Each posting test
            creates a marked listing, verifies it, then deletes it. Results stream in live.
          </p>
        </div>
        <SmokeRunner active={active} />
      </div>

      {!latest ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No runs yet. Hit <span className="font-medium">Run smoke tests</span> — the runner picks it up within ~a minute.
        </p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <RunBadge status={latest.status} />
            <span className="text-slate-500">
              {latest.passed} passed · {latest.failed} failed · {latest.skipped} skipped
            </span>
            <span className="text-slate-400">
              requested {fmt(latest.created_at)}{latest.requested_email ? ` by ${latest.requested_email}` : ''}
              {latest.finished_at ? ` · finished ${fmt(latest.finished_at)}` : ''}
            </span>
          </div>

          {latest.status === 'requested' && (
            <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" /> Queued — waiting for the runner to pick it up (checks every ~minute).
            </p>
          )}
          {latest.error && (
            <p className="mb-4 flex items-start gap-1.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {latest.error}
            </p>
          )}

          <ul className="divide-y divide-slate-100">
            {FLOWS.map((flow) => {
              const t = findTest(flow.key)
              return (
                <li key={flow.key} className="flex items-center gap-3 py-3">
                  <TestStatusIcon status={t?.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{flow.label}</p>
                    {t?.error && <p className="mt-0.5 truncate text-xs text-rose-600">{t.error}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {t ? (t.status === 'skipped' ? 'skipped' : `${t.status} · ${((t.duration_ms ?? 0) / 1000).toFixed(1)}s`) : active ? 'pending' : '—'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {runs.length > 1 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Recent runs</h3>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {runs.slice(1).map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <RunBadge status={r.status} />
                <span className="text-slate-500">{r.passed}P · {r.failed}F · {r.skipped}S</span>
                <span className="ml-auto text-xs text-slate-400">{fmt(r.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
