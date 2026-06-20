import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STATE_CODES, STATE_NAMES, SEO_MAKES, getInventoryMakeModels, SITE_URL, stateSlug } from '@/lib/seo'
import { countMakeModel, countForSaleState } from '@/components/AircraftSaleList'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/partnerships`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/partnerships/seeking`, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/aircraft`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/tools/cost-calculator`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/tools/earnings-calculator`, changeFrequency: 'monthly', priority: 0.6 },
    // Guides (content / informational-intent pillar pages)
    { url: `${SITE_URL}/guides`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/aircraft-co-ownership`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/cost-of-aircraft-co-ownership`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/aircraft-partnership-agreement`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides/leaseback-vs-co-ownership`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const statePages: MetadataRoute.Sitemap = STATE_CODES.map((code) => ({
    url: `${SITE_URL}/partnerships/state/${code.toLowerCase()}`,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  const makePages: MetadataRoute.Sitemap = SEO_MAKES.map(({ slug }) => ({
    url: `${SITE_URL}/partnerships/make/${slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  let listingPages: MetadataRoute.Sitemap = []
  let airportPages: MetadataRoute.Sitemap = []
  let makeModelPages: MetadataRoute.Sitemap = []
  let forSaleStatePages: MetadataRoute.Sitemap = []

  try {
    const supabase = await createServerSupabaseClient()

    const { data: listings } = await supabase
      .from('partnerships')
      .select('id, updated_at')
      .eq('status', 'active')

    listingPages = (listings ?? []).map((l) => ({
      url: `${SITE_URL}/partnerships/${l.id}`,
      lastModified: l.updated_at ? new Date(l.updated_at) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const { data: airports } = await supabase.from('airports').select('icao')

    airportPages = (airports ?? []).map((a) => ({
      url: `${SITE_URL}/airports/${(a.icao as string).toLowerCase()}`,
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
            changeFrequency: 'daily' as const,
            priority: 0.8,
          }]
        : []
    )

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
            changeFrequency: 'daily' as const,
            priority: 0.8,
          }]
        : []
    )
  } catch {
    // Supabase unavailable at build time — ship static pages only
  }

  return [
    ...staticPages,
    ...statePages,
    ...makePages,
    ...makeModelPages,
    ...forSaleStatePages,
    ...airportPages,
    ...listingPages,
  ]
}
