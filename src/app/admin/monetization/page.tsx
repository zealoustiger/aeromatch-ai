import { DollarSign } from 'lucide-react'
import { getMonetizationTally } from '@/lib/monetizationTally'

export const metadata = { title: 'Revenue Signals', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function MonetizationTallyPage() {
  const snap = await getMonetizationTally()
  const updated = new Date(snap.computedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  const max = Math.max(1, ...snap.rows.map((r) => r.count))

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <DollarSign className="h-5 w-5 text-sky-500" /> Revenue Signals
        </h2>
        <span className="text-xs text-slate-400">computed {updated}</span>
      </div>

      <p className="mb-6 text-sm text-slate-500">
        Real opt-ins from the honest &ldquo;Coming soon&rdquo; CTAs on listing pages — which
        revenue path pilots actually said they want, before we build any of it.{' '}
        <strong>This counts email opt-ins left in the modal, not raw button clicks</strong> —
        opening the modal is a real demand signal too (fires a <code>monetization_intent</code>{' '}
        analytics event) but that count isn&apos;t queried here, so the true interest per path is
        at least this high, possibly higher.
      </p>

      <div className="space-y-3">
        {snap.rows.map((row) => (
          <div key={row.path}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-800">{row.label}</span>
              <span className="text-slate-500">
                {row.count} {row.count === 1 ? 'opt-in' : 'opt-ins'}
                {snap.total > 0 && <span className="text-slate-400"> · {Math.round(row.share * 100)}%</span>}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-sky-500"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {snap.total === 0 && (
        <p className="mt-6 text-sm text-slate-400">
          No opt-ins yet — not enough data to say which path is winning.
        </p>
      )}
    </section>
  )
}
