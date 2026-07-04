import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import AlertsLanding from '@/components/AlertsLanding'

export const metadata: Metadata = {
  title: 'Get aircraft & partnership alerts — ClubHanger',
  description:
    'Get emailed the moment a new aircraft for sale or partnership share matches what you want. No account needed; one-click unsubscribe.',
  alternates: { canonical: `${SITE_URL}/alerts` },
  openGraph: {
    title: 'Never miss the right aircraft — ClubHanger alerts',
    description:
      'Tell us what you want and we email you the moment it’s listed across Barnstormers, Hangar67, AircraftForSale, and new partnership shares.',
    url: `${SITE_URL}/alerts`,
    siteName: SITE_NAME,
    type: 'website',
  },
}

export default function AlertsPage() {
  return (
    <div className="ch-surface min-h-screen">
      <AlertsLanding />
    </div>
  )
}
