import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, Plane, Wallet, ArrowRight, BookOpen } from 'lucide-react'
import { SITE_URL } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'

const TITLE = 'How Much Does It Cost to Co-Own an Aircraft?'
const PATH = '/guides/cost-of-aircraft-co-ownership'
const DESCRIPTION =
  'A clear cost breakdown of aircraft co-ownership: the buy-in and how it is split, fixed costs (hangar, insurance, annual, subscriptions) versus variable hourly costs (fuel, oil, engine and prop reserves, maintenance), and a worked example for a Cessna 172 in a 3-way partnership — with honest, labeled estimate ranges.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} — Cost Breakdown & Example | ClubHanger` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description:
      'The real cost components of aircraft co-ownership — buy-in, fixed costs, and hourly costs — plus a worked Cessna 172 example with honest estimate ranges.',
    url: `${SITE_URL}${PATH}`,
    type: 'article',
  },
}

// FAQ data is the SINGLE source of truth for both the visible FAQ section and the
// FAQPage JSON-LD, so the structured data can never claim a Q&A that isn't shown
// on the page (no cloaking — every marked-up answer is rendered verbatim below).
const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is co-owning an aircraft cheaper than renting?',
    a: 'It often is once you fly more than a handful of hours a month, but it depends on your utilization. Renting has no buy-in and no fixed monthly bill, so it wins for very occasional flyers. Co-ownership adds a one-time buy-in and a fixed monthly cost you owe whether you fly or not, but your hourly (wet) rate is usually much lower than a rental rate because you are only paying fuel and reserves, not a markup. The more hours you fly, the more those fixed costs spread out and the lower your effective cost per hour becomes — so there is a break-even point where ownership pulls ahead. The honest way to compare is to run your own numbers: estimate your annual hours and plug a share into a cost calculator rather than relying on a single headline figure.',
  },
  {
    q: 'How much does it cost to co-own a Cessna 172?',
    a: "It varies widely by the airplane's age and equipment, your region, and how many partners share it, but a useful way to think about it is three buckets: a one-time buy-in for your share of the aircraft's value, a fixed monthly amount toward hangar, insurance and reserves, and an hourly wet rate for the hours you fly. As a rough illustration only, a flying-club-grade 172 split three ways might mean a low-to-mid five-figure buy-in for your third, a fixed monthly contribution in the low hundreds, and a wet rate that covers fuel plus an engine-overhaul reserve. These are estimate ranges that vary by region and aircraft — treat them as a starting point and run your own inputs through a cost calculator.",
  },
  {
    q: 'What costs are fixed versus hourly in a partnership?',
    a: 'Fixed costs are the ones you owe regardless of how much anyone flies: hangar or tie-down, insurance (hull and liability), the annual inspection, database and chart subscriptions, and state or registration fees. Variable (hourly) costs are paid only for the hours actually flown: fuel and oil, an hourly reserve for the eventual engine and propeller overhaul, and a reserve for unscheduled maintenance. Partnerships usually share the fixed costs equally (or in proportion to share size) and bill the variable costs by the Hobbs or tach hour to whoever flew.',
  },
  {
    q: "What's a fair way to split costs among partners?",
    a: 'The fairest and most common approach is to separate fixed from variable costs. Fixed costs are shared equally (or in proportion to share size) because every partner benefits from the airplane being hangared, insured, and airworthy whether or not they flew this month. Variable costs are billed by the hour to whoever actually flew, usually as a "wet rate" tracked by the meter. Funding the engine and annual reserves continuously — a set amount per flight hour — means the big bills are already paid for when they arrive, instead of triggering a surprise assessment. Write the exact split, the wet rate, and how reserves are funded into your partnership agreement.',
  },
  {
    q: 'What are the hidden costs people forget to budget for?',
    a: 'The costs that catch new owners off guard are almost always the reserves and the irregular bills, not the obvious monthly ones. Budget for the eventual engine overhaul (set aside money per flight hour so it is funded before it is due), the annual inspection (which can uncover squawks that turn a routine inspection into a larger bill), avionics database subscriptions, and unscheduled maintenance. Insurance can also rise as the hull value or pilot mix changes. A partnership that funds reserves continuously and keeps a maintenance fund avoids the large unexpected assessments that strain a group.',
  },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 scroll-mt-20 text-xl font-bold text-slate-900 sm:text-2xl">
      {children}
    </h2>
  )
}

export default function CostGuidePage() {
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
      {/* "Guides" has no hub page yet, so it renders as plain text (no broken
          crawlable link); when a /guides index ships, give it an href. */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Guides' },
          { label: TITLE },
        ]}
      />

      <article className="text-slate-700">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How Much Does It Cost to Co-Own an Aircraft?
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            The honest answer is &quot;it depends&quot; — but it depends on a small number of
            predictable things. This guide breaks the real cost of aircraft co-ownership into the
            buy-in, the fixed costs you owe every month, and the hourly costs you pay only when you
            fly — then works through an example so the numbers feel concrete. Every figure here is a
            clearly-labeled estimate range, not a quote.
          </p>
        </header>

        {/* Quick links / table of contents */}
        <nav
          aria-label="In this guide"
          className="mt-8 rounded-xl border border-sky-100 bg-sky-50 p-5 text-sm"
        >
          <p className="font-semibold text-slate-900">In this guide</p>
          <ul className="mt-3 grid gap-x-6 gap-y-2 text-sky-700 sm:grid-cols-2">
            <li><a href="#three-buckets" className="hover:underline">The three cost buckets</a></li>
            <li><a href="#buy-in" className="hover:underline">The buy-in &amp; how it splits</a></li>
            <li><a href="#fixed-costs" className="hover:underline">Fixed (recurring) costs</a></li>
            <li><a href="#variable-costs" className="hover:underline">Variable (hourly) costs</a></li>
            <li><a href="#splitting" className="hover:underline">How shares split fixed vs hourly</a></li>
            <li><a href="#example" className="hover:underline">Worked example: Cessna 172</a></li>
            <li><a href="#cost-per-hour" className="hover:underline">Your true cost per hour</a></li>
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </nav>

        <SectionHeading><span id="three-buckets" />The three cost buckets</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Almost every co-ownership cost falls into one of three buckets, and keeping them separate
          is the key to understanding what a share really costs:
        </p>
        <ul className="mt-4 space-y-3">
          <li className="leading-relaxed">
            <strong className="text-slate-900">1. The buy-in.</strong> A one-time payment for your
            proportional share of the aircraft&apos;s value when you join the partnership.
          </li>
          <li className="leading-relaxed">
            <strong className="text-slate-900">2. Fixed (recurring) costs.</strong> Ongoing bills you
            owe whether you fly or not — hangar, insurance, the annual inspection, subscriptions.
          </li>
          <li className="leading-relaxed">
            <strong className="text-slate-900">3. Variable (hourly) costs.</strong> Costs you pay only
            for the hours you actually fly — fuel, oil, and the reserves that fund the engine overhaul
            and maintenance.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          The reason co-ownership saves money is that the second bucket — the big fixed costs — is the
          same whether one person or four people own the plane, so splitting it across partners is
          where the savings come from. This is the cost side of co-ownership; for how partnerships are
          structured and operated, see the companion guide on{' '}
          <Link href="/guides/aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how aircraft co-ownership &amp; partnerships work
          </Link>.
        </p>

        <SectionHeading><span id="buy-in" />The buy-in and how it splits</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The buy-in is your share of what the airplane is worth. In a clean equal partnership it is
          simply the aircraft&apos;s value divided by the number of partners: a $90,000 airplane split
          three ways is a $30,000 buy-in per partner for a one-third share. Unequal shares are common
          too — a partner who takes a half share pays half the value and gets a correspondingly larger
          claim on scheduling and on the asset when the plane is sold.
        </p>
        <p className="mt-4 leading-relaxed">
          The buy-in is the single biggest variable in the whole equation because aircraft values
          range enormously — from older trainers to well-equipped late-model singles. It is also the
          part you (mostly) get back: unlike rent, the buy-in buys equity in a real asset that you
          recover when you sell your share (subject to the market). Many groups hold the aircraft in a
          jointly-owned LLC so shares can be transferred cleanly.
        </p>

        <SectionHeading><span id="fixed-costs" />Fixed (recurring) costs</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Fixed costs are the bills that exist whether the plane flies 5 hours or 50 in a month. They
          are the costs co-ownership is best at reducing, because they are shared across the whole
          group. The usual line items:
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Wallet className="h-5 w-5 text-sky-600" /> Fixed / recurring costs (shared by the group)
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li><strong>Hangar or tie-down</strong> — by far the biggest swing; a hangar in a high-cost metro can cost many times a rural tie-down.</li>
            <li><strong>Insurance</strong> (hull + liability) — varies with hull value, pilot experience, and the number of named pilots.</li>
            <li><strong>Annual inspection</strong> — the base inspection is predictable; squawks it uncovers are not, so budget a cushion.</li>
            <li><strong>Database &amp; subscription fees</strong> — avionics nav databases, charts, and any tracking or scheduling services.</li>
            <li><strong>State / registration &amp; misc fees</strong> — registration, any state property or use taxes, association dues.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          A partnership usually rolls these into a single fixed monthly contribution per partner so the
          group always has cash on hand for the annual and the next insurance renewal. Because hangar
          and insurance dominate this bucket and vary so much by region, two identical airplanes can
          have very different fixed costs — which is why a quote always beats a national average.
        </p>

        <SectionHeading><span id="variable-costs" />Variable (hourly) costs</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Variable costs scale with how much the airplane flies, so they are billed to whoever flew —
          typically as a per-hour &quot;wet rate&quot; tracked by the Hobbs or tach meter. The key
          insight is that fuel is only part of it: a well-run partnership also collects reserves by the
          hour so the expensive, inevitable overhauls are funded before they come due.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Plane className="h-5 w-5 text-sky-600" /> Variable / hourly costs (paid by whoever flies)
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li><strong>Fuel and oil</strong> — the most visible cost; depends on the engine, power setting, and local fuel prices.</li>
            <li><strong>Engine reserve</strong> — money set aside per hour toward the eventual major overhaul, the single largest maintenance event.</li>
            <li><strong>Propeller reserve</strong> — a smaller per-hour set-aside for the prop overhaul on its own schedule.</li>
            <li><strong>Maintenance reserve</strong> — for unscheduled fixes between annuals (a worn tire, an alternator, a magneto).</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          Folding the reserves into the wet rate is what keeps a partnership financially honest: the
          partner who flies the most contributes the most toward the wear they cause, and nobody is hit
          with a surprise five-figure overhaul bill that the airplane &quot;earned&quot; over thousands
          of hours.
        </p>

        <SectionHeading><span id="splitting" />How shares split fixed versus hourly costs</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The standard, fair structure splits the two buckets differently:
        </p>
        <ul className="mt-4 space-y-3">
          <li className="leading-relaxed">
            <strong className="text-slate-900">Fixed costs → shared by share size.</strong> Equal
            partners split the fixed monthly cost equally; unequal partners split it in proportion to
            their shares. Everyone pays to keep the plane hangared, insured, and airworthy because
            everyone benefits from that — regardless of who flew this month.
          </li>
          <li className="leading-relaxed">
            <strong className="text-slate-900">Variable costs → billed by the hour.</strong> The wet
            rate is paid only by the partner who flew those hours, so a partner who flies twice a year
            doesn&apos;t subsidize the one who flies every weekend.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          This split is what makes co-ownership feel equitable over time, and it&apos;s worth writing
          the exact percentages, the wet rate, and the reserve amounts into the partnership agreement.
          For more on partnership structures and finding partners, see the{' '}
          <Link href="/guides/aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how-it-works guide
          </Link>.
        </p>

        <SectionHeading><span id="example" />Worked example: a Cessna 172 in a 3-way partnership</SectionHeading>
        <p className="mt-4 leading-relaxed">
          To make the buckets concrete, here is an illustrative example for one of the most commonly
          co-owned trainers, the{' '}
          <Link href="/aircraft/cessna/172" className="font-medium text-sky-700 hover:underline">
            Cessna 172
          </Link>
          , shared by three equal partners. <strong className="text-slate-900">These are estimate
          ranges, not quotes</strong> — actual figures vary widely by region, aircraft age and
          equipment, hangar availability, and insurance. Use them to see how the pieces fit, then run
          your own numbers.
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3 font-semibold">Cost component</th>
                <th className="px-4 py-3 font-semibold">Estimate range (whole airplane)</th>
                <th className="px-4 py-3 font-semibold">Per partner (÷3)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-4 py-3"><strong>Buy-in</strong> (aircraft value)</td>
                <td className="px-4 py-3">~$60k–$120k+ <span className="text-slate-400">(one-time)</span></td>
                <td className="px-4 py-3">~$20k–$40k+ one-time</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Hangar / tie-down (fixed)</td>
                <td className="px-4 py-3">~$1,200–$6,000 / yr</td>
                <td className="px-4 py-3">~$400–$2,000 / yr</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Insurance (fixed)</td>
                <td className="px-4 py-3">~$1,200–$3,000 / yr</td>
                <td className="px-4 py-3">~$400–$1,000 / yr</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Annual inspection (fixed)</td>
                <td className="px-4 py-3">~$1,500–$4,000 / yr</td>
                <td className="px-4 py-3">~$500–$1,300 / yr</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Databases &amp; subscriptions (fixed)</td>
                <td className="px-4 py-3">~$300–$900 / yr</td>
                <td className="px-4 py-3">~$100–$300 / yr</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Fuel + oil (hourly)</td>
                <td className="px-4 py-3">~$45–$80 / hr</td>
                <td className="px-4 py-3">billed per hour flown</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Engine + prop + maint. reserves (hourly)</td>
                <td className="px-4 py-3">~$25–$45 / hr</td>
                <td className="px-4 py-3">billed per hour flown</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 leading-relaxed">
          Reading the table: each of the three partners covers roughly a third of the fixed annual
          costs — very loosely on the order of <strong>~$1,400–$4,600 per partner per year</strong>{' '}
          (a wide range driven mostly by hangar and insurance) — which works out to a fixed monthly
          contribution somewhere in the low-to-mid hundreds. On top of that, each partner pays a wet
          rate of roughly <strong>~$70–$125 per flight hour</strong> only for the hours they actually
          fly, covering fuel plus the reserves. The one-time buy-in is separate and is the part you
          recover (subject to the market) when you sell your share. Again — these are illustrative
          ranges; <strong className="text-slate-900">typical ranges vary by region and aircraft</strong>.
        </p>

        <SectionHeading><span id="cost-per-hour" />Why your true cost per hour depends on how much you fly</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Because the fixed costs are owed no matter what, your <em>effective</em> cost per hour drops
          the more you fly. A partner who flies 25 hours a year is spreading their fixed share across
          only 25 hours; a partner who flies 100 hours spreads the same fixed share across four times
          as many hours, so each hour absorbs far less of the fixed bill. This is exactly why ownership
          beats renting past a certain number of hours — and why the right number of partners depends
          on how often each person actually flies.
        </p>
        <p className="mt-4 leading-relaxed">
          The only reliable way to pin down your real cost is to put your own inputs — a share&apos;s
          buy-in, the fixed monthly cost, the wet rate, and your expected annual hours — into a
          calculator. The{' '}
          <Link href="/tools/cost-calculator" className="font-medium text-sky-700 hover:underline">
            aircraft cost calculator
          </Link>{' '}
          shows your all-in monthly cost and your true cost per hour, and lets you estimate your own
          split. If you are weighing a leaseback to offset costs, the{' '}
          <Link href="/tools/earnings-calculator" className="font-medium text-sky-700 hover:underline">
            earnings calculator
          </Link>{' '}
          models how rental revenue changes the picture.
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

        {/* Related guide */}
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <BookOpen className="h-5 w-5 text-sky-600" /> Keep reading
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            New to the idea of sharing a plane? Start with{' '}
            <Link href="/guides/aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
              How Aircraft Co-Ownership &amp; Partnerships Work
            </Link>{' '}
            for the structures, share types, and how to find the right partner. When you are ready to put
            terms on paper, see{' '}
            <Link href="/guides/aircraft-partnership-agreement" className="font-medium text-sky-700 hover:underline">
              What to Put in an Aircraft Partnership Agreement
            </Link>.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Run your own numbers</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Estimate your own split and true cost per hour, then see who&apos;s looking to share a
            plane near you.
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
          This guide is general information about the costs of aircraft co-ownership and is not legal,
          tax, or financial advice. All figures are illustrative estimate ranges, not quotes — actual
          costs vary widely by aircraft, equipment, region, and arrangement. Get real quotes and
          consult an aviation attorney and your own advisors before entering any ownership agreement.
        </p>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  )
}
