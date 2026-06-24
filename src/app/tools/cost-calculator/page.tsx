import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator } from 'lucide-react'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'
import CostCalculator from '@/components/CostCalculator'
import ModelFaq from '@/components/ModelFaq'
import { buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'

export const metadata: Metadata = {
  title: 'Aircraft Partnership Cost Calculator — True Cost of Co-Ownership',
  description:
    'Calculate the real monthly and per-hour cost of an aircraft partnership share. Compare co-ownership against renting and full ownership with transparent buy-in, fixed, and wet-rate inputs.',
  alternates: { canonical: `${SITE_URL}/tools/cost-calculator` },
  openGraph: {
    title: 'Aircraft Partnership Cost Calculator',
    description: 'See the true monthly and per-hour cost of a co-ownership share vs. renting or owning outright.',
    url: `${SITE_URL}/tools/cost-calculator`,
    type: 'website',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `Aircraft Partnership Cost Calculator on ${SITE_NAME}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aircraft Partnership Cost Calculator',
    description: 'See the true monthly and per-hour cost of a co-ownership share vs. renting or owning outright.',
    images: [DEFAULT_OG_IMAGE],
  },
}

const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Aircraft Partnership Cost Calculator',
  description:
    'Free calculator for the true all-in monthly and per-hour cost of an aircraft partnership share, compared against renting and full ownership.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web browser',
  url: `${SITE_URL}/tools/cost-calculator`,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

// Curated, evergreen FAQ for the cost calculator — genuine questions a pilot
// weighing a partnership share actually asks. Answers are written from this page's
// own explanations (no fabricated figures, no live counts), so they stay accurate
// and never go stale. Rendered as a visible accordion (ModelFaq) AND emitted as
// FAQPage JSON-LD, so the visible text matches the structured data 1:1.
const COST_FAQS: { q: string; a: string }[] = [
  {
    q: 'How much does it cost to own an aircraft in a partnership?',
    a: 'Your cost has two parts: your share of the fixed costs (hangar, insurance, and an annual/maintenance reserve), which you pay whether or not you fly, plus your flying at the wet rate, which covers fuel and per-hour upkeep. Plug a share’s buy-in, monthly fixed cost, and wet rate into the calculator above to see your true all-in monthly figure for the hours you expect to fly.',
  },
  {
    q: 'Is an aircraft partnership cheaper than renting?',
    a: 'For most active pilots, yes. A partnership almost always beats renting once you fly a handful of hours a month, because you stop paying a marked-up rental rate on every hour. Use the comparison panel to enter your local club’s rental rate and find the break-even point where the share becomes cheaper for you.',
  },
  {
    q: 'What is included in the "all-in monthly" cost?',
    a: 'The all-in monthly figure is your share of the fixed costs — hangar, insurance, and an annual reserve — plus your flying at the wet rate for the hours you plan to fly that month. Fixed costs are owed even in a month you don’t fly; the wet-rate portion scales with how much you actually fly.',
  },
  {
    q: 'How is the true cost per hour calculated?',
    a: 'True cost per hour spreads your share of the fixed costs across the hours you actually fly and adds the wet rate. Because the fixed costs are the same no matter how much you fly, your effective hourly cost drops the more you fly — flying more hours in the month lowers your true cost per hour.',
  },
  {
    q: 'Why is co-ownership so much cheaper than owning a plane outright?',
    a: 'The expensive part of owning an aircraft is the fixed cost — hangar, insurance, and the annual — which you pay even if the plane sits. In a partnership you split those fixed costs across the group, so each owner carries only a fraction of them, while still flying at roughly the same hourly cost. That split is what makes co-ownership dramatically cheaper than sole ownership.',
  },
]

export default function CostCalculatorPage() {
  const faqJsonLd = buildFaqPageJsonLd(COST_FAQS, {
    url: `${SITE_URL}/tools/cost-calculator`,
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'Cost calculator' },
        ]}
      />
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          <Calculator className="h-7 w-7 text-sky-600" />
          Aircraft partnership cost calculator
        </h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Plug in a share’s buy-in, monthly fixed cost, and wet rate to see your true all-in monthly and per-hour cost —
          and how it stacks up against renting or owning the plane outright.
        </p>
      </div>

      <CostCalculator variant="full" />

      <div className="mt-12 max-w-2xl space-y-4 text-sm leading-relaxed text-slate-600">
        <h2 className="text-lg font-semibold text-slate-900">How to read these numbers</h2>
        <p>
          <strong>All-in monthly</strong> is your share of fixed costs (hangar, insurance, annual reserve) plus your
          flying at the wet rate. <strong>True cost per hour</strong> spreads those fixed costs across the hours you
          actually fly — fly more and your effective hourly drops.
        </p>
        <p>
          A partnership almost always beats renting once you fly a handful of hours a month, and it’s dramatically
          cheaper than sole ownership because you split the fixed costs. Use the comparison panel to find your
          break-even against your local club’s rental rate.
        </p>
        <p>
          Ready to find a share?{' '}
          <Link href="/partnerships" className="font-medium text-sky-700 hover:underline">
            Browse partnerships near you
          </Link>{' '}
          or{' '}
          <Link href="/tools/earnings-calculator" className="font-medium text-sky-700 hover:underline">
            see what offering a share could earn you
          </Link>
          .
        </p>
      </div>

      {/* Evergreen FAQ — visible accordion + matching FAQPage JSON-LD above. */}
      <ModelFaq label="Aircraft partnership costs" faqs={COST_FAQS} className="mt-12 max-w-2xl" />
    </div>
  )
}
