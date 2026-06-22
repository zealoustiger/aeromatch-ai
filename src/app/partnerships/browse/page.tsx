import type { Metadata } from 'next'
import Link from 'next/link'
import { Plane, MapPin, Navigation, ArrowRight } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import {
  SEO_MAKES,
  STATE_CODES,
  STATE_NAMES,
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
} from '@/lib/seo'
import {
  countPartnershipsByMake,
  countPartnershipsByState,
} from '@/lib/partnershipsQuery'
import { getNearAirportHubs, NEAR_RADIUS_NM } from '@/lib/nearbyPartnerships'

// This hub is a genuine navigation index, not a doorway page: every link below is
// gated on a LIVE active-partnership count > 0 (makes/states) or the same
// MIN_NEARBY gate the near-airport route + sitemap use, so no link points at an
// empty/thin family.

const PATH = '/partnerships/browse'
const URL = `${SITE_URL}${PATH}`
const title = 'Browse all aircraft partnerships — by make, state & airport'
const description =
  'A complete index of every aircraft-partnership page on ClubHanger: browse co-ownership shares by aircraft make, by US state, or near a home airport — all in one place. Free to search and post.'

export const metadata: Metadata = {
  title: { absolute: `${title} | ${SITE_NAME}` },
  description,
  alternates: { canonical: PATH },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: PATH,
    title,
    description,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [DEFAULT_OG_IMAGE],
  },
}

export const revalidate = 3600 // refresh hourly, matching the near-airport pages

export default async function PartnershipsBrowsePage() {
  // --- By make (the 8 curated SEO_MAKES, gated on live inventory) -------------
  const makeCounts = await Promise.all(
    SEO_MAKES.map((m) => countPartnershipsByMake(m.filter))
  )
  const makes = SEO_MAKES.map((m, i) => ({ ...m, n: makeCounts[i] }))
    .filter((m) => m.n > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  // --- By state (all states, gated on live inventory) ------------------------
  const stateCounts = await Promise.all(
    STATE_CODES.map((code) => countPartnershipsByState(code))
  )
  const states = STATE_CODES.map((code, i) => ({ code, n: stateCounts[i] }))
    .filter((s) => s.n > 0)
    .sort((a, b) => STATE_NAMES[a.code].localeCompare(STATE_NAMES[b.code]))

  // --- Near an airport (same gated hub set as the route + sitemap) -----------
  const hubs = await getNearAirportHubs()

  // CollectionPage JSON-LD: an ItemList of the make hub pages (real pages, each
  // with >= 1 live listing). Mirrors the /aircraft/browse pattern.
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: URL,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: makes.length,
      itemListElement: makes.map((m, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${m.name} aircraft partnerships`,
        url: `${SITE_URL}/partnerships/make/${m.slug}`,
      })),
    },
  }

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
        />

        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Partnerships', href: '/partnerships' },
            { label: 'Browse' },
          ]}
        />

        {/* Header */}
        <header className="mb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
            <Plane className="h-7 w-7 text-sky-500" />
            Browse all aircraft partnerships
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Every aircraft-partnership page on ClubHanger in one index — jump straight to a make,
            to co-ownership shares in your state, or to partnerships near a home airport. Every link
            goes to real, active listings.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            <Link href="/partnerships" className="font-medium text-sky-600 hover:underline">
              ← Back to search
            </Link>
            <span className="mx-2 text-slate-300">·</span>
            <a href="#by-make" className="text-sky-600 hover:underline">By make</a>
            <span className="mx-2 text-slate-300">·</span>
            <a href="#by-state" className="text-sky-600 hover:underline">By state</a>
            <span className="mx-2 text-slate-300">·</span>
            <a href="#by-airport" className="text-sky-600 hover:underline">Near an airport</a>
          </p>
        </header>

        {/* ---- By make ---- */}
        {makes.length > 0 && (
          <section id="by-make" className="ch-panel mb-8 scroll-mt-24 p-5 sm:p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Plane className="h-5 w-5 text-sky-500" />
              By make
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              {makes.length} {makes.length === 1 ? 'make' : 'makes'} with active partnerships. Pick a
              make to see every co-ownership share.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {makes.map((m) => (
                <Link
                  key={m.slug}
                  href={`/partnerships/make/${m.slug}`}
                  className="text-sm text-slate-600 hover:text-sky-600 hover:underline"
                >
                  {m.name} partnerships{' '}
                  <span className="text-xs text-slate-400">({m.n.toLocaleString()})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ---- By state ---- */}
        {states.length > 0 && (
          <section id="by-state" className="ch-panel mb-8 scroll-mt-24 p-5 sm:p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <MapPin className="h-5 w-5 text-sky-500" />
              By state
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Aircraft partnerships in {states.length}{' '}
              {states.length === 1 ? 'state' : 'states'} with active listings.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {states.map(({ code, n }) => (
                <Link
                  key={code}
                  href={`/partnerships/state/${code.toLowerCase()}`}
                  className="text-sm text-slate-600 hover:text-sky-600 hover:underline"
                >
                  {STATE_NAMES[code]}{' '}
                  <span className="text-xs text-slate-400">({n.toLocaleString()})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ---- Near an airport ---- */}
        {hubs.length > 0 && (
          <section id="by-airport" className="ch-panel mb-8 scroll-mt-24 p-5 sm:p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Navigation className="h-5 w-5 text-sky-500" />
              Near an airport
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              {hubs.length} {hubs.length === 1 ? 'airport hub' : 'airport hubs'} with partnerships
              within {NEAR_RADIUS_NM} nm.
            </p>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {hubs.map((h) => {
                const place = [h.city, h.state].filter(Boolean).join(', ')
                return (
                  <Link
                    key={h.icao}
                    href={`/partnerships/near/${h.icao}`}
                    className="flex min-w-0 items-baseline justify-between gap-2 text-sm text-slate-600 hover:text-sky-600 hover:underline"
                  >
                    <span className="min-w-0 truncate">
                      {h.name}{' '}
                      <span className="text-slate-400">({h.icao.toUpperCase()})</span>
                      {place && <span className="text-slate-400"> · {place}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{h.count.toLocaleString()}</span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty fallback (Supabase unavailable at build/request time) */}
        {makes.length === 0 && states.length === 0 && hubs.length === 0 && (
          <div className="ch-panel p-6 text-slate-600">
            <p>
              Listings are loading. In the meantime,{' '}
              <Link href="/partnerships" className="font-medium text-sky-600 hover:underline">
                search all aircraft partnerships
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mt-2">
          <Link
            href="/partnerships"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            View all aircraft partnerships <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
