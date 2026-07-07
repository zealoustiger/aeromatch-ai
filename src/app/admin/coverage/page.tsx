import { MapPin } from 'lucide-react'
import { getBayAreaCoverageSnapshot } from '@/lib/bayAreaCoverage'

export const metadata = { title: 'Bay Area Coverage', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function CoveragePage() {
  const snap = await getBayAreaCoverageSnapshot()
  const updated = new Date(snap.computedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MapPin className="h-5 w-5 text-sky-500" /> Bay Area Coverage
        </h2>
        <span className="text-xs text-slate-400">computed {updated}</span>
      </div>

      <p className="mb-6 text-sm text-slate-500">
        How much of our own live Bay Area inventory we have today — a leading indicator to
        track week over week. This is <strong>numerator only</strong>: we don&apos;t have an
        honest denominator (real Bay Area market size) yet, so no coverage percentage is
        shown here — that needs FAA based-aircraft fleet data or a de-duped
        competitor-listing count, tracked as the next slice.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-bold text-slate-900">{snap.partnerships}</div>
          <div className="mt-1 text-sm text-slate-600">Active partnership listings</div>
          <div className="mt-1 text-xs text-slate-400">
            Home airport is one of the 11 Bay Area ICAO codes (exact match).
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-bold text-slate-900">{snap.aircraftForSale}</div>
          <div className="mt-1 text-sm text-slate-600">Active for-sale listings ($50k+)</div>
          <div className="mt-1 text-xs text-slate-400">{snap.aircraftForSaleNote}</div>
        </div>
      </div>
    </section>
  )
}
