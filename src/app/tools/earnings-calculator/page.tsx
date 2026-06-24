import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'
import EarningsCalculator from '@/components/EarningsCalculator'
import ModelFaq from '@/components/ModelFaq'
import { buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'

const OG_TITLE = 'Aircraft Partnership Earnings Calculator'
const OG_DESCRIPTION =
  'Model the monthly offset and break-even of offering shares in your aircraft.'

export const metadata: Metadata = {
  title: 'Aircraft Partnership Earnings Calculator — Offset Your Ownership Costs',
  description:
    'See how much offering partnership shares in your aircraft could offset your fixed costs. Model monthly dues income, flying margin, upfront buy-ins, and how many partners cover your hangar and insurance.',
  alternates: { canonical: `${SITE_URL}/tools/earnings-calculator` },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: `${SITE_URL}/tools/earnings-calculator`,
    type: 'website',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE, alt: `${OG_TITLE} on ${SITE_NAME}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Aircraft Partnership Earnings Calculator',
  description:
    'Free calculator that models how much offering partnership shares in your aircraft could offset your fixed costs — monthly dues income, flying margin, buy-ins, and break-even.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web browser',
  url: `${SITE_URL}/tools/earnings-calculator`,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

// Curated, evergreen FAQ for the earnings calculator — genuine questions an aircraft
// OWNER weighing whether to offer partnership shares actually asks (the owner side,
// mirroring the buyer-side FAQ on the cost calculator). Answers are written from this
// page's own explanations (no fabricated figures, no live counts), so they stay
// accurate and never go stale. Rendered as a visible accordion (ModelFaq) AND emitted
// as FAQPage JSON-LD, so the visible text matches the structured data 1:1.
const EARNINGS_FAQS: { q: string; a: string }[] = [
  {
    q: 'How much can I earn by offering partnership shares in my aircraft?',
    a: 'Bringing on partners doesn’t turn your plane into a profit center — it offsets the costs you already pay. Each partner pays a one-time buy-in (capital you recover upfront), monthly dues toward your fixed costs, and a wet rate when they fly. Your monthly offset is the dues income plus the margin between the wet rate you charge and your real cost per hour. Enter your numbers in the calculator above to see the monthly figure for your aircraft.',
  },
  {
    q: 'How many partners do I need to cover my fixed costs?',
    a: 'It depends on your fixed costs (hangar, insurance, annual reserve) and the monthly dues each partner pays. The "fixed costs covered" bar in the calculator shows how close your dues come to zeroing out those costs — many owners fully cover their fixed costs with two or three partners while keeping priority access to the aircraft.',
  },
  {
    q: 'What is the buy-in and do I keep it?',
    a: 'The buy-in is a one-time payment each partner makes for their ownership share of the aircraft. It is capital you recover upfront, not income — it reflects the value of the equity stake the partner is buying. The recurring offset to your ownership costs comes from the monthly dues and the flying margin, which the calculator models separately from the upfront buy-in.',
  },
  {
    q: 'How is the monthly offset different from the flying margin?',
    a: 'The monthly offset has two parts: the dues income each partner pays toward fixed costs every month whether or not they fly, plus the flying margin — the difference between the wet rate you charge and your real cost per hour, earned only on the hours partners actually fly. Dues are steady; the flying-margin portion scales with how much your partners fly.',
  },
  {
    q: 'Will adding partners limit my own access to the aircraft?',
    a: 'Most co-ownership groups are small (typically 2–4 owners), so each owner still gets consistent, scheduled access. The goal is to offset your fixed costs without giving up priority on the airplane — you decide how many shares to offer. Once you have modeled the offset here, you can post your partnership to start finding qualified, budget-matched pilots.',
  },
]

export default function EarningsCalculatorPage() {
  const faqJsonLd = buildFaqPageJsonLd(EARNINGS_FAQS, {
    url: `${SITE_URL}/tools/earnings-calculator`,
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
          { label: 'Earnings calculator' },
        ]}
      />
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          <TrendingUp className="h-7 w-7 text-sky-600" />
          Aircraft partnership earnings calculator
        </h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Own a plane that sits idle most of the month? Model how much bringing on partners could offset your fixed
          costs — from monthly dues and flying margin to the upfront capital from buy-ins.
        </p>
      </div>

      <EarningsCalculator variant="full" />

      <div className="mt-12 max-w-2xl space-y-4 text-sm leading-relaxed text-slate-600">
        <h2 className="text-lg font-semibold text-slate-900">How the offset works</h2>
        <p>
          Each partner pays a one-time <strong>buy-in</strong> (capital you recover upfront), monthly{' '}
          <strong>dues</strong> toward fixed costs, and a <strong>wet rate</strong> when they fly. Your monthly offset is
          the dues income plus the margin between the wet rate you charge and your real cost per hour.
        </p>
        <p>
          The “fixed costs covered” bar shows how close your dues come to zeroing out your hangar, insurance, and annual
          reserve — many owners fully cover their fixed costs with two or three partners while keeping priority access to
          the aircraft.
        </p>
        <p>
          Ready to find pilots?{' '}
          <Link href="/partnerships/new" className="font-medium text-sky-700 hover:underline">
            Post your partnership
          </Link>{' '}
          or{' '}
          <Link href="/tools/cost-calculator" className="font-medium text-sky-700 hover:underline">
            see the buyer’s side with the cost calculator
          </Link>
          .
        </p>
      </div>

      {/* Evergreen FAQ — visible accordion + matching FAQPage JSON-LD above. */}
      <ModelFaq label="Aircraft partnership earnings" faqs={EARNINGS_FAQS} className="mt-12 max-w-2xl" />
    </div>
  )
}
