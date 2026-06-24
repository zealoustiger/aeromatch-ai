import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Plane, ArrowRight, Gauge, Lightbulb, Check, GitCompare } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import ModelFaq from '@/components/ModelFaq'
import { countMakeModel } from '@/components/AircraftSaleList'
import { buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import {
  COMPARISONS,
  getComparison,
  resolveComparisonModel,
} from '@/lib/aircraftComparisons'

type Props = { params: Promise<{ comparison: string }> }

// Only the curated slugs render; any other slug 404s (no thin/combinatorial pages).
export const dynamicParams = false

export async function generateStaticParams() {
  return COMPARISONS.map((c) => ({ comparison: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { comparison } = await params
  const c = getComparison(comparison)
  if (!c) return {}
  const a = resolveComparisonModel(c.a)
  const b = resolveComparisonModel(c.b)
  if (!a || !b) return {}

  const label = `${a.make} ${a.model} vs ${b.make} ${b.model}`
  const url = `${SITE_URL}/aircraft/compare/${c.slug}`
  const description = `${a.make} ${a.model} vs ${b.make} ${b.model}: a side-by-side comparison of specs, performance, and what's different — to help you choose which to buy or co-own.`

  return {
    title: { absolute: `${label} — Side-by-Side Comparison | ${SITE_NAME}` },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${label} — side-by-side comparison`,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, alt: `${label} comparison on ${SITE_NAME}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${label} — side-by-side comparison`,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function ComparisonPage({ params }: Props) {
  const { comparison } = await params
  const c = getComparison(comparison)
  if (!c) notFound()
  const a = resolveComparisonModel(c.a)
  const b = resolveComparisonModel(c.b)
  if (!a || !b) notFound()

  const aLabel = `${a.make} ${a.model}`
  const bLabel = `${b.make} ${b.model}`
  const title = `${aLabel} vs ${bLabel}`

  // Live inventory counts so the "Browse N for sale" CTAs only link to a model hub
  // that actually has listings (the hub 404s on zero inventory) — never a dead link.
  const [aCount, bCount] = await Promise.all([
    countMakeModel(a.make, a.modelPattern, a.notModelPattern),
    countMakeModel(b.make, b.modelPattern, b.notModelPattern),
  ])
  const aPath = `/aircraft/${a.makeSlug}/${a.modelSlug}`
  const bPath = `/aircraft/${b.makeSlug}/${b.modelSlug}`

  // Union of spec-row labels, A's order first, then any B-only labels appended.
  const aSpecs = a.specTable ?? []
  const bSpecs = b.specTable ?? []
  const aMap = new Map(aSpecs.map((r) => [r.label, r.value]))
  const bMap = new Map(bSpecs.map((r) => [r.label, r.value]))
  const labels: string[] = []
  for (const r of aSpecs) labels.push(r.label)
  for (const r of bSpecs) if (!aMap.has(r.label)) labels.push(r.label)

  // Other comparisons to cross-link (keeps crawl equity inside the family).
  const others = COMPARISONS.filter((x) => x.slug !== c.slug)

  // FAQPage JSON-LD built from the SAME Q&As rendered visibly below (Google parity).
  const faqJsonLd = buildFaqPageJsonLd(c.faqs, {
    url: `${SITE_URL}/aircraft/compare/${c.slug}`,
  })

  return (
    <div className="ch-surface min-h-screen">
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Aircraft for sale', href: '/aircraft' },
            { label: 'Compare', href: '/aircraft/compare' },
            { label: title },
          ]}
        />

        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
          <GitCompare className="h-7 w-7 shrink-0 text-sky-500" />
          {aLabel} <span className="text-slate-400">vs</span> {bLabel}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">{c.intro}</p>

        {/* Live inventory CTAs — only shown when the model hub has listings. */}
        <div className="mt-6 flex flex-wrap gap-3">
          {aCount > 0 && (
            <Link
              href={aPath}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              <Plane className="h-4 w-4" />
              {aCount.toLocaleString()} {aLabel} for sale
            </Link>
          )}
          {bCount > 0 && (
            <Link
              href={bPath}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              <Plane className="h-4 w-4" />
              {bCount.toLocaleString()} {bLabel} for sale
            </Link>
          )}
        </div>

        {/* Side-by-side key specifications. */}
        {labels.length > 0 && (
          <section className="mt-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">
              <Gauge className="h-4 w-4 text-sky-500" />
              Key specifications, side by side
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-2.5 font-medium text-slate-500"></th>
                    <th className="px-5 py-2.5 font-semibold text-slate-800">{aLabel}</th>
                    <th className="px-5 py-2.5 font-semibold text-slate-800">{bLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {labels.map((lbl) => (
                    <tr key={lbl} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-2.5 text-xs font-medium text-slate-500">{lbl}</td>
                      <td className="px-5 py-2.5 text-slate-800">{aMap.get(lbl) ?? '—'}</td>
                      <td className="px-5 py-2.5 text-slate-800">{bMap.get(lbl) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-xs text-slate-400">
              Representative figures for a popular variant of each family — exact specs vary by
              model year, engine, and avionics configuration.
            </p>
          </section>
        )}

        {/* What's different — each model's highlights, side by side on desktop. */}
        {(a.highlights?.length || b.highlights?.length) ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { label: aLabel, path: aPath, count: aCount, highlights: a.highlights },
              { label: bLabel, path: bPath, count: bCount, highlights: b.highlights },
            ].map((m) =>
              m.highlights && m.highlights.length > 0 ? (
                <section key={m.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Lightbulb className="h-4 w-4 text-sky-500" />
                    What&apos;s different about the {m.label}
                  </h2>
                  <ul className="space-y-3">
                    {m.highlights.map((point, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {m.count > 0 && (
                    <Link
                      href={m.path}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
                    >
                      Browse {m.label} listings <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </section>
              ) : null
            )}
          </div>
        ) : null}

        {/* Head-to-head FAQ — genuine Q&As, mirrored 1:1 by the FAQPage JSON-LD above. */}
        {c.faqs.length > 0 && (
          <ModelFaq label={title} faqs={c.faqs} className="mt-8" />
        )}

        {/* More comparisons — cross-links across the new family. */}
        {others.length > 0 && (
          <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
              <GitCompare className="h-4 w-4 text-sky-500" />
              More aircraft comparisons
            </h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {others.map((x) => {
                const xa = resolveComparisonModel(x.a)
                const xb = resolveComparisonModel(x.b)
                if (!xa || !xb) return null
                return (
                  <Link
                    key={x.slug}
                    href={`/aircraft/compare/${x.slug}`}
                    className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
                  >
                    {xa.make} {xa.model} vs {xb.make} {xb.model}
                  </Link>
                )
              })}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <Link
                href="/aircraft/compare"
                className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
              >
                All aircraft comparisons <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
