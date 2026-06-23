import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Plane,
  Wallet,
  Shield,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  FileText,
  Wrench,
  Gauge,
  Layers,
  Cpu,
  ScrollText,
  Users,
} from 'lucide-react'
import { SITE_URL } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'
import { buildArticleJsonLd } from '@/lib/guideJsonLd'

const TITLE = 'Aircraft Pre-Purchase Inspection — A Buyer’s Checklist'
const PATH = '/guides/aircraft-pre-purchase-inspection'
const DESCRIPTION =
  'Buying a used airplane? A plain-English guide to the pre-purchase (pre-buy) inspection: what it covers and why it matters, the major areas to check (logbooks and AD compliance, engine compression and oil analysis, airframe and corrosion, avionics, paperwork/title and liens, and damage history), how to choose an independent inspector or shop, how to think about scope and cost, and the red flags that should make you slow down. Educational information only — not legal, tax, financial, or airworthiness advice.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | ClubHanger` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description:
      'What a pre-purchase (pre-buy) inspection covers and why it matters when buying a used airplane: logbooks and AD compliance, engine compression and oil analysis, airframe and corrosion, avionics, title/liens and paperwork, damage history, how to choose an independent inspector, how to think about scope and cost, and the red flags to watch for. Educational, not legal/tax/financial/airworthiness advice.',
    url: `${SITE_URL}${PATH}`,
    type: 'article',
  },
}

// FAQ data is the SINGLE source of truth for both the visible FAQ section and the
// FAQPage JSON-LD, so the structured data can never claim a Q&A that isn't shown
// on the page (no cloaking — every marked-up answer is rendered verbatim below).
const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is an aircraft pre-purchase inspection?',
    a: 'A pre-purchase inspection — often called a "pre-buy" — is an independent examination of a used aircraft, commissioned by the buyer, before money changes hands. Its job is to surface the airplane’s real condition and any expensive surprises while you can still negotiate or walk away. A good pre-buy reviews the logbooks and maintenance records, checks airworthiness directive (AD) and service-bulletin compliance, evaluates the engine (typically a compression check and often an oil analysis), inspects the airframe for corrosion and prior damage, looks over the avionics and equipment, and confirms the paperwork, title, and registration line up. It is not the same as an annual inspection or a routine maintenance event: a pre-buy is about due diligence for the buyer, not signing off the aircraft as airworthy. The depth can range from a focused records-and-logs review to a thorough teardown-level look, depending on the airplane and what you agree with the shop.',
  },
  {
    q: 'How much does a pre-buy inspection cost?',
    a: 'Cost varies widely and depends on the aircraft type, the shop’s rate, how deep the inspection goes, and where the airplane is located — so treat any single number you hear as a starting point, not a quote. A light single-engine piston pre-buy is generally a modest fraction of the purchase price; more complex, higher-performance, twin, or turbine aircraft cost more, and a deep inspection that involves removing panels or pulling cylinders costs more than a records-focused review. Plan for additional, separate costs too: travel or ferry to a shop, a title and lien search, and any test-flight or fuel expenses. The honest way to frame it is that a pre-buy is a small, qualitative percentage of what you are about to spend, and it routinely pays for itself by catching issues that would cost far more to discover after the sale. Get a written scope and estimate from the shop before they start so there are no surprises.',
  },
  {
    q: 'Who should do the pre-purchase inspection?',
    a: 'Use an independent, qualified mechanic — ideally an A&P (Airframe & Powerplant) mechanic, and for the records and AD review an IA (Inspection Authorization) — who works for you, the buyer, not for the seller or the broker. A shop with real experience on your specific make and model is worth seeking out, because type-specific knowledge is where the meaningful problems get found; type clubs and owner groups can often point you to a trusted shop. Avoid letting the seller’s own mechanic perform the only inspection — even an honest one has a relationship you don’t control. You generally want the airplane brought to (or the inspection performed by) a shop you chose, with a clear written scope of what will be checked and a written report you receive directly.',
  },
  {
    q: 'What are the red flags when buying a used aircraft?',
    a: 'The biggest red flags are around records and access. Incomplete, missing, or suspiciously "clean" logbooks; gaps in the maintenance history; unclear or undisclosed damage history; and any resistance to a buyer-chosen, independent pre-buy are all reasons to slow down. Also watch for unresolved or undocumented airworthiness directives, signs of corrosion or prior repairs that aren’t reflected in the paperwork, a title or registration that doesn’t cleanly match the seller, and any pressure to skip due diligence or "trust me, it’s a great airplane." None of these automatically kills a deal, but each is a reason to dig deeper, get the inspection in writing, and confirm the facts before you commit. A seller confident in the aircraft generally welcomes a thorough, independent pre-buy.',
  },
  {
    q: 'Is a pre-purchase inspection required?',
    a: 'No — a pre-buy is not legally required to buy an aircraft, and it is different from the annual inspection the FAA does require for the airplane to be operated. But skipping it is one of the most expensive mistakes a first-time buyer can make. The records review, AD-compliance check, engine evaluation, corrosion and damage inspection, and title/lien search are how you avoid inheriting someone else’s deferred problems. Whether a pre-buy is "worth it" is really a question of how much risk you want to carry: on a major purchase like an airplane, an independent inspection is widely treated as basic due diligence, not an optional extra.',
  },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 scroll-mt-20 text-xl font-bold text-slate-900 sm:text-2xl">
      {children}
    </h2>
  )
}

export default function PrePurchaseInspectionGuidePage() {
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
          { label: 'Pre-Purchase Inspection' },
        ]}
      />

      <article className="text-slate-700">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Aircraft Pre-Purchase Inspection: A Buyer&apos;s Checklist
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Buying a used airplane is a big, mostly-irreversible purchase — and the single best way to
            avoid an expensive surprise is an independent <strong>pre-purchase inspection</strong> (a
            &ldquo;pre-buy&rdquo;) before money changes hands. This guide walks through what a pre-buy
            covers and why it matters, the major areas to check, how to choose an inspector, how to think
            about scope and cost, and the <strong>red flags</strong> that should make you slow down. It is
            educational information, <strong>not</strong> legal, tax, financial, or airworthiness advice.
          </p>
        </header>

        {/* Prominent disclaimer up top — the advice boundary */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-900">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>
              <strong>This is general educational information, not legal, tax, financial, or
              airworthiness advice.</strong>{' '}
              Whether a specific aircraft is airworthy is a determination only a qualified mechanic can
              make on the actual airplane, and title, tax, and AD-compliance treatment vary by aircraft
              and situation. Before you buy, commission an independent inspection and consult a{' '}
              <strong>qualified A&amp;P/IA mechanic and your own legal, tax, and title advisors</strong>{' '}
              about the specific aircraft.
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
            <li><a href="#what" className="hover:underline">What a pre-buy is</a></li>
            <li><a href="#areas" className="hover:underline">The major areas to check</a></li>
            <li><a href="#inspector" className="hover:underline">Choosing an inspector</a></li>
            <li><a href="#scope" className="hover:underline">Scope &amp; cost</a></li>
            <li><a href="#red-flags" className="hover:underline">Red flags to watch for</a></li>
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </nav>

        <p className="mt-8 leading-relaxed">
          Already running the numbers on ownership? Two companion guides cover the costs:{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            what it costs to own (or co-own) an aircraft
          </Link>{' '}
          and{' '}
          <Link href="/guides/how-to-find-aircraft-partners" className="font-medium text-sky-700 hover:underline">
            how to find partners to share the plane
          </Link>
          . This guide is the step that protects that investment: making sure the airplane you buy is the
          airplane you think you&apos;re buying.
        </p>

        <SectionHeading><span id="what" />What a pre-purchase inspection is — and why it matters</SectionHeading>
        <p className="mt-4 leading-relaxed">
          A pre-purchase inspection is an <strong>independent examination of the aircraft, commissioned by
          you (the buyer), before the sale closes</strong>. Its whole purpose is to surface the airplane&apos;s
          real condition — and any expensive surprises — while you can still negotiate the price or walk
          away. It is <em>not</em> an annual inspection and it does not &ldquo;sign off&rdquo; the aircraft
          as airworthy; it&apos;s due diligence for the buyer. A pre-buy can range from a focused
          records-and-logs review to a deep, panels-off look, depending on the airplane and what you agree
          with the shop.
        </p>
        <p className="mt-4 leading-relaxed">
          Why it matters: an airplane carries decades of maintenance history, and the costliest problems —
          corrosion, an engine near overhaul, undisclosed damage, or unresolved airworthiness directives —
          are exactly the ones a casual look won&apos;t reveal. A pre-buy is a small fraction of the
          purchase price that routinely pays for itself by catching issues that would cost far more to
          discover after you own the plane.
        </p>

        <SectionHeading><span id="areas" />The major areas a pre-buy should cover</SectionHeading>
        <p className="mt-4 leading-relaxed">
          A thorough pre-buy looks at the records first and the metal second — both matter. The areas
          worth covering on almost any used airplane:
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <ScrollText className="h-5 w-5 text-sky-600" /> Logbooks &amp; AD compliance
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Complete airframe, engine, and propeller logbooks; a clear maintenance history; and
              documented compliance with applicable airworthiness directives and service bulletins.
              Missing or vague records are themselves a finding.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Gauge className="h-5 w-5 text-sky-600" /> Engine
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A compression check, a look at time since overhaul, and often an oil analysis and screen/filter
              inspection. Time on the engine relative to its recommended overhaul interval is a major
              value driver.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Layers className="h-5 w-5 text-sky-600" /> Airframe &amp; corrosion
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Structure, skin, and control surfaces inspected for corrosion, cracks, and signs of prior
              repair — especially in hard-to-see areas. Corrosion is one of the most expensive things to
              find after the fact.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Cpu className="h-5 w-5 text-sky-600" /> Avionics &amp; equipment
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Confirm the panel actually matches the listing, that installed equipment works, and that
              required equipment (and any ADS-B / transponder items) is present and documented.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-sky-600" /> Paperwork, title &amp; liens
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A title and lien search to confirm the seller can actually convey clean ownership, plus
              registration, weight-and-balance, and equipment-list paperwork that all line up. A title
              issue can sink an otherwise good deal.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Wrench className="h-5 w-5 text-sky-600" /> Damage history
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Evidence of prior accidents, hard landings, or major repairs — and whether they were
              properly documented and repaired. Undisclosed damage history is a classic deal-breaker.
            </p>
          </div>
        </div>

        <SectionHeading><span id="inspector" />How to choose an inspector or shop</SectionHeading>
        <p className="mt-4 leading-relaxed">
          The single most important rule: the inspector should work <strong>for you, the buyer</strong> —
          not the seller or the broker. Beyond that, you want the right qualifications and the right
          experience:
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <ClipboardCheck className="h-5 w-5 text-sky-600" /> What to look for
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><strong className="text-slate-900">Independence.</strong> An A&amp;P mechanic (and an IA for the records/AD review) you hire and who reports directly to you — not the seller&apos;s own shop as the only set of eyes.</li>
            <li><strong className="text-slate-900">Type experience.</strong> A shop that knows your specific make and model; type clubs and owner groups are a good source for trusted recommendations.</li>
            <li><strong className="text-slate-900">A written scope.</strong> Agree in advance exactly what will be checked (records, compression, oil analysis, panels off, etc.) so expectations are clear.</li>
            <li><strong className="text-slate-900">A written report.</strong> You should receive a clear, written report directly — findings, photos, and recommendations you can act on or negotiate around.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          You generally want the airplane brought to (or the inspection performed by) a shop you chose,
          and you should expect a seller who is confident in the aircraft to welcome it.
        </p>

        <SectionHeading><span id="scope" />Thinking about scope and cost</SectionHeading>
        <p className="mt-4 leading-relaxed">
          Cost depends on the aircraft type, the shop&apos;s rate, how deep the inspection goes, and where
          the airplane is — so treat any single figure as a starting point, not a quote. A light
          single-engine piston pre-buy is generally a modest fraction of the purchase price; complex,
          high-performance, twin, or turbine aircraft cost more, and a deep panels-off or
          cylinders-pulled inspection costs more than a records-focused review.
        </p>
        <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Wallet className="h-5 w-5 text-sky-600" /> Budget for the whole picture
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>The inspection itself — a qualitative percentage of the purchase price, larger for complex aircraft.</li>
            <li>Separate costs: a title/lien search, any ferry or travel to the shop, and test-flight or fuel.</li>
            <li>Get a written scope and estimate <em>before</em> the shop starts, so there are no surprises.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          Framed honestly, a pre-buy is a small, qualitative slice of what you&apos;re about to spend on the
          airplane — and it&apos;s the slice that protects all the rest. To put the inspection cost in
          context of the total cost of owning the plane, the{' '}
          <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
            cost-of-ownership guide
          </Link>{' '}
          breaks down buy-in, fixed, and hourly costs.
        </p>

        <SectionHeading><span id="red-flags" />Red flags to watch for</SectionHeading>
        <p className="mt-4 leading-relaxed">
          None of these automatically kills a deal, but each is a reason to slow down and dig deeper
          before you commit:
        </p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <AlertTriangle className="h-5 w-5 text-amber-600" /> Slow down if you see
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            <li>Incomplete, missing, or suspiciously &ldquo;clean&rdquo; logbooks, or gaps in the maintenance history.</li>
            <li>Unclear or undisclosed damage history, or repairs not reflected in the paperwork.</li>
            <li>Resistance to a buyer-chosen, independent pre-buy — or pressure to skip due diligence.</li>
            <li>Unresolved or undocumented airworthiness directives.</li>
            <li>Signs of corrosion or prior repair that the records don&apos;t mention.</li>
            <li>A title or registration that doesn&apos;t cleanly match the seller.</li>
          </ul>
        </div>
        <p className="mt-4 leading-relaxed">
          The biggest one is resistance to an independent inspection. A seller confident in the airplane
          generally <em>welcomes</em> a thorough, buyer-chosen pre-buy — because it confirms what they&apos;re
          telling you.
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
              <Link href="/guides/aircraft-title-escrow-and-closing" className="font-medium text-sky-700 hover:underline">
                Aircraft Title, Escrow &amp; Closing
              </Link>{' '}
              — the other half of due diligence: how ownership and money safely change hands when you close.
            </li>
            <li>
              <Link href="/guides/cost-of-aircraft-co-ownership" className="font-medium text-sky-700 hover:underline">
                How Much Does It Cost to Co-Own an Aircraft?
              </Link>{' '}
              — buy-in, fixed, and hourly costs, so you can budget the whole purchase.
            </li>
            <li>
              <Link href="/guides/how-to-find-aircraft-partners" className="font-medium text-sky-700 hover:underline">
                How to Find Aircraft Co-Owners &amp; Partners
              </Link>{' '}
              — share the plane (and the cost) with the right partners.
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
          <h2 className="text-xl font-bold text-slate-900">Looking for a plane to buy?</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Browse aircraft for sale, find one you like, then line up an independent pre-buy before you
            make an offer.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/aircraft"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 font-medium text-white hover:bg-sky-700"
            >
              <Plane className="h-5 w-5" /> Browse planes for sale
            </Link>
            <Link
              href="/guides/cost-of-aircraft-co-ownership"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-5 py-2.5 font-medium text-sky-700 hover:bg-sky-50"
            >
              <Wallet className="h-5 w-5" /> See the cost of ownership
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Thinking about sharing the plane?{' '}
            <Link href="/guides/how-to-find-aircraft-partners" className="font-medium text-sky-700 hover:underline">
              See how to find partners
            </Link>{' '}
            <ArrowRight className="inline h-4 w-4" />
          </p>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          This guide is general educational information about pre-purchase inspections when buying a used
          aircraft. It is <strong>not legal, tax, financial, or airworthiness advice</strong>, and does not
          create an attorney-client or mechanic-client relationship. Whether a specific aircraft is
          airworthy is a determination only a qualified mechanic can make on the actual airplane, and
          title, tax, and AD-compliance treatment vary by aircraft, region, use, and situation. Commission
          an independent inspection and consult a qualified A&amp;P/IA mechanic and your own legal, tax, and
          title advisors before buying any aircraft.
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
