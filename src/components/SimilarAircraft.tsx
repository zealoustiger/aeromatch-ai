import { Layers } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { getSimilarAircraftForSale } from '@/lib/aircraftForSale'
import AircraftSaleCard from './AircraftSaleCard'

/**
 * "Similar aircraft for sale" module for the listing detail page: real other
 * active same-make listings (same make+model family ranked first), excluding the
 * current one, each a crawlable internal <Link> to its own detail page via
 * AircraftSaleCard. Keeps buyers browsing on-site (the Zillow "more like this"
 * loop) and adds internal links between detail pages. Fails soft — renders
 * nothing when there are no sensible matches.
 */
export default async function SimilarAircraft({ current }: { current: AircraftForSale }) {
  const similar = await getSimilarAircraftForSale(current, 3)
  if (similar.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Layers className="h-5 w-5 text-sky-600" />
        Similar aircraft for sale
      </h2>
      <div className="space-y-4">
        {similar.map((p) => (
          <AircraftSaleCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  )
}
