import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Calculator,
  Users,
  Building2,
  KeyRound,
  Wallet,
  CalendarClock,
  DoorOpen,
  Scale,
  CheckCircle2,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'
import { buildArticleJsonLd } from '@/lib/guideJsonLd'

const TITLE = 'Flying Club vs. Aircraft Co-Ownership'
const PATH = '/guides/flying-club-vs-co-ownership'
const DESCRIPTION =
  'A plain-English comparison of joining a flying club versus buying into aircraft co-ownership (a partnership): membership-and-access vs an ownership stake, what you pay and what you build, who controls the schedule and the aircraft, fleet access vs one shared plane, how each handles exit, and who each suits — plus how to decide. Educational information only — not legal, tax, or financial advice.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} — How to Decide | ClubHanger` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description:
      'Flying club (pay to belong and rent the club’s aircraft) vs. co-ownership (buy a share and split the costs of one plane) — what you pay, what you build, control, fleet access, exit, and how to decide. Educational, not legal/tax/financial advice.',
    url: `${SITE_URL}${PATH}`,
    type: 'article',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${TITLE} — a guide on ${SITE_NAME}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description:
      'Flying club (pay to belong and rent the club’s aircraft) vs. co-ownership (buy a share and split the costs of one plane) — what you pay, what you build, control, fleet access, exit, and how to decide. Educational, not legal/tax/financial advice.',
    images: [DEFAULT_OG_IMAGE],
  },
}

// FAQ data is the SINGLE source of truth for both the visible FAQ section and the
// FAQPage JSON-LD, so the structured data can never claim a Q&A that isn't shown
// on the page (no cloaking — every marked-up answer is rendered verbatim below).
const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is the difference between a flying club and aircraft co-ownership?',
    a: 'A flying club is a membership organization: you pay to belong — usually a joining fee plus monthly dues and an hourly rate — and in return you can book and fly the club’s aircraft, but you do not own them. Co-ownership (a partnership) is the opposite: you buy a share of a specific airplane alongside a small group of partners, so you own an equity stake and split that plane’s fixed and hourly costs directly. Put simply, a club sells you access; co-ownership gives you ownership. A club is usually easier to join and to leave and often offers a small fleet to choose from, while co-ownership ties you to one plane and a few partners but lets you build equity and control the aircraft yourselves.',
  },
  {
    q: 'Is a flying club or co-ownership cheaper?',
    a: 'It depends mostly on how much you fly. A flying club spreads its fixed costs across many members, so the entry cost is low and you can fly only occasionally without carrying a whole airplane — which tends to win for low-time-per-year pilots. Co-ownership splits one plane’s fixed costs across only a few partners, so your monthly share is higher than club dues, but your hourly cost is usually lower and there is no club markup; the more hours you fly, the more that lower hourly rate pays off. The honest way to compare is to estimate your yearly hours and run both: a partnership share in the cost calculator against a club’s dues-plus-hourly rate. There is no universal answer — only the answer for your hours.',
  },
  {
    q: 'Do you build equity in a flying club?',
    a: 'Generally no. In most flying clubs your dues and hourly payments buy access, not ownership — you are essentially renting from the club, so when you leave you walk away with nothing but (sometimes) a refundable deposit. A few equity clubs do give members an ownership interest, but they are less common. In co-ownership you buy a share of the aircraft, so you hold an equity stake you can later sell to a new partner; you also carry that plane’s ownership responsibilities and its share of the market risk. If building equity matters to you, co-ownership is the model that offers it; if you would rather not tie up capital in a plane, a club avoids that.',
  },
  {
    q: 'Which gives you more control over the airplane and the schedule?',
    a: 'Co-ownership gives a small group of partners direct control: you choose the aircraft, how it is equipped and maintained, and you set your own scheduling and fairness rules in the partnership agreement. A flying club is run for all its members, so the club — through its board or manager — decides which aircraft are in the fleet, how they are maintained, and the booking rules, and at a busy club popular times can be hard to get. The trade-off is access versus say: a club hands you a ready-made fleet and handles the operations, while co-ownership gives you and your partners the final say over one specific plane.',
  },
  {
    q: 'Can you do both — belong to a club and co-own a plane?',
    a: 'Yes, and some pilots do. A common pattern is to co-own a plane that fits your main mission while keeping a club membership for variety — a club’s fleet might let you grab a different type for a particular trip or for training, while your share covers your everyday flying. It does mean paying into both, so it only makes sense if you fly enough to use each. As with either model on its own, confirm how insurance treats your flying across the two arrangements, since coverage depends on what you fly and how it is owned and operated.',
  },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 scroll-mt-20 text-xl font-bold text-slate-900 sm:text-2xl">
      {children}
    </h2>
  )
}

export default function FlyingClubVsCoOwnershipGuidePage() {
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
            Flying Club vs. Aircraft Co-Ownership
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Two of the most popular ways to fly affordably without buying a whole airplane alone work in
            very different ways. A <strong>flying club</strong> sells you membership and access — you pay
            to belong and rent the club&apos;s aircraft. <strong>Co-ownership</strong> (a partnership)
            sells you a stake — you buy a share of one specific plane and split its costs with a few
            partners. This guide compares the two side by side — what you pay, what you build, control,
            fleet access, and exit — so you can decide which fits. It is educational information,{' '}
            <strong>not</strong> legal, tax, or financial advice.
          </p>
        </header>

        {/* Prominent disclaimer up top — this is the advice boundary */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-900">
            <Scale className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>
              <strong>This is general educational information, not legal, tax, or financial advice.</strong>{' '}
              Club rules, costs, and the tax and insurance treatment of shared ownership vary by club, by
              state, and by situation. Talk to the specific club and to a{' '}
              <strong>qualified aviation attorney, tax advisor, and insurance broker</strong> before
              joining a club or entering a co-ownership arrangement.
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
            <li><a href="#cost" className="hover:underline">What you pay &amp; what you build</a></li>
            <li><a href="#access" className="hover:underline">Fleet access vs. one shared plane</a></li>
            <li><a href="#control" className="hover:underline">Control &amp; scheduling</a></li>
            <li><a href="#exit" className="hover:underline">Getting in &amp; getting out</a></li>
            <li><a href="#who" className="hover:underline">Who each is for</a></li>
            <li><a href="#decide" className="hover:underline">How to decide</a></li>
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </nav>

        <p className="mt-8 leading-relaxed">
          New to the idea of sharing a plane? Start with{' '}
          <Link href="/guides/aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how aircraft co-ownership &amp; partnerships work
          </Link>{' '}
          for the ownership side, and{' '}
          <Link href="/guides/how-to-find-aircraft-partners" className="font-medium text-sky-700 hover:underline">
            how to find aircraft partners
          </Link>{' '}
          — which also covers flying clubs as a place to meet people and fly. This guide is the decision
          layer: club membership or an ownership share, and how to tell which one fits you.
        </p>

        <SectionHeading><span id="two-models" />The two models at a glance</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Both exist to solve the same problem — flying a capable airplane is expensive to do entirely on
          your own — but they answer it from opposite ends:
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Building2 className="h-5 w-5 text-sky-600" /> Flying club
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A membership organization. You pay a joining fee plus monthly dues and an hourly rate, and
              in return you can book and fly the club&apos;s aircraft — but you don&apos;t own them. It is
              an <strong>access</strong> model: low entry cost, a fleet to choose from, and the club
              handles operations and maintenance.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Users className="h-5 w-5 text-sky-600" /> Co-ownership
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You buy a share of one specific airplane alongside a small group of partners. Each pays a
              buy-in and a slice of the costs, and the group controls the plane together. It is an{' '}
              <strong>ownership</strong> model: a higher commitment, but a real equity stake and direct
              control of the aircraft.
            </p>
          </div>
        </div>

        <SectionHeading><span id="side-by-side" />Side-by-side comparison</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The clearest way to see the trade-offs is to put the two models next to each other. This is a
          high-level summary of how they typically differ — not a rule for any specific club or
          partnership:
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3 font-semibold">Factor</th>
                <th className="px-4 py-3 font-semibold">Flying club</th>
                <th className="px-4 py-3 font-semibold">Co-ownership / partnership</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-4 py-3"><strong>What you get</strong></td>
                <td className="px-4 py-3">Membership &amp; access to the fleet</td>
                <td className="px-4 py-3">An equity share of one specific plane</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Up-front cost</strong></td>
                <td className="px-4 py-3">A joining fee / deposit (usually modest)</td>
                <td className="px-4 py-3">A buy-in for your share of the aircraft</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Ongoing cost</strong></td>
                <td className="px-4 py-3">Monthly dues + hourly (often wet) rate</td>
                <td className="px-4 py-3">Your share of fixed costs + hourly costs</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Do you build equity?</strong></td>
                <td className="px-4 py-3">Usually no — you rent access</td>
                <td className="px-4 py-3">Yes — a share you can later sell</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Aircraft choice</strong></td>
                <td className="px-4 py-3">The club&apos;s fleet — sometimes several types</td>
                <td className="px-4 py-3">The one plane your group chose</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Who runs it</strong></td>
                <td className="px-4 py-3">The club&apos;s board / manager, for all members</td>
                <td className="px-4 py-3">You and your partners, by agreement</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Getting out</strong></td>
                <td className="px-4 py-3">Usually easy — cancel membership</td>
                <td className="px-4 py-3">Sell your share to a new partner</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><strong>Model it with</strong></td>
                <td className="px-4 py-3">The club&apos;s published dues + hourly rate</td>
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

        <SectionHeading><span id="cost" />What you pay &amp; what you build</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The headline difference is whether your money buys <em>access</em> or an <em>asset</em>. A
          flying club spreads its fixed costs across many members, so the entry cost is low and you pay
          dues plus an hourly rate to fly — but those payments generally build no equity, and most clubs
          add a margin to keep the operation running. Co-ownership asks for a larger commitment up front
          (your buy-in) and a higher monthly share, because one plane&apos;s fixed costs are split across
          only a few partners — yet that buy-in is a real ownership stake you can later sell, and your
          hourly cost has no club markup on top.
        </p>
        <p className="mt-4 leading-relaxed">
          Which comes out cheaper depends mostly on <strong>how much you fly</strong>. Fly only a handful
          of hours a year and a club&apos;s low fixed commitment usually wins; fly regularly and
          co-ownership&apos;s lower hourly cost tends to pull ahead. The honest way to compare is to
          estimate your yearly hours and put real numbers on both — a partnership share in the{' '}
          <Link href="/tools/cost-calculator" className="font-medium text-sky-700 hover:underline">
            cost calculator
          </Link>{' '}
          against the dues-plus-hourly figures the club publishes. For the full breakdown behind the
          ownership side, see{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how much it costs to co-own an aircraft
          </Link>
          . Treat every figure as a clearly-labeled estimate and use realistic — not best-case — hours.
        </p>

        <SectionHeading><span id="access" />Fleet access vs. one shared plane</SectionHeading>
        <p className="mt-4 leading-relaxed">
          A club often offers a <strong>small fleet</strong>: a trainer, a cross-country single, maybe a
          complex or IFR platform, so you can pick the right tool for a given flight and there is usually
          a backup if one aircraft is down for maintenance. Co-ownership ties you to <strong>one
          specific plane</strong> the group chose and equipped — which is exactly the point if you have a
          clear mission and want a known, well-cared-for airplane, but means no easy swap to a different
          type and a real squeeze when that single plane is in the shop.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <KeyRound className="h-5 w-5 text-sky-600" /> Variety vs. a known airplane
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>Club: more types to choose from and a backup when one is down — but it isn&apos;t &ldquo;yours.&rdquo;</li>
            <li>Co-ownership: one familiar, well-equipped plane you helped choose — but no swap, and downtime hits harder.</li>
            <li>If your flying spans missions, a fleet helps; if it&apos;s consistent, one right plane wins.</li>
          </ul>
        </div>

        <SectionHeading><span id="control" />Control &amp; scheduling</SectionHeading>
        <p className="mt-4 leading-relaxed">
          For many pilots this is the deciding factor. A flying club is run for{' '}
          <strong>all its members</strong>, so the club&apos;s board or manager sets the booking rules,
          decides which aircraft are in the fleet, and handles maintenance — convenient, but at a busy
          club the popular times can be hard to get and you have little say over how the planes are kept.
          Co-ownership gives a <strong>small group of partners</strong> direct control: you set your own
          scheduling and fairness rules in the partnership agreement, and you collectively decide how the
          aircraft is equipped and maintained.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <CalendarClock className="h-5 w-5 text-sky-600" /> The access vs. say trade-off
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>Club: operations handled for you, but you share the fleet with many members.</li>
            <li>Co-ownership: more predictable access among a few partners, and the final say over your plane.</li>
            <li>Either way, the scheduling rules should be written down — in the club&apos;s policy, or your agreement.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          On the co-ownership side, the scheduling and fairness rules belong in writing — see{' '}
          <Link href="/guides/aircraft-partnership-agreement" className="font-medium text-sky-700 hover:underline">
            what to put in an aircraft partnership agreement
          </Link>{' '}
          for the plain-English checklist.
        </p>

        <SectionHeading><span id="exit" />Getting in &amp; getting out</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The two models differ as much at the <em>ends</em> as in the middle. Joining a club is usually
          straightforward — an application, a checkout, and a deposit — and leaving is typically as simple
          as cancelling your membership, since you own nothing to unwind. Co-ownership takes more to enter
          (finding compatible partners and the right plane, agreeing terms, and paying a buy-in) and more
          to exit: to leave cleanly you generally sell your share to a new partner, which is exactly why a
          good agreement spells out how a partner buys out, how a share is valued, and how a replacement
          is approved.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <DoorOpen className="h-5 w-5 text-sky-600" /> Flexibility vs. commitment
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>Club: low friction to join and to leave — good if your plans may change.</li>
            <li>Co-ownership: more to set up and to exit, but you hold a sellable equity stake.</li>
            <li>Write the buy-out, share valuation, and replacement-partner rules into the agreement up front.</li>
          </ul>
        </div>

        <SectionHeading><span id="who" />Who each model is for</SectionHeading>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Building2 className="h-5 w-5 text-sky-600" /> A flying club can fit if you
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Fly occasionally and want a low fixed commitment</li>
              <li>Like having a few aircraft types to choose from</li>
              <li>Prefer not to tie up capital in a plane</li>
              <li>Want the operations and maintenance handled for you</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Users className="h-5 w-5 text-sky-600" /> Co-ownership can fit if you
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Fly enough that a lower hourly cost pays off</li>
              <li>Want a specific, known plane equipped your way</li>
              <li>Value predictable access and direct control</li>
              <li>Want to build equity and don&apos;t mind a few partners</li>
            </ul>
          </div>
        </div>

        <SectionHeading><span id="decide" />How to decide</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Start with how and how much you actually fly, then let the trade-offs sort themselves out. A
          short way to think it through:
        </p>
        <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-5">
          <ul className="space-y-2 text-sm text-slate-700">
            {[
              'How many hours a year will you really fly? Few hours leans club; regular flying leans co-ownership.',
              'Do you want one known, well-equipped plane, or variety and a backup aircraft?',
              'Do you want an equity stake you can sell later, or to keep your capital free?',
              'How much do you value direct control over scheduling and maintenance vs. having it handled for you?',
              'Could your plans change soon? A club is lower-friction to leave; a share takes more to exit.',
              'Model both: a partnership share in the cost calculator vs. the club’s dues plus hourly rate, with realistic hours.',
              'Confirm the insurance (and any tax) treatment for your situation with qualified professionals before committing.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          The two are not mutually exclusive — some pilots co-own a plane for their main flying{' '}
          <em>and</em> keep a club membership for variety (see the FAQ) — but that means paying into both,
          so it only pays off if you fly enough to use each. Whichever way you lean, run your own numbers
          and, on the ownership side, put the terms in writing.
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
              <Link href="/guides/how-to-find-aircraft-partners" className="font-medium text-sky-700 hover:underline">
                How to Find Aircraft Co-Owners &amp; Partners
              </Link>{' '}
              — where to look (including flying clubs), how to vet a partner, and the red flags.
            </li>
            <li>
              <Link href="/guides/leaseback-vs-co-ownership" className="font-medium text-sky-700 hover:underline">
                Aircraft Leaseback vs. Co-Ownership
              </Link>{' '}
              — the other &ldquo;vs. co-ownership&rdquo; decision: income from renting your plane vs. sharing it.
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Run the numbers, then choose</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Estimate what a partnership share would cost, compare it to a club&apos;s dues plus hourly
            rate, then find pilots to share a plane with near you.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/tools/cost-calculator"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 font-medium text-white hover:bg-sky-700"
            >
              <Calculator className="h-5 w-5" /> Estimate co-ownership cost
            </Link>
            <Link
              href="/partnerships"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-5 py-2.5 font-medium text-sky-700 hover:bg-sky-50"
            >
              <Users className="h-5 w-5" /> Browse partnerships <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          This guide is general educational information comparing flying-club membership and aircraft
          co-ownership. It is <strong>not legal, tax, or financial advice</strong>, and does not create an
          attorney-client relationship. Club rules, fees, costs, tax, and insurance treatment vary widely
          by club, region, use, and situation. Confirm the specifics with the club itself and consult a
          qualified aviation attorney, tax advisor, and insurance broker before joining a club or entering
          any ownership arrangement.
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
