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
    default: 'AeroMatch — Find Aircraft Partnerships & Sales',
    template: '%s | AeroMatch',
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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen bg-slate-50">
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
