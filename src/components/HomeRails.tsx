import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { fetchAircraftPage } from '@/components/AircraftSaleList'
import { getFamilyCompsForBatch } from '@/lib/aircraftForSale'
import { resolveMakeModelFamily } from '@/lib/seo'
import { clubHangerDealVerdict } from '@/lib/aircraftEstimate'
import { AircraftForSale } from '@/lib/types'
import AircraftRailCard from './AircraftRailCard'
import RailScroller from './RailScroller'

/**
 * Homepage curated rails (Etsy-style), slice 4 of the Etsy × Airbnb refresh.
 * Each rail is a horizontally-scrolling row of REAL for-sale aircraft, fetched
 * through the marketplace's own `fetchAircraftPage()` helper (single source of
 * truth — same query/ordering/quality-floor users see on `/aircraft`). A rail
 * whose query returns fewer than MIN_PER_RAIL real listings is dropped entirely
 * rather than padded, so a rail never looks thin or fabricates listings.
 *
 * Every rail title links to the matching EXISTING `/aircraft?...` filtered page,
 * which also spreads internal-link/crawl reachability (a side benefit while
 * STAGE=INDEXING). Additive: this renders below the newest-partnerships section
 * and touches no other part of the homepage.
 */

// Minimum real listings for a rail to render. Below this we drop the rail.
const MIN_PER_RAIL = 4
// How many cards we show per rail (a rail's query may return more; we slice).
const PER_RAIL = 12

interface RailDef {
  title: string
  /** Existing /aircraft filter params for this collection. */
  filters: Parameters<typeof fetchAircraftPage>[0]
  /** Href to the matching filtered search page (existing params only). */
  href: string
}

// Aspirational, no-cheap-lead collections (human P1 [want], 2026-06-22). Every
// rail carries `min_price: '50000'` so only real, priced aircraft show — parts
// and project listings sit below that, and no-price rows are excluded — which
// honors the "respect the $50k floor / only priced real aircraft" guidance.
// Titles name the actual filter so each rail is honest about what it shows.
const RAILS: RailDef[] = [
  {
    title: 'Just listed this week',
    filters: { min_price: '50000' }, // default sort = newest (created_at desc)
    href: '/aircraft?min_price=50000',
  },
  {
    title: 'Recently reduced',
    filters: { drops: '1', min_price: '50000', sort: 'reduced' },
    href: '/aircraft?drops=1&min_price=50000&sort=reduced',
  },
  {
    title: 'Glass-panel cross-country',
    filters: { q: 'glass', min_price: '50000' },
    href: '/aircraft?q=glass&min_price=50000',
  },
  {
    // Match the MODEL field (not free text) so the rail can't pull in unrelated
    // listings; %SR22% also covers the SR22T turbo — both are step-up singles.
    title: 'Step-up performance (Cirrus SR22)',
    filters: { make: 'Cirrus', modelPattern: '%SR22%', min_price: '50000' },
    href: '/aircraft/cirrus/sr22',
  },
  {
    // Model-field match avoids the `%172%`-vs-year-"1972" false positives a free
    // text search would hit; "See all" lands on the curated Cessna 172 page.
    title: 'Family four-seaters (Cessna 172)',
    filters: { make: 'Cessna', modelPattern: '%172%', min_price: '50000' },
    href: '/aircraft/cessna/172',
  },
]

interface ResolvedRail {
  title: string
  href: string
  listings: AircraftForSale[]
}

type FamilyKey = string
interface FamilySpec { make: string; modelPattern: string; notModelPattern?: string }
type BatchComp = { id: string; asking_price: number | null; year: number | null; ttaf: number | null }

export default async function HomeRails() {
  // Fetch every candidate rail in parallel via the marketplace's own helper.
  const resolved = await Promise.all(
    RAILS.map(async (rail): Promise<ResolvedRail | null> => {
      // photoOnly: homepage cards must always show a real plane photo, never the
      // make placeholder — a rail thinned below MIN_PER_RAIL drops out entirely.
      const { listings, error } = await fetchAircraftPage({ ...rail.filters, photoOnly: true })
      if (error || listings.length < MIN_PER_RAIL) return null
      return { title: rail.title, href: rail.href, listings: listings.slice(0, PER_RAIL) }
    })
  )

  // Drop empty/thin rails; de-dup is not needed (each rail is its own row).
  const rails = resolved.filter((r): r is ResolvedRail => r !== null)
  if (rails.length === 0) return null

  // Collect all unique make+model families across all rail listings so we can
  // batch-fetch comps in parallel (one query per family, not per listing).
  const familyMap = new Map<FamilyKey, FamilySpec>()
  const listingFamilyKey = new Map<string, FamilyKey>()

  for (const rail of rails) {
    for (const p of rail.listings) {
      if (!p.asking_price) continue
      const fam = resolveMakeModelFamily(p.make, p.model)
      if (!fam) continue
      const key: FamilyKey = `${fam.make}||${fam.modelPattern}||${fam.notModelPattern ?? ''}`
      if (!familyMap.has(key)) {
        familyMap.set(key, { make: fam.make, modelPattern: fam.modelPattern, notModelPattern: fam.notModelPattern })
      }
      listingFamilyKey.set(p.id, key)
    }
  }

  // Fetch comps for every unique family in one parallel Promise.all — no N+1 queries.
  const familyEntries = [...familyMap.entries()]
  const compArrays = await Promise.all(
    familyEntries.map(([, spec]) =>
      getFamilyCompsForBatch(spec.make, spec.modelPattern, spec.notModelPattern)
    )
  )
  const familyCompsMap = new Map<FamilyKey, BatchComp[]>()
  familyEntries.forEach(([key], i) => familyCompsMap.set(key, compArrays[i]))

  // Compute year+hours-controlled deal verdict per listing (same logic as browse cards
  // and Similar aircraft rail). Suppress 'fair' to reduce noise — only 'good'/'high'.
  const verdicts = new Map<string, 'below' | 'above'>()
  for (const rail of rails) {
    for (const p of rail.listings) {
      const key = listingFamilyKey.get(p.id)
      if (!key || !p.asking_price) continue
      const allComps = familyCompsMap.get(key) ?? []
      const comps = allComps.filter((c) => c.id !== p.id)
      const verdict = clubHangerDealVerdict(
        { askingPrice: p.asking_price, year: p.year, ttaf: p.ttaf },
        comps
      )
      if (verdict && verdict.verdict !== 'fair') {
        verdicts.set(p.id, verdict.verdict === 'good' ? 'below' : 'above')
      }
    }
  }

  return (
    <section className="ch-surface border-t border-slate-100 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Browse curated collections</h2>
          <p className="mt-1 text-slate-500">Hand-picked aircraft for sale, aggregated from across the web.</p>
        </div>

        <div className="space-y-10">
          {rails.map((rail) => (
            <div key={rail.href}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <Link
                  href={rail.href}
                  className="group inline-flex items-center gap-1.5 text-lg font-bold text-slate-900 hover:text-sky-700"
                >
                  {rail.title}
                  <ArrowRight className="h-4 w-4 text-sky-600 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href={rail.href}
                  className="hidden shrink-0 text-sm font-semibold text-sky-600 hover:text-sky-700 sm:block"
                >
                  See all
                </Link>
              </div>

              {/* Horizontal rail as a snap-carousel (hidden scrollbar + scroll-snap
                  + desktop chevrons). The row scrolls internally; the parent page
                  stays overflow-hidden so there is zero PAGE overflow. */}
              <RailScroller>
                {rail.listings.map((p) => (
                  <li key={p.id} className="shrink-0 snap-start">
                    <AircraftRailCard p={p} compVerdict={verdicts.get(p.id)} />
                  </li>
                ))}
              </RailScroller>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
