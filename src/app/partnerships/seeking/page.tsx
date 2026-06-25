import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, SlidersHorizontal } from 'lucide-react'
import SeekerList from '@/components/SeekerList'
import SeekerChipBar from '@/components/SeekerChipBar'
import SeekerFilters from '@/components/SeekerFilters'
import SeekerActiveFilterChips from '@/components/SeekerActiveFilterChips'
import MobileFiltersDrawer from '@/components/MobileFiltersDrawer'
import PartnershipTabs from '@/components/PartnershipTabs'
import Breadcrumbs from '@/components/Breadcrumbs'
import ModelFaq from '@/components/ModelFaq'
import SaveSearchButton from '@/components/SaveSearchButton'
import { SEO_MAKES, SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo'
import { getLatestPartnerships } from '@/lib/partnerships'
import { getSeekerMakes } from '@/lib/seekersQuery'
import { buildPartnershipItemListJsonLd } from '@/lib/partnershipJsonLd'
import { buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'

// Unique, evergreen content depth for this priority seed page (STAGE=INDEXING).
// The seeker side of the marketplace is frequently empty (few/no pilots have
// posted a "seeking" listing yet), which left the page thin and not index-worthy.
// This editorial prose explains what the seeking side IS so the page carries real,
// substantively-unique value regardless of how many seeker rows exist. NO fabricated
// statistics and NO live counts, so the copy stays accurate and never goes stale.
// Intentionally distinct in wording from SEEKING_FAQS below.
const SEEKING_OVERVIEW: string[] = [
  'Most aircraft-partnership searches start from the owner side: someone already has a plane and wants to fill an empty seat in the ownership group. A "seeking" listing flips that around. Instead of waiting for exactly the right available share to appear, a pilot posts what they are after — the kind of aircraft they want to fly, their mission, their budget, and the airport they want to base out of — so owners forming a group can come to them.',
  'Posting a seeking listing means you get found rather than constantly refreshing the search. Co-ownership groups often come together before an aircraft is even bought, and owners with an open share regularly look here for a qualified partner who fits their mission and home field. A strong listing makes that match easy: say what ratings and roughly how many hours you hold, the makes and models you are interested in, your monthly or buy-in budget, and how far you are willing to travel from home base.',
  'The seeking side works best alongside the available partnerships — browse the open shares to see what co-ownership looks like in your area, then post your own listing so the right owner can reach you. ClubHanger is free to search and free to post, and contact happens on-platform, so you can talk to a prospective partner without handing out your personal details up front.',
]

// Curated, evergreen FAQ for the seeking page — genuine Q&As a prospective co-owner
// actually asks. Rendered as a visible accordion AND emitted as FAQPage JSON-LD, so
// the visible text must match the structured data 1:1 (ModelFaq + buildFaqPageJsonLd
// share this same array). No fabricated stats / live counts → never goes stale.
const SEEKING_FAQS: { q: string; a: string }[] = [
  {
    q: 'What is a "seeking" listing on ClubHanger?',
    a: 'It is a post by a pilot who is looking to join or form an aircraft co-ownership group, rather than an owner advertising an existing share. You describe the aircraft you want, your mission, your budget, and your home airport, and owners forming a partnership can reach out to you.',
  },
  {
    q: 'Who should post a seeking listing?',
    a: 'Any pilot who wants to share the cost of an aircraft but does not yet have a partnership lined up — whether you are buying your first plane, stepping up to something faster, building time, or just want to fly more for less. It is also useful if you have an aircraft in mind and want partners before you buy.',
  },
  {
    q: 'What should I include to attract a good partnership?',
    a: 'The listings that get the best responses are specific: the makes or models you would consider, your ratings and roughly how many hours you hold, your monthly or buy-in budget, your home or preferred base airport, and how far you are willing to travel. A short note on how you intend to use the aircraft helps owners judge whether you fit their group.',
  },
  {
    q: 'How is this different from browsing available partnerships?',
    a: 'Available partnerships are open shares posted by owners who already have an aircraft. A seeking listing is the reverse — it advertises you to those owners. Many pilots do both: browse the available shares for a direct fit, and post a seeking listing so the right owner can find them when a new share opens up.',
  },
  {
    q: 'Is it free to post a seeking listing?',
    a: 'Yes. ClubHanger is free to search and free to post. Contact between pilots happens on-platform, so you can start a conversation with a prospective partner without publishing your personal contact details.',
  },
]

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

  // FAQPage JSON-LD — questions/answers match the visible ModelFaq accordion 1:1.
  const faqJsonLd = buildFaqPageJsonLd(SEEKING_FAQS, {
    url: `${SITE_URL}/partnerships/seeking`,
  })

  // The make hubs this page should reach so it isn't an internal dead-end.
  const makeLinks = SEO_MAKES.slice(0, 3)
  // Makes seekers actually want — feeds the chip bar + the make filter dropdown.
  const seekerMakes = await getSeekerMakes()
  const activeFilterCount = ['airports', 'airport', 'state', 'make', 'rating', 'min_hours', 'share_type'].filter((k) => params[k]).length

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {itemListJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
        )}
        {faqJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        )}

        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Partnerships', href: '/partnerships' },
            { label: 'Seeking' },
          ]}
        />

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
              <Search className="h-7 w-7 text-sky-500" />
              Pilots Seeking Partnerships
            </h1>
            <p className="mt-1 text-slate-600">
              Qualified pilots looking for a co-ownership share near their home airport.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="lg:hidden">
              <MobileFiltersDrawer variant="seeker" initialValues={params} activeCount={activeFilterCount} makes={seekerMakes} />
            </div>
            <Link
              href="/partnerships/seeking/new"
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 sm:px-4"
            >
              <span className="sm:hidden">+ Post</span>
              <span className="hidden sm:inline">+ Post Seeking Listing</span>
            </Link>
          </div>
        </div>

        <PartnershipTabs active="seeking" />

        {/* Quick-filter chip bar (mirrors /aircraft + /partnerships). */}
        <SeekerChipBar makes={seekerMakes} />

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters sidebar — desktop only */}
          <aside className="hidden w-full shrink-0 lg:block lg:w-64">
            <div className="ch-panel sticky top-24 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <SlidersHorizontal className="h-4 w-4" />
                Filter Pilots
              </div>
              <SeekerFilters initialValues={params} makes={seekerMakes} saveSearchBasePath="/partnerships/seeking" />
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0 flex-1">
            <SeekerActiveFilterChips params={params} />
            {/* "Save this search" button — appears when filters are active so the
                owner can recall their preferred seeker search later (parity with
                /aircraft and /partnerships). Hides when no filters are set. */}
            <div className="mb-3">
              <SaveSearchButton basePath="/partnerships/seeking" />
            </div>
            <Suspense fallback={<SeekerListSkeleton />}>
              <SeekerList filters={params} fallbackPartnerships={railPartnerships} />
            </Suspense>
          </div>
        </div>

        {/* About — unique, evergreen editorial prose (content depth for the INDEXING
            stage). Moved below the results so the page leads with filters + listings. */}
        <section className="mt-12 ch-panel p-5 sm:p-6">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            About pilots seeking aircraft partnerships
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            {SEEKING_OVERVIEW.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        {/* Evergreen FAQ — visible accordion + matching FAQPage JSON-LD above. */}
        <ModelFaq label="Pilots seeking partnerships" faqs={SEEKING_FAQS} className="mt-8" />

        {/* Cross-links so crawlers (and pilots) reach the partnership hub families. */}
        <div className="mt-8 ch-panel p-6">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Browse aircraft partnerships</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {makeLinks.map(({ slug, name }) => (
              <Link key={slug} href={`/partnerships/make/${slug}`} className="text-sm text-slate-500 hover:text-sky-600 hover:underline">
                {name} partnerships
              </Link>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Link href="/partnerships" className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700">
              View all partnerships <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
