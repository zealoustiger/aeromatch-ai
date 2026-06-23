import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from './seo'

/**
 * Article (schema.org) structured data for the editorial guide pages.
 *
 * The guides already emit FAQPage + BreadcrumbList JSON-LD; this adds the
 * Article wrapper so search engines recognize each guide as a substantive
 * editorial article (E-E-A-T / enhanced-presentation eligibility) — a
 * leading-indicator INDEXING win, not a tonight-pageview play. Mirrors the
 * repo's existing JSON-LD builder pattern (see aircraftJsonLd.ts).
 *
 * Honesty: we don't store real publish/update timestamps for these evergreen
 * guides, so we OMIT datePublished/dateModified rather than stamp a fake
 * build-time "now" (same principle as the sitemap's data-derived lastmod), and
 * there's no fabricated author person — the publisher/author is the ClubHanger
 * Organization. headline/description/url all mirror the page's own
 * <h1>/meta/canonical, so the structured data never claims anything the page
 * doesn't show.
 */
export function buildArticleJsonLd({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}) {
  const url = `${SITE_URL}${path}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: DEFAULT_OG_IMAGE,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
    },
  }
}
