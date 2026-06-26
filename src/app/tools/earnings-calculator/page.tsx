import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { SITE_URL } from '@/lib/seo'
import EarningsCalculator from '@/components/EarningsCalculator'

export const metadata: Metadata = {
  title: 'Aircraft Partnership Earnings Calculator — Offset Your Ownership Costs',
  description:
    'See how much offering partnership shares in your aircraft could offset your fixed costs. Model monthly dues income, flying margin, upfront buy-ins, and how many partners cover your hangar and insurance.',
  alternates: { canonical: `${SITE_URL}/tools/earnings-calculator` },
  openGraph: {
    title: 'Aircraft Partnership Earnings Calculator',
    description: 'Model the monthly offset and break-even of offering shares in your aircraft.',
  },
}

export default function EarningsCalculatorPage() {
  return (
    <div className="ch-surface min-h-screen">
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          <TrendingUp className="h-7 w-7 text-emerald-600" />
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
          <Link href="/partnerships/new" className="font-medium text-emerald-700 hover:underline">
            Post your partnership
          </Link>{' '}
          or{' '}
          <Link href="/tools/cost-calculator" className="font-medium text-emerald-700 hover:underline">
            see the buyer’s side with the cost calculator
          </Link>
          .
        </p>
      </div>
    </div>
    </div>
  )
}
