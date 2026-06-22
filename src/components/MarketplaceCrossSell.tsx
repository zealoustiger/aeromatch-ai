import Link from 'next/link'
import { Plane, Users, ArrowRight } from 'lucide-react'
import { AircraftForSale, Partnership } from '@/lib/types'
import AircraftRailCard from './AircraftRailCard'
import PartnershipRailCard from './PartnershipRailCard'

/**
 * A single, make-aware cross-sell card between the two marketplace types
 * (co-ownership partnerships ↔ planes for sale). Shown at the bottom of each
 * results page so a visitor who actually wants the *other* ownership model finds
 * it — and so crawlers get one more internal link between the two biggest hubs.
 *
 * Slice 3 of "Blend result types + cross-sell": in addition to the make-aware
 * count copy (slice 2), the card now surfaces up to a handful of REAL sample
 * listings from the OTHER marketplace as a compact horizontal mini-rail
 * (`samples`). Real data only — the rail is omitted entirely when there are no
 * matching listings (never padded/fabricated), and the card degrades to the
 * slice-2 heading + count + CTA. When a `make` filter is active it's carried into
 * the cross-link, the copy, and the sample query so the suggestions stay on-topic.
 */
export default function MarketplaceCrossSell({
  from,
  make,
  count,
  samples,
  className = '',
}: {
  /** Which marketplace the visitor is on now; the card promotes the OTHER one. */
  from: 'partnerships' | 'aircraft'
  /** Active make filter, if any — carried into the cross-link + the copy. */
  make?: string
  /** Live count of the OTHER marketplace's matching listings; shown only when > 0. */
  count?: number
  /**
   * Real sample listings from the OTHER marketplace to preview in a mini-rail.
   * Aircraft when `from='partnerships'`, partnerships when `from='aircraft'`.
   * Omitted/empty → no rail.
   */
  samples?: AircraftForSale[] | Partnership[]
  className?: string
}) {
  const m = make?.trim()
  const makeLabel = m ? `${m} ` : ''
  const makeQuery = m ? `?make=${encodeURIComponent(m)}` : ''
  // Only surface a real, positive count — fall back to the countless copy otherwise.
  const countLabel = count && count > 0 ? `${count.toLocaleString()} ` : ''

  const content =
    from === 'partnerships'
      ? {
          href: `/aircraft${makeQuery}`,
          Icon: Plane,
          heading: 'Prefer to own outright?',
          body: `Browse ${countLabel}${makeLabel}aircraft for sale aggregated from across the web — the same planes, owned solo instead of shared.`,
          cta: `Browse ${makeLabel}planes for sale`,
        }
      : {
          href: `/partnerships${makeQuery}`,
          Icon: Users,
          heading: 'Want to split the cost?',
          body: `See ${countLabel}${makeLabel}co-ownership partnerships — transparent buy-in, monthly, and hourly costs on every listing.`,
          cta: `Browse ${makeLabel}partnerships`,
        }

  const { href, Icon, heading, body, cta } = content

  // Up to 4 real samples; render nothing if none. `from` disambiguates the type.
  const rail = (samples ?? []).slice(0, 4)
  const hasRail = rail.length > 0

  return (
    <section className={`rounded-2xl border border-sky-200 bg-sky-50 p-5 ${className}`}>
      {/* Header — the primary cross-link (its own anchor; no nested links). */}
      <Link
        href={href}
        className="group flex items-center justify-between gap-4 rounded-lg transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="hidden shrink-0 rounded-xl bg-white p-2 text-sky-600 shadow-sm sm:block">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sky-600 group-hover:text-sky-700">
          <span className="hidden sm:inline">{cta}</span>
          <ArrowRight className="h-5 w-5" />
        </span>
      </Link>

      {/* Sample mini-rail of REAL listings from the other marketplace.
          `overflow-x-auto` scrolls the ROW within the card; the card has a fixed
          width within the results column, so there is zero PAGE overflow. */}
      {hasRail && (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {from === 'partnerships'
            ? (rail as AircraftForSale[]).map((p) => (
                <li key={p.id} className="contents">
                  <AircraftRailCard p={p} />
                </li>
              ))
            : (rail as Partnership[]).map((p) => (
                <li key={p.id} className="contents">
                  <PartnershipRailCard p={p} />
                </li>
              ))}
        </ul>
      )}
    </section>
  )
}
