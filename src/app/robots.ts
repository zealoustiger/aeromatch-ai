import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/auth',
        '/saved',
        '/searches',
        '/compare',
        '/partnerships/new',
        '/partnerships/seeking/new',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
