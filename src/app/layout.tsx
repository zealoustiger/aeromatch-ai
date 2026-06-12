import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import PostHogProvider from '@/components/PostHogProvider'
import FeedbackWidget from '@/components/FeedbackWidget'
import { SITE_URL, SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ClubHanger — Find Aircraft Partnerships & Sales',
    template: '%s | ClubHanger',
  },
  description:
    'The best place to find aircraft co-ownership partnerships and aircraft for sale. Search by airport, aircraft type, and budget.',
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  keywords: [
    'aircraft co-ownership',
    'aircraft partnership',
    'airplane co-ownership',
    'aircraft share',
    'GA aircraft partnership',
    'pilot co-ownership',
    'find aircraft partner',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ClubHanger',
  url: SITE_URL,
  description:
    'ClubHanger is a free marketplace for general aviation pilots to find aircraft co-ownership partnerships and aircraft for sale.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen bg-slate-50">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <PostHogProvider>
          <Nav />
          <main>{children}</main>
          <Footer />
          <FeedbackWidget />
        </PostHogProvider>
      </body>
    </html>
  )
}
