import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, GitCompare } from 'lucide-react'
import { Partnership } from '@/lib/types'
import { getPartnershipsByIds } from '@/lib/partnerships'
import { formatPrice, formatShareType, aircraftLabel } from '@/lib/utils'

// Cap at 3 listings. Defined locally (not imported from the 'use client'
// CompareProvider) so the value is reliably present in this server component.
const MAX_COMPARE = 3

// Utility view, NOT an SEO page — keep it out of the index (no thin/duplicate
// indexable pages) and out of the sitemap. Overrides the site-wide index:true.
export const metadata: Metadata = {
  title: 'Compare partnerships',
  description: 'Compare aircraft partnership listings side by side.',
  robots: { index: false, follow: false },
}

type SearchParams = Record<string, string | string[] | undefined>

function parseIds(raw: string | string[] | undefined): string[] {
  if (!raw) return []
  const joined = Array.isArray(raw) ? raw.join(',') : raw
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of joined.split(',')) {
    const id = part.trim()
    if (id && !seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
    if (out.length >= MAX_COMPARE) break // cap at 3
  }
  return out
}

/** Each comparison row: a label + how to render the cell for a given listing. */
const ROWS: { label: string; render: (p: Partnership) => React.ReactNode }[] = [
  { label: 'Aircraft', render: (p) => aircraftLabel(p.make, p.model, p.year) || '—' },
  {
    label: 'Home airport',
    render: (p) =>
      p.home_airport ? (
        <Link href={`/airports/${p.home_airport.toLowerCase()}`} className="font-medium text-sky-700 hover:underline">
          {p.home_airport}
        </Link>
      ) : (
        '—'
      ),
  },
  { label: 'Location', render: (p) => [p.city, p.state].filter(Boolean).join(', ') || '—' },
  { label: 'Share type', render: (p) => formatShareType(p.share_type) },
  { label: 'Buy-in', render: (p) => (p.buy_in_price ? formatPrice(p.buy_in_price) : '—') },
  { label: 'Monthly', render: (p) => (p.monthly_fixed ? `${formatPrice(p.monthly_fixed)}/mo` : '—') },
  { label: 'Wet rate', render: (p) => (p.hourly_wet ? `${formatPrice(p.hourly_wet)}/hr` : '—') },
  {
    label: 'Total partners',
    render: (p) => (p.total_shares != null ? String(p.total_shares) : '—'),
  },
  {
    label: 'Shares available',
    render: (p) => (p.shares_available != null ? String(p.shares_available) : '—'),
  },
  { label: 'Min hours', render: (p) => (p.min_hours != null ? `${p.min_hours} hrs` : '—') },
  {
    label: 'Ratings required',
    render: (p) => (p.ratings_required && p.ratings_required.length > 0 ? p.ratings_required.join(', ') : '—'),
  },
  { label: 'Scheduling', render: (p) => p.scheduling_system || '—' },
  { label: 'Registration', render: (p) => p.registration || '—' },
]

function EmptyPrompt({ count }: { count: number }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-sky-50 ring-1 ring-sky-200">
        <GitCompare className="h-6 w-6 text-sky-500" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">
        {count === 1 ? 'Pick one more partnership to compare' : 'Choose partnerships to compare'}
      </h1>
      <p className="mt-2 text-slate-500">
        Select 2–3 listings on the partnerships page using the{' '}
        <span className="font-medium text-sky-700">Compare</span> toggle, then come back here to
        see them side by side.
      </p>
      <Link
        href="/partnerships"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
      >
        Browse partnerships
      </Link>
    </div>
  )
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const ids = parseIds(params.ids)

  // Fetch (missing/invalid ids are dropped by the helper).
  const listings = ids.length > 0 ? await getPartnershipsByIds(ids) : []

  if (listings.length < 2) {
    return <EmptyPrompt count={listings.length} />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6">
        <Link
          href="/partnerships"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Partnerships
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <GitCompare className="h-6 w-6 text-sky-500" />
          Compare partnerships
        </h1>
        <p className="mt-1 text-slate-500">
          {listings.length} listings side by side.
        </p>
      </div>

      {/* Horizontal scroll keeps the table usable at 375px without clipping. */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[560px] border-separate border-spacing-0">
          <thead>
            <tr>
              {/* Sticky row-label corner */}
              <th className="sticky left-0 z-10 w-32 bg-slate-50 p-0" />
              {listings.map((p) => (
                <th
                  key={p.id}
                  className="border-b border-slate-200 bg-white p-3 align-top"
                >
                  <Link href={`/partnerships/${p.id}`} className="group block text-left">
                    <span className="block text-sm font-semibold text-slate-900 group-hover:text-sky-700">
                      {p.title}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-slate-500">
                      {aircraftLabel(p.make, p.model, p.year)}
                    </span>
                    <span className="mt-1 inline-block text-xs font-medium text-sky-600 group-hover:underline">
                      View listing →
                    </span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => (
              <tr key={row.label} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <th
                  scope="row"
                  className={`sticky left-0 z-10 whitespace-nowrap border-b border-slate-100 p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 ${
                    ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  {row.label}
                </th>
                {listings.map((p) => (
                  <td
                    key={p.id}
                    className="border-b border-slate-100 p-3 align-top text-sm text-slate-700"
                  >
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-column quick links also at the bottom for long tables. */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {listings.map((p) => (
          <Link
            key={p.id}
            href={`/partnerships/${p.id}`}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-sky-700 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
          >
            View {aircraftLabel(p.make, p.model, p.year) || p.title} →
          </Link>
        ))}
      </div>
    </div>
  )
}
