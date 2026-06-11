import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Plane, Users, Search, MapPin, DollarSign, ShieldCheck, ArrowRight } from 'lucide-react'
import HeroSearch from '@/components/HeroSearch'
import FeaturedListings from '@/components/FeaturedListings'
import { STATE_NAMES, SEO_MAKES } from '@/lib/seo'

export const metadata: Metadata = {
  title: { absolute: 'AeroMatch — Aircraft Partnerships, Co-Ownership & Planes for Sale' },
  description:
    'Search aircraft partnerships and co-ownership opportunities by home airport. Browse planes for sale with real specs. Free to search, free to post.',
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

      {/* ── BENEFITS — why AeroMatch ── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why pilots use AeroMatch</h2>
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
