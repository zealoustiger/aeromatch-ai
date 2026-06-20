import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, GitCompare } from 'lucide-react'
import { Partnership, AircraftForSale } from '@/lib/types'
import { getPartnershipsByIds } from '@/lib/partnerships'
import { getAircraftForSaleByIds } from '@/lib/aircraftForSale'
import { formatPrice, formatShareType, aircraftLabel } from '@/lib/utils'
import { resolveMakeModelFamily } from '@/lib/seo'

// Cap at 3 listings. Defined locally (not imported from the 'use client'
// CompareProvider) so the value is reliably present in this server component.
const MAX_COMPARE = 3

type CompareType = 'partnership' | 'aircraft'

// Utility view, NOT an SEO page — keep it out of the index (no thin/duplicate
// indexable pages) and out of the sitemap. Overrides the site-wide index:true.
export const metadata: Metadata = {
  title: 'Compare listings',
  description: 'Compare aircraft partnership and for-sale listings side by side.',
  robots: { index: false, follow: false },
}

type SearchParams = Record<string, string | string[] | undefined>

function parseType(raw: string | string[] | undefined): CompareType {
  const v = Array.isArray(raw) ? raw[0] : raw
  return v === 'aircraft' ? 'aircraft' : 'partnership'
}

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

/* ─────────────────────────── Partnership table ─────────────────────────── */

const PARTNERSHIP_ROWS: { label: string; render: (p: Partnership) => React.ReactNode }[] = [
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

/* ──────────────────────────── Aircraft table ───────────────────────────── */

// Where an aircraft column links: the source listing (most cards' primary link),
// else the make+model for-sale family page if one exists — never an invented
// detail route (aircraft have no detail page).
function aircraftLink(p: AircraftForSale): { href: string; external: boolean; text: string } | null {
  if (p.source_url) {
    return { href: p.source_url, external: p.source !== 'user', text: 'View listing →' }
  }
  const family = resolveMakeModelFamily(p.make, p.model)
  if (family) {
    return {
      href: `/aircraft/${family.makeSlug}/${family.modelSlug}`,
      external: false,
      text: `See ${family.make} ${family.model} →`,
    }
  }
  return null
}

function aircraftHeading(p: AircraftForSale): string {
  return aircraftLabel(p.make ?? '', p.model ?? '', p.year) || 'Aircraft'
}

const AIRCRAFT_ROWS: { label: string; render: (p: AircraftForSale) => React.ReactNode }[] = [
  { label: 'Make', render: (p) => p.make || '—' },
  { label: 'Model', render: (p) => p.model || '—' },
  { label: 'Year', render: (p) => (p.year != null ? String(p.year) : '—') },
  {
    label: 'Price',
    render: (p) =>
      p.asking_price ? formatPrice(p.asking_price) : p.price_text ? <span className="capitalize">{p.price_text}</span> : '—',
  },
  { label: 'Total time (TTAF)', render: (p) => (p.ttaf != null ? `${p.ttaf.toLocaleString()} hrs` : '—') },
  { label: 'SMOH', render: (p) => (p.smoh != null ? `${p.smoh.toLocaleString()} hrs` : '—') },
  { label: 'Engine', render: (p) => p.engine_type || '—' },
  { label: 'Annual due', render: (p) => p.annual_due || '—' },
  {
    label: 'Damage history',
    render: (p) => (p.damage_history == null ? '—' : p.damage_history ? 'Yes' : 'No'),
  },
  {
    label: 'Avionics',
    render: (p) => (p.avionics && p.avionics.length > 0 ? p.avionics.join(', ') : '—'),
  },
  { label: 'Location', render: (p) => p.location || p.state || '—' },
  { label: 'Registration', render: (p) => p.registration || '—' },
  { label: 'Source', render: (p) => p.source || '—' },
]

/* ──────────────────────────────── Empty ─────────────────────────────────── */

function EmptyPrompt({ count, type }: { count: number; type: CompareType }) {
  const isAircraft = type === 'aircraft'
  // "aircraft" is an invariant plural ("aircrafts" is wrong); "partnership" pluralizes.
  const singular = isAircraft ? 'aircraft' : 'partnership'
  const plural = isAircraft ? 'aircraft' : 'partnerships'
  const browseHref = isAircraft ? '/aircraft' : '/partnerships'
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-sky-50 ring-1 ring-sky-200">
        <GitCompare className="h-6 w-6 text-sky-500" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">
        {count === 1 ? `Pick one more ${singular} to compare` : `Choose ${plural} to compare`}
      </h1>
      <p className="mt-2 text-slate-500">
        Select 2–3 listings on the {isAircraft ? 'planes-for-sale' : 'partnerships'} page using the{' '}
        <span className="font-medium text-sky-700">Compare</span> toggle, then come back here to
        see them side by side.
      </p>
      <Link
        href={browseHref}
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
      >
        {isAircraft ? 'Browse aircraft for sale' : 'Browse partnerships'}
      </Link>
    </div>
  )
}

/* ──────────────────────────────── Page ──────────────────────────────────── */

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const type = parseType(params.type)
  const ids = parseIds(params.ids)

  if (type === 'aircraft') {
    const listings = ids.length > 0 ? await getAircraftForSaleByIds(ids) : []
    if (listings.length < 2) return <EmptyPrompt count={listings.length} type="aircraft" />

    return (
      <CompareLayout
        backHref="/aircraft"
        backLabel="Back to Planes for Sale"
        heading="Compare aircraft for sale"
        count={listings.length}
        columns={listings.map((p) => {
          const link = aircraftLink(p)
          return {
            key: p.id,
            header: (
              <ColumnHeader
                title={p.title}
                subtitle={aircraftHeading(p)}
                link={link}
              />
            ),
            bottomLink: link
              ? { href: link.href, external: link.external, text: `View ${aircraftHeading(p)} →` }
              : null,
          }
        })}
        rows={AIRCRAFT_ROWS.map((row) => ({
          label: row.label,
          cells: listings.map((p) => ({ key: p.id, node: row.render(p) })),
        }))}
      />
    )
  }

  // Partnerships (default)
  const listings = ids.length > 0 ? await getPartnershipsByIds(ids) : []
  if (listings.length < 2) return <EmptyPrompt count={listings.length} type="partnership" />

  return (
    <CompareLayout
      backHref="/partnerships"
      backLabel="Back to Partnerships"
      heading="Compare partnerships"
      count={listings.length}
      columns={listings.map((p) => ({
        key: p.id,
        header: (
          <ColumnHeader
            title={p.title}
            subtitle={aircraftLabel(p.make, p.model, p.year)}
            link={{ href: `/partnerships/${p.id}`, external: false, text: 'View listing →' }}
          />
        ),
        bottomLink: {
          href: `/partnerships/${p.id}`,
          external: false,
          text: `View ${aircraftLabel(p.make, p.model, p.year) || p.title} →`,
        },
      }))}
      rows={PARTNERSHIP_ROWS.map((row) => ({
        label: row.label,
        cells: listings.map((p) => ({ key: p.id, node: row.render(p) })),
      }))}
    />
  )
}

/* ─────────────────────────── Shared rendering ───────────────────────────── */

interface ColumnLink {
  href: string
  external: boolean
  text: string
}

function ColumnHeader({
  title,
  subtitle,
  link,
}: {
  title: string
  subtitle: string
  link: ColumnLink | null
}) {
  const inner = (
    <>
      <span className="block text-sm font-semibold text-slate-900 group-hover:text-sky-700">
        {title}
      </span>
      {subtitle && (
        <span className="mt-0.5 block text-xs font-medium text-slate-500">{subtitle}</span>
      )}
      {link && (
        <span className="mt-1 inline-block text-xs font-medium text-sky-600 group-hover:underline">
          {link.text}
        </span>
      )}
    </>
  )
  if (!link) return <div className="block text-left">{inner}</div>
  return link.external ? (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block text-left"
    >
      {inner}
    </a>
  ) : (
    <Link href={link.href} className="group block text-left">
      {inner}
    </Link>
  )
}

interface Column {
  key: string
  header: React.ReactNode
  bottomLink: ColumnLink | null
}

interface Row {
  label: string
  cells: { key: string; node: React.ReactNode }[]
}

function CompareLayout({
  backHref,
  backLabel,
  heading,
  count,
  columns,
  rows,
}: {
  backHref: string
  backLabel: string
  heading: string
  count: number
  columns: Column[]
  rows: Row[]
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <GitCompare className="h-6 w-6 text-sky-500" />
          {heading}
        </h1>
        <p className="mt-1 text-slate-500">{count} listings side by side.</p>
      </div>

      {/* Horizontal scroll keeps the table usable at 375px without clipping. */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[560px] border-separate border-spacing-0">
          <thead>
            <tr>
              {/* Sticky row-label corner */}
              <th className="sticky left-0 z-10 w-32 bg-slate-50 p-0" />
              {columns.map((col) => (
                <th key={col.key} className="border-b border-slate-200 bg-white p-3 align-top">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.label} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <th
                  scope="row"
                  className={`sticky left-0 z-10 whitespace-nowrap border-b border-slate-100 p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 ${
                    ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  {row.label}
                </th>
                {row.cells.map((cell) => (
                  <td
                    key={cell.key}
                    className="border-b border-slate-100 p-3 align-top text-sm text-slate-700"
                  >
                    {cell.node}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-column quick links also at the bottom for long tables. */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {columns.map((col) =>
          col.bottomLink ? (
            col.bottomLink.external ? (
              <a
                key={col.key}
                href={col.bottomLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-sky-700 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                {col.bottomLink.text}
              </a>
            ) : (
              <Link
                key={col.key}
                href={col.bottomLink.href}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-sky-700 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                {col.bottomLink.text}
              </Link>
            )
          ) : null
        )}
      </div>
    </div>
  )
}
