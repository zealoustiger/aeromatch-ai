import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Plane, ArrowRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAirportsWithinRadius } from '@/lib/airports'
import { Partnership, Airport } from '@/lib/types'
import { SITE_URL } from '@/lib/seo'
import { buildAirportJsonLd, buildPartnershipItemListJsonLd } from '@/lib/partnershipJsonLd'
import PartnershipCard from '@/components/PartnershipCard'
import {
  getNearbyPartnerships,
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

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/airports/${airport.icao.toLowerCase()}` },
    openGraph: { title, description },
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
        <span className="mx-2">/</span>
        <span className="text-slate-600">{airport.icao}</span>
      </nav>

      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Plane className="h-6 w-6 text-sky-500" />
          Aircraft Partnerships at {airport.name}
        </h1>
        <p className="mt-2 max-w-3xl text-slate-500">
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
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
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
          className="mt-10 flex items-center justify-between gap-4 rounded-xl border border-sky-200 bg-sky-50 p-5 transition-colors hover:border-sky-300 hover:bg-sky-100"
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

      <p className="mt-10 text-sm text-slate-400">
        Looking for something specific?{' '}
        <Link
          href={`/partnerships?airport=${airport.icao}&radius=50`}
          className="font-medium text-sky-600 hover:text-sky-700"
        >
          Search with filters →
        </Link>
      </p>
    </div>
  )
}
