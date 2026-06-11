import type { MetadataRoute } from 'next'
import { STATE_CODES, SEO_MAKES, SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/partnerships`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/partnerships/seeking`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/partnerships/new`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/partnerships/seeking/new`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/aircraft`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const stateRoutes: MetadataRoute.Sitemap = STATE_CODES.map((code) => ({
    url: `${SITE_URL}/partnerships/state/${code.toLowerCase()}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  const makeRoutes: MetadataRoute.Sitemap = SEO_MAKES.map(({ slug }) => ({
    url: `${SITE_URL}/partnerships/make/${slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  return [...staticRoutes, ...stateRoutes, ...makeRoutes]
}
