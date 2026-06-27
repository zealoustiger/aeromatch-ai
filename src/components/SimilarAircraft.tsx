import { Layers } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { getSimilarAircraftForSale, getFamilyCompsForBatch } from '@/lib/aircraftForSale'
import { resolveMakeModelFamily } from '@/lib/seo'
import { clubHangerDealVerdict } from '@/lib/aircraftEstimate'
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
 * Each card shows a "Good deal" or "Priced high" chip using the year+hours-controlled
 * `clubHangerDealVerdict` (same as browse cards) — only when ≥4 same-family comps
 * fall within ±5 yr and ±1 000 hrs (or ±35%) of the subject listing, and the gap
 * clears the ±5% dead band. Listings without year or ttaf receive no chip. Comps are
 * batch-fetched per unique make+model family to avoid N+1 queries; each listing
 * self-excludes from its own comp set in JS.
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

  // Batch-fetch comps (id + price + year + ttaf) for each unique family in parallel.
  // One read per family; each similar listing self-excludes in JS below so there's no
  // N+1 query problem. Uses the year+hours-controlled deal verdict (same as browse cards)
  // rather than the whole-family estimate — a listing 20 years newer than the median
  // won't falsely show "Good deal" just because it's cheaper than a newer family.
  const familyEntries = [...familyMap.entries()]
  type BatchComp = { id: string; asking_price: number | null; year: number | null; ttaf: number | null }
  const compArrays = await Promise.all(
    familyEntries.map(([, spec]) =>
      getFamilyCompsForBatch(spec.make, spec.modelPattern, spec.notModelPattern)
    )
  )
  const familyCompsMap = new Map<FamilyKey, BatchComp[]>()
  familyEntries.forEach(([key], i) => familyCompsMap.set(key, compArrays[i]))

  // Compute per-listing deal verdict — only signal 'good' or 'high'; suppress 'fair'
  // to reduce noise. Honesty floors (≥4 similar-year + similar-hours comps, ±5% dead
  // band) enforced by clubHangerDealVerdict itself (returns null on thin/uncontrolled data).
  // Listings without year or ttaf never receive a verdict — correct self-suppression.
  const verdicts = new Map<string, 'below' | 'above'>()
  for (const p of similar) {
    const key = listingFamily.get(p.id)
    if (!key || !p.asking_price) continue
    const allComps = familyCompsMap.get(key) ?? []
    // Exclude the listing from its own comp set to avoid self-comparison bias.
    const comps = allComps.filter((c) => c.id !== p.id)
    const verdict = clubHangerDealVerdict(
      { askingPrice: p.asking_price, year: p.year, ttaf: p.ttaf },
      comps
    )
    if (verdict && verdict.verdict !== 'fair') {
      verdicts.set(p.id, verdict.verdict === 'good' ? 'below' : 'above')
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
