import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import AlertsLanding, { type PopularChip } from '@/components/AlertsLanding'
import { getAlertMatchCount } from '@/lib/alertMatchCounts'

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

// Live match counts refresh hourly (matches /airports/[icao], /partnerships/browse,
// /partnerships/near/[icao]) — fresh enough for an honesty gate without a DB hit per request.
export const revalidate = 3600

// Curated "popular alert" candidates. Honesty gate (GOAL.md): a chip only renders
// when a live server-side count confirms it actually has matches right now — never
// a canned list a visitor can one-tap into a search that alerts on nothing.
const POPULAR_CANDIDATES: Omit<PopularChip, 'count'>[] = [
  { label: 'Cessna 172', context: 'Cessna 172', sourcePath: '/aircraft?make=Cessna&model=172', noun: 'aircraft' },
  { label: 'Cirrus SR22', context: 'Cirrus SR22', sourcePath: '/aircraft?make=Cirrus&model=SR22', noun: 'aircraft' },
  { label: 'Piper Cherokee', context: 'Piper Cherokee', sourcePath: '/aircraft?make=Piper&model=Cherokee', noun: 'aircraft' },
  { label: 'Beechcraft Bonanza', context: 'Beechcraft Bonanza', sourcePath: '/aircraft?make=Beechcraft&model=Bonanza', noun: 'aircraft' },
  { label: 'Partnerships in California', context: 'California partnerships', sourcePath: '/partnerships?state=CA', noun: 'partnership' },
]

async function getPopularChips(): Promise<PopularChip[]> {
  const results = await Promise.all(
    POPULAR_CANDIDATES.map(async (candidate) => {
      const match = await getAlertMatchCount(candidate.sourcePath)
      return match && match.count > 0 ? { ...candidate, count: match.count } : null
    })
  )
  return results.filter((c): c is PopularChip => c !== null)
}

export default async function AlertsPage() {
  const popularChips = await getPopularChips()
  return (
    <div className="ch-surface min-h-screen">
      <AlertsLanding popularChips={popularChips} />
    </div>
  )
}
