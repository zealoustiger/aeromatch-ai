import { Layers } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { getSimilarAircraftForSale, getFamilyAskingPrices } from '@/lib/aircraftForSale'
import { resolveMakeModelFamily } from '@/lib/seo'
import { clubHangerEstimate } from '@/lib/aircraftEstimate'
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
 *
 * Each card shows an honest "Good deal" or "Priced high" chip when the listing's
 * asking price is outside the ±5% dead band of its family-wide median (same
 * honesty floors as the ClubHanger Estimate: ≥4 comps required, no chip for thin
 * data). Family prices are batch-fetched per unique make+model family to avoid
 * N+1 queries — most similar aircraft share the same make so there are 1-3 unique
 * families at most.
 */
export default async function SimilarAircraft({ current }: { current: AircraftForSale }) {
  const similar = await getSimilarAircraftForSale(current, 12)
  if (similar.length === 0) return null

  // Resolve each listing's make+model family and collect unique families to fetch.
  // Key: "{make}||{modelPattern}||{notModelPattern}" for deduplication.
  type FamilyKey = string
  interface FamilySpec { make: string; modelPattern: string; notModelPattern?: string }
  const familyMap = new Map<FamilyKey, FamilySpec>()
  const listingFamily = new Map<string, FamilyKey>()

  for (const p of similar) {
    if (!p.asking_price) continue
    const fam = resolveMakeModelFamily(p.make, p.model)
    if (!fam) continue
    const key: FamilyKey = `${fam.make}||${fam.modelPattern}||${fam.notModelPattern ?? ''}`
    if (!familyMap.has(key)) {
      familyMap.set(key, { make: fam.make, modelPattern: fam.modelPattern, notModelPattern: fam.notModelPattern })
    }
    listingFamily.set(p.id, key)
  }

  // Batch-fetch asking prices for each unique family in parallel.
  const familyEntries = [...familyMap.entries()]
  const priceArrays = await Promise.all(
    familyEntries.map(([, spec]) =>
      getFamilyAskingPrices(spec.make, spec.modelPattern, spec.notModelPattern)
    )
  )
  const familyPricesMap = new Map<FamilyKey, number[]>()
  familyEntries.forEach(([key], i) => familyPricesMap.set(key, priceArrays[i]))

  // Compute per-listing verdict — only signal outliers (below/above); skip 'around'
  // to reduce noise. Honesty floors (≥4 comps, ±5% dead band) enforced by
  // clubHangerEstimate itself, which returns null on thin data.
  const verdicts = new Map<string, 'below' | 'above'>()
  for (const p of similar) {
    const key = listingFamily.get(p.id)
    if (!key) continue
    const prices = familyPricesMap.get(key)
    if (!prices) continue
    const est = clubHangerEstimate(p.asking_price, prices)
    if (est && est.verdict !== 'around') {
      verdicts.set(p.id, est.verdict)
    }
  }

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Layers className="h-5 w-5 text-sky-600" />
        Similar aircraft for sale
      </h2>
      <RailScroller>
        {similar.map((p) => (
          <li key={p.id} className="shrink-0 snap-start">
            <AircraftRailCard p={p} compVerdict={verdicts.get(p.id)} />
          </li>
        ))}
      </RailScroller>
    </section>
  )
}
