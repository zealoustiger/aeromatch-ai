import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Plane,
  Shield,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  FileText,
  Search,
  Landmark,
  Lock,
  ListChecks,
  Receipt,
} from 'lucide-react'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'
import { buildArticleJsonLd } from '@/lib/guideJsonLd'

const TITLE = 'Aircraft Title, Escrow & Closing — How Buying a Plane Actually Closes'
const PATH = '/guides/aircraft-title-escrow-and-closing'
const DESCRIPTION =
  'Found the airplane — now how does the deal actually close? A plain-English guide to the legal and financial side of buying an aircraft: the title and lien search, the role of an escrow agent, the bill of sale and FAA registration (your N-number), releasing existing liens, the typical closing steps, and how sales and use tax can come into play. Educational information only — not legal, tax, or financial advice.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | ClubHanger` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description:
      'The legal and financial side of buying a used airplane: title and lien searches, what an escrow agent does, the bill of sale and FAA aircraft registration, releasing liens, the typical closing sequence, and how sales/use tax can apply. Educational, not legal/tax/financial advice.',
    url: `${SITE_URL}${PATH}`,
    type: 'article',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${TITLE} — a guide on ${SITE_NAME}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description:
      'The legal and financial side of buying a used airplane: title and lien searches, what an escrow agent does, the bill of sale and FAA aircraft registration, releasing liens, the typical closing sequence, and how sales/use tax can apply. Educational, not legal/tax/financial advice.',
    images: [DEFAULT_OG_IMAGE],
  },
}

// FAQ data is the SINGLE source of truth for both the visible FAQ section and the
// FAQPage JSON-LD, so the structured data can never claim a Q&A that isn't shown
// on the page (no cloaking — every marked-up answer is rendered verbatim below).
const FAQS: { q: string; a: string }[] = [
  {
    q: 'What does it mean to "close" on an aircraft purchase?',
    a: 'Closing is the moment the deal actually happens: the buyer’s money and the seller’s ownership change hands at the same time, with the paperwork that makes the transfer real and recordable. In practice that means a signed bill of sale conveying the aircraft from seller to buyer, the funds released to the seller, any existing lien released so the buyer gets clear title, and the registration paperwork filed so the FAA records the buyer as the new owner. Closing is a distinct step from the pre-purchase inspection: the inspection answers "is this airplane sound?" while the closing answers "how does ownership and money safely transfer?" On all but the simplest cash deals, both buyer and seller usually want a neutral third party — an escrow agent — to coordinate the exchange so neither side has to send money or sign over the plane first.',
  },
  {
    q: 'What is a title search and why does it matter?',
    a: 'A title search reviews the recorded history of an aircraft to confirm the seller actually owns it free and clear and can convey it to you. Because U.S. civil aircraft ownership and liens are recorded centrally with the FAA (and certain interests can also be recorded internationally), a title company or aviation attorney can pull the records and look for problems: an open mortgage or lien, a chain of ownership that doesn’t line up, missing releases from a prior sale, tax liens, or paperwork that was never properly recorded. It matters because you can buy an airplane and still inherit someone else’s debt or a clouded title if a lien was never released — a problem that surfaces later, when you try to sell or refinance. A clean title search (and clearing anything it turns up) before you fund the deal is basic due diligence on a major purchase.',
  },
  {
    q: 'What does an aircraft escrow agent do?',
    a: 'An escrow agent is a neutral third party that holds the buyer’s funds and the signed transfer documents and releases them only when both sides have met the agreed conditions — so neither party has to go first. A typical aircraft escrow handles the money (holding the buyer’s deposit and balance, then disbursing to the seller and to any lienholder being paid off), coordinates the signed bill of sale and registration paperwork, often runs or arranges the title search, and helps make sure existing liens get released and the new ownership and registration get recorded with the FAA. Using an established aviation title and escrow company is common practice precisely because it removes the "who sends first?" trust problem and keeps the closing organized. The escrow agent is not your attorney and does not give you legal or tax advice — they execute the agreed transaction.',
  },
  {
    q: 'How does FAA aircraft registration and the N-number work in a sale?',
    a: 'U.S. civil aircraft are registered with the FAA, and the registration is tied to a registration mark — the "N-number" — painted on the aircraft. When you buy a plane, ownership is conveyed by a bill of sale, and you (the new owner) file to register the aircraft in your name with the FAA; the existing registration doesn’t simply carry over to you automatically. In a typical closing the bill of sale, the application for registration, and any lien release are submitted together so the records reflect the new owner and a clear title. You can usually keep the existing N-number, or apply to reserve and assign a different available registration mark if you’d prefer one — that’s a separate request. Exact forms, fees, and processing times are set by the FAA and change over time, so confirm the current requirements (an escrow/title company or aviation attorney does this routinely) rather than relying on a number you read somewhere.',
  },
  {
    q: 'How do existing liens get released at closing?',
    a: 'If the seller still owes money on the airplane, there is usually a recorded lien (a lender’s security interest). To deliver clear title, that lien has to be released. In a typical escrow closing, the payoff amount is confirmed with the lienholder, part of the buyer’s funds is directed to pay off that balance, and in exchange the lienholder provides a release that gets recorded with the FAA so the lien no longer clouds the title. The escrow agent coordinates this so the seller’s loan is paid and the buyer receives the aircraft free of that lien in the same transaction. This is exactly the kind of thing a title search is meant to surface in advance: if there’s an open lien, you want it identified and a payoff/release plan in place before funds move — not discovered afterward.',
  },
  {
    q: 'Do I have to pay sales or use tax when I buy an airplane?',
    a: 'Possibly — it depends on where you are, where the aircraft is delivered and based, how it’s used, and the rules in the relevant jurisdiction, so there is no single answer and you should not treat anything here as a tax determination. As a general matter, buying a major asset like an aircraft can trigger sales tax or a use tax depending on the state and circumstances, and the way the transaction is structured (delivery location, basing, registration) can affect what applies. Some situations have exemptions or specific rules; others don’t. Because the amounts can be significant and the rules vary and change, the honest guidance is to get advice from a qualified tax professional and/or an aviation attorney for your specific purchase before you close, rather than assuming there’s no tax — or assuming a workaround you heard about applies to you.',
  },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 scroll-mt-20 text-xl font-bold text-slate-900 sm:text-2xl">
      {children}
    </h2>
  )
}

export default function TitleEscrowClosingGuidePage() {
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
          { label: 'Title, Escrow & Closing' },
        ]}
      />

      <article className="text-slate-700">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Aircraft Title, Escrow &amp; Closing: How Buying a Plane Actually Closes
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            You found the airplane and the pre-buy looks good — so how does the deal actually{' '}
            <em>close</em>? Buying an aircraft is a major transaction with its own legal and financial
            machinery: a <strong>title and lien search</strong>, a neutral <strong>escrow agent</strong>{' '}
            holding the money, a <strong>bill of sale</strong>, <strong>FAA registration</strong> in your
            name, releasing any existing lien, and — depending on where you are — possible{' '}
            <strong>sales or use tax</strong>. This guide walks through the closing process in plain
            English. It is educational information, <strong>not</strong> legal, tax, or financial advice.
          </p>
        </header>

        {/* Prominent disclaimer up top — the advice boundary */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-900">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>
              <strong>This is general educational information, not legal, tax, or financial advice.</strong>{' '}
              Title, lien, registration, and tax treatment vary by aircraft, jurisdiction, use, and
              situation, and the rules and FAA requirements change over time. Before you close, consult a{' '}
              <strong>qualified aviation attorney, a reputable aircraft title &amp; escrow company, and your
              own tax advisor</strong> about your specific purchase.
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
            <li><a href="#what" className="hover:underline">What &ldquo;closing&rdquo; means</a></li>
            <li><a href="#title" className="hover:underline">Title &amp; lien search</a></li>
            <li><a href="#escrow" className="hover:underline">The escrow agent&apos;s role</a></li>
            <li><a href="#paperwork" className="hover:underline">Bill of sale &amp; FAA registration</a></li>
            <li><a href="#steps" className="hover:underline">The closing, step by step</a></li>
            <li><a href="#tax" className="hover:underline">Sales &amp; use tax</a></li>
            <li><a href="#watch" className="hover:underline">What to watch for</a></li>
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </nav>

        <p className="mt-8 leading-relaxed">
          This guide picks up where the{' '}
          <Link href="/guides/aircraft-pre-purchase-inspection" className="font-medium text-sky-700 hover:underline">
            pre-purchase inspection guide
          </Link>{' '}
          leaves off. The pre-buy answers <em>&ldquo;is the airplane sound?&rdquo;</em>; closing answers{' '}
          <em>&ldquo;how do ownership and money safely change hands?&rdquo;</em> They&apos;re two different
          workstreams that run around the same purchase — and a clean closing is what turns a good
          inspection into a plane that&apos;s actually, cleanly <em>yours</em>.
        </p>

        <SectionHeading><span id="what" />What &ldquo;closing&rdquo; actually means</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Closing is the moment the transaction becomes real: the buyer&apos;s funds and the seller&apos;s
          ownership transfer <strong>at the same time</strong>, backed by paperwork that makes it official
          and recordable. Concretely, a close involves a signed <strong>bill of sale</strong> conveying the
          aircraft, the <strong>funds</strong> released to the seller, any existing <strong>lien
          released</strong> so you get clear title, and the <strong>registration</strong> filed so the FAA
          records you as the new owner.
        </p>
        <p className="mt-4 leading-relaxed">
          The hard part is trust: nobody wants to send the money before they have the plane, and nobody
          wants to sign over the plane before they have the money. That&apos;s why most aircraft purchases —
          anything beyond the simplest cash, hand-to-hand deal — run through a neutral{' '}
          <strong>escrow agent</strong> who holds both sides and releases them together once the agreed
          conditions are met.
        </p>

        <SectionHeading><span id="title" />The title &amp; lien search</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Before money moves, you want to know the seller can actually convey the airplane{' '}
          <strong>free and clear</strong>. U.S. civil aircraft ownership and liens are recorded centrally
          with the FAA, so a title company or aviation attorney can pull the records and look for trouble.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Search className="h-5 w-5 text-sky-600" /> What a search looks for
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              An open mortgage or lien, a chain of ownership that doesn&apos;t line up, missing releases
              from a prior sale, tax liens, or transfers that were never properly recorded.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Lock className="h-5 w-5 text-sky-600" /> Why it protects you
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You can buy a plane and still inherit someone else&apos;s debt or a clouded title if an old
              lien was never released — a problem that surfaces later when you try to sell or finance.
            </p>
          </div>
        </div>
        <p className="mt-4 leading-relaxed">
          The goal is simple: turn up anything that clouds the title <em>before</em> you fund the deal, and
          make sure it gets cleared (for example, an open loan paid off and released) as part of the close —
          not discovered months afterward.
        </p>

        <SectionHeading><span id="escrow" />The escrow agent&apos;s role</SectionHeading>
        <p className="mt-4 leading-relaxed">
          An <strong>escrow agent</strong> is a neutral third party that holds the money and the signed
          documents and releases them only when both sides have met the agreed conditions — so neither party
          has to go first. Using an established aviation <strong>title &amp; escrow company</strong> is
          common practice precisely because it removes the &ldquo;who sends first?&rdquo; problem.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Landmark className="h-5 w-5 text-sky-600" /> What an escrow typically handles
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><strong className="text-slate-900">The money.</strong> Holds the buyer&apos;s deposit and balance, then disburses to the seller and to any lienholder being paid off.</li>
            <li><strong className="text-slate-900">The documents.</strong> Coordinates the signed bill of sale, the application for registration, and lien releases.</li>
            <li><strong className="text-slate-900">The title work.</strong> Often runs or arranges the title search and helps make sure liens are released and recorded.</li>
            <li><strong className="text-slate-900">The recording.</strong> Helps get the new ownership and registration recorded with the FAA so the records reflect a clean transfer.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          One important boundary: the escrow agent <strong>executes the agreed transaction</strong> — they
          are not your attorney and don&apos;t give you legal or tax advice. For the advice side, that&apos;s
          what an aviation attorney and a tax professional are for.
        </p>

        <SectionHeading><span id="paperwork" />The bill of sale &amp; FAA registration</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Two pieces of paperwork sit at the center of the transfer. The <strong>bill of sale</strong>{' '}
          conveys the aircraft from the seller to you. Then <strong>you</strong>, as the new owner, file to{' '}
          <strong>register the aircraft with the FAA</strong> in your name — the existing registration
          doesn&apos;t simply carry over automatically.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-sky-600" /> Bill of sale
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The document that conveys ownership from seller to buyer. In a typical close it&apos;s
              submitted together with the registration application and any lien release.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Plane className="h-5 w-5 text-sky-600" /> Registration &amp; N-number
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You file to register the aircraft in your name. You can usually keep the existing N-number, or
              apply to reserve and assign a different available registration mark — a separate request.
            </p>
          </div>
        </div>
        <p className="mt-4 leading-relaxed">
          Exact FAA forms, fees, and processing times are set by the FAA and change over time, so confirm
          the <em>current</em> requirements rather than relying on a figure you read somewhere. A title and
          escrow company or an aviation attorney handles this filing routinely.
        </p>

        <SectionHeading><span id="steps" />The closing, step by step</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Every deal is a little different, but a typical escrow-based aircraft closing runs roughly in this
          order:
        </p>
        <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <ListChecks className="h-5 w-5 text-sky-600" /> A typical sequence
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600 marker:text-sky-600 marker:font-semibold">
            <li><strong className="text-slate-900">Agree terms.</strong> Price and conditions are set in a purchase agreement (often with the pre-buy as a contingency).</li>
            <li><strong className="text-slate-900">Open escrow.</strong> A neutral escrow/title company is engaged and the buyer&apos;s deposit goes into escrow.</li>
            <li><strong className="text-slate-900">Title search.</strong> The records are pulled and reviewed; any lien or cloud on title is identified.</li>
            <li><strong className="text-slate-900">Clear the path.</strong> Payoff amounts are confirmed and a plan is set to release any existing lien.</li>
            <li><strong className="text-slate-900">Sign &amp; fund.</strong> The bill of sale and registration paperwork are signed; the balance is wired into escrow.</li>
            <li><strong className="text-slate-900">Disburse &amp; record.</strong> Funds go to the seller (and lienholder), the lien is released, and the bill of sale and registration are filed with the FAA.</li>
          </ol>
        </div>
        <p className="mt-4 leading-relaxed">
          The point of running it through escrow is that the money and the ownership move <em>together</em>,
          on agreed conditions — instead of one side trusting the other to follow through.
        </p>

        <SectionHeading><span id="tax" />Sales &amp; use tax — a heads-up, not a determination</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Buying a major asset like an aircraft can trigger <strong>sales tax</strong> or a{' '}
          <strong>use tax</strong> — but whether it does, and how much, depends on where you are, where the
          aircraft is delivered and based, how it&apos;s used, and the rules in the relevant jurisdiction.
          There is no single answer, and the way a transaction is structured can affect what applies.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Receipt className="h-5 w-5 text-sky-600" /> The honest version
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>Some situations have exemptions or specific rules; others don&apos;t.</li>
            <li>The amounts can be significant, and the rules vary by jurisdiction and change over time.</li>
            <li>Don&apos;t assume there&apos;s no tax — and don&apos;t assume a &ldquo;workaround&rdquo; you heard about applies to you.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          The right move is to get advice from a <strong>qualified tax professional and/or an aviation
          attorney</strong> for your specific purchase <em>before</em> you close, so there are no surprises.
        </p>

        <SectionHeading><span id="watch" />What to watch for</SectionHeading>
        <p className="mt-4 leading-relaxed">
          None of these automatically kills a deal, but each is a reason to slow down and get it handled
          before funds move:
        </p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <AlertTriangle className="h-5 w-5 text-amber-600" /> Slow down if you see
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            <li>An open lien with no clear payoff and release plan in place before closing.</li>
            <li>A chain of ownership or registration that doesn&apos;t cleanly match the seller.</li>
            <li>Pressure to send money directly to the seller instead of through a neutral escrow.</li>
            <li>Skipping the title search to &ldquo;save time&rdquo; on a major purchase.</li>
            <li>Assuming sales/use tax doesn&apos;t apply without checking your specific situation.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          The recurring theme: a neutral escrow plus a clean title search is how you avoid both the
          &ldquo;who sends first?&rdquo; trust problem and the nasty surprise of inheriting someone
          else&apos;s lien.
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
              <Link href="/guides/aircraft-pre-purchase-inspection" className="font-medium text-sky-700 hover:underline">
                Aircraft Pre-Purchase Inspection: A Buyer&apos;s Checklist
              </Link>{' '}
              — the other half of due diligence: making sure the airplane itself is sound before you close.
            </li>
            <li>
              <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
                How Much Does It Cost to Co-Own an Aircraft?
              </Link>{' '}
              — buy-in, fixed, and hourly costs, so you can budget the whole purchase.
            </li>
            <li>
              <Link href="/guides" className="font-medium text-sky-700 hover:underline">
                All ClubHanger guides
              </Link>{' '}
              — the full library of plain-English guides for pilots.
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Ready to find a plane to buy?</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Browse aircraft for sale, line up an independent pre-buy, then close cleanly through a neutral
            title &amp; escrow company.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/aircraft"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 font-medium text-white hover:bg-sky-700"
            >
              <Plane className="h-5 w-5" /> Browse planes for sale
            </Link>
            <Link
              href="/guides/aircraft-pre-purchase-inspection"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-5 py-2.5 font-medium text-sky-700 hover:bg-sky-50"
            >
              <ClipboardCheck className="h-5 w-5" /> See the pre-buy checklist
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Budgeting the whole purchase?{' '}
            <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
              See the cost of ownership
            </Link>{' '}
            <ArrowRight className="inline h-4 w-4" />
          </p>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          This guide is general educational information about the title, escrow, and closing process when
          buying a used aircraft. It is <strong>not legal, tax, or financial advice</strong>, and does not
          create an attorney-client relationship. Title, lien, registration, and tax treatment vary by
          aircraft, jurisdiction, use, and situation, and FAA requirements change over time. Before you
          close, consult a qualified aviation attorney, a reputable aircraft title &amp; escrow company, and
          your own tax advisor about your specific purchase.
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
