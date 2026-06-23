import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getLatestPartnerships } from '@/lib/partnerships'
import FeaturedListingCard from './FeaturedListingCard'
import RailScroller from './RailScroller'

export default async function FeaturedListings() {
  // Fetch 12 (was 6) so the rail has more to swipe through, matching the
  // 12-card homepage curated rails and the in-listing "Similar" rails.
  const listings = await getLatestPartnerships(12)

  if (listings.length === 0) return null

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Newest partnerships</h2>
            <p className="mt-1 text-slate-500">Fresh co-ownership opportunities across the country</p>
          </div>
          <Link
            href="/partnerships"
            className="hidden items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Horizontal snap-carousel (hidden scrollbar + scroll-snap + desktop
            chevrons), shared with the curated rails + the in-listing "Similar"
            rails via RailScroller. Cards stay server-rendered; the row scrolls
            internally so there is zero PAGE overflow. Fixed-width <li> wrappers
            constrain the otherwise full-width FeaturedListingCard. */}
        <RailScroller>
          {listings.map((p) => (
            <li key={p.id} className="w-72 shrink-0 snap-start sm:w-80">
              <FeaturedListingCard p={p} />
            </li>
          ))}
        </RailScroller>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/partnerships"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600"
          >
            View all partnerships <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
