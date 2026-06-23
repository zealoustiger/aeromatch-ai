import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Plane, Users, Search, MapPin, DollarSign, ShieldCheck, ArrowRight, Calculator, BookOpen, FileText, TrendingUp } from 'lucide-react'
import HeroSearch from '@/components/HeroSearch'
import FeaturedListings from '@/components/FeaturedListings'
import HomeRails from '@/components/HomeRails'
import DealsRail from '@/components/DealsRail'
import { STATE_NAMES, SEO_MAKES, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'

const faqItems = [
  {
    q: 'What is aircraft co-ownership?',
    a: 'Aircraft co-ownership is when 2–4 pilots jointly purchase and operate an airplane, dividing the acquisition cost, fixed monthly expenses (hangar, insurance, annual inspection), and hourly operating costs (fuel, oil, reserves). It is the most cost-effective way for many GA pilots to have consistent, scheduled access to an aircraft without the full financial burden of sole ownership.',
  },
  {
    q: 'How much does it cost to join an aircraft partnership?',
    a: 'Costs depend on the aircraft and location. A 1/3 share in a Cessna 172 typically requires a $12,000–$25,000 buy-in, $250–$400/month in fixed costs, and a $75–$110/hour wet rate. A Cirrus SR22 partnership share may require a $45,000–$80,000 buy-in with $600–$900/month in fixed costs. Every listing on ClubHanger shows buy-in, monthly fixed, and wet rate upfront.',
  },
  {
    q: 'What pilot requirements are typical for an aircraft partnership?',
    a: 'Most single-engine piston partnerships require at least a Private Pilot License (PPL) with 150–250 total hours. Partnerships involving IFR-equipped aircraft like a Garmin G1000-equipped Cessna 172S or Cirrus SR22 often require an Instrument Rating. Each ClubHanger listing specifies the minimum hours and required ratings so you only see listings that fit your certificate.',
  },
  {
    q: 'How do I find an aircraft partnership near my home airport?',
    a: 'On ClubHanger, enter your home airport ICAO code (e.g., KAUS for Austin-Bergstrom, KPAO for Palo Alto, KADS for Addison) or search by city and radius. Filter by aircraft make and model, share type (1/2, 1/3, 1/4), monthly budget, and experience requirements to narrow results to listings that match your situation.',
  },
  {
    q: "What's the difference between aircraft co-ownership and a flying club?",
    a: 'Aircraft co-ownership involves 2–4 pilots who jointly own a specific aircraft and split all costs proportionally by share. A flying club is a larger membership organization (often 10–100+ members) that owns one or more aircraft and charges dues and hourly rates. Co-ownership offers more scheduling flexibility and direct equity ownership; flying clubs provide lower per-member costs and more available aircraft.',
  },
]

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ClubHanger',
  url: SITE_URL,
  logo: `${SITE_URL}/og-default.png`,
  description:
    'Free marketplace for general aviation pilots to find aircraft co-ownership partnerships and aircraft for sale.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/partnerships?airport={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const homeTitle = 'ClubHanger — Aircraft Partnerships, Co-Ownership & Planes for Sale'
const homeDescription =
  'Search aircraft partnerships and co-ownership opportunities by home airport. Browse planes for sale with real specs. Free to search, free to post.'

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: '/',
    title: homeTitle,
    description: homeDescription,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: homeDescription,
    images: [DEFAULT_OG_IMAGE],
  },
}

const benefits = [
  {
    icon: MapPin,
    title: 'Search by home airport',
    desc: 'Filter by ICAO code or radius — see only aircraft actually based near you, not 500 miles away.',
  },
  {
    icon: DollarSign,
    title: 'Full cost transparency',
    desc: 'Buy-in, monthly fixed, and hourly wet rate shown upfront on every partnership listing.',
  },
  {
    icon: ShieldCheck,
    title: 'Structured, vetted listings',
    desc: 'Share type, total partners, pilot requirements — standardized fields, not paragraph soup.',
  },
  {
    icon: Users,
    title: 'Free for the community',
    desc: 'No broker fees, no paywalls. Posting and searching are free, built by a pilot for pilots.',
  },
]

const exploreCards = [
  {
    href: '/partnerships',
    title: 'Find a partnership',
    desc: 'Browse co-ownership shares with transparent costs near your home airport.',
    img: 'https://images.unsplash.com/photo-1436891620584-47fd0e565afb?w=900&q=80',
    alt: 'Small aircraft over a coastline',
    cta: 'Browse partnerships',
  },
  {
    href: '/partnerships/seeking',
    title: 'Pilots seeking shares',
    desc: 'Own a plane? Find qualified, budget-matched pilots looking to buy in.',
    img: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=900&q=80',
    alt: 'Aircraft parked on a grass airfield at sunset',
    cta: 'Meet seekers',
  },
  {
    href: '/aircraft',
    title: 'Aircraft for sale',
    desc: 'Aggregated listings with parsed specs — TTAF, SMOH, and avionics as filters.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Cirrus_SR-22_G3_GTS_AN1594917.jpg',
    alt: 'Cirrus SR22 single-engine airplane',
    cta: 'Search aircraft',
  },
]

// Free guides & tools — in-content internal links from the homepage (highest-authority
// page) to the priority content seed pages and the rest of the guides/tools families.
// Footer already links these, but in-content links from the homepage carry more crawl
// weight (STAGE=INDEXING). Copy mirrors each page's real description — no fabricated claims.
const resources = [
  {
    href: '/tools/cost-calculator',
    icon: Calculator,
    tag: 'Tool',
    title: 'Cost calculator',
    desc: 'See the true monthly and per-hour cost of a co-ownership share vs. renting or owning outright.',
  },
  {
    href: '/guides/aircraft-co-ownership',
    icon: BookOpen,
    tag: 'Guide',
    title: 'How co-ownership works',
    desc: 'A plain-English walkthrough of how 2–4 pilots jointly buy, schedule, and split the cost of an aircraft.',
  },
  {
    href: '/guides/cost-of-aircraft-co-ownership',
    icon: DollarSign,
    tag: 'Guide',
    title: 'What it really costs',
    desc: 'Buy-in, fixed, and hourly costs broken down — with a worked Cessna 172 example and honest estimate ranges.',
  },
  {
    href: '/guides/how-to-find-aircraft-partners',
    icon: Users,
    tag: 'Guide',
    title: 'How to find partners',
    desc: 'Where to look and how to vet co-owners so you end up with a partnership that actually works.',
  },
  {
    href: '/guides/aircraft-partnership-agreement',
    icon: FileText,
    tag: 'Guide',
    title: 'Partnership agreements',
    desc: 'What to put in writing — scheduling, expenses, buy-outs — before you share a plane.',
  },
  {
    href: '/tools/earnings-calculator',
    icon: TrendingUp,
    tag: 'Tool',
    title: 'Earnings calculator',
    desc: 'Model the monthly offset and break-even of offering shares in your aircraft.',
  },
]

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO — compact, centered search (Redfin-style) ── */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1436891620584-47fd0e565afb?w=1800&q=80"
            alt="Aerial view from small aircraft cockpit"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/70" />
        </div>

        <div className="relative mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Your next aircraft starts here.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-slate-200">
            Search partnerships and planes for sale by home airport — with real costs and real specs.
          </p>

          <div className="mt-8 flex justify-center">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ── NEWEST LISTINGS — large photo cards ── */}
      <FeaturedListings />

      {/* ── CURATED RAILS — Etsy-style horizontal collections of real for-sale aircraft ── */}
      <HomeRails />

      {/* ── PRICED BELOW MARKET — rail of below-market deals (links to /aircraft/deals) ── */}
      <DealsRail />

      {/* ── EXPLORE — three big photo cards ── */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">Three ways to fly more for less</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {exploreCards.map(({ href, title, desc, img, alt, cta }) => (
              <Link
                key={href}
                href={href}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={img}
                    alt={alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-600 group-hover:text-sky-700">
                    {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS — why ClubHanger ── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why pilots use ClubHanger</h2>
            <p className="mt-2 text-lg text-slate-500">
              The aviation marketplace, rebuilt around how pilots actually search.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50">
                  <Icon className="h-7 w-7 text-sky-600" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-slate-900">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUIDES & TOOLS — in-content internal links to the content seed pages ── */}
      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Free guides &amp; tools</h2>
              <p className="mt-2 text-base text-slate-500">
                Everything you need to plan a partnership — what it costs, how to find partners, and what to put in writing.
              </p>
            </div>
            <div className="flex shrink-0 gap-4 text-sm font-semibold">
              <Link href="/guides" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700">
                All guides <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/tools" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700">
                All tools <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map(({ href, icon: Icon, tag, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50">
                    <Icon className="h-5 w-5 text-sky-600" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{tag}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-sky-700">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION STRIP ── */}
      <section className="bg-slate-900 py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:flex-row lg:justify-between lg:text-left lg:px-8">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-sky-400">Built by a pilot, for pilots</p>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Free to search. Free to post. For the GA community.</h2>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              Our story
            </Link>
            <Link
              href="/partnerships/new"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
            >
              Post a listing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEO: BROWSE BY MAKE ── */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-slate-900">
            <Plane className="h-5 w-5 text-sky-600" />
            Browse partnerships by aircraft make
          </h2>
          <p className="mb-6 text-sm text-slate-500">Co-ownership opportunities for the most popular GA aircraft.</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            {SEO_MAKES.map(({ slug, name }) => (
              <Link
                key={slug}
                href={`/partnerships/make/${slug}`}
                className="py-1 text-sm text-slate-600 transition-colors hover:text-sky-600 hover:underline"
              >
                {name} partnerships
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO: BROWSE AIRCRAFT FOR SALE BY MAKE ──
          Internal links from the homepage (highest-authority page) into the
          aircraft-for-sale make hubs — the #1 search-demand family ("{make} for
          sale"), which the homepage otherwise never links to (it surfaced only the
          partnership make/state hubs). Pure static links to real, inventory-backed
          hubs (every SEO_MAKES slug resolves via resolveMake), so no DB query and no
          404 risk. Each make hub fans crawl out to its model + state pages, and the
          "browse all" link reaches every for-sale programmatic page. STAGE=INDEXING. */}
      <section className="border-t border-slate-100 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-slate-900">
                <Plane className="h-5 w-5 text-sky-600" />
                Browse aircraft for sale by make
              </h2>
              <p className="text-sm text-slate-500">Every listing for the most popular GA aircraft, aggregated from across the web.</p>
            </div>
            <Link href="/aircraft/browse" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700">
              Browse all aircraft for sale <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            {SEO_MAKES.map(({ slug, name }) => (
              <Link
                key={slug}
                href={`/aircraft/${slug}`}
                className="py-1 text-sm text-slate-600 transition-colors hover:text-sky-600 hover:underline"
              >
                {name} aircraft for sale
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO: BROWSE BY STATE ── */}
      <section className="border-t border-slate-100 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-slate-900">
            <Search className="h-5 w-5 text-sky-600" />
            Find aircraft partnerships by state
          </h2>
          <p className="mb-6 text-sm text-slate-500">Browse co-ownership and flying club opportunities across the United States.</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(STATE_NAMES).map(([code, name]) => (
              <Link
                key={code}
                href={`/partnerships/state/${code.toLowerCase()}`}
                className="py-1 text-sm text-slate-600 transition-colors hover:text-sky-600 hover:underline"
              >
                {name} partnerships
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-slate-50 py-20" id="faq">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Common questions about aircraft co-ownership</h2>
            <p className="mt-3 text-lg text-slate-500">Everything you need to know before you start searching.</p>
          </div>
          <dl className="space-y-6">
            {faqItems.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <dt className="text-base font-semibold text-slate-900">{q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-sky-600 py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Have a partnership to offer?</h2>
          <p className="mt-2 text-lg text-sky-100">
            Reach pilots actively searching near your home airport — in under five minutes, for free.
          </p>
          <Link
            href="/partnerships/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-base font-semibold text-sky-700 shadow-lg transition-all hover:bg-sky-50"
          >
            Post a Partnership <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

    </div>
  )
}
