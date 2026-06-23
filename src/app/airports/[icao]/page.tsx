import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Plane, ArrowRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAirportsWithinRadius } from '@/lib/airports'
import { Partnership, Airport } from '@/lib/types'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, STATE_NAMES } from '@/lib/seo'
import { buildAirportJsonLd, buildPartnershipItemListJsonLd } from '@/lib/partnershipJsonLd'
import PartnershipCard from '@/components/PartnershipCard'
import {
  getNearbyPartnerships,
  getIndexableAirportHubs,
  isAirportIndexable,
  NEAR_RADIUS_NM,
  MIN_NEARBY,
} from '@/lib/nearbyPartnerships'

export const revalidate = 3600 // refresh hourly

async function getAirport(icao: string): Promise<Airport | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('airports')
    .select('*')
    .eq('icao', icao.toUpperCase())
    .single()
  return data
}

async function getListings(icaos: string[]): Promise<Partnership[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('partnerships')
    .select('*')
    .eq('status', 'active')
    .in('home_airport', icaos)
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ icao: string }>
}): Promise<Metadata> {
  const { icao } = await params
  const airport = await getAirport(icao)
  if (!airport) return { title: 'Airport not found' }

  const title = `Aircraft Partnerships at ${airport.name} (${airport.icao})`
  const description = `Find aircraft co-ownership partnerships, leasebacks, and flying shares based at ${airport.name} in ${airport.city}, ${airport.state} — and at nearby airports.`

  // Thin-page guard (GOAL.md INDEXING / no thin pages): only ~9 of the ~17k
  // airports have a partnership based there; the rest render a thin "no
  // partnerships based here yet" page. Keep those crawlable (follow) but out of
  // the index. Same rule the sitemap gates on (getIndexableAirportIcaos).
  const indexable = await isAirportIndexable(airport.icao)

  const url = `${SITE_URL}/airports/${airport.icao.toLowerCase()}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${airport.name} (${airport.icao}) on ClubHanger` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
  }
}

export default async function AirportPage({
  params,
}: {
  params: Promise<{ icao: string }>
}) {
  const { icao } = await params
  const airport = await getAirport(icao)
  if (!airport) notFound()

  const nearbyIcaos = await getAirportsWithinRadius(airport.icao, 50)
  const allListings = await getListings(nearbyIcaos)
  const atAirport = allListings.filter((l) => l.home_airport === airport.icao)
  const nearby = allListings.filter((l) => l.home_airport !== airport.icao)

  // Internal link to the canonical geo "partnerships near [airport]" page
  // (`/partnerships/near/[icao]`). Gate it on the EXACT same inventory check that
  // page + the sitemap use as the single source of truth (getNearbyPartnerships
  // + MIN_NEARBY within NEAR_RADIUS_NM): the near page 404s below the threshold,
  // so we only link when it will actually resolve 200 — never a broken link.
  const nearData = await getNearbyPartnerships(airport.icao)
  const nearCount =
    nearData && nearData.results.length >= MIN_NEARBY ? nearData.results.length : 0

  // Internal-linking graph (STAGE=INDEXING, #2 indexing lever): wire this hub up to
  // its state partnership page and across to the other genuinely-indexable airport
  // hubs, so the airport family is a crawlable mesh instead of a dead-end.
  const stateCode = airport.state?.toUpperCase()
  const stateName = stateCode ? STATE_NAMES[stateCode] : undefined // only link known USPS codes
  const otherHubs = (await getIndexableAirportHubs()).filter(
    (h) => h.icao !== airport.icao.toLowerCase()
  )

  // Schema.org: an Airport Place node (real codes/coords/region only) + an
  // ItemList of the partnerships shown on the page (in render order: at-airport
  // first, then nearby), each linking to its real /partnerships/[id]. Real data
  // only — no fabricated ratings/reviews. See src/lib/partnershipJsonLd.ts.
  const airportJsonLd = buildAirportJsonLd(airport)
  const listingItemList = buildPartnershipItemListJsonLd([...atAirport, ...nearby], {
    name: `Aircraft partnerships at ${airport.name} (${airport.icao})`,
    url: `${SITE_URL}/airports/${airport.icao.toLowerCase()}`,
  })

  return (
    <div className="ch-surface min-h-screen">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(airportJsonLd) }}
      />
      {listingItemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listingItemList) }}
        />
      )}
      <nav className="mb-6 text-sm text-slate-400">
        <Link href="/partnerships" className="hover:text-slate-600">
          Partnerships
        </Link>
        {stateName && stateCode && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/partnerships/state/${stateCode.toLowerCase()}`}
              className="hover:text-slate-600"
            >
              {stateName}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-slate-600">{airport.icao}</span>
      </nav>

      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
          <Plane className="h-7 w-7 text-sky-500" />
          Aircraft Partnerships at {airport.name}
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          {airport.name} ({airport.icao}
          {airport.iata ? ` / ${airport.iata}` : ''}) is located in {airport.city},{' '}
          {airport.state}
          {airport.elevation ? ` at a field elevation of ${airport.elevation} ft` : ''}. Browse
          active aircraft co-ownership partnerships, leasebacks, and flying shares based here, or
          widen your search to airports within 50 miles.
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-400">
          <MapPin className="h-4 w-4" />
          {airport.city}, {airport.state}
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Based at {airport.icao} ({atAirport.length})
        </h2>
        {atAirport.length > 0 ? (
          <div className="space-y-4">
            {atAirport.map((p) => (
              <PartnershipCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="ch-panel p-10 text-center">
            <p className="text-slate-500">No active partnerships based at {airport.icao} yet.</p>
            <Link
              href="/partnerships/new"
              className="mt-3 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Post the first one
            </Link>
          </div>
        )}
      </section>

      {nearby.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Within 50 miles of {airport.icao} ({nearby.length})
          </h2>
          <div className="space-y-4">
            {nearby.map((p) => (
              <PartnershipCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {nearCount > 0 && (
        <Link
          href={`/partnerships/near/${airport.icao.toLowerCase()}`}
          className="mt-10 flex items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-5 transition-colors hover:border-sky-300 hover:bg-sky-100"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Aircraft partnerships near {airport.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {nearCount} active{' '}
              {nearCount === 1 ? 'partnership' : 'partnerships'} within {NEAR_RADIUS_NM} nm of{' '}
              {airport.icao}, ordered by distance.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sky-600">
            <span className="hidden sm:inline">View</span>
            <ArrowRight className="h-5 w-5" />
          </span>
        </Link>
      )}

      {/* Cross-link the airport family — every link is a gated indexable hub that
          renders real "Based at {ICAO}" content, so this is a crawl mesh, not a set
          of thin/broken links (STAGE=INDEXING internal-linking lever). */}
      {otherHubs.length > 0 && (
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">
            Other airports with active partnerships
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Browse aircraft co-ownership shares based at these airports.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {otherHubs.map((h) => (
              <Link
                key={h.icao}
                href={`/airports/${h.icao}`}
                className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
              >
                {h.name}
                {h.city && h.state ? ` (${h.city}, ${h.state})` : ` (${h.icao.toUpperCase()})`}
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-sm text-slate-400">
        {stateName && stateCode ? (
          <>
            See all{' '}
            <Link
              href={`/partnerships/state/${stateCode.toLowerCase()}`}
              className="font-medium text-sky-600 hover:text-sky-700"
            >
              aircraft partnerships in {stateName}
            </Link>
            , or{' '}
          </>
        ) : (
          'Looking for something specific? '
        )}
        <Link
          href={`/partnerships?airport=${airport.icao}&radius=50`}
          className="font-medium text-sky-600 hover:text-sky-700"
        >
          search with filters →
        </Link>
      </p>
    </div>
    </div>
  )
}
