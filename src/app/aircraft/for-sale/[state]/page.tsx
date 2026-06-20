import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Plane, MapPin, ArrowRight } from 'lucide-react'
import AircraftSaleList, { countForSaleState, fetchAircraftPage, topMakeModelsForState } from '@/components/AircraftSaleList'
import Breadcrumbs from '@/components/Breadcrumbs'
import AlertSignup from '@/components/AlertSignup'
import { STATE_CODES, STATE_NAMES, stateSlug, getStateBySlug, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import { buildAircraftItemListJsonLd } from '@/lib/aircraftJsonLd'

type Props = { params: Promise<{ state: string }> }

export function generateStaticParams() {
  // Slug = the full state name people search ("aircraft for sale california").
  return STATE_CODES.map((code) => ({ state: stateSlug(STATE_NAMES[code]) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params
  const entry = getStateBySlug(state)
  if (!entry) return {}

  const n = await countForSaleState(entry.code)
  if (n === 0) return {}
  const count = n.toLocaleString()
  const slug = stateSlug(entry.name)
  const path = `/aircraft/for-sale/${slug}`
  const url = `${SITE_URL}${path}`
  // Page-specific OG/Twitter copy reflecting THIS state (mirrors the per-page
  // card pattern shipped on /partnerships/[id]). No per-aircraft image — fall
  // back to the SAME site default OG card so a shared link always unfurls into a
  // real card, never a broken/empty image.
  const ogTitle = `Aircraft for sale in ${entry.name} — ${count} aircraft`
  const ogDescription = `General aviation aircraft for sale located in ${entry.name}, searchable in one place on ClubHanger.`

  return {
    // Title pattern per spec: "Aircraft for sale in {State} — {N} aircraft | ClubHanger".
    // `absolute` bypasses the root layout's "%s | ClubHanger" template so the
    // " | ClubHanger" isn't doubled.
    title: { absolute: `Aircraft for sale in ${entry.name} — ${count} aircraft | ClubHanger` },
    description: `Browse ${count} aircraft for sale in ${entry.name}, aggregated from across the web. Filter by make, year, and price — every listing links back to its source. Free to search.`,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, alt: `Aircraft for sale in ${entry.name} on ClubHanger` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function StateAircraftForSalePage({ params }: Props) {
  const { state } = await params
  const entry = getStateBySlug(state)
  if (!entry) notFound()

  const n = await countForSaleState(entry.code)
  // Guardrail: never render a thin/doorway page. A state with no active inventory
  // 404s rather than showing an empty "for sale in {state}" landing page.
  if (n === 0) notFound()

  const otherStates = STATE_CODES.filter((c) => c !== entry.code).slice(0, 14)
  const path = `/aircraft/for-sale/${stateSlug(entry.name)}`

  // FAMILY→FAMILY rail (slice 2): the most-listed make+model families in THIS
  // state that have a real /aircraft/[make]/[model] page. Each is resolved
  // through the shared resolveMakeModelFamily, so no link can 404.
  const popularModels = await topMakeModelsForState(entry.code, 8)

  // ItemList JSON-LD for rich results — marks up exactly the first page of
  // listings the visitor sees (same state filter/order as the rendered list),
  // each as a Product/Offer with real data only. See src/lib/aircraftJsonLd.ts.
  const { listings } = await fetchAircraftPage({ state: entry.code })
  const itemListJsonLd = buildAircraftItemListJsonLd(listings, {
    name: `${entry.name} aircraft for sale`,
    url: `${SITE_URL}${path}`,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Aircraft for Sale', href: '/aircraft' },
          { label: entry.name },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          <MapPin className="h-7 w-7 text-sky-500" />
          {entry.name} aircraft for sale
        </h1>
        <p className="mt-2 max-w-3xl text-slate-500">
          <span className="font-semibold text-slate-700">{n.toLocaleString()}</span>{' '}
          {n === 1 ? 'aircraft' : 'aircraft'} for sale located in {entry.name}, aggregated from
          across the web and searchable in one place. Every listing shows make, model, year, and
          asking price, and links back to its original source. Looking to split the cost of one?{' '}
          <Link href="/partnerships" className="font-medium text-sky-600 hover:underline">
            Browse {entry.name} aircraft partnerships
          </Link>
          .
        </p>
      </div>

      {/* Email-alerts capture (slice 1) — inline, no account required. */}
      <AlertSignup context={entry.name} sourcePath={path} />

      {/* Listings */}
      <Suspense fallback={<ListSkeleton />}>
        <AircraftSaleList
          filters={{
            state: entry.code,
            basePath: `/aircraft/for-sale/${stateSlug(entry.name)}`,
          }}
        />
      </Suspense>

      {/* Aggregation disclosure */}
      <p className="mt-6 text-xs text-slate-400">
        Listings are aggregated from third-party sites and link back to the original source.
        ClubHanger is not the seller. Listing data may be out of date — confirm details on the
        source listing.
      </p>

      {/* Popular make+model families in this state (slice 2 family→family rail) */}
      {popularModels.length > 0 && (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Plane className="h-4 w-4 text-sky-500" />
            Popular aircraft for sale in {entry.name}
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {popularModels.map(({ entry: e }) => (
              <Link
                key={`${e.makeSlug}/${e.modelSlug}`}
                href={`/aircraft/${e.makeSlug}/${e.modelSlug}`}
                className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
              >
                {e.make} {e.model} for sale
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Cross-links */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Aircraft for sale in other states</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {otherStates.map((c) => (
            <Link
              key={c}
              href={`/aircraft/for-sale/${stateSlug(STATE_NAMES[c])}`}
              className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
            >
              {STATE_NAMES[c]}
            </Link>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Link
            href="/aircraft"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            <Plane className="h-4 w-4" /> View all aircraft for sale <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}
