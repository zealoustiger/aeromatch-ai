import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Plane, MapPin, ArrowRight } from 'lucide-react'
import AircraftSaleList, { countMakeModelState, fetchAircraftPage } from '@/components/AircraftSaleList'
import Breadcrumbs from '@/components/Breadcrumbs'
import AlertSignup from '@/components/AlertSignup'
import ForSaleGuideLinks from '@/components/ForSaleGuideLinks'
import ModelFaq from '@/components/ModelFaq'
import {
  resolveMakeModel,
  getStateBySlug,
  getInventoryMakeModelStates,
  getMakeModelStateFaqs,
  STATE_NAMES,
  stateSlug,
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
} from '@/lib/seo'
import { buildAircraftItemListJsonLd, buildAircraftAggregateOfferJsonLd, buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'
import { CompareProvider } from '@/components/CompareProvider'
import CompareTray from '@/components/CompareTray'

type Props = { params: Promise<{ make: string; model: string; state: string }> }

// Min listings a combo needs to be a real (non-thin) page. MUST match the
// threshold `getInventoryMakeModelStates` uses to build the prebuilt/sitemap set,
// so a valid-but-not-prebuilt combo that renders on demand applies the same bar.
const MIN_LISTINGS = 3

// Prebuild ONLY inventory-backed (make, model, state) combos (>= threshold live
// listings), from the SAME helper the sitemap uses. Any other combo still renders
// on demand (dynamicParams stays the default `true`); the count guard below 404s
// thin/garbage combos so no doorway page is ever served.
export async function generateStaticParams() {
  const combos = await getInventoryMakeModelStates()
  return combos.map(({ entry, stateSlug }) => ({
    make: entry.makeSlug,
    model: entry.modelSlug,
    state: stateSlug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make, model, state } = await params
  const entry = await resolveMakeModel(make, model)
  const st = getStateBySlug(state)
  if (!entry || !st) return {}

  const n = await countMakeModelState(entry.make, entry.modelPattern, entry.notModelPattern, st.code)
  if (n < MIN_LISTINGS) return {}

  const label = `${entry.make} ${entry.model}`
  const count = n.toLocaleString()
  const path = `/aircraft/${entry.makeSlug}/${entry.modelSlug}/${stateSlug(st.name)}`
  const url = `${SITE_URL}${path}`
  const ogTitle = `${label} for sale in ${st.name} — ${count} aircraft`
  const ogDescription = `${label} aircraft for sale located in ${st.name}, searchable in one place on ClubHanger.`

  return {
    // Title pattern per spec. `absolute` bypasses the root layout's
    // "%s | ClubHanger" template so the suffix isn't doubled.
    title: { absolute: `${label} for sale in ${st.name} — ${count} aircraft | ClubHanger` },
    description: `Browse ${count} ${label} aircraft for sale in ${st.name}, aggregated from across the web. ${entry.specs} Every listing links back to its source — free to search.`,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, alt: `${label} aircraft for sale in ${st.name} on ClubHanger` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function MakeModelStateForSalePage({ params }: Props) {
  const { make, model, state } = await params
  const entry = await resolveMakeModel(make, model)
  const st = getStateBySlug(state)
  // Unrecognized make/model OR state slug → 404 (never a thin/doorway page).
  if (!entry || !st) notFound()

  const n = await countMakeModelState(entry.make, entry.modelPattern, entry.notModelPattern, st.code)
  // Thin-page guard: a combo below the inventory threshold (incl. 0) 404s rather
  // than render an empty/near-empty "for sale in {state}" intersection page.
  if (n < MIN_LISTINGS) notFound()

  const label = `${entry.make} ${entry.model}`
  const path = `/aircraft/${entry.makeSlug}/${entry.modelSlug}/${stateSlug(st.name)}`

  // Sibling intersection pages — OTHER states with real inventory of THIS family,
  // so the rail can never link to a sub-threshold 404. Drawn from the same shared
  // helper that backs generateStaticParams + the sitemap.
  const allIntersections = await getInventoryMakeModelStates()
  const otherStatesForFamily = allIntersections
    .filter(
      (c) =>
        c.entry.makeSlug === entry.makeSlug &&
        c.entry.modelSlug === entry.modelSlug &&
        c.code !== st.code
    )
    .slice(0, 12)

  // ItemList JSON-LD — marks up exactly the first page of listings the visitor
  // sees (same make+model+state filters/order as the rendered list), each as a
  // Product/Offer with real data only. See src/lib/aircraftJsonLd.ts.
  const { listings } = await fetchAircraftPage({
    make: entry.make,
    modelPattern: entry.modelPattern,
    notModelPattern: entry.notModelPattern,
    state: st.code,
  })
  const itemListJsonLd = buildAircraftItemListJsonLd(listings, {
    name: `${label} for sale in ${st.name}`,
    url: `${SITE_URL}${path}`,
  })
  // Page-level price-range AggregateOffer (real data only; null when <2 priced).
  const aggregateOfferJsonLd = buildAircraftAggregateOfferJsonLd(listings, {
    name: `${label} for sale in ${st.name}`,
    url: `${SITE_URL}${path}`,
  })

  // Intersection-specific FAQs — curated marquee combos only (no boilerplate on
  // the long tail). The visible accordion answers and the FAQPage JSON-LD come
  // from one source so they match 1:1 (Google parity). Non-curated combo → null
  // → no FAQ section, no FAQPage markup.
  const faqs = getMakeModelStateFaqs(entry.makeSlug, entry.modelSlug, st.code)
  const faqJsonLd = buildFaqPageJsonLd(faqs ?? undefined, { url: `${SITE_URL}${path}` })

  return (
    <CompareProvider>
    {/* Extra bottom padding so the fixed compare tray never overlaps content. */}
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 sm:py-10 lg:px-8">
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
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {/* Breadcrumb: Home → Aircraft for Sale → {Make} {Model} → {State} */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Aircraft for Sale', href: '/aircraft' },
          { label: `${label} for sale`, href: `/aircraft/${entry.makeSlug}/${entry.modelSlug}` },
          { label: st.name },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          <MapPin className="h-7 w-7 text-sky-500" />
          {label} for sale in {st.name}
        </h1>
        <p className="mt-2 max-w-3xl text-slate-500">
          <span className="font-semibold text-slate-700">{n.toLocaleString()}</span>{' '}
          {label} {n === 1 ? 'aircraft' : 'aircraft'} for sale located in {st.name}, aggregated from
          across the web and searchable in one place. Looking beyond {st.name}?{' '}
          <Link
            href={`/aircraft/${entry.makeSlug}/${entry.modelSlug}`}
            className="font-medium text-sky-600 hover:underline"
          >
            See all {label} for sale
          </Link>{' '}
          or{' '}
          <Link
            href={`/aircraft/for-sale/${stateSlug(st.name)}`}
            className="font-medium text-sky-600 hover:underline"
          >
            all aircraft for sale in {st.name}
          </Link>
          .
        </p>
      </div>

      {/* Email-alerts capture — inline, no account required. */}
      <AlertSignup context={`${label} in ${st.name}`} sourcePath={path} />

      {/* Listings */}
      <Suspense fallback={<ListSkeleton />}>
        <AircraftSaleList
          filters={{
            make: entry.make,
            modelPattern: entry.modelPattern,
            notModelPattern: entry.notModelPattern,
            state: st.code,
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

      {/* Sibling intersection rail: this family in other states */}
      {otherStatesForFamily.length > 0 && (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Plane className="h-4 w-4 text-sky-500" />
            {label} for sale in other states
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {otherStatesForFamily.map((c) => (
              <Link
                key={c.code}
                href={`/aircraft/${c.entry.makeSlug}/${c.entry.modelSlug}/${c.stateSlug}`}
                className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
              >
                {c.entry.make} {c.entry.model} in {c.stateName}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Cross-links up to parent pages */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Keep browsing</h2>
        <div className="flex flex-col gap-2">
          <Link
            href={`/aircraft/${entry.makeSlug}/${entry.modelSlug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            <Plane className="h-4 w-4" /> All {label} for sale <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/aircraft/for-sale/${stateSlug(st.name)}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            <MapPin className="h-4 w-4" /> All aircraft for sale in {st.name} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/aircraft"
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            <ArrowRight className="h-4 w-4" /> View all aircraft for sale
          </Link>
        </div>
      </div>

      {/* Intersection-specific FAQs — curated combos only (no thin boilerplate).
          The visible answers match the FAQPage JSON-LD emitted above 1:1. */}
      {faqs && <ModelFaq label={`${label} for sale in ${st.name}`} faqs={faqs} className="mt-4" />}

      {/* Buying a plane? — related-guides cross-link block. */}
      <ForSaleGuideLinks className="mt-4" />
    </div>
    <CompareTray />
    </CompareProvider>
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
