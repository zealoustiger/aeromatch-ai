import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import AlertsLanding, { type PopularChip } from '@/components/AlertsLanding'
import { getAlertDigestPreview } from '@/lib/alertMatchCounts'
import type { AlertDigestSample } from '@/lib/email'
import { BASE_INTEREST_PATHS } from '@/lib/alertsLandingInterests'

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

// A chip's live preview: the same real, up-to-3-sample preview the "send me a
// sample digest" / instant-first-digest paths already use — so what a visitor
// sees here is exactly what the real digest email would show, not a mockup.
async function getChipPreview(sourcePath: string): Promise<{ count: number; samples: AlertDigestSample[] } | null> {
  const preview = await getAlertDigestPreview(sourcePath, 3)
  return preview && preview.count > 0 ? { count: preview.count, samples: preview.samples } : null
}

async function getPopularChips(): Promise<{ chips: PopularChip[]; samplesByPath: Record<string, AlertDigestSample[]> }> {
  const samplesByPath: Record<string, AlertDigestSample[]> = {}

  const [popularResults] = await Promise.all([
    Promise.all(
      POPULAR_CANDIDATES.map(async (candidate) => {
        const preview = await getChipPreview(candidate.sourcePath)
        return preview ? { chip: { ...candidate, count: preview.count }, samples: preview.samples } : null
      })
    ),
    Promise.all(
      BASE_INTEREST_PATHS.map(async (sourcePath) => {
        const preview = await getChipPreview(sourcePath)
        if (preview) samplesByPath[sourcePath] = preview.samples
      })
    ),
  ])

  const chips: PopularChip[] = []
  for (const result of popularResults) {
    if (!result) continue
    chips.push(result.chip)
    samplesByPath[result.chip.sourcePath] = result.samples
  }
  return { chips, samplesByPath }
}

export default async function AlertsPage() {
  const { chips: popularChips, samplesByPath } = await getPopularChips()
  return (
    <div className="ch-surface min-h-screen">
      <AlertsLanding popularChips={popularChips} samplesByPath={samplesByPath} />
    </div>
  )
}
