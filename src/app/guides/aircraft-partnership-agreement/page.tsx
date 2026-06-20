import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Calculator,
  Plane,
  Wallet,
  Users,
  Shield,
  Wrench,
  CalendarClock,
  DoorOpen,
  Scale,
  CheckCircle2,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { SITE_URL } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'

const TITLE = 'What to Put in an Aircraft Partnership Agreement'
const PATH = '/guides/aircraft-partnership-agreement'
const DESCRIPTION =
  'A plain-English checklist of what a good aircraft co-ownership / partnership agreement should cover: ownership shares and buy-in/buy-out, scheduling and fair use, cost-sharing (fixed vs hourly), maintenance and reserves, insurance, dispute resolution, exit and sale of a share, and the LLC-vs-direct co-ownership question. Educational information only — not legal advice.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} — A Plain-English Checklist | ClubHanger` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description:
      'The topics a solid aircraft co-ownership agreement should address — shares and buy-out, scheduling, cost-sharing, maintenance, insurance, disputes, exit, and LLC vs direct ownership. Educational, not legal advice.',
    url: `${SITE_URL}${PATH}`,
    type: 'article',
  },
}

// FAQ data is the SINGLE source of truth for both the visible FAQ section and the
// FAQPage JSON-LD, so the structured data can never claim a Q&A that isn't shown
// on the page (no cloaking — every marked-up answer is rendered verbatim below).
const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do I need an LLC to co-own a plane?',
    a: "No — an LLC is not required to co-own an aircraft. Plenty of partnerships hold the airplane as direct co-owners (tenants in common) named on the registration, governed by a written co-ownership agreement. An LLC is one option some groups choose because it can make transferring a share cleaner (you transfer membership interests instead of re-titling the aircraft) and can keep partnership business separate from personal affairs. But forming an entity also adds paperwork, possible fees, and tax and insurance considerations, and an LLC by itself does not replace a good written agreement. Whether an LLC is right for your group depends on your goals and your state — this is exactly the kind of question to put to a qualified aviation attorney and your tax advisor before you decide.",
  },
  {
    q: 'What happens if one owner wants out?',
    a: 'A good agreement decides this in advance instead of leaving it to a stressful negotiation later. Common approaches give the remaining partners a right of first refusal to buy the departing partner\'s share, set out how the share is valued (for example a recent appraisal or an agreed formula), and define a notice period and a timeline for payment. The agreement should also say what happens if no partner wants to buy — whether the departing owner may sell to an outside buyer the others approve, or whether the whole aircraft is sold and proceeds are split by share. Spelling out the exit before anyone needs it is one of the most valuable things an agreement does.',
  },
  {
    q: 'What should an aircraft partnership agreement cover?',
    a: "At a high level it should cover who owns what (shares and the buy-in), how the airplane is scheduled and used fairly, how costs are split between fixed monthly amounts and hourly (wet-rate) charges, how maintenance decisions are made and how reserves are funded, the insurance the group will carry and who must be a named pilot, how disagreements are resolved, and how a partner exits or sells a share. Many groups also address whether the aircraft is held directly or in an LLC. The point of writing it down is that everyone agrees to the rules while things are friendly, so a future disagreement has a clear, pre-agreed answer.",
  },
  {
    q: 'How are scheduling conflicts usually handled?',
    a: 'Most partnerships use a shared booking system (a calendar or scheduling app) with a few fairness rules written into the agreement: how far ahead you can book, limits on holding the airplane for long blocks or holidays so one partner cannot monopolize peak weekends, and how trips that keep the plane overnight or away from base are handled. Some groups rotate priority for popular dates. The mechanics matter less than agreeing on them up front and writing them down, so "who gets the plane on the long weekend" is answered by the agreement rather than by whoever asks loudest.',
  },
  {
    q: 'Is a written agreement really necessary for friends or family?',
    a: 'It is arguably most important among friends and family, because the relationship is the thing you most want to protect. A clear written agreement is not a sign of distrust — it removes ambiguity so a future disagreement about money, scheduling, maintenance, or someone wanting out has a pre-agreed answer rather than turning into a personal conflict. Handshake arrangements tend to work right up until a large repair bill, a damaged airplane, or a change in someone\'s circumstances tests them. Putting the terms in writing and having a qualified aviation attorney review them protects both the friendship and the investment.',
  },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 scroll-mt-20 text-xl font-bold text-slate-900 sm:text-2xl">
      {children}
    </h2>
  )
}

export default function PartnershipAgreementGuidePage() {
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
            What to Put in an Aircraft Partnership Agreement
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            A co-ownership agreement is the rulebook a flying partnership agrees to while everyone is
            still friendly — so a future disagreement about money, scheduling, maintenance, or someone
            wanting out has a clear, pre-agreed answer. This guide walks through the topics a solid
            agreement should address, in plain language, with a short checklist and an FAQ. It is
            educational information about what to think through, <strong>not</strong> a legal template
            and not legal advice.
          </p>
        </header>

        {/* Prominent disclaimer up top — this is the legal-advice boundary */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-900">
            <Scale className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>
              <strong>This is general educational information, not legal advice,</strong> and it is not a
              contract or a template to copy. Laws and tax treatment vary by state and by situation. Have a{' '}
              <strong>qualified aviation attorney</strong> draft or review your actual agreement, and
              consult your own tax and insurance advisors, before you sign anything.
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
            <li><a href="#shares" className="hover:underline">Ownership shares &amp; buy-in</a></li>
            <li><a href="#scheduling" className="hover:underline">Scheduling &amp; fair use</a></li>
            <li><a href="#costs" className="hover:underline">Cost-sharing (fixed vs hourly)</a></li>
            <li><a href="#maintenance" className="hover:underline">Maintenance &amp; reserves</a></li>
            <li><a href="#insurance" className="hover:underline">Insurance requirements</a></li>
            <li><a href="#disputes" className="hover:underline">Dispute resolution</a></li>
            <li><a href="#exit" className="hover:underline">Exit &amp; sale of a share</a></li>
            <li><a href="#llc" className="hover:underline">LLC vs. direct co-ownership</a></li>
            <li><a href="#checklist" className="hover:underline">The short checklist</a></li>
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </nav>

        <p className="mt-8 leading-relaxed">
          New to the idea of sharing a plane? Start with the companion guides on{' '}
          <Link href="/guides/aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how aircraft co-ownership &amp; partnerships work
          </Link>{' '}
          and{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how much it costs to co-own an aircraft
          </Link>
          . This guide picks up where those leave off: once you have found partners and understand the
          costs, here is what to actually write down.
        </p>

        <SectionHeading><span id="shares" />Ownership shares, buy-in &amp; buy-out</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The foundation of the agreement is who owns what. Spell out each partner&apos;s percentage
          share, the <strong>buy-in</strong> they paid for it, and how the airplane is titled. Equal
          shares are simplest, but unequal shares are common — a half-share partner pays half the value
          and usually gets a correspondingly larger claim on scheduling and on the proceeds when the
          plane is sold. Be explicit about what the share entitles each partner to and what it obligates
          them for.
        </p>
        <ul className="mt-4 space-y-2">
          <li className="leading-relaxed">Each partner&apos;s percentage share and the buy-in amount for it.</li>
          <li className="leading-relaxed">How the aircraft is titled (direct co-ownership vs. an LLC — see below).</li>
          <li className="leading-relaxed">How a share is valued later (an appraisal, an agreed formula, or a stated method) for buy-out.</li>
          <li className="leading-relaxed">Whether new partners can be added, and who must approve them.</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          For how the buy-in is calculated and how it relates to the aircraft&apos;s value, the{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            cost-of-co-ownership guide
          </Link>{' '}
          works through a concrete example.
        </p>

        <SectionHeading><span id="scheduling" />Scheduling &amp; fair use</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Scheduling is the single most common source of day-to-day friction in a partnership, so the
          agreement should set the ground rules even if the booking itself lives in a calendar or app.
          The goal is that no one can monopolize the airplane on the days everyone wants it.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <CalendarClock className="h-5 w-5 text-sky-600" /> Worth deciding up front
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>How far ahead partners may book, and how bookings are made (the shared calendar/app).</li>
            <li>Limits on holding the plane for long blocks, and how holidays and peak weekends are shared.</li>
            <li>How overnight or multi-day trips away from base are handled and billed.</li>
            <li>What happens to a booking if a partner cancels late or doesn&apos;t show.</li>
          </ul>
        </div>

        <SectionHeading><span id="costs" />Cost-sharing: fixed vs. hourly</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The fairest and most common structure separates <strong>fixed</strong> costs from{' '}
          <strong>variable (hourly)</strong> costs. Fixed costs — hangar or tie-down, insurance, the
          annual inspection, subscriptions — are owed whether anyone flies or not, so they are shared by
          share size. Variable costs — fuel and the reserves that fund overhauls — are billed by the hour
          to whoever actually flew, usually as a &quot;wet rate.&quot; Write the exact split, the wet
          rate, how it is tracked (Hobbs or tach), and when partners are billed.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Wallet className="h-5 w-5 text-sky-600" /> Fixed (shared by share)
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Hangar / tie-down</li>
              <li>Insurance</li>
              <li>Annual inspection</li>
              <li>Databases &amp; subscriptions</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Plane className="h-5 w-5 text-sky-600" /> Variable (billed per hour)
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Fuel and oil</li>
              <li>Engine &amp; prop reserves</li>
              <li>Maintenance reserve</li>
              <li>The agreed wet rate</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 leading-relaxed">
          To estimate a fair split and a realistic wet rate for your group, the{' '}
          <Link href="/tools/cost-calculator" className="font-medium text-sky-700 hover:underline">
            aircraft cost calculator
          </Link>{' '}
          shows all-in monthly cost and true cost per hour. For the full breakdown of which costs are
          fixed versus hourly, see the{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            cost guide
          </Link>.
        </p>

        <SectionHeading><span id="maintenance" />Maintenance decisions &amp; reserves</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Maintenance is where partnerships either run smoothly or fall apart, so the agreement should
          say how decisions get made and how the money is set aside. A common approach funds reserves
          continuously — a set amount per flight hour — so the expensive, inevitable bills (the engine
          overhaul, the annual&apos;s surprises) are already paid for when they arrive instead of
          triggering a sudden assessment.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Wrench className="h-5 w-5 text-sky-600" /> Decisions to write down
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>Who can approve routine maintenance, and a dollar threshold above which all partners must agree.</li>
            <li>How reserves are funded (per flight hour) and where the money is held.</li>
            <li>Which shop or mechanic the group uses, and standards for how the plane is kept.</li>
            <li>How an unexpected major repair or assessment is handled if reserves fall short.</li>
          </ul>
        </div>

        <SectionHeading><span id="insurance" />Insurance requirements</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The agreement should require the group to carry agreed coverage and keep it current — typically
          hull and liability — and address who must be a named pilot. Insurers care about each pilot&apos;s
          ratings, hours, and recency, and how the aircraft is owned (direct vs. an entity) can affect the
          policy, so this is worth confirming with your insurance broker as you set the partnership up.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Shield className="h-5 w-5 text-sky-600" /> Spell out in the agreement
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>The minimum coverage the group will carry, and who pays for it (a fixed cost shared by share).</li>
            <li>Who must be a named/approved pilot and any currency or checkout requirements.</li>
            <li>What happens to coverage and the policy if a partner joins or leaves.</li>
          </ul>
        </div>

        <SectionHeading><span id="disputes" />Dispute resolution</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Even compatible partners will eventually disagree. Rather than leaving it to whoever is most
          stubborn, the agreement can set a process: how votes work (by head or by share), what counts as
          a major decision needing unanimous or supermajority agreement, and a step-by-step path for
          settling a disagreement — for example, discussion first, then mediation, before anything more
          formal. Having the process written down keeps a single argument from threatening the whole
          partnership. The specific mechanism that fits your group and your state is a good thing to
          confirm with an attorney.
        </p>

        <SectionHeading><span id="exit" />Exit &amp; sale of a share</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Decide how someone leaves <em>before</em> anyone needs to. The cleanest agreements address what
          happens when a partner wants out (or can no longer participate), so an exit is an orderly,
          pre-agreed process rather than a crisis.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <DoorOpen className="h-5 w-5 text-sky-600" /> The exit terms to cover
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>A right of first refusal for the remaining partners to buy the departing share.</li>
            <li>How the share is valued (appraisal or agreed formula) and the payment timeline.</li>
            <li>Whether a partner may sell to an outside buyer, and who must approve that buyer.</li>
            <li>What happens if no one wants to buy — including the option to sell the whole aircraft and split proceeds.</li>
            <li>What happens on death, disability, or a partner simply going non-responsive.</li>
          </ul>
        </div>

        <SectionHeading><span id="llc" />LLC vs. direct co-ownership</SectionHeading>
        <p className="mt-4 leading-relaxed">
          One structural choice comes up often: hold the airplane as <strong>direct co-owners</strong>{' '}
          (named on the registration, governed by a co-ownership agreement) or in a jointly-owned{' '}
          <strong>LLC</strong>. Direct co-ownership is simpler to set up; an LLC adds formation paperwork
          and possible fees but can make transferring a share cleaner — you transfer membership interests
          rather than re-titling the aircraft — and keeps partnership business separate from personal
          affairs. Neither replaces a good written agreement, and the right answer depends on your goals,
          your state, and tax and insurance considerations. This is a high-level overview, not a
          recommendation:{' '}
          <strong className="text-slate-900">decide it with a qualified aviation attorney and your tax advisor.</strong>
        </p>

        <SectionHeading><span id="checklist" />The short checklist</SectionHeading>
        <p className="mt-4 leading-relaxed">
          A quick scan of the topics a solid agreement covers — use it as a starting point for the
          conversation with your partners and, ultimately, with your attorney:
        </p>
        <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-5">
          <ul className="space-y-2 text-sm text-slate-700">
            {[
              'Ownership shares, the buy-in for each, and how the aircraft is titled',
              'How a share is valued later for a buy-out',
              'Scheduling rules and fair-use limits (peak days, long blocks, overnight trips)',
              'Cost split: fixed costs by share, variable costs by the hour (the wet rate)',
              'How maintenance is approved and how reserves are funded',
              'Required insurance coverage and who must be a named pilot',
              'A dispute-resolution process and how votes work',
              'Exit terms: right of first refusal, valuation, outside sale, death/disability',
              'Whether to use an LLC or hold the plane as direct co-owners',
              'A note that all partners have had the agreement reviewed by an attorney',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
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
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Plan the partnership, then find one</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Estimate a fair cost split for your group, then see who&apos;s looking to share a plane near
            you.
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
              <Users className="h-5 w-5" /> Browse partnerships <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Curious what a popular shared type looks like? See{' '}
            <Link href="/aircraft/cessna/172" className="font-medium text-sky-700 hover:underline">
              Cessna 172
            </Link>{' '}
            aircraft.
          </p>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          This guide is general educational information about the topics an aircraft co-ownership
          agreement typically addresses. It is <strong>not legal, tax, or financial advice</strong>, is
          not a contract or a template, and does not create an attorney-client relationship. Laws and tax
          treatment vary by state and situation. Have a qualified aviation attorney draft or review your
          actual agreement, and consult your own tax and insurance advisors, before entering any ownership
          arrangement.
        </p>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  )
}
