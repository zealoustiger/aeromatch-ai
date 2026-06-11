import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
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
          <footer className="mt-20 border-t border-slate-200 bg-white py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <span className="text-sm font-semibold text-slate-900">AeroMatch</span>
                <p className="text-sm text-slate-400">The modern marketplace for pilots.</p>
                <a
                  href="mailto:feedback@aeromatch.ai"
                  className="text-sm text-slate-400 hover:text-slate-600"
                >
                  Contact us
                </a>
              </div>
            </div>
          </footer>
          <FeedbackWidget />
        </PostHogProvider>
      </body>
    </html>
  )
}
