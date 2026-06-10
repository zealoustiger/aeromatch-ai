import Link from 'next/link'
import Image from 'next/image'
import { Plane, Users, Search, ChevronRight, MapPin, DollarSign, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import HeroSearch from '@/components/HeroSearch'

const problems = [
  {
    site: 'Barnstormers / Trade-A-Plane',
    issue: 'Listings buried in unformatted walls of text. No structured specs. You\'re hunting for "SMOH" in a paragraph.',
  },
  {
    site: 'Reddit r/flying / r/TheHangar',
    issue: 'Partnerships exist here, but they\'re unsearchable, expire from the feed, and there\'s no way to filter by home airport.',
  },
  {
    site: 'Controller.com',
    issue: 'Built for turbines and jets. Filtering for a $90k single-engine trainer is an afterthought.',
  },
]

const partnershipFeatures = [
  { icon: MapPin, label: 'Search by home airport', desc: 'Filter by ICAO code or radius — find what\'s actually based near you.' },
  { icon: DollarSign, label: 'Full cost transparency', desc: 'Buy-in, monthly fixed, and wet rate shown upfront on every listing.' },
  { icon: Clock, label: 'Experience requirements', desc: 'Filter by minimum hours and required ratings so you see only what fits.' },
  { icon: Users, label: 'Structured deal terms', desc: 'Share type, total partners, scheduling system — all standardized.' },
]

const purchaseFeatures = [
  { icon: Search, label: 'Parsed specs, not paragraphs', desc: 'TTAF, SMOH, annual due date, and damage history surfaced as filters.' },
  { icon: Plane, label: 'Avionics stack', desc: 'G1000, Garmin 430W, ADS-B — searchable, not buried in descriptions.' },
  { icon: CheckCircle, label: 'FAA registry cross-reference', desc: 'N-number lookup ties to real ownership history and accident records.' },
  { icon: ChevronRight, label: 'Side-by-side comparison', desc: 'Compare two or three aircraft on specs and price — like cars, but for planes.' },
]

const howItWorks = [
  {
    step: '01',
    title: 'Describe what you\'re looking for',
    desc: 'Home airport, aircraft type, budget, experience level. Real filters that match how pilots actually think.',
  },
  {
    step: '02',
    title: 'Browse structured listings',
    desc: 'Every listing shows the info that matters — costs, specs, requirements — not a wall of unformatted text.',
  },
  {
    step: '03',
    title: 'Connect directly',
    desc: 'No middlemen, no broker fees. Email or call the owner directly from the listing.',
  },
]

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] overflow-hidden bg-slate-900 flex items-center">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1436891620584-47fd0e565afb?w=1800&q=80"
            alt="Aerial view from small aircraft cockpit"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sky-900/60 px-3 py-1.5 text-sm text-sky-300 ring-1 ring-sky-700/50">
              <Plane className="h-3.5 w-3.5" strokeWidth={2.5} />
              Built by a pilot, for pilots
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Find your next<br />
              <span className="text-sky-400">aircraft.</span>
            </h1>

            <p className="mt-5 text-xl leading-relaxed text-slate-300">
              Search partnerships by home airport. Filter purchases by real specs.
              No paragraph soup.
            </p>

            {/* ── Hero Search ── */}
            <div className="mt-10">
              <HeroSearch />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/aircraft"
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 underline-offset-2 hover:text-sky-400 hover:underline"
              >
                <Plane className="h-4 w-4" />
                Browse aircraft for sale
              </Link>
              <span className="text-slate-700">·</span>
              <span className="text-sm text-slate-500">Free to search. Free to post.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600 ring-1 ring-red-100">
              <AlertTriangle className="h-3.5 w-3.5" />
              The current tools are broken
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              You shouldn't need three tabs and a Reddit scroll to find a co-owner.
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              The aviation buying and partnership market is fragmented across sites that were built for a different era. None of them were designed around how you actually search.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {problems.map(({ site, issue }) => (
              <div key={site} className="rounded-xl border border-red-100 bg-red-50/50 p-6">
                <p className="mb-2 text-sm font-semibold text-slate-700">{site}</p>
                <p className="text-sm leading-relaxed text-slate-500">{issue}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-100">
            <CheckCircle className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
            <p className="text-lg font-semibold text-slate-900">AeroMatch fixes this.</p>
            <p className="mt-1 text-slate-500">Structured data, real filters, and a search experience that matches how pilots actually think about aircraft.</p>
          </div>
        </div>
      </section>

      {/* ── TWO VERTICALS ── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Two things done right.</h2>
            <p className="mt-3 text-lg text-slate-500">Purpose-built for the two most common ways pilots acquire aircraft.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Partnerships */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Partnerships & Co-Ownership</h3>
                  <p className="text-sm text-slate-400">The only dedicated, searchable partnership board</p>
                </div>
              </div>
              <ul className="space-y-4">
                {partnershipFeatures.map(({ icon: Icon, label, desc }) => (
                  <li key={label} className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <Icon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      <p className="text-sm text-slate-500">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/partnerships"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Join a Partnership <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Aircraft for sale */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                  <Plane className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Aircraft for Sale</h3>
                  <p className="text-sm text-slate-400">Aggregated, structured, actually searchable</p>
                </div>
              </div>
              <ul className="space-y-4">
                {purchaseFeatures.map(({ icon: Icon, label, desc }) => (
                  <li key={label} className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50">
                      <Icon className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      <p className="text-sm text-slate-500">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/aircraft"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Search Aircraft <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Simple by design.</h2>
            <p className="mt-3 text-lg text-slate-500">No account required to search. No fees to browse.</p>
          </div>

          <div className="relative grid gap-8 sm:grid-cols-3">
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent sm:block" />
            {howItWorks.map(({ step, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <span className="text-xl font-bold text-sky-600">{step}</span>
                </div>
                <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY MISSION ── */}
      <section className="relative overflow-hidden bg-slate-900 py-24">
        <div
          className="absolute inset-0 opacity-15"
          style={{ backgroundImage: 'radial-gradient(ellipse at 30% 60%, #0ea5e9 0%, transparent 60%)' }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-sky-400">Our mission</p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Built for the community.<br />Free for the community.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-300">
                AeroMatch exists because the GA community deserves better tools. Every feature we build is driven by one question: what would make it genuinely easier for a pilot to find their next aircraft or their next partner?
              </p>
              <p className="mt-4 text-slate-400">
                Posting a partnership listing is free. Searching is free. We hope to keep it that way for as long as possible.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
                >
                  Our story <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/partnerships/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
                >
                  Post a listing
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80"
                  alt="Small aircraft parked on a grass airfield at sunset"
                  width={600}
                  height={400}
                  className="h-[360px] w-full object-cover opacity-80"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-sky-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Have a partnership to offer?</h2>
          <p className="mt-3 text-lg text-sky-100">
            Reach pilots actively searching near your home airport. It takes under five minutes and it's completely free.
          </p>
          <Link
            href="/partnerships/new"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-base font-semibold text-sky-700 shadow-lg transition-all hover:bg-sky-50"
          >
            Post a Partnership <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

    </div>
  )
}
