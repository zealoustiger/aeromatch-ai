import type { Metadata } from 'next'
import { Suspense } from 'react'
import { headers } from 'next/headers'

import { Users, SlidersHorizontal } from 'lucide-react'
import PartnershipFilters from '@/components/PartnershipFilters'
import PartnershipActiveFilterChips from '@/components/PartnershipActiveFilterChips'
import PartnershipChipBar from '@/components/PartnershipChipBar'
import PartnershipList from '@/components/PartnershipList'
import { getPartnershipMakes, getPartnershipListings } from '@/lib/partnershipsQuery'
import { getSeekerCount } from '@/lib/seekersQuery'
import { buildPartnershipItemListJsonLd } from '@/lib/partnershipJsonLd'
import { countForSale, fetchAircraftPage } from '@/components/AircraftSaleList'
import SaveSearchButton from '@/components/SaveSearchButton'
import MobileFiltersDrawer from '@/components/MobileFiltersDrawer'

import PartnershipTabs from '@/components/PartnershipTabs'
import MarketplaceCrossSell from '@/components/MarketplaceCrossSell'
import { CompareProvider } from '@/components/CompareProvider'
import CompareTray from '@/components/CompareTray'
import ModelFaq from '@/components/ModelFaq'
import Link from 'next/link'
import PartnershipLaunchBanner from '@/components/PartnershipLaunchBanner'
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo'
import { buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'

// Unique, evergreen content depth for this priority seed page (#3, STAGE=INDEXING).
// Explains what an aircraft partnership IS so the hub carries real, substantively-unique
// value regardless of how many listings are live. NO fabricated statistics and NO live
// counts, so the copy stays accurate and never goes stale. Intentionally distinct in
// wording from PARTNERSHIPS_FAQS below.
const PARTNERSHIPS_OVERVIEW: string[] = [
  'An aircraft partnership — also called co-ownership or a flying group — is a small group of pilots who share the cost of buying and operating one airplane. Instead of carrying the full purchase price, monthly hangar, insurance, and maintenance on your own, you split the fixed costs across the group and pay for the hours you actually fly. For most owners that is the difference between an airplane that mostly sits and one that earns its keep.',
  'Every listing here lays out the three numbers that actually matter so you can compare partnerships honestly: the buy-in (your share of the aircraft and any reserves), the fixed monthly cost (your slice of hangar, insurance, and recurring expenses), and the hourly or "wet" rate that covers fuel and engine reserves while you fly. Browse by home airport, state, make, and budget to find shares that fit how and where you fly — most groups keep the airplane at one home field, so location is usually the first filter that matters.',
  'Partnerships range from a simple two-person share on a training-friendly single to a larger equity group around a faster cross-country aircraft. If you do not see the right open share yet, post a free "seeking" listing so owners forming a group can find you, and use the cost calculator to sanity-check what a given buy-in and hourly rate really mean per year. ClubHanger is free to search and free to post, and contact happens on-platform so you can vet a prospective partner before sharing personal details.',
]

// Curated, evergreen FAQ for the partnerships hub — genuine Q&As a prospective
// co-owner actually asks. Rendered as a visible accordion AND emitted as FAQPage
// JSON-LD, so the visible text must match the structured data 1:1 (ModelFaq +
// buildFaqPageJsonLd share this array). No fabricated stats / live counts → never stale.
const PARTNERSHIPS_FAQS: { q: string; a: string }[] = [
  {
    q: 'What is an aircraft partnership?',
    a: 'It is an arrangement where two or more pilots co-own one airplane and share its costs. Each partner holds a share of the aircraft and contributes to the fixed expenses — hangar, insurance, and maintenance — while paying an hourly rate for the time they personally fly. It is the most common way pilots own a capable airplane without carrying the whole cost alone.',
  },
  {
    q: 'How much does joining an aircraft partnership cost?',
    a: 'There are three parts to the cost, and every ClubHanger listing shows them: the buy-in (your one-time share of the aircraft, plus any reserves), the fixed monthly cost (your portion of hangar, insurance, and recurring expenses), and an hourly or wet rate that covers fuel and engine reserves as you fly. Splitting the fixed costs across the group is what makes co-ownership far cheaper than owning outright.',
  },
  {
    q: 'How many people are usually in an aircraft partnership?',
    a: 'Most partnerships range from two to about six pilots. Smaller groups give each partner more availability and a bigger say; larger groups spread the fixed costs further but mean more scheduling around each other. The right size depends on how often you want to fly and how much you want to lower your monthly cost.',
  },
  {
    q: 'How do I find a partnership near my home airport?',
    a: 'Use the filters on this page to search by home airport, state, make, and budget — most groups base the aircraft at a single field, so starting from your airport or region is the fastest way to find a realistic fit. You can also browse by make or state from the partnerships directory to see what co-ownership looks like in your area.',
  },
  {
    q: 'What if there is no open share that fits me yet?',
    a: 'Post a free "seeking" listing describing the aircraft you want, your mission, your budget, and your home airport, so owners forming a group can reach out to you. Many co-ownership groups come together before an aircraft is even purchased, so getting your listing up early means the right owner can find you when a share opens.',
  },
]

const partnershipsTitle = 'Aircraft Partnerships & Co-Ownership Near You'
const partnershipsDescription =
  'Search aircraft partnerships by home airport, state, make, and budget. Transparent buy-in, monthly, and hourly costs on every co-ownership listing.'

export const metadata: Metadata = {
  title: partnershipsTitle,
  description: partnershipsDescription,
  alternates: { canonical: '/partnerships' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: '/partnerships',
    title: partnershipsTitle,
    description: partnershipsDescription,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: partnershipsTitle,
    description: partnershipsDescription,
    images: [DEFAULT_OG_IMAGE],
  },
}

type SearchParams = Record<string, string | undefined>

export default async function PartnershipsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const hdrs = await headers()
  const visitorRegion = hdrs.get('x-vercel-ip-country-region')
    ? decodeURIComponent(hdrs.get('x-vercel-ip-country-region')!)
    : null

  const activeFilterCount = Object.values(params).filter(Boolean).length
  const [makes, seekerCount] = await Promise.all([getPartnershipMakes(), getSeekerCount()])

  // ItemList JSON-LD for the partnerships the visitor actually sees — fetched with
  // the SAME filters PartnershipList renders below, so the structured data matches
  // the visible cards 1:1 (mirrors the make/state sub-family pages, which already
  // emit ItemList; this closes the gap on the /partnerships hub, priority seed page #3).
  // The helper returns null (renders nothing) when no valid rows qualify.
  const { listings: itemListListings } = await getPartnershipListings(params)
  const itemListJsonLd = buildPartnershipItemListJsonLd(itemListListings, {
    name: partnershipsTitle,
    url: `${SITE_URL}/partnerships`,
  })

  // FAQPage JSON-LD — questions/answers match the visible ModelFaq accordion 1:1.
  const faqJsonLd = buildFaqPageJsonLd(PARTNERSHIPS_FAQS, {
    url: `${SITE_URL}/partnerships`,
  })

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
    {/* Warm cream marketplace surface (Etsy×Airbnb design tokens — slice 5 token
        sweep). Full-bleed cream behind the surface, reversible + scoped here;
        mirrors /aircraft so the page matches its already-warm cards. */}
    <div className="ch-surface min-h-screen">
    {/* Extra bottom padding so the fixed compare tray never overlaps content. */}
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 sm:py-10 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
            <Users className="h-7 w-7 text-sky-500" />
            Aircraft Partnerships
          </h1>
          <p className="mt-1 text-slate-600">
            Find co-ownership opportunities near your home airport.
          </p>
          <Link
            href="/partnerships/browse"
            className="mt-1 inline-block text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            Browse all makes, states &amp; airports →
          </Link>
        </div>

        {/* Action bar — filter button visible only on mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="lg:hidden">
            <MobileFiltersDrawer initialValues={params} activeCount={activeFilterCount} />
          </div>
          <Suspense>
            <SaveSearchButton />
          </Suspense>
          <Link
            href="/partnerships/new"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 sm:px-4"
          >
            <span className="sm:hidden">+ Post</span>
            <span className="hidden sm:inline">+ Post a Partnership</span>
          </Link>
        </div>
      </div>

      <PartnershipTabs active="available" />

      {/* Airbnb-style quick-filter chip bar (Etsy×Airbnb refresh — slice 3,
          partnerships half). Horizontally-scrolling chips that set existing
          filter URL params (make / share type / budget). Mirrors /aircraft. */}
      <PartnershipChipBar makes={makes} />

      <PartnershipLaunchBanner
        visitorState={visitorRegion}
        seekerCount={seekerCount}
        sourcePath="/partnerships"
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters sidebar — desktop only */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-64">
          <div className="ch-panel sticky top-24 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal className="h-4 w-4" />
              Filter Results
            </div>
            <PartnershipFilters initialValues={params} saveSearchBasePath="/partnerships" />
          </div>
        </aside>

        {/* Listings — min-w-0 lets the column shrink to fit so inner
            overflow-x-auto rails (cross-sell samples) scroll instead of
            widening the page at desktop. */}
        <div className="min-w-0 flex-1">
          <PartnershipActiveFilterChips params={params} />
          <Suspense fallback={<PartnershipListSkeleton />}>
            <PartnershipList filters={params} />
          </Suspense>

          {/* Cross-sell to the other marketplace type (planes for sale).
              Make-aware: carries the active make filter through. */}
          <MarketplaceCrossSell
            from="partnerships"
            make={params.make}
            count={await countForSale(params.make)}
            samples={(await fetchAircraftPage({ make: params.make })).listings}
            className="mt-10"
          />
        </div>
      </div>

      {/* About — unique, evergreen editorial prose (content depth for the INDEXING
          stage). Below the listings so the page leads with filters + results. */}
      <section className="mt-12 ch-panel p-5 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          About aircraft partnerships
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          {PARTNERSHIPS_OVERVIEW.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      {/* Evergreen FAQ — visible accordion + matching FAQPage JSON-LD above. */}
      <ModelFaq label="Aircraft partnerships" faqs={PARTNERSHIPS_FAQS} className="mt-8" />
    </div>
    </div>
    <CompareTray />
    </CompareProvider>
  )
}

function PartnershipListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}
