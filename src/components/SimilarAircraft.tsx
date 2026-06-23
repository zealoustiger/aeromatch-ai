import { Layers } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { getSimilarAircraftForSale } from '@/lib/aircraftForSale'
import AircraftRailCard from './AircraftRailCard'
import RailScroller from './RailScroller'

/**
 * "Similar aircraft for sale" module for the listing detail page: real other
 * active same-make listings (same make+model family ranked first), excluding the
 * current one, each a crawlable internal <Link> to its own detail page. Keeps
 * buyers browsing on-site (the Zillow "more like this" loop) and adds internal
 * links between detail pages. Fails soft — renders nothing when there are no
 * sensible matches.
 *
 * Presentation: a horizontal snap-carousel (hidden scrollbar + scroll-snap +
 * desktop chevrons) of compact `AircraftRailCard`s, shared with the homepage
 * curated rails via `RailScroller` — the "more like this" Option-B rail. Fetches
 * up to 12 so the rail is worth scrolling; cards stay server-rendered children.
 */
export default async function SimilarAircraft({ current }: { current: AircraftForSale }) {
  const similar = await getSimilarAircraftForSale(current, 12)
  if (similar.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Layers className="h-5 w-5 text-sky-600" />
        Similar aircraft for sale
      </h2>
      <RailScroller>
        {similar.map((p) => (
          <li key={p.id} className="shrink-0 snap-start">
            <AircraftRailCard p={p} />
          </li>
        ))}
      </RailScroller>
    </section>
  )
}
