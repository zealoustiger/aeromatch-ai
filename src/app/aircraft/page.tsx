import type { Metadata } from 'next'
import { Plane, Construction } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aircraft for Sale — Structured, Searchable GA Listings',
  description:
    'Coming soon: aggregated general aviation aircraft for sale with normalized specs — TTAF, SMOH, avionics, damage history, and FAA registry cross-reference.',
  alternates: { canonical: '/aircraft' },
}

export default function AircraftPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
          <Plane className="h-8 w-8 text-sky-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Aircraft for Sale</h1>
        <p className="mt-4 text-lg text-slate-500">
          Coming soon. We're building a structured aircraft purchase search with normalized specs,
          damage history flags, avionics details, and aggregated listings from Barnstormers,
          Trade-A-Plane, and more.
        </p>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">What's coming</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Aggregated listings from major sites, structured + normalized
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Parsed specs: TTAF, SMOH, annual due date, damage history
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              FAA registry cross-reference by N-number
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Side-by-side comparison
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Saved searches with email alerts
            </li>
          </ul>
        </div>
        <Link
          href="/partnerships"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          Browse Partnerships in the meantime →
        </Link>
      </div>
    </div>
  )
}
