import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Calculator,
  Plane,
  Users,
  Shield,
  Wrench,
  CalendarClock,
  TrendingUp,
  Scale,
  CheckCircle2,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { SITE_URL } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'
import { buildArticleJsonLd } from '@/lib/guideJsonLd'

const TITLE = 'Aircraft Leaseback vs. Co-Ownership'
const PATH = '/guides/leaseback-vs-co-ownership'
const DESCRIPTION =
  'A plain-English comparison of aircraft leaseback (renting your plane to a flight school or FBO for income) versus co-ownership / partnership (sharing ownership and costs with other pilots): who each is for, income vs. cost-offset, control and scheduling, wear and hours, and the high-level tax and insurance differences — plus how to decide. Educational information only — not legal, tax, or financial advice.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} — How to Decide | ClubHanger` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description:
      'Leaseback (income from renting your plane to a flight school/FBO) vs. co-ownership (sharing the plane and its costs with other pilots) — who each suits, control, wear, tax and insurance at a high level, and how to decide. Educational, not legal/tax/financial advice.',
    url: `${SITE_URL}${PATH}`,
    type: 'article',
  },
}

// FAQ data is the SINGLE source of truth for both the visible FAQ section and the
// FAQPage JSON-LD, so the structured data can never claim a Q&A that isn't shown
// on the page (no cloaking — every marked-up answer is rendered verbatim below).
const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is the difference between a leaseback and co-ownership?',
    a: 'They solve the cost of an airplane in opposite ways. In a leaseback you own the aircraft (alone or with others) and lease it to a flight school or FBO, who rents it out to their students and renters; the rental revenue offsets — and sometimes covers — your fixed costs, in exchange for which the operator controls the schedule and the plane flies a lot of hours on other people\'s missions. In co-ownership you share the aircraft with a small group of partners: each pays a buy-in and a slice of the costs, you collectively control the schedule, and there is no rental income — the savings come from splitting the fixed costs rather than earning revenue. Leaseback is an income/cost-offset play built around utilization; co-ownership is a cost-sharing play built around shared access and control.',
  },
  {
    q: 'Does a leaseback actually make money?',
    a: 'Sometimes it offsets a large share of your fixed costs, and occasionally it nets a small profit, but a leaseback is best thought of as a way to reduce the cost of owning a plane you want anyway — not as a reliable investment. The economics live or die on utilization (how many hours the operator actually rents it), the rental rate and your split, and maintenance: a plane flown hard by many renters needs more frequent inspections and reaches its expensive overhauls sooner, and those bills can erase a thin margin. The honest way to size it up is to model it with realistic — not best-case — hours and a maintenance reserve; the earnings calculator lets you put your own numbers in rather than trusting a headline figure.',
  },
  {
    q: 'Which is better for someone who only flies occasionally?',
    a: 'It depends on whether your priority is income or access. A leaseback can suit an occasional flyer who wants to own a specific airplane while having the operator\'s renters help carry the fixed costs — but you will often have to schedule around their bookings and accept more wear on the plane. Co-ownership can also suit an occasional flyer, because splitting the fixed costs with two or three partners lowers what you owe each month whether you fly or not, while keeping the plane available most of the time and entirely under the group\'s control. If steady access and control matter more than income, co-ownership tends to fit; if you can tolerate less control in exchange for revenue, a leaseback can.',
  },
  {
    q: 'How do control and scheduling differ between the two?',
    a: 'This is one of the biggest practical differences. Under a leaseback the operator generally controls the schedule because their business depends on renting the plane — you typically book your own airplane around their bookings, and peak times may be exactly when it is busiest with renters. Under co-ownership the partners control the schedule themselves through a shared calendar and a few fairness rules in the agreement, so access is more predictable and there is no outside operator to coordinate with. If having the plane on the days you want it is a priority, co-ownership usually gives you more direct control.',
  },
  {
    q: 'Can you combine a leaseback with co-ownership?',
    a: 'Yes — some groups co-own an aircraft and also place it on leaseback, so a small ownership group shares the buy-in and fixed costs and the rental revenue offsets those costs further. It can work, but it stacks the trade-offs of both: you have partners to coordinate with and an operator controlling much of the schedule, plus heavier utilization and the bookkeeping of shared income, costs, and wear. If you go this route it is especially important to write the revenue split, scheduling priority, and maintenance-reserve rules into the agreement, and to get the tax and insurance treatment confirmed by qualified professionals before you start.',
  },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 scroll-mt-20 text-xl font-bold text-slate-900 sm:text-2xl">
      {children}
    </h2>
  )
}

export default function LeasebackVsCoOwnershipGuidePage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Guides', href: '/guides' },
          { label: TITLE },
        ]}
      />

      <article className="text-slate-700">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Aircraft Leaseback vs. Co-Ownership
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Two of the most common ways to make owning an airplane affordable pull in opposite
            directions. A <strong>leaseback</strong> turns your plane into income by renting it to a
            flight school or FBO; <strong>co-ownership</strong> cuts your cost by sharing the plane and
            its bills with a few other pilots. This guide compares the two side by side — who each is
            for, income versus cost-offset, control, wear, and the high-level tax and insurance
            differences — so you can decide which fits. It is educational information,{' '}
            <strong>not</strong> legal, tax, or financial advice.
          </p>
        </header>

        {/* Prominent disclaimer up top — this is the advice boundary */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-900">
            <Scale className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>
              <strong>This is general educational information, not legal, tax, or financial advice.</strong>{' '}
              Every figure here is a clearly-labeled estimate or range, not a quote, and tax and
              insurance treatment vary by state and by situation. Talk to a{' '}
              <strong>qualified aviation attorney, tax advisor, and insurance broker</strong> before
              choosing a leaseback or a co-ownership arrangement.
            </span>
          </p>
        </div>

        {/* Quick links / table of contents */}
        <nav
          aria-label="In this guide"
          className="mt-8 rounded-xl border border-sky-100 bg-sky-50 p-5 text-sm"
        >
          <p className="font-semibold text-slate-900">In this guide</p>
          <ul className="mt-3 grid gap-x-6 gap-y-2 text-sky-700 sm:grid-cols-2">
            <li><a href="#two-models" className="hover:underline">The two models at a glance</a></li>
            <li><a href="#side-by-side" className="hover:underline">Side-by-side comparison</a></li>
            <li><a href="#income" className="hover:underline">Income vs. cost-offset</a></li>
            <li><a href="#control" className="hover:underline">Control &amp; scheduling</a></li>
            <li><a href="#wear" className="hover:underline">Wear &amp; hours</a></li>
            <li><a href="#tax-insurance" className="hover:underline">Tax &amp; insurance (high level)</a></li>
            <li><a href="#who" className="hover:underline">Who each is for</a></li>
            <li><a href="#decide" className="hover:underline">How to decide</a></li>
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </nav>

        <p className="mt-8 leading-relaxed">
          New to the idea of sharing a plane? Two companion guides cover the co-ownership side in
          depth:{' '}
          <Link href="/guides/aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how aircraft co-ownership &amp; partnerships work
          </Link>{' '}
          and{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how much it costs to co-own an aircraft
          </Link>
          . This guide is the decision layer above them: leaseback or co-ownership, and how to tell
          which one fits you.
        </p>

        <SectionHeading><span id="two-models" />The two models at a glance</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Both models exist to solve the same problem — airplanes are expensive to own alone — but they
          attack it from opposite ends:
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <TrendingUp className="h-5 w-5 text-sky-600" /> Leaseback
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You own the airplane and lease it to a flight school or FBO, who rents it to their
              students and renters. The rental revenue offsets your fixed costs — but the operator
              largely controls the schedule and the plane flies many hours on other people&apos;s
              missions. It is an <strong>income / cost-offset</strong> play built around high
              utilization.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Users className="h-5 w-5 text-sky-600" /> Co-ownership
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You share the airplane with a small group of partners. Each pays a buy-in and a slice of
              the costs, and the group controls the schedule together. There is no rental income — the
              savings come from <strong>splitting the fixed costs</strong>, with shared access and
              control.
            </p>
          </div>
        </div>

        <SectionHeading><span id="side-by-side" />Side-by-side comparison</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The clearest way to see the trade-offs is to put the two models next to each other. This is a
          high-level summary of how they typically differ — not a guarantee for any specific deal:
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3 font-semibold">Factor</th>
                <th className="px-4 py-3 font-semibold">Leaseback</th>
                <th className="px-4 py-3 font-semibold">Co-ownership / partnership</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-4 py-3"><strong>Primary benefit</strong></td>
                <td className="px-4 py-3">Rental income offsets fixed costs</td>
                <td className="px-4 py-3">Fixed costs split across partners</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Who else is involved</strong></td>
                <td className="px-4 py-3">A flight school / FBO and its renters</td>
                <td className="px-4 py-3">A small group of co-owner pilots</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Who controls the schedule</strong></td>
                <td className="px-4 py-3">Mostly the operator; you book around renters</td>
                <td className="px-4 py-3">The partners, via a shared calendar</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Hours flown / wear</strong></td>
                <td className="px-4 py-3">High — many renters; faster to overhauls</td>
                <td className="px-4 py-3">Lower — only the partners fly it</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Up-front cost</strong></td>
                <td className="px-4 py-3">Full aircraft (you own it all)</td>
                <td className="px-4 py-3">A share of the buy-in only</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Best when you</strong></td>
                <td className="px-4 py-3">Want income and can give up control</td>
                <td className="px-4 py-3">Want access and control, shared cost</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Model it with</strong></td>
                <td className="px-4 py-3">
                  <Link href="/tools/earnings-calculator" className="font-medium text-sky-700 hover:underline">
                    Earnings calculator
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href="/tools/cost-calculator" className="font-medium text-sky-700 hover:underline">
                    Cost calculator
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 leading-relaxed">
          The rest of this guide walks through the rows that matter most when you are choosing.
        </p>

        <SectionHeading><span id="income" />Income vs. cost-offset</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The headline difference is <em>direction of money</em>. A leaseback aims to bring revenue{' '}
          <strong>in</strong>: rent from the operator offsets — and occasionally exceeds — your fixed
          costs. Co-ownership only ever sends money <strong>out</strong>, but less of it, because the
          fixed costs that exist whether the plane flies or not are divided across the group.
        </p>
        <p className="mt-4 leading-relaxed">
          A leaseback is best understood as a way to lower the cost of a plane you want anyway, not as a
          dependable profit center. Whether it offsets a little or a lot turns on{' '}
          <strong>utilization</strong> (how many hours the operator actually rents it), the rental rate
          and your split, and the maintenance the extra hours create. Co-ownership&apos;s savings are
          more predictable: split the fixed bill by the number of partners and you know roughly what
          you owe each month. To put real numbers on either side, model a leaseback with the{' '}
          <Link href="/tools/earnings-calculator" className="font-medium text-sky-700 hover:underline">
            earnings calculator
          </Link>{' '}
          and a partnership share with the{' '}
          <Link href="/tools/cost-calculator" className="font-medium text-sky-700 hover:underline">
            cost calculator
          </Link>
          . For the full cost breakdown behind co-ownership, see{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how much it costs to co-own an aircraft
          </Link>
          . Treat any figure as a clearly-labeled estimate, and use realistic — not best-case — inputs.
        </p>

        <SectionHeading><span id="control" />Control &amp; scheduling</SectionHeading>
        <p className="mt-4 leading-relaxed">
          For many pilots this is the deciding factor. Under a leaseback the{' '}
          <strong>operator generally controls the schedule</strong> — their business depends on renting
          the airplane — so you book your own plane around their renters, and peak times for you may be
          exactly when it is busiest for them. Under co-ownership the{' '}
          <strong>partners control the schedule themselves</strong> through a shared calendar and a few
          fairness rules, with no outside operator to coordinate with.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <CalendarClock className="h-5 w-5 text-sky-600" /> The control trade-off
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>Leaseback: more revenue, less say over when the plane is available to you.</li>
            <li>Co-ownership: no revenue, but predictable, group-controlled access.</li>
            <li>Either way, write the scheduling rules down — in the lease, or in the partnership agreement.</li>
          </ul>
        </div>

        <SectionHeading><span id="wear" />Wear &amp; hours</SectionHeading>
        <p className="mt-4 leading-relaxed">
          More flying means more income on a leaseback — and more wear. A leaseback aircraft is rented
          to many different pilots and tends to accumulate hours quickly, which means more frequent
          inspections and a faster march toward the expensive, inevitable events like the engine
          overhaul. A co-owned plane is flown only by its small group of partners, so it generally
          accumulates hours more slowly and wear is shared among people who all have a stake in caring
          for it.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Wrench className="h-5 w-5 text-sky-600" /> Why hours matter to the math
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>High utilization brings the engine and prop overhauls sooner.</li>
            <li>A maintenance reserve per flight hour keeps the big bills from erasing leaseback margin.</li>
            <li>On a co-owned plane, the same per-hour reserve spreads wear fairly across partners.</li>
          </ul>
        </div>

        <SectionHeading><span id="tax-insurance" />Tax &amp; insurance differences (high level)</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The two models can be treated quite differently for tax and insurance, and the details are
          exactly where professional advice pays for itself. At a <strong>high level only</strong>:
        </p>
        <ul className="mt-4 space-y-3">
          <li className="leading-relaxed">
            <strong className="text-slate-900">Tax.</strong> A leaseback generates rental income and
            may involve business-use considerations, depreciation, and sales/use tax questions that
            differ sharply from simply co-owning a plane for personal use. The right treatment depends
            on your situation and your state — this is a question for a qualified tax advisor, not a
            web page.
          </li>
          <li className="leading-relaxed">
            <strong className="text-slate-900">Insurance.</strong> A plane flown commercially by many
            renters under a leaseback typically needs different — often broader and costlier — coverage
            than a co-owned plane flown by a few named pilots. Insurers care about how the aircraft is
            used, who flies it, and their experience, so confirm coverage with a broker for the
            specific arrangement you are considering.
          </li>
        </ul>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-900">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>
              This is a general overview, <strong>not tax or insurance advice</strong>. Treatment
              varies by state and situation — confirm the specifics with your own tax advisor and
              insurance broker before you commit.
            </span>
          </p>
        </div>

        <SectionHeading><span id="who" />Who each model is for</SectionHeading>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <TrendingUp className="h-5 w-5 text-sky-600" /> A leaseback can fit if you
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Want to own a specific plane and offset its cost with income</li>
              <li>Can tolerate the operator controlling much of the schedule</li>
              <li>Are comfortable with high utilization and faster wear</li>
              <li>Have an operator nearby that needs the type you own</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Users className="h-5 w-5 text-sky-600" /> Co-ownership can fit if you
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Want predictable access and control over scheduling</li>
              <li>Prefer a lower buy-in (a share, not the whole plane)</li>
              <li>Are happy to coordinate with a few compatible partners</li>
              <li>Want lower wear and a plane only your group flies</li>
            </ul>
          </div>
        </div>

        <SectionHeading><span id="decide" />How to decide</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Start with what you actually want from owning a plane, then let the trade-offs sort
          themselves out. A short way to think it through:
        </p>
        <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-5">
          <ul className="space-y-2 text-sm text-slate-700">
            {[
              'Is your priority income/cost-offset (leans leaseback) or shared cost with control (leans co-ownership)?',
              'How much do you fly, and how much do you need the plane on the days you want it?',
              'Are you comfortable with high utilization and faster wear, or do you want a lightly-flown plane?',
              'Can you afford the full buy-in (leaseback) or do you prefer a share (co-ownership)?',
              'Is there an operator nearby that needs your type — or compatible partners to share with?',
              'Model both: rental revenue in the earnings calculator, a share in the cost calculator, with realistic inputs.',
              'Confirm the tax and insurance treatment for your situation with qualified professionals before committing.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          The two are not mutually exclusive — some groups co-own a plane <em>and</em> lease it back —
          but that stacks the trade-offs of both (see the FAQ). Whichever way you lean, run your own
          numbers and put the terms in writing.
        </p>

        {/* FAQ */}
        <SectionHeading><span id="faq" />Frequently asked questions</SectionHeading>
        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {FAQS.map((f) => (
            <div key={f.q} className="py-5">
              <h3 className="font-semibold text-slate-900">{f.q}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{f.a}</p>
            </div>
          ))}
        </div>

        {/* Related guides */}
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <BookOpen className="h-5 w-5 text-sky-600" /> Keep reading
          </h2>
          <ul className="mt-2 space-y-1 text-sm leading-relaxed text-slate-600">
            <li>
              <Link href="/guides/aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
                How Aircraft Co-Ownership &amp; Partnerships Work
              </Link>{' '}
              — the structures, share types, and how to find the right partner.
            </li>
            <li>
              <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
                How Much Does It Cost to Co-Own an Aircraft?
              </Link>{' '}
              — a full cost breakdown with a worked Cessna 172 example.
            </li>
            <li>
              <Link href="/guides/aircraft-partnership-agreement" className="font-medium text-sky-700 hover:underline">
                What to Put in an Aircraft Partnership Agreement
              </Link>{' '}
              — the plain-English checklist for the co-ownership side.
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Model both, then choose</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            See what a leaseback could earn, what a partnership share would cost, then find pilots to
            share a plane with near you.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/tools/earnings-calculator"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 font-medium text-white hover:bg-sky-700"
            >
              <TrendingUp className="h-5 w-5" /> Estimate leaseback earnings
            </Link>
            <Link
              href="/tools/cost-calculator"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-5 py-2.5 font-medium text-sky-700 hover:bg-sky-50"
            >
              <Calculator className="h-5 w-5" /> Estimate co-ownership cost
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Ready to share instead?{' '}
            <Link href="/partnerships" className="font-medium text-sky-700 hover:underline">
              Browse aircraft partnerships
            </Link>{' '}
            <ArrowRight className="inline h-4 w-4" />
          </p>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          This guide is general educational information comparing aircraft leaseback and co-ownership.
          It is <strong>not legal, tax, or financial advice</strong>, and does not create an
          attorney-client relationship. All figures are illustrative estimate ranges, not quotes — and
          income, costs, tax, and insurance treatment vary widely by aircraft, region, use, and
          situation. Get real quotes and consult a qualified aviation attorney, tax advisor, and
          insurance broker before entering any leaseback or ownership arrangement.
        </p>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildArticleJsonLd({ title: TITLE, description: DESCRIPTION, path: PATH })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  )
}
