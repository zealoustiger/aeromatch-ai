import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Compass, ArrowRight } from 'lucide-react'
import AircraftSaleList, { fetchAircraftPage } from '@/components/AircraftSaleList'
import Breadcrumbs from '@/components/Breadcrumbs'
import ForSaleGuideLinks from '@/components/ForSaleGuideLinks'
import AlertSignup from '@/components/AlertSignup'
import ModelFaq from '@/components/ModelFaq'
import { CompareProvider } from '@/components/CompareProvider'
import CompareTray from '@/components/CompareTray'
import { MISSIONS, getMission } from '@/lib/missions'
import { SEO_MAKES, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import { buildAircraftItemListJsonLd, buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'

type Props = {
  params: Promise<{ mission: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

// Prebuild the fixed, curated mission slugs. dynamicParams stays the default
// `true`, but the getMission() guard below 404s anything not in the registry.
export async function generateStaticParams() {
  return MISSIONS.map((m) => ({ mission: m.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mission } = await params
  const m = getMission(mission)
  if (!m) return {}
  const url = `${SITE_URL}/aircraft/mission/${m.slug}`
  return {
    title: { absolute: m.metaTitle },
    description: m.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: m.metaTitle,
      description: m.metaDescription,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: m.h1 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.metaTitle,
      description: m.metaDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function AircraftMissionPage({ params, searchParams }: Props) {
  const { mission } = await params
  const m = getMission(mission)
  if (!m) notFound()

  const sp = await searchParams
  const basePath = `/aircraft/mission/${m.slug}`

  // The filters this page renders: the mission's fixed preset + the visitor's
  // page number. basePath keeps paging on the mission route.
  const filters = { ...m.filters, basePath, page: sp.page }

  // ItemList JSON-LD for the listings actually shown (same filters as the list
  // below) → structured data matches the visible cards 1:1. Null when nothing
  // priced/valid qualifies (helper handles it), so we render nothing then.
  const { listings } = await fetchAircraftPage(filters)
  const itemListJsonLd = buildAircraftItemListJsonLd(listings, {
    name: m.h1,
    url: `${SITE_URL}${basePath}`,
  })

  // FAQPage JSON-LD — questions/answers match the visible ModelFaq accordion 1:1.
  const faqJsonLd = buildFaqPageJsonLd(m.faqs, {
    url: `${SITE_URL}${basePath}`,
  })

  const otherMissions = MISSIONS.filter((x) => x.slug !== m.slug)
  const makeLinks = SEO_MAKES.slice(0, 6)

  return (
    <CompareProvider>
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div className="ch-surface min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 sm:py-10 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Aircraft for Sale', href: '/aircraft' },
              { label: m.label },
            ]}
          />

          {/* Header */}
          <div className="mb-6">
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
              <Compass className="h-7 w-7 text-sky-500" />
              {m.h1}
            </h1>
            <p className="mt-1 text-slate-600">{m.blurb}</p>
          </div>

          {/* Unique editorial buyer guidance — distinct per mission. */}
          <section className="ch-panel mb-8 p-5 sm:p-6">
            <div className="space-y-3 text-sm leading-relaxed text-slate-600">
              {m.intro.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {/* Live matching listings — reuses the shared list (real data). */}
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {m.label} aircraft listings
          </h2>
          <Suspense key={JSON.stringify(filters)} fallback={<ListSkeleton />}>
            <AircraftSaleList filters={filters} />
          </Suspense>

          {/* Aggregation disclosure (mirrors /aircraft). */}
          <p className="mt-6 text-xs text-slate-400">
            Listings are aggregated from third-party sites and link back to the original source.
            ClubHanger is not the seller. Listing data may be out of date — confirm details on the
            source listing.
          </p>

          {/* Filter-aware email-alerts capture. */}
          <AlertSignup
            context={`${m.label} aircraft for sale`}
            sourcePath={basePath}
          />

          {/* Evergreen FAQ — visible accordion + matching FAQPage JSON-LD above. */}
          <ModelFaq label={m.label} faqs={m.faqs} className="mt-10" />

          {/* Cross-links: the other missions (keeps the family internally linked). */}
          <div className="ch-panel mt-10 p-6">
            <h2 className="mb-3 text-base font-semibold text-slate-900">
              Browse aircraft by mission
            </h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {otherMissions.map((x) => (
                <Link
                  key={x.slug}
                  href={`/aircraft/mission/${x.slug}`}
                  className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
                >
                  {x.h1}
                </Link>
              ))}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <Link
                href="/aircraft"
                className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
              >
                Browse all aircraft for sale <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Cross-links: the top make hubs, so this page isn't a crawl dead-end. */}
          <div className="ch-panel mt-4 p-6">
            <h2 className="mb-3 text-base font-semibold text-slate-900">
              Popular makes
            </h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {makeLinks.map(({ slug, name }) => (
                <Link
                  key={slug}
                  href={`/aircraft/${slug}`}
                  className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
                >
                  {name} for sale
                </Link>
              ))}
            </div>
          </div>

          {/* Buyer-guide cluster cross-links (internal linking). */}
          <ForSaleGuideLinks className="mt-4" />
        </div>
      </div>
      <CompareTray />
    </CompareProvider>
  )
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}
