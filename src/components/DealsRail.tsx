import Link from 'next/link'
import { TrendingDown } from 'lucide-react'
import { fetchUnderMarketDeals } from '@/components/AircraftSaleList'
import AircraftRailCard from './AircraftRailCard'
import RailScroller from './RailScroller'

/**
 * Homepage "Priced below market" rail — slice 1 of the [P2][want] "Great Deals"
 * item (the `/aircraft/deals` destination shipped the cycle before this one and
 * exported `fetchUnderMarketDeals()` for exactly this rail).
 *
 * Surfaces the SAME below-market deals as `/aircraft/deals`, ranked biggest
 * discount first, via the same `fetchUnderMarketDeals()` helper — so the homepage
 * gives buyers an at-a-glance reason to dig in (the Redfin "hot homes" loop)
 * without any new comp math or DB query beyond that helper. Each card carries the
 * same emerald "~X% below average" pill the deals page + per-card pill use, so the
 * three stay consistent. Additive: renders below the curated rails and touches no
 * other part of the homepage.
 *
 * Honesty guardrails (GOAL.md): the helper already enforces the $50k real-aircraft
 * floor, the site quality floor, a >= DEAL_MIN_PCT (10%) genuine-discount band, and
 * a per-family cap; if there are fewer than MIN_PER_RAIL real deals the whole rail
 * is dropped rather than padded — never thin or fabricated.
 */

// Minimum real deals for the rail to render. Below this we drop it entirely.
const MIN_PER_RAIL = 4
// How many cards we show in the rail (the deals page shows the full list).
const PER_RAIL = 12

export default async function DealsRail() {
  // photoOnly: every homepage deal card shows a real photo (drops the rail below
  // MIN_PER_RAIL → hidden, rather than surfacing a placeholder).
  const deals = await fetchUnderMarketDeals(PER_RAIL, true)
  if (deals.length < MIN_PER_RAIL) return null

  return (
    <section className="bg-white border-t border-slate-100 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            <TrendingDown className="h-6 w-6 text-emerald-500" />
            Priced below market
          </h2>
          <p className="mt-1 text-slate-500">
            Active listings asking below the median for the same make &amp; model — a price-only
            comparison, biggest discount first.
          </p>
        </div>

        <div className="mb-3 flex items-end justify-between gap-3">
          <Link
            href="/aircraft/deals"
            className="group inline-flex items-center gap-1.5 text-lg font-bold text-slate-900 hover:text-sky-700"
          >
            Below-market deals
            <TrendingDown className="h-4 w-4 text-emerald-600 transition-transform group-hover:translate-y-0.5" />
          </Link>
          <Link
            href="/aircraft/deals"
            className="hidden shrink-0 text-sm font-semibold text-sky-600 hover:text-sky-700 sm:block"
          >
            See all
          </Link>
        </div>

        {/* Horizontal rail as a snap-carousel (hidden scrollbar + scroll-snap +
            desktop chevrons). The row scrolls internally; the page stays
            overflow-hidden so there is zero PAGE overflow. */}
        <RailScroller>
          {deals.map(({ listing, comp }) => (
            <li key={listing.id} className="shrink-0 snap-start">
              <AircraftRailCard p={listing} discountPct={comp.pct} />
            </li>
          ))}
        </RailScroller>
      </div>
    </section>
  )
}
