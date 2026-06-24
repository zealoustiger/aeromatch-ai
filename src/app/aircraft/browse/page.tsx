import type { Metadata } from 'next'
import Link from 'next/link'
import { Plane, MapPin, Layers, ArrowRight, GitCompare, Target } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import ForSaleGuideLinks from '@/components/ForSaleGuideLinks'
import {
  getInventoryMakeModels,
  STATE_CODES,
  STATE_NAMES,
  stateSlug,
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  type SeoMakeModel,
} from '@/lib/seo'
import { countMakeModel, countForSaleState } from '@/components/AircraftSaleList'
import { COMPARISONS, resolveComparisonModel } from '@/lib/aircraftComparisons'
import { MISSIONS } from '@/lib/missions'

// This hub is a genuine navigation index, not a doorway page: every link below is
// derived from the SAME inventory-backed helpers the sitemap and the programmatic
// routes use, gated on a LIVE count > 0, so no link points at a 404/empty family.

const PATH = '/aircraft/browse'
const URL = `${SITE_URL}${PATH}`
const title = 'Browse all aircraft for sale — by make, model & state'
const description =
  'A complete index of every aircraft-for-sale page on ClubHanger: browse general aviation listings by make, by make and model, or by US state, compare popular models head to head, or shop by mission — all aggregated from across the web in one place.'

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

type MakeGroup = {
  makeSlug: string
  make: string
  /** inventory-backed model families for this make, each with a live count. */
  models: { entry: SeoMakeModel; n: number }[]
}

export default async function AircraftBrowsePage() {
  // --- Make + make/model families (mirrors sitemap.ts lines 89–119) ----------
  const comboList = await getInventoryMakeModels()
  const counts = await Promise.all(
    comboList.map((e) => countMakeModel(e.make, e.modelPattern, e.notModelPattern))
  )
  // Group live (count > 0) combos by make, preserving curated-first order.
  const byMake = new Map<string, MakeGroup>()
  comboList.forEach((entry, i) => {
    const n = counts[i]
    if (n <= 0) return
    const g = byMake.get(entry.makeSlug)
    if (g) g.models.push({ entry, n })
    else byMake.set(entry.makeSlug, { makeSlug: entry.makeSlug, make: entry.make, models: [{ entry, n }] })
  })
  const makeGroups = [...byMake.values()].sort((a, b) => a.make.localeCompare(b.make))

  // --- For-sale-by-state pages (mirrors sitemap.ts lines 139–150) ------------
  const stateCounts = await Promise.all(STATE_CODES.map((code) => countForSaleState(code)))
  const states = STATE_CODES.map((code, i) => ({ code, n: stateCounts[i] }))
    .filter((s) => s.n > 0)
    .sort((a, b) => STATE_NAMES[a.code].localeCompare(STATE_NAMES[b.code]))

  const totalMakes = makeGroups.length
  const totalModels = makeGroups.reduce((sum, g) => sum + g.models.length, 0)

  // --- Curated head-to-head comparison pages (mirrors the fixed COMPARISONS list
  // emitted in sitemap.ts). Resolve each side's curated make/model so the label
  // matches the destination page exactly; drop any entry whose data is missing
  // (resolveComparisonModel returns null) so we never link a broken page. ---------
  const compareCards = COMPARISONS.map((c) => {
    const a = resolveComparisonModel(c.a)
    const b = resolveComparisonModel(c.b)
    return a && b ? { slug: c.slug, a, b } : null
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  // CollectionPage JSON-LD: an ItemList of the make hub pages (real pages, each
  // with ≥1 live listing). Mirrors the repo's existing application/ld+json pattern.
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: URL,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: makeGroups.length,
      itemListElement: makeGroups.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${g.make} aircraft for sale`,
        url: `${SITE_URL}/aircraft/${g.makeSlug}`,
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
            { label: 'Aircraft for Sale', href: '/aircraft' },
            { label: 'Browse' },
          ]}
        />

        {/* Header */}
        <header className="mb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
            <Plane className="h-7 w-7 text-sky-500" />
            Browse all aircraft for sale
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Every aircraft-for-sale page on ClubHanger in one index — jump straight to a make,
            a specific make and model, or aircraft for sale in your state. Every link goes to
            real, live listings aggregated from across the web.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            <Link href="/aircraft" className="font-medium text-sky-600 hover:underline">
              ← Back to search
            </Link>
            <span className="mx-2 text-slate-300">·</span>
            <a href="#by-make" className="text-sky-600 hover:underline">By make</a>
            <span className="mx-2 text-slate-300">·</span>
            <a href="#by-model" className="text-sky-600 hover:underline">By make &amp; model</a>
            <span className="mx-2 text-slate-300">·</span>
            <a href="#by-state" className="text-sky-600 hover:underline">By state</a>
            {compareCards.length > 0 && (
              <>
                <span className="mx-2 text-slate-300">·</span>
                <a href="#compare" className="text-sky-600 hover:underline">Compare</a>
              </>
            )}
            {MISSIONS.length > 0 && (
              <>
                <span className="mx-2 text-slate-300">·</span>
                <a href="#by-mission" className="text-sky-600 hover:underline">By mission</a>
              </>
            )}
          </p>
        </header>

        {/* ---- By make ---- */}
        {makeGroups.length > 0 && (
          <section id="by-make" className="ch-panel mb-8 scroll-mt-24 p-5 sm:p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Plane className="h-5 w-5 text-sky-500" />
              By make
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              {totalMakes} {totalMakes === 1 ? 'make' : 'makes'} with aircraft for sale. Pick a make
              to see every model and listing.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {makeGroups.map((g) => (
                <Link
                  key={g.makeSlug}
                  href={`/aircraft/${g.makeSlug}`}
                  className="text-sm text-slate-600 hover:text-sky-600 hover:underline"
                >
                  {g.make} for sale
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ---- By make & model ---- */}
        {totalModels > 0 && (
          <section id="by-model" className="ch-panel mb-8 scroll-mt-24 p-5 sm:p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Layers className="h-5 w-5 text-sky-500" />
              By make &amp; model
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              {totalModels} {totalModels === 1 ? 'model family' : 'model families'} with live
              inventory, grouped by make.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {makeGroups.map((g) => (
                <div key={g.makeSlug} className="min-w-0">
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">
                    <Link href={`/aircraft/${g.makeSlug}`} className="hover:text-sky-600 hover:underline">
                      {g.make}
                    </Link>
                  </h3>
                  <ul className="space-y-1">
                    {g.models.map(({ entry, n }) => (
                      <li key={`${entry.makeSlug}/${entry.modelSlug}`}>
                        <Link
                          href={`/aircraft/${entry.makeSlug}/${entry.modelSlug}`}
                          className="flex items-baseline justify-between gap-2 text-sm text-slate-600 hover:text-sky-600 hover:underline"
                        >
                          <span className="truncate">{entry.make} {entry.model}</span>
                          <span className="shrink-0 text-xs text-slate-400">{n.toLocaleString()}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
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
              Aircraft for sale in {states.length} {states.length === 1 ? 'state' : 'states'} with
              live inventory.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {states.map(({ code, n }) => (
                <Link
                  key={code}
                  href={`/aircraft/for-sale/${stateSlug(STATE_NAMES[code])}`}
                  className="text-sm text-slate-600 hover:text-sky-600 hover:underline"
                >
                  {STATE_NAMES[code]}{' '}
                  <span className="text-xs text-slate-400">({n.toLocaleString()})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ---- Compare aircraft (curated head-to-head pages) ---- */}
        {compareCards.length > 0 && (
          <section id="compare" className="ch-panel mb-8 scroll-mt-24 p-5 sm:p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <GitCompare className="h-5 w-5 text-sky-500" />
              Compare aircraft
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Head-to-head, side-by-side comparisons of popular general-aviation singles —
              specs, performance, and ownership trade-offs.{' '}
              <Link href="/aircraft/compare" className="text-sky-600 hover:underline">
                See all comparisons
              </Link>
              .
            </p>
            <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {compareCards.map(({ slug, a, b }) => (
                <Link
                  key={slug}
                  href={`/aircraft/compare/${slug}`}
                  className="truncate text-sm text-slate-600 hover:text-sky-600 hover:underline"
                >
                  {a.make} {a.model} <span className="text-slate-400">vs</span> {b.make} {b.model}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ---- By mission (curated buyer-intent landing pages) ---- */}
        {MISSIONS.length > 0 && (
          <section id="by-mission" className="ch-panel mb-8 scroll-mt-24 p-5 sm:p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Target className="h-5 w-5 text-sky-500" />
              By mission
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Shop by what you want the airplane to do — each page collects the live
              listings that fit.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {MISSIONS.map((m) => (
                <Link
                  key={m.slug}
                  href={`/aircraft/mission/${m.slug}`}
                  className="text-sm text-slate-600 hover:text-sky-600 hover:underline"
                >
                  {m.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty fallback (Supabase unavailable at build/request time) */}
        {makeGroups.length === 0 && states.length === 0 && (
          <div className="ch-panel p-6 text-slate-600">
            <p>
              Listings are loading. In the meantime,{' '}
              <Link href="/aircraft" className="font-medium text-sky-600 hover:underline">
                search all aircraft for sale
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mt-2">
          <Link
            href="/aircraft"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            View all aircraft for sale <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ForSaleGuideLinks className="mt-6" />
      </div>
    </div>
  )
}
