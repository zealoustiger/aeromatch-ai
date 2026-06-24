import type { Metadata } from 'next'
import Link from 'next/link'
import { GitCompare, ArrowRight } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import { COMPARISONS, resolveComparisonModel } from '@/lib/aircraftComparisons'

export const metadata: Metadata = {
  title: 'Aircraft Comparisons — Side by Side',
  description:
    'Head-to-head aircraft comparisons — Cessna 172 vs Cirrus SR22, SR20 vs SR22, Cherokee vs Arrow, and more. Compare specs, performance, and what makes each different.',
  alternates: { canonical: `${SITE_URL}/aircraft/compare` },
  openGraph: {
    title: 'Aircraft Comparisons — Side by Side',
    description:
      'Compare popular general-aviation aircraft side by side — specs, performance, and what makes each different.',
    url: `${SITE_URL}/aircraft/compare`,
    type: 'website',
    siteName: SITE_NAME,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function CompareIndexPage() {
  const cards = COMPARISONS.map((c) => {
    const a = resolveComparisonModel(c.a)
    const b = resolveComparisonModel(c.b)
    return a && b ? { slug: c.slug, a, b } : null
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Aircraft for sale', href: '/aircraft' },
            { label: 'Compare' },
          ]}
        />

        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
          <GitCompare className="h-7 w-7 shrink-0 text-sky-500" />
          Aircraft comparisons
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
          Trying to decide between two airplanes? These head-to-head comparisons put the
          specs, performance, and ownership trade-offs of popular general-aviation singles
          side by side — so you can choose the right one to buy or co-own.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {cards.map(({ slug, a, b }) => (
            <Link
              key={slug}
              href={`/aircraft/compare/${slug}`}
              className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300"
            >
              <span className="text-base font-semibold text-slate-900">
                {a.make} {a.model} <span className="font-normal text-slate-400">vs</span> {b.make} {b.model}
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-sky-500" />
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/aircraft"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            Browse all aircraft for sale <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
