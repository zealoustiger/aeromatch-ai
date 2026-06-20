import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { Plane, ArrowRight } from 'lucide-react'
import AircraftSaleList, { countMakeModel, fetchAircraftPage } from '@/components/AircraftSaleList'
import Breadcrumbs from '@/components/Breadcrumbs'
import ForSaleGuideLinks from '@/components/ForSaleGuideLinks'
import AlertSignup from '@/components/AlertSignup'
import { getInventoryMakes, resolveMake, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, type SeoMakeModel } from '@/lib/seo'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'
import { buildAircraftItemListJsonLd, buildAircraftAggregateOfferJsonLd } from '@/lib/aircraftJsonLd'

type Props = { params: Promise<{ make: string }> }

// Prebuild every make that has inventory-backed model families. Any valid make
// not prebuilt still renders on demand (dynamicParams stays default `true`); the
// live count===0 guard below 404s thin/garbage makes.
export async function generateStaticParams() {
  const makes = await getInventoryMakes()
  return makes.map((m) => ({ make: m.makeSlug }))
}

/**
 * Live per-model breakdown for a make: each inventory-backed model family with
 * its CURRENT active count, keeping only families that still have ≥1 listing,
 * sorted most-listed first. This is the page's unique aggregate value (and the
 * source of the title's total N), computed from the same `countMakeModel` the
 * model pages and sitemap use — so the make page can never disagree with them.
 */
async function modelBreakdown(
  models: SeoMakeModel[]
): Promise<{ entry: SeoMakeModel; n: number }[]> {
  const counts = await Promise.all(
    models.map((e) => countMakeModel(e.make, e.modelPattern, e.notModelPattern))
  )
  return models
    .map((entry, i) => ({ entry, n: counts[i] }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make } = await params
  const entry = await resolveMake(make)
  if (!entry) return {}

  const breakdown = await modelBreakdown(entry.models)
  const total = breakdown.reduce((sum, r) => sum + r.n, 0)
  if (total === 0) return {}

  const count = total.toLocaleString()
  const path = `/aircraft/${entry.makeSlug}`
  const url = `${SITE_URL}${path}`
  const ogTitle = `${entry.make} aircraft for sale — ${count} listings`
  const ogDescription = `Every ${entry.make} aircraft for sale, aggregated from across the web and grouped by model on ClubHanger.`

  return {
    // Title pattern per spec: "{Make} aircraft for sale — {N} listings | ClubHanger".
    // `absolute` bypasses the root layout's "%s | ClubHanger" template so the
    // " | ClubHanger" isn't doubled.
    title: { absolute: `${entry.make} aircraft for sale — ${count} listings | ClubHanger` },
    description: `Browse ${count} ${entry.make} aircraft for sale across ${breakdown.length} ${breakdown.length === 1 ? 'model' : 'models'}, aggregated from across the web. Compare ${entry.make} models, see how many of each are for sale, and search them all in one place.`,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, alt: `${entry.make} aircraft for sale on ClubHanger` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function MakeForSalePage({ params }: Props) {
  const { make } = await params
  const entry = await resolveMake(make)
  if (!entry) notFound()

  const breakdown = await modelBreakdown(entry.models)
  const total = breakdown.reduce((sum, r) => sum + r.n, 0)
  // Guardrail: never render a thin/doorway page. If no model of this make has any
  // live inventory, 404 rather than show an empty make landing page.
  if (total === 0) notFound()

  const path = `/aircraft/${entry.makeSlug}`

  // Other makes for the cross-link rail — every one is inventory-backed, so no
  // link can 404. Exclude the current make; cap at 14.
  const otherMakes = (await getInventoryMakes())
    .filter((m) => m.makeSlug !== entry.makeSlug)
    .slice(0, 14)

  // CollectionPage JSON-LD: an ItemList of the make's model pages (real data —
  // each item is a page that exists with ≥1 live listing). Mirrors the repo's
  // existing application/ld+json pattern; no fabricated properties.
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${entry.make} aircraft for sale`,
    url: `${SITE_URL}${path}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: breakdown.length,
      itemListElement: breakdown.map((r, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${r.entry.make} ${r.entry.model} for sale`,
        url: `${SITE_URL}/aircraft/${r.entry.makeSlug}/${r.entry.modelSlug}`,
      })),
    },
  }

  // ItemList JSON-LD for the listings the visitor actually sees (same make filter
  // and order as the rendered list), each a Product/Offer with real data only.
  const { listings } = await fetchAircraftPage({ make: entry.make })
  const itemListJsonLd = buildAircraftItemListJsonLd(listings, {
    name: `${entry.make} aircraft for sale`,
    url: `${SITE_URL}${path}`,
  })
  // Page-level price-range AggregateOffer (real data only; null when <2 priced).
  const aggregateOfferJsonLd = buildAircraftAggregateOfferJsonLd(listings, {
    name: `${entry.make} aircraft for sale`,
    url: `${SITE_URL}${path}`,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      {aggregateOfferJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateOfferJsonLd) }}
        />
      )}
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Aircraft for Sale', href: '/aircraft' },
          { label: `${entry.make} for sale` },
        ]}
      />

      {/* Header with photo */}
      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="p-6 sm:p-8">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              <Plane className="h-7 w-7 text-sky-500" />
              {entry.make} aircraft for sale
            </h1>
            <p className="mt-2 text-slate-500">
              <span className="font-semibold text-slate-700">{total.toLocaleString()}</span>{' '}
              {entry.make} aircraft for sale across{' '}
              <span className="font-semibold text-slate-700">{breakdown.length}</span>{' '}
              {breakdown.length === 1 ? 'model' : 'models'}, aggregated from across the web —
              search them all in one place. Looking to split the cost?{' '}
              <Link href="/partnerships" className="font-medium text-sky-600 hover:underline">
                Browse {entry.make} partnerships
              </Link>
              .
            </p>
          </div>
          <div className="relative hidden h-full min-h-[200px] md:block">
            <Image
              src={getPlaceholderPhoto(entry.make)}
              alt={`${entry.make} aircraft`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 0vw, 50vw"
            />
            <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
              Not actual plane photo
            </span>
          </div>
        </div>
      </div>

      {/* Per-model breakdown — the make page's unique aggregate value. Each model
          family with its live count, linking down to its own for-sale page. */}
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
          <Plane className="h-4 w-4 text-sky-500" />
          {entry.make} models for sale
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Browse {entry.make} by model — pick a model to see just those listings.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {breakdown.map(({ entry: e, n }) => (
            <li key={`${e.makeSlug}/${e.modelSlug}`}>
              <Link
                href={`/aircraft/${e.makeSlug}/${e.modelSlug}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-sky-300 hover:bg-sky-50/60"
              >
                <span className="font-medium text-slate-700">
                  {e.make} {e.model}
                </span>
                <span className="shrink-0 text-sm text-slate-500">
                  <span className="font-semibold text-sky-700">{n.toLocaleString()}</span> for sale
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Email-alerts capture — inline, no account required. */}
      <AlertSignup context={entry.make} sourcePath={path} />

      {/* All listings for the make */}
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        All {entry.make} listings
      </h2>
      <Suspense fallback={<ListSkeleton />}>
        <AircraftSaleList
          filters={{
            make: entry.make,
            basePath: path,
          }}
        />
      </Suspense>

      {/* Aggregation disclosure */}
      <p className="mt-6 text-xs text-slate-400">
        Listings are aggregated from third-party sites and link back to the original source.
        ClubHanger is not the seller. Listing data may be out of date — confirm details on the
        source listing.
      </p>

      {/* Cross-links to other makes */}
      {otherMakes.length > 0 && (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Browse other makes for sale</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {otherMakes.map((m) => (
              <Link
                key={m.makeSlug}
                href={`/aircraft/${m.makeSlug}`}
                className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
              >
                {m.make} for sale
              </Link>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Link
              href="/aircraft"
              className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
            >
              View all aircraft for sale <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Buying a plane? — related-guides cross-link block. Additive; no new page.
          Mirrors the same block on /aircraft, /aircraft/[make]/[model], and the
          by-state for-sale pages. */}
      <ForSaleGuideLinks className="mt-4" />
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
