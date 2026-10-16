import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Baidu's rendering crawler (Baiduspider-render) ran 200-300 full SSR
      // sessions/day against /partnerships in Sep-Oct 2026 and helped exhaust
      // the Vercel Hobby Active-CPU quota, taking the site down on 2026-10-14.
      // It brings zero relevant traffic to a US GA marketplace. Belt (this) and
      // braces (a Vercel Firewall deny rule on the same UA, applied via API).
      { userAgent: 'Baiduspider', disallow: '/' },
      {
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
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
