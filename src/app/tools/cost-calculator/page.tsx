import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator } from 'lucide-react'
import { SITE_URL } from '@/lib/seo'
import CostCalculator from '@/components/CostCalculator'

export const metadata: Metadata = {
  title: 'Aircraft Partnership Cost Calculator — True Cost of Co-Ownership',
  description:
    'Calculate the real monthly and per-hour cost of an aircraft partnership share. Compare co-ownership against renting and full ownership with transparent buy-in, fixed, and wet-rate inputs.',
  alternates: { canonical: `${SITE_URL}/tools/cost-calculator` },
  openGraph: {
    title: 'Aircraft Partnership Cost Calculator',
    description: 'See the true monthly and per-hour cost of a co-ownership share vs. renting or owning outright.',
  },
}

export default function CostCalculatorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
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
    </div>
  )
}
