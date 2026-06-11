import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/partnerships`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/aircraft`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  let listingPages: MetadataRoute.Sitemap = []
  let airportPages: MetadataRoute.Sitemap = []

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
  } catch {
    // Supabase unavailable at build time — ship static pages only
  }

  return [...staticPages, ...airportPages, ...listingPages]
}
