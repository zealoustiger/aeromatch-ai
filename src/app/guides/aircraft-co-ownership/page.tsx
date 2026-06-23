import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, Plane, Users, Wallet, ArrowRight } from 'lucide-react'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'
import { buildArticleJsonLd } from '@/lib/guideJsonLd'

const TITLE = 'How Aircraft Co-Ownership & Partnerships Work'
const PATH = '/guides/aircraft-co-ownership'
const DESCRIPTION =
  'A plain-English guide to aircraft co-ownership and flying partnerships: how shared ownership works, what it costs, the types of shares, how partners split costs, how to find the right partner, and the real pros and cons.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} — A Pilot's Guide | ClubHanger` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description:
      'How shared aircraft ownership works, what it costs, how partners split expenses, and how to find a partner.',
    url: `${SITE_URL}${PATH}`,
    type: 'article',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${TITLE} — a guide on ${SITE_NAME}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description:
      'How shared aircraft ownership works, what it costs, how partners split expenses, and how to find a partner.',
    images: [DEFAULT_OG_IMAGE],
  },
}

// FAQ data is the SINGLE source of truth for both the visible FAQ section and the
// FAQPage JSON-LD, so the structured data can never claim a Q&A that isn't shown
// on the page (no cloaking — every marked-up answer is rendered verbatim below).
const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much does it cost to co-own a Cessna 172?',
    a: "It depends on the airplane and how many partners share it, but a common structure is a buy-in for your share of the aircraft's value plus a monthly fixed cost and an hourly (wet) rate for the hours you fly. As a rough illustration, a flying-club-grade Cessna 172 split four ways might mean a low five-figure buy-in for your quarter share, a modest monthly contribution toward hangar, insurance and the annual-inspection reserve, and an hourly rate that covers fuel and an engine-overhaul reserve. The exact numbers vary widely by region, aircraft age, and hangar costs — use a cost calculator with your own inputs rather than relying on a single headline figure.",
  },
  {
    q: 'How do partners split the costs of a shared aircraft?',
    a: 'Most partnerships split costs into two buckets. Fixed costs — hangar or tie-down, insurance, the annual inspection, database and subscription fees, and a reserve for the eventual engine overhaul — are usually shared equally (or in proportion to share size) regardless of how much each partner flies. Variable costs — fuel and oil, and often an hourly engine reserve — are paid by whoever flies, typically through a per-hour "wet rate" billed by the Hobbs or tach hour. Spelling out exactly which costs are fixed versus hourly, and how reserves are funded, is one of the most important parts of a written partnership agreement.',
  },
  {
    q: 'What is the difference between an equity share and a flying club?',
    a: "In an equity (co-ownership) share you actually own a piece of the aircraft — your name is on the title or on the LLC that holds it — so you build equity, share in the asset's value, and share liability and major-repair bills. A flying club is usually a non-equity membership: you pay dues and hourly rates to fly club aircraft you don't own, with no buy-in equity and no claim on the asset. Equity shares suit pilots who want a specific airplane and long-term ownership; clubs suit pilots who want flexibility and lower commitment.",
  },
  {
    q: 'How many partners is the right number for an aircraft partnership?',
    a: 'There is no single right answer, but the trade-off is consistent: more partners means lower cost per person but less availability and more scheduling coordination. Two to four partners is a common sweet spot for a single piston aircraft that each owner wants regular access to — enough to meaningfully split the fixed costs while keeping the airplane available most of the time. Larger groups push costs down further and look more like a flying club. Match the partner count to how often each person actually flies.',
  },
  {
    q: 'Do I need a written partnership agreement?',
    a: "Yes — a clear written agreement is strongly recommended for any co-ownership. A good agreement covers how costs are split, how the aircraft is scheduled, how decisions and major maintenance are made, insurance and minimum-experience requirements, what happens if a partner wants to sell or can't pay, and how the airplane is sold or a partner is bought out. This guide is general information, not legal or tax advice — have an aviation attorney review your specific agreement and ownership structure.",
  },
  {
    q: 'How do I find a partner to co-own an aircraft with?',
    a: 'Pilots find co-ownership partners through their local airport and flight school communities, type clubs and owner groups, EAA chapters, and dedicated partnership marketplaces. When evaluating a potential partner, look for aligned flying goals and budgets, compatible schedules, similar standards for maintenance and care, and a willingness to put the arrangement in writing. Browsing existing partnership listings is a good way to see how shares are typically structured and to connect with pilots already looking to share a plane.',
  },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 scroll-mt-20 text-xl font-bold text-slate-900 sm:text-2xl">
      {children}
    </h2>
  )
}

export default function CoOwnershipGuidePage() {
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
            How Aircraft Co-Ownership &amp; Partnerships Work
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Co-ownership is the most accessible way for many pilots to fly a capable airplane without
            carrying the full cost alone. This guide explains how shared aircraft ownership actually
            works — the structures, the real costs, how partners split expenses, and how to find the
            right people to share a plane with.
          </p>
        </header>

        {/* Quick links / table of contents */}
        <nav
          aria-label="In this guide"
          className="mt-8 rounded-xl border border-sky-100 bg-sky-50 p-5 text-sm"
        >
          <p className="font-semibold text-slate-900">In this guide</p>
          <ul className="mt-3 grid gap-x-6 gap-y-2 text-sky-700 sm:grid-cols-2">
            <li><a href="#what-it-is" className="hover:underline">What co-ownership is</a></li>
            <li><a href="#how-it-works" className="hover:underline">How a partnership works</a></li>
            <li><a href="#types-of-shares" className="hover:underline">Types of shares</a></li>
            <li><a href="#costs" className="hover:underline">What it costs</a></li>
            <li><a href="#splitting-costs" className="hover:underline">How to split costs</a></li>
            <li><a href="#finding-a-partner" className="hover:underline">Finding a partner</a></li>
            <li><a href="#pros-cons" className="hover:underline">Pros and cons</a></li>
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </nav>

        <SectionHeading><span id="what-it-is" />What aircraft co-ownership is</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Aircraft co-ownership — often just called a <em>partnership</em> — is an arrangement where
          two or more pilots jointly own and operate a single airplane and split the costs of owning
          it. Instead of one person paying the entire buy-in, hangar, insurance, and maintenance bill,
          each partner owns a share of the aircraft and contributes a proportional slice of the
          expenses. In exchange, each partner gets scheduled access to fly the plane.
        </p>
        <p className="mt-4 leading-relaxed">
          The appeal is simple: aviation has high fixed costs that exist whether the plane flies or
          sits in the hangar. Splitting those fixed costs across several owners can turn an
          unaffordable airplane into a realistic one — often for a fraction of the cost of sole
          ownership — while still giving each pilot far more availability and flexibility than renting.
        </p>

        <SectionHeading><span id="how-it-works" />How a partnership works</SectionHeading>
        <p className="mt-4 leading-relaxed">
          A typical partnership has three moving parts: <strong>ownership</strong> (who holds title and
          in what proportion), <strong>money</strong> (how the buy-in and ongoing costs are divided),
          and <strong>operations</strong> (how the airplane is scheduled, maintained, and insured).
          Many groups hold the aircraft in a jointly-owned LLC, which keeps the title clean and makes it
          easier to add or remove partners; others hold it as named co-owners directly on the registration.
        </p>
        <p className="mt-4 leading-relaxed">
          Day to day, partners share a calendar to book the airplane, agree on minimum-experience and
          insurance requirements, and contribute to a maintenance fund so that the annual inspection
          and the eventual engine overhaul are paid from reserves rather than a surprise bill. The
          arrangement works best when it is written down in a partnership agreement that everyone signs
          before money changes hands.
        </p>

        <SectionHeading><span id="types-of-shares" />Types of shares and ownership structures</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Shares are usually described as a fraction of the airplane — a <strong>1/2</strong>,
          <strong> 1/3</strong>, or <strong>1/4</strong> share — corresponding to how many partners are
          in the group and how the buy-in and fixed costs are divided. Common structures include:
        </p>
        <ul className="mt-4 space-y-3">
          <li className="leading-relaxed">
            <strong className="text-slate-900">Equity co-ownership.</strong> You own a real piece of the
            aircraft (directly or through an LLC), build equity, and share both the asset value and the
            liabilities. This is the classic "partnership."
          </li>
          <li className="leading-relaxed">
            <strong className="text-slate-900">Leaseback.</strong> An owner places the aircraft on a
            flight school or operator's certificate, who rents it out; rental revenue offsets the owner's
            fixed costs. Earnings vary with utilization — see the{' '}
            <Link href="/tools/earnings-calculator" className="font-medium text-sky-700 hover:underline">
              earnings calculator
            </Link>{' '}
            to model it, and{' '}
            <Link href="/guides/leaseback-vs-co-ownership" className="font-medium text-sky-700 hover:underline">
              leaseback vs. co-ownership
            </Link>{' '}
            to weigh it against sharing the plane.
          </li>
          <li className="leading-relaxed">
            <strong className="text-slate-900">Flying club.</strong> A non-equity membership: you pay dues
            and hourly rates to fly club aircraft you don't own. Lower commitment, no buy-in equity — see
            the FAQ for how this differs from an equity share.
          </li>
          <li className="leading-relaxed">
            <strong className="text-slate-900">Fractional ownership.</strong> A managed program (more common
            with turbine aircraft) where you buy a fraction of an aircraft and a management company handles
            scheduling, crew, and maintenance for a monthly fee.
          </li>
        </ul>

        <SectionHeading><span id="costs" />What co-ownership costs</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The cost of a share breaks down into three pieces: the one-time <strong>buy-in</strong> (your
          proportional share of the aircraft's value), the ongoing <strong>fixed costs</strong> you owe
          whether you fly or not, and the <strong>hourly costs</strong> you pay only for the hours you fly.
          Typical cost components include:
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Wallet className="h-5 w-5 text-sky-600" /> Fixed costs (shared)
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Hangar or tie-down</li>
              <li>Insurance (hull + liability)</li>
              <li>Annual inspection reserve</li>
              <li>Engine-overhaul reserve</li>
              <li>Database, charts &amp; subscriptions</li>
              <li>State/registration fees</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Plane className="h-5 w-5 text-sky-600" /> Hourly costs (per flyer)
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Fuel and oil</li>
              <li>Hourly engine reserve</li>
              <li>Unscheduled maintenance reserve</li>
              <li>Tach/Hobbs "wet rate"</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 leading-relaxed">
          Because the big fixed costs are split across the group, your <em>true</em> cost per flight hour
          depends heavily on how many partners you have and how much you fly. The more you fly, the more
          those fixed costs spread out and the lower your effective hourly rate. To put real numbers on
          your own situation, plug a share's buy-in, monthly fixed cost, and wet rate into the{' '}
          <Link href="/tools/cost-calculator" className="font-medium text-sky-700 hover:underline">
            aircraft cost calculator
          </Link>{' '}
          — it shows your all-in monthly cost, your true cost per hour, and how a partnership compares to
          renting or owning outright. For a concrete example airplane, the{' '}
          <Link href="/aircraft/cessna/172" className="font-medium text-sky-700 hover:underline">
            Cessna 172
          </Link>{' '}
          is one of the most commonly co-owned types in the U.S., which makes it a good baseline for cost
          comparisons. For a full cost breakdown with a worked example, see{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how much it costs to co-own an aircraft
          </Link>.
        </p>

        <SectionHeading><span id="splitting-costs" />How to split costs fairly</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The fairest and most common approach is to separate <strong>fixed</strong> from{' '}
          <strong>variable</strong> costs. Fixed costs — hangar, insurance, the annual, and reserves — are
          shared equally (or in proportion to share size) because every partner benefits from the airplane
          being hangared, insured, and airworthy whether or not they flew this month. Variable costs — fuel
          and an hourly engine reserve — are billed by the hour to whoever actually flew, usually as a "wet
          rate" tracked by the Hobbs or tach meter.
        </p>
        <p className="mt-4 leading-relaxed">
          This structure keeps things equitable: a partner who flies twice a year still pays their share of
          keeping the plane ready, but doesn't subsidize the partner who flies every weekend. Fund the
          reserves continuously (a set amount per flight hour) so the inevitable engine overhaul and annual
          inspection are already paid for when they arrive, instead of triggering a large unexpected
          assessment. Write the exact split, the wet rate, and how reserves are funded into your partnership
          agreement — see{' '}
          <Link href="/guides/aircraft-partnership-agreement" className="font-medium text-sky-700 hover:underline">
            what to put in an aircraft partnership agreement
          </Link>{' '}
          for the full checklist.
        </p>

        <SectionHeading><span id="finding-a-partner" />How to find the right partner</SectionHeading>
        <p className="mt-4 leading-relaxed">
          A partnership is as much about the <em>people</em> as the airplane. The best partners share
          aligned flying goals (training, travel, fun flying), compatible budgets, similar standards for
          how the plane is maintained and treated, and schedules that don't constantly collide. It is
          worth flying together and talking through the agreement in detail before committing.
        </p>
        <p className="mt-4 leading-relaxed">
          Pilots find partners through their home airport, flight schools, type clubs, EAA chapters, and
          dedicated marketplaces. You can{' '}
          <Link href="/partnerships" className="font-medium text-sky-700 hover:underline">
            browse available aircraft partnerships
          </Link>{' '}
          to see how real shares are structured and to connect with pilots already looking to share a
          plane near you. For a full walkthrough of where to look and how to vet someone, see{' '}
          <Link href="/guides/how-to-find-aircraft-partners" className="font-medium text-sky-700 hover:underline">
            how to find aircraft co-owners &amp; partners
          </Link>
          .
        </p>

        <SectionHeading><span id="pros-cons" />Pros and cons of co-ownership</SectionHeading>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Users className="h-5 w-5 text-sky-600" /> Pros
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Dramatically lower cost than sole ownership</li>
              <li>Far more availability than renting</li>
              <li>You fly a known, well-cared-for airplane</li>
              <li>Shared maintenance knowledge and workload</li>
              <li>Build equity in a real asset</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              Cons &amp; things to watch
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Scheduling conflicts with other partners</li>
              <li>Shared liability for major repairs</li>
              <li>Less freedom than owning outright</li>
              <li>Disagreements need a clear written process</li>
              <li>Selling a share can take time</li>
            </ul>
          </div>
        </div>

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

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-sky-100 bg-sky-50 p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Ready to explore a partnership?</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Run your own numbers, then see who's looking to share a plane near you.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/tools/cost-calculator"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 font-medium text-white hover:bg-sky-700"
            >
              <Calculator className="h-5 w-5" /> Estimate your cost
            </Link>
            <Link
              href="/partnerships"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-5 py-2.5 font-medium text-sky-700 hover:bg-sky-50"
            >
              Browse partnerships <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          This guide is general information about aircraft co-ownership and is not legal, tax, or financial
          advice. Costs vary widely by aircraft, region, and arrangement. Consult an aviation attorney and
          your own advisors before entering any ownership agreement.
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
