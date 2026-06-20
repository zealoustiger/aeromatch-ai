import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Calculator,
  Users,
  Shield,
  MapPin,
  Search,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Building2,
  FileText,
} from 'lucide-react'
import { SITE_URL } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'

const TITLE = 'How to Find Aircraft Co-Owners & Partners'
const PATH = '/guides/how-to-find-aircraft-partners'
const DESCRIPTION =
  'A practical guide to finding someone to co-own a plane with: where to look (flying clubs, FBOs and flight schools, EAA chapters and type clubs, airport bulletin boards, and online partnership marketplaces), how to vet a potential partner, the red flags to watch for, how many partners makes sense, and the steps to go from "found someone" to a signed agreement and shared costs. Educational information only — not legal, tax, or financial advice.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} — Where to Look & How to Vet | ClubHanger` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description:
      'Where to find aircraft co-owners (flying clubs, FBOs and flight schools, EAA chapters and type clubs, airport boards, and online marketplaces), how to vet a potential partner, the red flags to avoid, how many partners makes sense, and how to go from a handshake to a signed agreement. Educational, not legal/tax/financial advice.',
    url: `${SITE_URL}${PATH}`,
    type: 'article',
  },
}

// FAQ data is the SINGLE source of truth for both the visible FAQ section and the
// FAQPage JSON-LD, so the structured data can never claim a Q&A that isn't shown
// on the page (no cloaking — every marked-up answer is rendered verbatim below).
const FAQS: { q: string; a: string }[] = [
  {
    q: 'Where do I find aircraft partners?',
    a: 'Pilots find co-ownership partners both in person and online. In person, the best places are the ones where local pilots already gather: your home airport and its FBO or flight school, flying clubs, EAA chapters, and type clubs for the specific make you want to fly. Airport bulletin boards and word of mouth among pilots you already fly with also turn up partners, since the strongest partnerships often start with someone you have flown with and trust. Online, dedicated partnership marketplaces let you browse pilots who are already looking to share a plane and filter by aircraft and location — you can browse aircraft partnerships on ClubHanger to see how shares are typically structured and connect with pilots near you. Most successful searches combine both: post where local pilots will see it, and look online to widen the pool.',
  },
  {
    q: "How do I know if someone's a good co-owner?",
    a: 'Compatibility matters as much as the airplane, so vet a potential partner the way you would a roommate you also share an expensive asset with. Look for aligned flying goals (someone who wants the plane for the same kind of flying you do — training, travel, or fun), a budget that genuinely fits the share and the ongoing costs, hours and ratings appropriate for the aircraft, a based airport close enough that the plane is convenient for everyone, and similar standards for how the plane is maintained and treated. Beyond the checklist, pay attention to personality and communication: you will be making money and scheduling decisions together for years. Flying together a few times, talking openly about money and expectations, and asking for references from people who have flown or shared with them are all reasonable steps before you commit.',
  },
  {
    q: 'How many partners is too many?',
    a: 'There is no single right number, but the trade-off is consistent: more partners means a lower cost per person and less availability, plus more scheduling coordination. For a single piston aircraft that each owner wants regular access to, two to four partners is a common sweet spot — enough to meaningfully split the fixed costs while keeping the plane available most of the time. Larger groups push the cost down further but start to feel more like a flying club, with more calendars to juggle and more people who have to agree on maintenance and decisions. The honest way to size it is to match the partner count to how often each person actually flies: if everyone flies a lot, keep the group small; if people fly occasionally, more partners can share the cost without crowding the schedule.',
  },
  {
    q: 'What are the red flags when choosing an aircraft partner?',
    a: 'Watch for anything that suggests money, maintenance, or commitment will become a problem later. Red flags include a budget that is clearly stretched by the buy-in or the monthly costs, vagueness or evasiveness about finances, a casual attitude toward maintenance or safety, unwillingness to put the arrangement in writing, very different flying goals or expectations about how often the plane is used, and a history of partnerships or rentals that ended badly. Pressure to skip the paperwork or to "just trust each other" is itself a red flag — a good partner welcomes a clear written agreement because it protects everyone. None of these guarantees a bad partnership, but each is a reason to slow down, ask more questions, and confirm the details before money changes hands.',
  },
  {
    q: 'What should I do after I find a potential partner?',
    a: 'Once you have found someone promising, move from conversation to specifics before any money changes hands. Talk openly about flying goals, budget, how often each of you expects to fly, and how the plane will be maintained, then estimate a fair cost split together so everyone sees the real monthly and hourly numbers — a cost calculator makes this concrete. If the numbers and the fit work, put the terms in writing: a written partnership agreement covering shares and buy-in, scheduling, cost-sharing, maintenance, insurance, disputes, and how a partner exits. Have a qualified aviation attorney review the actual agreement, and consult your own tax and insurance advisors, before you sign. Doing this while everyone is still friendly is what turns a promising match into a partnership that lasts.',
  },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 scroll-mt-20 text-xl font-bold text-slate-900 sm:text-2xl">
      {children}
    </h2>
  )
}

export default function FindAircraftPartnersGuidePage() {
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
            How to Find Aircraft Co-Owners &amp; Partners
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            The hardest part of co-owning a plane often isn&apos;t the money or the paperwork — it&apos;s
            finding the right <strong>people</strong>. This guide is the sourcing playbook: where to look
            for aircraft partners, how to vet someone before you share an expensive asset with them, the
            red flags to watch for, how many partners makes sense, and how to go from{' '}
            <em>&ldquo;found someone&rdquo;</em> to a signed agreement and shared costs. It is educational
            information, <strong>not</strong> legal, tax, or financial advice.
          </p>
        </header>

        {/* Prominent disclaimer up top — the advice boundary */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-900">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>
              <strong>This is general educational information, not legal, tax, or financial advice.</strong>{' '}
              Vetting a partner is about judgment, not guarantees, and tax and insurance treatment vary by
              state and situation. Before you commit, put the terms in writing and have a{' '}
              <strong>qualified aviation attorney, tax advisor, and insurance broker</strong> review the
              specific arrangement.
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
            <li><a href="#where" className="hover:underline">Where to find partners</a></li>
            <li><a href="#online" className="hover:underline">Looking online</a></li>
            <li><a href="#vet" className="hover:underline">How to vet a partner</a></li>
            <li><a href="#red-flags" className="hover:underline">Red flags to watch for</a></li>
            <li><a href="#how-many" className="hover:underline">How many partners?</a></li>
            <li><a href="#next-steps" className="hover:underline">After you find someone</a></li>
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </nav>

        <p className="mt-8 leading-relaxed">
          New to the idea of sharing a plane? Two companion guides cover the basics:{' '}
          <Link href="/guides/aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how aircraft co-ownership &amp; partnerships work
          </Link>{' '}
          and{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            how much it costs to co-own an aircraft
          </Link>
          . This guide is the step before those pay off: actually finding the partners to share with.
        </p>

        <SectionHeading><span id="where" />Where to find aircraft partners</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The best partnerships usually start with pilots who already share a runway, a hobby, or a
          mutual acquaintance — so the most productive places to look are the ones where local pilots
          already gather. Cast a wide net across these:
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Building2 className="h-5 w-5 text-sky-600" /> Flying clubs
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Members are already pilots who chose to share aircraft — a natural pool for someone open to
              an equity partnership rather than club dues.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <MapPin className="h-5 w-5 text-sky-600" /> FBOs &amp; flight schools
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The staff and based-pilot community at your FBO or flight school hear about partnerships
              forming, and renters tired of renting are often ready to own a share.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Users className="h-5 w-5 text-sky-600" /> EAA chapters &amp; type clubs
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              EAA chapters and clubs for a specific make (think Cessna, Cirrus, or Bonanza owner groups)
              connect you with pilots who want the exact aircraft you do.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-sky-600" /> Airport bulletin boards
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The old-fashioned board by the pilot lounge still works — a clear note about the share you
              have or want reaches everyone based at the field.
            </p>
          </div>
        </div>
        <p className="mt-4 leading-relaxed">
          Don&apos;t overlook the people you already fly with. A pilot you have flown alongside, share a
          mechanic with, or know through a club is someone whose habits and judgment you can actually
          observe — which is worth more than any listing. Word of mouth at the airport remains one of the
          most reliable ways partnerships come together.
        </p>

        <SectionHeading><span id="online" />Looking online</SectionHeading>
        <p className="mt-4 leading-relaxed">
          In-person sources are strong but local. To widen the pool — especially if you want a specific
          aircraft or there aren&apos;t many partners forming at your field — look online. Dedicated
          partnership marketplaces let you browse pilots who are already looking to share a plane, filter
          by aircraft type and location, and see how real shares are structured before you reach out.
        </p>
        <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Search className="h-5 w-5 text-sky-600" /> Browse partnerships on ClubHanger
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            ClubHanger is built specifically for this:{' '}
            <Link href="/partnerships" className="font-medium text-sky-700 hover:underline">
              browse aircraft partnerships
            </Link>{' '}
            to see pilots offering shares and pilots seeking them, near you and in the aircraft you want.
            It&apos;s a faster way to find a compatible co-owner than waiting for the right note to appear
            on the airport board.
          </p>
        </div>
        <p className="mt-4 leading-relaxed">
          Whether a candidate comes from the board or a marketplace, the next step is the same: figure out
          whether they are actually the right person to share an airplane with.
        </p>

        <SectionHeading><span id="vet" />How to vet a potential partner</SectionHeading>
        <p className="mt-4 leading-relaxed">
          A partnership is a multi-year financial and personal relationship around an expensive, shared
          asset — so vet a candidate the way you would someone you are going into business with, because
          you are. The things worth checking before you commit:
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <ClipboardCheck className="h-5 w-5 text-sky-600" /> What to look for
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><strong className="text-slate-900">Flying goals.</strong> Do they want the plane for the same kind of flying you do — training, travel, or fun? Mismatched goals cause friction over how the plane is used and equipped.</li>
            <li><strong className="text-slate-900">Hours &amp; ratings.</strong> Experience and ratings appropriate for the aircraft, which also matters for insurance and currency.</li>
            <li><strong className="text-slate-900">Budget.</strong> A budget that genuinely fits both the buy-in and the ongoing fixed and hourly costs — not a stretch.</li>
            <li><strong className="text-slate-900">Based airport.</strong> A home field close enough that the plane is convenient for everyone in the group.</li>
            <li><strong className="text-slate-900">Personality &amp; compatibility.</strong> Communication style, attitude toward maintenance and safety, and how they handle money and scheduling — you will be deciding these together for years.</li>
            <li><strong className="text-slate-900">References.</strong> Ask people who have flown, shared, or done business with them; a CFI or a previous partner can tell you a lot.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          Beyond the checklist, do the obvious human things: fly together a few times, talk openly and
          specifically about money and expectations, and notice how they treat the airplane and the people
          around it. The fit is at least as important as the numbers.
        </p>

        <SectionHeading><span id="red-flags" />Red flags to watch for</SectionHeading>
        <p className="mt-4 leading-relaxed">
          None of these guarantees a bad partnership, but each is a reason to slow down and ask more
          questions before money changes hands:
        </p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <AlertTriangle className="h-5 w-5 text-amber-600" /> Slow down if you see
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            <li>A budget that is clearly stretched by the buy-in or the monthly costs.</li>
            <li>Vagueness or evasiveness about finances.</li>
            <li>A casual attitude toward maintenance, safety, or how the plane is treated.</li>
            <li>Unwillingness to put the arrangement in writing — or pressure to &ldquo;just trust each other.&rdquo;</li>
            <li>Very different flying goals or expectations about how often the plane is used.</li>
            <li>A history of partnerships or rental arrangements that ended badly.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          The biggest one is resistance to a written agreement. A good partner <em>welcomes</em> clear
          terms, because the agreement protects everyone — see{' '}
          <Link href="/guides/aircraft-partnership-agreement" className="font-medium text-sky-700 hover:underline">
            what to put in an aircraft partnership agreement
          </Link>{' '}
          for what that should cover.
        </p>

        <SectionHeading><span id="how-many" />How many partners makes sense</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The number of partners is really a trade-off between cost and availability:{' '}
          <strong>more partners means a lower cost per person but less availability and more scheduling
          coordination</strong>. For a single piston aircraft that each owner wants regular access to, two
          to four partners is a common sweet spot — enough to meaningfully split the fixed costs while
          keeping the plane available most of the time. Larger groups push costs down further but begin to
          feel more like a flying club, with more calendars to juggle and more people who must agree on
          maintenance and major decisions.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Users className="h-5 w-5 text-sky-600" /> A simple way to size the group
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>Everyone flies a lot? Keep the group small so the plane stays available.</li>
            <li>People fly occasionally? More partners can share the cost without crowding the schedule.</li>
            <li>Match the count to how often each person actually flies — then check the math.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          To see how the cost per person changes with the number of partners, plug a share into the{' '}
          <Link href="/tools/cost-calculator" className="font-medium text-sky-700 hover:underline">
            aircraft cost calculator
          </Link>{' '}
          — it shows your all-in monthly cost and true cost per hour for a given group size.
        </p>

        <SectionHeading><span id="next-steps" />After you find someone: from match to signed agreement</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Finding a promising partner is the start, not the finish. Move from conversation to specifics —
          while everyone is still friendly — using a short, repeatable path:
        </p>
        <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-5">
          <ul className="space-y-2 text-sm text-slate-700">
            {[
              'Talk openly about flying goals, budget, how often each of you expects to fly, and maintenance standards.',
              'Estimate a fair cost split together so everyone sees the real monthly and hourly numbers (use the cost calculator).',
              'Agree on the share structure: who owns what fraction, the buy-in, and how the plane is titled.',
              'Put the terms in writing — shares, scheduling, cost-sharing, maintenance, insurance, disputes, and exit.',
              'Have a qualified aviation attorney review the actual agreement, and consult your tax and insurance advisors.',
              'Sign before money changes hands, then set up the shared calendar and the maintenance reserve.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          The two pieces that turn a good match into a lasting partnership are the{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            cost breakdown
          </Link>{' '}
          (so the money is clear) and the{' '}
          <Link href="/guides/aircraft-partnership-agreement" className="font-medium text-sky-700 hover:underline">
            written agreement
          </Link>{' '}
          (so the rules are clear). Do both before you commit.
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
              — the structures, share types, and how shared ownership works.
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
              — the plain-English checklist for once you&apos;ve found your partners.
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Ready to find a partner?</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Browse pilots already looking to share a plane near you, then run the numbers before you
            reach out.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/partnerships"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 font-medium text-white hover:bg-sky-700"
            >
              <Users className="h-5 w-5" /> Browse aircraft partnerships
            </Link>
            <Link
              href="/tools/cost-calculator"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-5 py-2.5 font-medium text-sky-700 hover:bg-sky-50"
            >
              <Calculator className="h-5 w-5" /> Estimate your cost
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Found someone already?{' '}
            <Link href="/guides/aircraft-partnership-agreement" className="font-medium text-sky-700 hover:underline">
              See what to put in the agreement
            </Link>{' '}
            <ArrowRight className="inline h-4 w-4" />
          </p>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          This guide is general educational information about how to find and vet aircraft co-ownership
          partners. It is <strong>not legal, tax, or financial advice</strong>, and does not create an
          attorney-client relationship. Vetting a partner is a matter of judgment, not a guarantee, and
          tax and insurance treatment vary by aircraft, region, use, and situation. Put the terms in
          writing and consult a qualified aviation attorney, tax advisor, and insurance broker before
          entering any partnership.
        </p>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  )
}
