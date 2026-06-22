import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { Plane, ArrowRight, Gauge, Wallet, LineChart } from 'lucide-react'
import AircraftSaleList, { countMakeModel, fetchAircraftPage, topStatesForMakeModel, priceStatsForMakeModel } from '@/components/AircraftSaleList'
import Breadcrumbs from '@/components/Breadcrumbs'
import ForSaleGuideLinks from '@/components/ForSaleGuideLinks'
import ModelFaq from '@/components/ModelFaq'
import AlertSignup from '@/components/AlertSignup'
import { getInventoryMakeModels, resolveMakeModel, STATE_NAMES, stateSlug, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'
import { buildAircraftItemListJsonLd, buildAircraftAggregateOfferJsonLd, buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'
import { CompareProvider } from '@/components/CompareProvider'
import CompareTray from '@/components/CompareTray'

type Props = { params: Promise<{ make: string; model: string }> }

// Prebuild every inventory-backed combo (curated + dynamically discovered). Any
// valid-but-not-prebuilt combo still renders on demand (dynamicParams stays the
// default `true`); the live count===0 guard below 404s thin/garbage combos.
export async function generateStaticParams() {
  const combos = await getInventoryMakeModels()
  return combos.map(({ makeSlug, modelSlug }) => ({
    make: makeSlug,
    model: modelSlug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make, model } = await params
  const entry = await resolveMakeModel(make, model)
  if (!entry) return {}

  const n = await countMakeModel(entry.make, entry.modelPattern, entry.notModelPattern)
  const label = `${entry.make} ${entry.model}`
  const count = n.toLocaleString()
  const path = `/aircraft/${entry.makeSlug}/${entry.modelSlug}`
  const url = `${SITE_URL}${path}`
  // Page-specific OG/Twitter copy reflecting THIS make+model (mirrors the
  // per-page card pattern shipped on /partnerships/[id]). No per-aircraft image
  // — fall back to the SAME site default OG card so a shared link always unfurls
  // into a real card, never a broken/empty image.
  const ogTitle = `${label} for sale — ${count} aircraft`
  const ogDescription = `${label} aircraft for sale, with specs and cost-to-own guidance from ClubHanger.`

  return {
    // Title pattern per spec: "{Make} {Model} for sale — {N} aircraft | ClubHanger".
    // `absolute` bypasses the root layout's "%s | ClubHanger" template so the
    // " | ClubHanger" isn't doubled.
    title: { absolute: `${label} for sale — ${count} aircraft | ClubHanger` },
    description: `Browse ${count} ${label} aircraft for sale, aggregated from across the web. ${entry.specs} See specs and typical cost to own.`,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, alt: `${label} aircraft for sale on ClubHanger` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function MakeModelForSalePage({ params }: Props) {
  const { make, model } = await params
  const entry = await resolveMakeModel(make, model)
  if (!entry) notFound()

  const n = await countMakeModel(entry.make, entry.modelPattern, entry.notModelPattern)
  // Guardrail: never render a thin/doorway page. If the inventory has dried up
  // for this combo, 404 rather than show an empty "for sale" landing page.
  if (n === 0) notFound()

  const label = `${entry.make} ${entry.model}`
  const path = `/aircraft/${entry.makeSlug}/${entry.modelSlug}`
  // Related-combos rail — draw from the full inventory-backed set, excluding the
  // current combo. Curated families lead (they have hand-tuned copy + the most
  // inventory); capped to 12.
  const allCombos = await getInventoryMakeModels()
  const otherCombos = allCombos
    .filter((e) => e.makeSlug !== entry.makeSlug || e.modelSlug !== entry.modelSlug)
    .slice(0, 12)

  // FAMILY→FAMILY rails (slice 2). All targets are inventory-backed pages that
  // exist, so no rail link can 404.
  //   (a) Other models of the SAME make that have a page (e.g. "More Cessna
  //       models for sale") — keeps crawl equity inside the make family.
  const sameMakeModels = allCombos
    .filter((e) => e.makeSlug === entry.makeSlug && e.modelSlug !== entry.modelSlug)
    .slice(0, 8)
  //   (b) The states with the most listings of THIS family — link DOWN to the
  //       model×state intersection page (/aircraft/[make]/[model]/[state],
  //       "Cessna 172 for sale in California"). That route 404s a combo below the
  //       inventory threshold, so we keep only states at/above the SAME threshold
  //       (>= 3) — the rail can never link to a thin/404 intersection page.
  const INTERSECTION_MIN = 3
  const topStates = (
    await topStatesForMakeModel(entry.make, entry.modelPattern, entry.notModelPattern, 12)
  )
    // Only known USPS states have a page; drop any stray/territory code.
    .filter((s) => STATE_NAMES[s.code] && s.n >= INTERSECTION_MIN)
    .slice(0, 8)

  // Aggregate "Market snapshot" stats for THIS family (median / range / count),
  // computed from the same active priced `aircraft_for_sale` rows the page already
  // queries. Returns null for sparse families (< 5 priced listings) — we then
  // render no snapshot rather than publish noisy/misleading aggregates.
  const snapshot = await priceStatsForMakeModel(
    entry.make,
    entry.modelPattern,
    entry.notModelPattern
  )

  // ItemList JSON-LD for rich results — marks up exactly the first page of
  // listings the visitor sees (same filters/order as the rendered list), each as
  // a Product/Offer with real data only. See src/lib/aircraftJsonLd.ts.
  const { listings } = await fetchAircraftPage({
    make: entry.make,
    modelPattern: entry.modelPattern,
    notModelPattern: entry.notModelPattern,
  })
  const itemListJsonLd = buildAircraftItemListJsonLd(listings, {
    name: `${label} for sale`,
    url: `${SITE_URL}${path}`,
  })
  // Page-level price-range AggregateOffer (real data only; null when <2 priced).
  const aggregateOfferJsonLd = buildAircraftAggregateOfferJsonLd(listings, {
    name: `${label} for sale`,
    url: `${SITE_URL}${path}`,
  })
  // FAQPage JSON-LD — curated combos carry genuine evergreen Q&As (entry.faqs);
  // dynamically-discovered combos have none, so this is null and nothing renders.
  // The visible <ModelFaq> below renders the exact same Q&As (Google parity).
  const faqJsonLd = buildFaqPageJsonLd(entry.faqs, { url: `${SITE_URL}${path}` })

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
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Aircraft for Sale', href: '/aircraft' },
          // Up-link to the make-level page (internal linking lever) — it's
          // inventory-backed (this combo's make has ≥1 live model), so it resolves.
          { label: `${entry.make} for sale`, href: `/aircraft/${entry.makeSlug}` },
          { label: `${label} for sale` },
        ]}
      />

      {/* Header with photo */}
      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="p-6 sm:p-8">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              <Plane className="h-7 w-7 text-sky-500" />
              {label} for sale
            </h1>
            <p className="mt-2 text-slate-500">
              <span className="font-semibold text-slate-700">{n.toLocaleString()}</span>{' '}
              {label} {n === 1 ? 'aircraft' : 'aircraft'} for sale, aggregated from across the web — search them all in one place.
            </p>
          </div>
          <div className="relative hidden h-full min-h-[200px] md:block">
            <Image
              src={getPlaceholderPhoto(entry.make)}
              alt={`${label} aircraft`}
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

      {/* Specs + cost-to-own */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Gauge className="h-4 w-4 text-sky-500" />
            {label} specs
          </h2>
          <p className="text-sm text-slate-500">{entry.specs}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Wallet className="h-4 w-4 text-sky-500" />
            Cost to own a {label}
          </h2>
          <p className="text-sm text-slate-500">{entry.costToOwn}</p>
          <p className="mt-2 text-sm text-slate-400">
            Want to split those costs?{' '}
            <Link href="/partnerships" className="font-medium text-sky-600 hover:underline">
              Browse {entry.make} partnerships
            </Link>
            .
          </p>
          {/* Internal-linking lever: high-intent contextual CTA from this
              cost-to-own card to the cost calculator. Reuses the same inline
              sky-blue link styling as the partnerships link above. Single,
              contextual link — make+model surface only. */}
          <p className="mt-1 text-sm text-slate-400">
            <Link
              href="/tools/cost-calculator"
              className="font-medium text-sky-600 hover:underline"
            >
              Estimate your cost to own a {label} →
            </Link>
          </p>
        </div>
      </div>

      {/* About the {Make} {Model} — unique, evergreen editorial prose (content
          depth for the INDEXING stage), mirrors the make-hub "About {Make}" card.
          Curated combos only; dynamically-discovered combos render nothing. */}
      {entry.overview && entry.overview.length > 0 && (
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            About the {label}
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            {entry.overview.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* Market snapshot — real aggregate price stats for THIS family, computed
          from the active priced inventory. Renders ONLY when the family has
          enough priced listings (>= 5); sparse families show nothing (honesty
          guardrail — no fake/empty aggregates, no false precision). */}
      {snapshot && (
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <LineChart className="h-4 w-4 text-sky-500" />
            {label} market snapshot
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            From <span className="font-semibold text-slate-700">{snapshot.count.toLocaleString()}</span>{' '}
            priced {label} {snapshot.count === 1 ? 'listing' : 'listings'} on the market right now.
          </p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
              <dt className="text-xs font-medium text-slate-500">Median asking price</dt>
              <dd className="mt-1 text-lg font-bold text-sky-700 sm:text-xl">{fmtUsd(snapshot.median)}</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <dt className="text-xs font-medium text-slate-500">Average asking price</dt>
              <dd className="mt-1 text-lg font-bold text-slate-800 sm:text-xl">{fmtUsd(snapshot.average)}</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <dt className="text-xs font-medium text-slate-500">Lowest asking price</dt>
              <dd className="mt-1 text-lg font-bold text-slate-800 sm:text-xl">{fmtUsd(snapshot.low)}</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <dt className="text-xs font-medium text-slate-500">Highest asking price</dt>
              <dd className="mt-1 text-lg font-bold text-slate-800 sm:text-xl">{fmtUsd(snapshot.high)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-400">
            Based on asking prices of active {label} listings aggregated from across the web — not sale
            prices. Listings without a stated price are excluded.
          </p>
        </section>
      )}

      {/* Email-alerts capture (slice 1) — inline, no account required. */}
      <AlertSignup context={label} sourcePath={path} />

      {/* Listings */}
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        {label} listings
      </h2>
      <Suspense fallback={<ListSkeleton />}>
        <AircraftSaleList
          filters={{
            make: entry.make,
            modelPattern: entry.modelPattern,
            notModelPattern: entry.notModelPattern,
            basePath: `/aircraft/${entry.makeSlug}/${entry.modelSlug}`,
          }}
        />
      </Suspense>

      {/* Aggregation disclosure */}
      <p className="mt-6 text-xs text-slate-400">
        Listings are aggregated from third-party sites and link back to the original source.
        ClubHanger is not the seller. Listing data may be out of date — confirm details on the
        source listing.
      </p>

      {/* Family→family rails (slice 2) */}
      {(sameMakeModels.length > 0 || topStates.length > 0) && (
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {sameMakeModels.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                <Plane className="h-4 w-4 text-sky-500" />
                More {entry.make} models for sale
              </h2>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {sameMakeModels.map((e) => (
                  <Link
                    key={`${e.makeSlug}/${e.modelSlug}`}
                    href={`/aircraft/${e.makeSlug}/${e.modelSlug}`}
                    className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
                  >
                    {e.make} {e.model}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {topStates.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                <ArrowRight className="h-4 w-4 text-sky-500" />
                Browse {label} by state
              </h2>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {topStates.map((s) => (
                  <Link
                    key={s.code}
                    href={`/aircraft/${entry.makeSlug}/${entry.modelSlug}/${stateSlug(STATE_NAMES[s.code])}`}
                    className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
                  >
                    {label} in {STATE_NAMES[s.code]}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cross-links */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Browse other aircraft for sale</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {otherCombos.map((e) => (
            <Link
              key={`${e.makeSlug}/${e.modelSlug}`}
              href={`/aircraft/${e.makeSlug}/${e.modelSlug}`}
              className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
            >
              {e.make} {e.model} for sale
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

      {/* Per-model FAQ — genuine evergreen Q&As (curated combos only). Unique
          content depth + FAQPage structured data; mirrors the JSON-LD above. */}
      {entry.faqs && entry.faqs.length > 0 && (
        <ModelFaq label={label} faqs={entry.faqs} className="mt-4" />
      )}

      {/* Buying a plane? — related-guides cross-link block (internal linking
          toward the buyer-guide cluster). Additive; no new page. */}
      <ForSaleGuideLinks className="mt-4" />
    </div>
    <CompareTray />
    </CompareProvider>
  )
}

// Whole-dollar USD, no cents — e.g. 287500 -> "$287,500". Prices are already
// rounded to whole dollars in `priceStats`; this just formats them honestly
// (no fake precision, no "k" rounding that would hide the real listing figure).
function fmtUsd(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
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
