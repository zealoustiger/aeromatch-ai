import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, BadgeCheck, Check, ArrowRight } from 'lucide-react'
import { SITE_URL } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'
import ModelFaq from '@/components/ModelFaq'
import { buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'
import { gradeMeta, QUALITY_SIGNALS, GRADE_CUTOFFS, type Grade } from '@/lib/listingQuality'
import { TRUST_SIGNALS } from '@/lib/partnershipTrust'
import { AIRCRAFT_TRUST_SIGNALS } from '@/lib/aircraftTrust'

const TITLE = 'What our listing badges mean'
const PATH = '/listing-quality'
const DESCRIPTION =
  'How ClubHanger grades listing quality (A / B / C) and what the trust signals on each listing mean. An honest, plain-English guide so you can judge any aircraft or partnership listing at a glance.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} — Listing Quality & Trust Badges | ClubHanger` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description:
      'A plain-English guide to ClubHanger’s listing-quality grade (A/B/C) and the trust signals shown on every listing.',
    url: `${SITE_URL}${PATH}`,
    type: 'website',
  },
}

// Visible answers are read 1:1 by the FAQPage JSON-LD below — keep them in sync.
const FAQS: { q: string; a: string }[] = [
  {
    q: 'Does the A / B / C grade mean the aircraft is in good condition?',
    a: 'No. The grade measures how complete the listing is — how many of the key facts a buyer needs are actually filled in (price, year, make, model, location, registration, total time, and a real description). It is not an inspection, an appraisal, or a judgement of the aircraft’s condition. Always do your own pre-purchase inspection.',
  },
  {
    q: 'How is the quality grade calculated?',
    a: `Each listing earns points for the details it includes — an asking price is worth the most, then year, make, model and location, then registration, total time, and a full description. The points add up to a score out of 100. Listings scoring ${GRADE_CUTOFFS.A} or more are Grade A, ${GRADE_CUTOFFS.B} to ${GRADE_CUTOFFS.A - 1} are Grade B, and anything lower is Grade C.`,
  },
  {
    q: 'What are the trust signals?',
    a: 'Trust signals are a separate set of checks shown as a "trust signals" chip. They flag listings that are filled out, disclose the details buyers care about, are contacted on ClubHanger rather than off-platform, and are posted by a signed-up member rather than scraped from an aggregator. The more signals a listing meets, the more confidence you can have in it.',
  },
]

const GRADES: Grade[] = ['A', 'B', 'C']

export default function ListingQualityPage() {
  const faqJsonLd = buildFaqPageJsonLd(FAQS, { url: `${SITE_URL}${PATH}` })

  return (
    <main className="ch-surface min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Listing badges' }]}
        />

        {/* Intro */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            What our listing badges mean
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Every aircraft and partnership listing on ClubHanger carries two kinds of
            badge to help you judge it at a glance: a <strong>quality grade</strong>{' '}
            (A, B, or C) and a set of <strong>trust signals</strong>. Here is exactly
            what each one means — and, just as importantly, what it doesn&rsquo;t.
          </p>
        </header>

        {/* Quality grade */}
        <section className="ch-panel mb-8 rounded-2xl p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <BadgeCheck className="h-5 w-5 text-sky-600" aria-hidden />
            Listing quality grade (A / B / C)
          </h2>
          <p className="mt-3 text-slate-600">
            The grade measures how <strong>complete</strong> a listing is — how many of
            the facts a buyer needs are actually filled in. It is <em>not</em> a measure
            of the aircraft&rsquo;s condition, and it is not an appraisal of whether the
            price is fair. A sparse listing can still be a great airplane; it just gives
            you less to go on. Always do your own pre-purchase inspection.
          </p>

          <div className="mt-6 space-y-3">
            {GRADES.map((g) => {
              const gm = gradeMeta(g)
              return (
                <div
                  key={g}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${gm.chip}`}
                  >
                    {gm.short}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{gm.label}</p>
                    <p className="text-sm text-slate-600">{gm.blurb}.</p>
                  </div>
                </div>
              )
            })}
          </div>

          <h3 className="mt-7 text-sm font-semibold text-slate-900">
            What goes into the score
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Each listing earns points for the details it includes. The more complete it
            is, the higher its grade:
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {QUALITY_SIGNALS.map((s) => (
              <li
                key={s.key}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-100"
              >
                <span className="text-slate-700">{s.label}</span>
                <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                  {s.points} pts
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Trust signals */}
        <section className="ch-panel mb-8 rounded-2xl p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <ShieldCheck className="h-5 w-5 text-sky-600" aria-hidden />
            Trust signals
          </h2>
          <p className="mt-3 text-slate-600">
            Separate from the quality grade, the <strong>trust signals</strong> chip
            counts how many trust checks a listing meets (for example,{' '}
            &ldquo;3/4 trust signals&rdquo;). They reward listings that are filled out,
            handled on-platform, and posted by real members — the things pilots tell us
            matter most. The checks differ slightly for partnerships and for aircraft
            for sale:
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Partnership listings
              </h3>
              <ul className="mt-3 space-y-3">
                {TRUST_SIGNALS.map((s) => (
                  <li key={s.key} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">
                        {s.label}
                      </span>
                      <span className="block text-xs text-slate-500">{s.hint}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Aircraft for sale
              </h3>
              <ul className="mt-3 space-y-3">
                {AIRCRAFT_TRUST_SIGNALS.map((s) => (
                  <li key={s.key} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">
                        {s.label}
                      </span>
                      <span className="block text-xs text-slate-500">{s.hint}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* For sellers */}
        <section className="mb-8 rounded-2xl border border-sky-200 bg-sky-50/60 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-sky-900">
            Posting a listing? Earn a higher grade.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-sky-900/80">
            Filling in the asking price, year, make and model, registration, total time,
            and a real description bumps your listing toward Grade A — and a complete,
            on-platform, member-posted listing earns every trust signal. Complete
            listings get more attention from serious pilots.
          </p>
          <Link
            href="/partnerships/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            Post a listing
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>

        {/* FAQ */}
        <ModelFaq label="Listing badges" faqs={FAQS} />
      </div>

      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
    </main>
  )
}
