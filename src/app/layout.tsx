import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AeroMatch — Find Aircraft Partnerships & Sales',
    template: '%s | AeroMatch',
  },
  description: 'The best place to find aircraft co-ownership partnerships and aircraft for sale. Search by airport, aircraft type, and budget.',
  openGraph: {
    siteName: 'AeroMatch',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen bg-slate-50">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
