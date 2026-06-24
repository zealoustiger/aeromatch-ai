import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getForSaleListingSitemapRows } from '@/lib/aircraftForSale'
import { STATE_CODES, STATE_NAMES, SEO_MAKES, getInventoryMakeModels, getInventoryMakeModelStates, SITE_URL, stateSlug } from '@/lib/seo'
import { countMakeModel, countForSaleState } from '@/components/AircraftSaleList'
import { getNearAirportSitemapIcaos, getIndexableAirportIcaos } from '@/lib/nearbyPartnerships'
import { MISSIONS } from '@/lib/missions'
import { COMPARISONS } from '@/lib/aircraftComparisons'

// Largest valid Date from a set of ISO/date strings, ignoring null/undefined/unparseable
// values. Used to derive an honest, data-derived `lastmod` for the aggregation pages
// (a make/state/airport page's content IS its current listing set, so "when the data last
// changed" is its real last-modified date). Returns undefined when nothing is parseable, so
// the caller omits `lastModified` rather than faking a build-time "now".
function maxDate(...vals: (string | null | undefined)[]): Date | undefined {
  const times = vals
    .filter((v): v is string => !!v)
    .map((v) => new Date(v).getTime())
    .filter((t) => !Number.isNaN(t))
  return times.length ? new Date(Math.max(...times)) : undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Data-derived "last changed" timestamps (set inside the try below). These reflect when
  // the underlying marketplace data last changed — NOT the deploy time — so they stay stable
  // across builds with no data change (honest, non-gameable freshness; not per-deploy churn).
  let partnershipsLastMod: Date | undefined
  let aircraftLastMod: Date | undefined

  let listingPages: MetadataRoute.Sitemap = []
  let forSaleListingPages: MetadataRoute.Sitemap = []
  let airportPages: MetadataRoute.Sitemap = []
  let nearAirportPages: MetadataRoute.Sitemap = []
  let makePages2: MetadataRoute.Sitemap = []
  let makeModelPages: MetadataRoute.Sitemap = []
  let makeModelStatePages: MetadataRoute.Sitemap = []
  let forSaleStatePages: MetadataRoute.Sitemap = []

  try {
    const supabase = await createServerSupabaseClient()

    const { data: listings } = await supabase
      .from('partnerships')
      .select('id, updated_at')
      .eq('status', 'active')

    // Partnership-family freshness = newest active-partnership `updated_at` (computed from
    // the rows we already fetch here — no extra query).
    partnershipsLastMod = maxDate(...(listings ?? []).map((l) => l.updated_at))

    // Aircraft-family freshness = newest active for-sale row. `aircraft_for_sale` has no
    // `updated_at`, so use the later of max(`last_seen_at`) (ingest re-saw the listing) and
    // max(`created_at`) (newly ingested). Two tiny `limit 1` queries — cheap at build.
    const [{ data: acSeen }, { data: acCreated }] = await Promise.all([
      supabase
        .from('aircraft_for_sale')
        .select('last_seen_at')
        .eq('status', 'active')
        .not('last_seen_at', 'is', null)
        .order('last_seen_at', { ascending: false })
        .limit(1),
      supabase
        .from('aircraft_for_sale')
        .select('created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1),
    ])
    aircraftLastMod = maxDate(acSeen?.[0]?.last_seen_at, acCreated?.[0]?.created_at)

    listingPages = (listings ?? []).map((l) => ({
      url: `${SITE_URL}/partnerships/${l.id}`,
      lastModified: l.updated_at ? new Date(l.updated_at) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Individual aircraft-for-sale detail pages (`/aircraft/listing/[id]`). Each is a
    // genuinely-unique page (real photos + specs + description + price for one aircraft),
    // self-canonical, with its own OG/title — but the family was orphaned from the
    // sitemap. Emit ONLY priced active listings (see getForSaleListingSitemapRows: the
    // $50k floor drops parts/projects + no-price rows so no thin/junk pages enter the
    // sitemap). Per-listing `lastmod` = the newest of price-change / re-seen / created.
    const forSaleRows = await getForSaleListingSitemapRows()
    forSaleListingPages = forSaleRows.map((r) => ({
      url: `${SITE_URL}/aircraft/listing/${r.id}`,
      lastModified: maxDate(r.price_changed_at, r.last_seen_at, r.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Airport hub pages (`/airports/[icao]`). The `airports` table holds ~17k rows,
    // but an airport page only has real content when partnerships are based there —
    // every other one is a thin, near-identical "no partnerships based here yet"
    // page. Emit ONLY airports with >= 1 based-here active partnership (the SAME
    // rule the page uses to stay indexable — see getIndexableAirportIcaos /
    // isAirportIndexable), so the ~17k thin pages don't dilute crawl budget
    // (GOAL.md INDEXING stage; no thin/doorway pages). Mirrors the inventory gating
    // already applied to every other programmatic family below.
    const airportIcaos = await getIndexableAirportIcaos()
    airportPages = airportIcaos.map((icao) => ({
      url: `${SITE_URL}/airports/${icao}`,
      lastModified: partnershipsLastMod,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    // Geo "partnerships near [airport]" pages (`/partnerships/near/[icao]`).
    // Emit ONLY airports with real nearby partnership inventory (>= MIN_NEARBY
    // within NEAR_RADIUS_NM). The page route 404s below that threshold (see
    // near/[icao]/page.tsx), so this helper is the single source of truth — a
    // thin airport must never appear in the sitemap (it would be a soft-404).
    const nearIcaos = await getNearAirportSitemapIcaos()
    nearAirportPages = nearIcaos.map((icao) => ({
      url: `${SITE_URL}/partnerships/near/${icao}`,
      lastModified: partnershipsLastMod,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    // Make+model for-sale pages — emit ONLY combos that have real live inventory.
    // The page route 404s when its live count is 0 (see page.tsx + countMakeModel),
    // so reuse the same count here as the single source of truth: a combo with no
    // listings must never appear in the sitemap (it would be a soft-404). The
    // combo list is the SAME inventory-backed set `generateStaticParams` builds,
    // so the sitemap and the generated pages can't drift.
    const comboList = await getInventoryMakeModels()
    const counts = await Promise.all(
      comboList.map((e) =>
        countMakeModel(e.make, e.modelPattern, e.notModelPattern)
      )
    )
    makeModelPages = comboList.flatMap((e, i) =>
      counts[i] > 0
        ? [{
            url: `${SITE_URL}/aircraft/${e.makeSlug}/${e.modelSlug}`,
            lastModified: aircraftLastMod,
            changeFrequency: 'daily' as const,
            priority: 0.8,
          }]
        : []
    )

    // Make-only for-sale aggregation pages (`/aircraft/[make]`). Emit ONLY makes
    // with real live inventory: reuse the same per-combo `counts` above as the
    // single source of truth — a make is live iff ≥1 of its model combos has a
    // live count > 0. The page route 404s a make with no live models (see
    // [make]/page.tsx), so this gate keeps the sitemap free of soft-404s and the
    // make pages can't drift from the model pages.
    const liveMakeSlugs = new Set<string>()
    comboList.forEach((e, i) => {
      if (counts[i] > 0) liveMakeSlugs.add(e.makeSlug)
    })
    makePages2 = [...liveMakeSlugs].map((makeSlug) => ({
      url: `${SITE_URL}/aircraft/${makeSlug}`,
      lastModified: aircraftLastMod,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    // Model × state intersection pages (`/aircraft/[make]/[model]/[state]`) —
    // emit ONLY inventory-backed combos (>= threshold live listings). Reuse the
    // SAME `getInventoryMakeModelStates` helper the route's generateStaticParams
    // uses as the single source of truth, so the sitemap and the generated pages
    // can never drift and no sub-threshold combo (a soft-404) ever appears here.
    // The set is small (~tens of combos), so no cap is applied.
    const intersections = await getInventoryMakeModelStates()
    makeModelStatePages = intersections.map(({ entry, stateSlug: slug }) => ({
      url: `${SITE_URL}/aircraft/${entry.makeSlug}/${entry.modelSlug}/${slug}`,
      lastModified: aircraftLastMod,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    // State-level aircraft-for-sale pages — emit ONLY states with real live
    // inventory. The page route 404s when its live count is 0 (see the
    // for-sale/[state] page + countForSaleState), so reuse the same count here as
    // the single source of truth: a state with no listings must never appear in
    // the sitemap (it would be a soft-404).
    const stateCounts = await Promise.all(
      STATE_CODES.map((code) => countForSaleState(code))
    )
    forSaleStatePages = STATE_CODES.flatMap((code, i) =>
      stateCounts[i] > 0
        ? [{
            url: `${SITE_URL}/aircraft/for-sale/${stateSlug(STATE_NAMES[code])}`,
            lastModified: aircraftLastMod,
            changeFrequency: 'daily' as const,
            priority: 0.8,
          }]
        : []
    )
  } catch {
    // Supabase unavailable at build time — ship the static + constant-list pages below
    // (without the data-derived `lastModified`). No URLs are dropped vs a successful build.
  }

  // The homepage surfaces both marketplaces, so its freshness = the later of the two.
  const siteLastMod = maxDate(
    partnershipsLastMod?.toISOString(),
    aircraftLastMod?.toISOString()
  )

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: siteLastMod, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/partnerships`, lastModified: partnershipsLastMod, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/partnerships/seeking`, lastModified: partnershipsLastMod, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/partnerships/browse`, lastModified: partnershipsLastMod, changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/aircraft`, lastModified: aircraftLastMod, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/aircraft/browse`, lastModified: aircraftLastMod, changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/aircraft/deals`, lastModified: aircraftLastMod, changeFrequency: 'daily', priority: 0.6 },
    // Head-to-head comparison pages (`/aircraft/compare/[a-vs-b]`) — a fixed,
    // hand-curated set of high-intent "{model} vs {model}" buyer queries, each
    // built from curated spec/highlight data (no thin/combinatorial pages).
    { url: `${SITE_URL}/aircraft/compare`, changeFrequency: 'monthly', priority: 0.5 },
    ...COMPARISONS.map((c) => ({
      url: `${SITE_URL}/aircraft/compare/${c.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Curated "mission" landing pages (`/aircraft/mission/[mission]`) — a fixed,
    // hand-curated set (like guides) of high-intent buyer searches, each carrying
    // unique editorial guidance + the live matching listings. Data-derived freshness.
    ...MISSIONS.map((m) => ({
      url: `${SITE_URL}/aircraft/mission/${m.slug}`,
      lastModified: aircraftLastMod,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    // Static content pages (tools/guides/about) carry no data-derived date — leaving
    // `lastModified` unset is more honest than stamping a build-time "now" on unchanged copy.
    { url: `${SITE_URL}/tools`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/tools/cost-calculator`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/tools/earnings-calculator`, changeFrequency: 'monthly', priority: 0.6 },
    // Guides (content / informational-intent pillar pages)
    { url: `${SITE_URL}/guides`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/aircraft-co-ownership`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/cost-of-aircraft-co-ownership`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/aircraft-partnership-agreement`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/leaseback-vs-co-ownership`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/flying-club-vs-co-ownership`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/how-to-find-aircraft-partners`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/aircraft-pre-purchase-inspection`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/aircraft-title-escrow-and-closing`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const statePages: MetadataRoute.Sitemap = STATE_CODES.map((code) => ({
    url: `${SITE_URL}/partnerships/state/${code.toLowerCase()}`,
    lastModified: partnershipsLastMod,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  const makePages: MetadataRoute.Sitemap = SEO_MAKES.map(({ slug }) => ({
    url: `${SITE_URL}/partnerships/make/${slug}`,
    lastModified: partnershipsLastMod,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  return [
    ...staticPages,
    ...statePages,
    ...makePages,
    ...makePages2,
    ...makeModelPages,
    ...makeModelStatePages,
    ...forSaleStatePages,
    ...airportPages,
    ...nearAirportPages,
    ...listingPages,
    ...forSaleListingPages,
  ]
}
