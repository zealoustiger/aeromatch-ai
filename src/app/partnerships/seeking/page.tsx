import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import SeekerList from '@/components/SeekerList'
import PartnershipTabs from '@/components/PartnershipTabs'
import Breadcrumbs from '@/components/Breadcrumbs'
import { SEO_MAKES, SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo'
import { getLatestPartnerships } from '@/lib/partnerships'
import { buildPartnershipItemListJsonLd } from '@/lib/partnershipJsonLd'

export const metadata: Metadata = {
  title: 'Pilots Seeking Aircraft Partnerships',
  description:
    'Browse pilots actively looking for aircraft co-ownership shares — with budgets, ratings, and home airports listed. Find your next partner.',
  alternates: { canonical: `${SITE_URL}/partnerships/seeking` },
  openGraph: {
    title: 'Pilots Seeking Aircraft Partnerships',
    description:
      'Pilots actively looking for a co-ownership share near their home airport. Post what you fly and what you want.',
    url: `${SITE_URL}/partnerships/seeking`,
    images: [DEFAULT_OG_IMAGE],
  },
}

type SearchParams = Record<string, string | undefined>

export default async function SeekingPartnershipsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  // Fetch the available-partnerships rail once, here, so the page can both
  // (a) emit ItemList JSON-LD that matches the visible cards 1:1 and (b) hand the
  // same rows to SeekerList's empty state — no duplicate query, real data only.
  // Each item links to a real /partnerships/[id]; no fabricated rating/offer.
  const railPartnerships = await getLatestPartnerships(3)
  const itemListJsonLd = buildPartnershipItemListJsonLd(railPartnerships, {
    name: 'Pilots seeking aircraft partnerships',
    url: `${SITE_URL}/partnerships/seeking`,
  })

  // The make hubs this page should reach so it isn't an internal dead-end.
  const makeLinks = SEO_MAKES.slice(0, 3)

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
          { label: 'Seeking' },
        ]}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Search className="h-6 w-6 text-sky-500" />
            Pilots Seeking Partnerships
          </h1>
          <p className="mt-1 text-slate-500">
            Qualified pilots looking for a co-ownership share near their home airport.
          </p>
        </div>
        <Link
          href="/partnerships/seeking/new"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          + Post Seeking Listing
        </Link>
      </div>

      <PartnershipTabs active="seeking" />

      <Suspense fallback={<SeekerListSkeleton />}>
        <SeekerList filters={params} fallbackPartnerships={railPartnerships} />
      </Suspense>

      {/* Cross-links so crawlers (and pilots) reach the partnership hub families
          from here — this page used to be an internal dead-end. */}
      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Browse aircraft partnerships
        </h2>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {makeLinks.map(({ slug, name }) => (
            <Link
              key={slug}
              href={`/partnerships/make/${slug}`}
              className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
            >
              {name} partnerships
            </Link>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Link
            href="/partnerships"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            View all partnerships <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function SeekerListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}
