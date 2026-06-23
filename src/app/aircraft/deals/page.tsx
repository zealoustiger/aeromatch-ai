import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingDown, Plane, Info } from 'lucide-react'

import Breadcrumbs from '@/components/Breadcrumbs'
import AircraftSaleCard from '@/components/AircraftSaleCard'
import { fetchUnderMarketDeals, DEAL_MIN_PCT } from '@/components/AircraftSaleList'
import { SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'

const dealsTitle = 'Aircraft Priced Below Market — Great Deals on Planes for Sale'
const dealsDescription =
  'Active aircraft listings asking below the median price of comparable same make and model listings on ClubHanger — ranked by the biggest discount. A price-only market comparison.'

export const metadata: Metadata = {
  title: dealsTitle,
  description: dealsDescription,
  alternates: { canonical: '/aircraft/deals' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: '/aircraft/deals',
    title: dealsTitle,
    description: dealsDescription,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: dealsTitle,
    description: dealsDescription,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default async function AircraftDealsPage() {
  const deals = await fetchUnderMarketDeals(48)

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 sm:py-10 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Aircraft for Sale', href: '/aircraft' },
            { label: 'Priced below market' },
          ]}
        />

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
            <TrendingDown className="h-7 w-7 text-emerald-500" />
            Aircraft priced below market
          </h1>
          <p className="mt-1 max-w-3xl text-slate-600">
            Active listings asking at least {DEAL_MIN_PCT}% below the median price of comparable
            same make &amp; model aircraft on ClubHanger — biggest discounts first.
          </p>
        </div>

        {/* Honesty caveat — a price-only comparison, not an endorsement. */}
        <div className="mb-8 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            This is a <strong>price-only</strong> comparison against other listings of the same
            make and model (families with enough priced listings to compare). It does{' '}
            <strong>not</strong> account for year, total time, engine time, avionics, or condition —
            a lower price can reflect an older airframe, higher hours, or needed work. Always check
            the specifics and confirm details on the source listing.
          </p>
        </div>

        {deals.length > 0 ? (
          <div className="space-y-4">
            {deals.map(({ listing, comp }) => (
              <AircraftSaleCard key={listing.id} p={listing} comp={comp} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">No below-market listings to show right now.</p>
            <p className="mt-1 text-sm text-slate-400">
              Deals are computed live from current inventory — check back soon.
            </p>
            <Link
              href="/aircraft"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700"
            >
              <Plane className="h-4 w-4" />
              Browse all aircraft for sale
            </Link>
          </div>
        )}

        {/* Disclosure — mirrors the /aircraft aggregation note. */}
        <p className="mt-6 text-xs text-slate-400">
          Listings are aggregated from third-party sites and link back to the original source.
          ClubHanger is not the seller. &ldquo;Below market&rdquo; reflects asking prices on
          ClubHanger only and may be out of date — confirm details on the source listing.
        </p>
      </div>
    </div>
  )
}
