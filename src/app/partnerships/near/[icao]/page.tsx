import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Plane, MapPin, ArrowRight } from 'lucide-react'
import PartnershipCard from '@/components/PartnershipCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import AlertSignup from '@/components/AlertSignup'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, STATE_NAMES } from '@/lib/seo'
import { buildPartnershipItemListJsonLd } from '@/lib/partnershipJsonLd'
import {
  getNearbyPartnerships,
  NEAR_RADIUS_NM,
  MIN_NEARBY,
} from '@/lib/nearbyPartnerships'

export const revalidate = 3600 // refresh hourly, matching /airports/[icao]

type Props = { params: Promise<{ icao: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { icao } = await params
  const data = await getNearbyPartnerships(icao)
  if (!data || data.results.length < MIN_NEARBY) return { title: 'Airport not found' }

  const { airport, results } = data
  const place = [airport.city, airport.state].filter(Boolean).join(', ')
  // The root layout applies the "%s | ClubHanger" title template, so this title
  // omits the brand suffix (avoids "… | ClubHanger | ClubHanger"). Rendered title
  // becomes "Aircraft partnerships near {name} ({ICAO}) | ClubHanger".
  const title = `Aircraft partnerships near ${airport.name} (${airport.icao})`
  const description = `Browse ${results.length} aircraft co-ownership partnerships and flying shares within ${NEAR_RADIUS_NM} nm of ${airport.name}${place ? ` in ${place}` : ''}. See buy-in, monthly, and hourly costs upfront — ordered by distance. Free to search.`
  const url = `${SITE_URL}/partnerships/near/${airport.icao.toLowerCase()}`
  const ogDescription = `Co-ownership shares and flying partnerships within ${NEAR_RADIUS_NM} nm of ${airport.name}, ordered by distance.`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: ogDescription,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${title} on ${SITE_NAME}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: ogDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function NearAirportPartnershipsPage({ params }: Props) {
  const { icao } = await params
  const data = await getNearbyPartnerships(icao)

  // Thin-page guardrail (GOAL.md): only render when there is real nearby
  // inventory. Unknown ICAO, or below the threshold → 404, never a thin page.
  if (!data || data.results.length < MIN_NEARBY) notFound()

  const { airport, results } = data
  const place = [airport.city, airport.state].filter(Boolean).join(', ')
  const stateName = airport.state ? STATE_NAMES[airport.state] : null

  // ItemList JSON-LD from the SAME ordered result set the page renders, so the
  // markup matches the visible cards 1:1 (each item → a real /partnerships/[id]).
  const itemListJsonLd = buildPartnershipItemListJsonLd(
    results.map((r) => r.p),
    {
      name: `Aircraft partnerships near ${airport.name} (${airport.icao})`,
      url: `${SITE_URL}/partnerships/near/${airport.icao.toLowerCase()}`,
    }
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Partnerships', href: '/partnerships' },
          { label: `Near ${airport.icao}` },
        ]}
      />

      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          <Plane className="h-7 w-7 shrink-0 text-sky-600" />
          Aircraft partnerships near {airport.name}
        </h1>
        <p className="mt-2 max-w-3xl text-slate-500">
          {results.length} active aircraft co-ownership{' '}
          {results.length === 1 ? 'partnership' : 'partnerships'} within {NEAR_RADIUS_NM} nm of{' '}
          {airport.name} ({airport.icao}
          {airport.iata ? ` / ${airport.iata}` : ''}){place ? `, ${place}` : ''} — sorted by
          distance. Every listing shows the buy-in price, monthly fixed costs, and hourly wet
          rate upfront, so you know what flying will cost before you reach out. Based near here?{' '}
          <Link href="/partnerships/new" className="font-medium text-sky-600 hover:underline">
            Post a free listing
          </Link>
          .
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-400">
          <MapPin className="h-4 w-4" />
          {place || airport.icao}
        </p>
      </div>

      <div className="space-y-4">
        {results.map(({ p, distanceNm }) => (
          <div key={p.id}>
            <p className="mb-1 text-xs font-medium text-sky-700">
              {distanceNm === 0
                ? `Based at ${airport.icao}`
                : `${distanceNm} nm from ${airport.icao} · ${p.home_airport}`}
            </p>
            <PartnershipCard p={p} />
          </div>
        ))}
      </div>

      {/* No-account email capture for new nearby partnerships — same low-friction,
          confirmed double-opt-in pipeline the make/state hubs + for-sale pages use. */}
      <AlertSignup
        context={`${airport.icao} area`}
        sourcePath={`/partnerships/near/${airport.icao.toLowerCase()}`}
        noun="partnership"
      />

      {/* Cross-links */}
      <div className="mt-12 grid gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            Partnerships at {airport.icao}
          </h2>
          <p className="mb-3 text-sm text-slate-500">
            See partnerships based at {airport.name} and the airport&apos;s full detail page.
          </p>
          <Link
            href={`/airports/${airport.icao.toLowerCase()}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            View {airport.icao} airport page <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {airport.state && stateName && (
          <div>
            <h2 className="mb-3 text-base font-semibold text-slate-900">
              Browse all of {stateName}
            </h2>
            <p className="mb-3 text-sm text-slate-500">
              Widen your search to every aircraft partnership across {stateName}.
            </p>
            <Link
              href={`/partnerships/state/${airport.state.toLowerCase()}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
            >
              Partnerships in {stateName} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
