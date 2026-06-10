import Image from 'next/image'
import Link from 'next/link'
import { Plane, Users, ArrowRight, Heart } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — AeroMatch',
  description: 'Why AeroMatch exists. A pilot\'s frustration turned into something useful for the whole community.',
}

const frustrations = [
  {
    title: 'Partnerships scattered everywhere',
    desc: 'Reddit posts, expired forum threads, word-of-mouth at the FBO. There\'s no single place to find who\'s looking for a partner at your home field.',
  },
  {
    title: 'No search by home airport',
    desc: 'The few partnership listings that do exist have no searchable location. You\'re manually reading dozens of posts to find out if any are even based within driving distance.',
  },
  {
    title: 'Listing sites built for browsing, not comparing',
    desc: 'Barnstormers and Trade-A-Plane are great for sellers. For buyers, the data is inconsistent — TTAF buried in paragraph four, price is "call for details," damage history nowhere to be found.',
  },
  {
    title: 'No cost transparency on partnerships',
    desc: 'Monthly fixed, wet rate, buy-in — none of it standardized. You spend weeks emailing back and forth to piece together what a partnership actually costs.',
  },
]

export default function AboutPage() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-slate-900 py-28">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1583395838144-09bcec3c5df0?w=1800&q=80"
            alt="Cessna parked on a quiet ramp at golden hour"
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/70 to-slate-900" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-sky-900/60 px-3 py-1.5 text-sm text-sky-300 ring-1 ring-sky-700/50">
            <Plane className="h-3.5 w-3.5" strokeWidth={2.5} />
            Our story
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            A pilot who got tired<br />of bad tools.
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-slate-300">
            AeroMatch started as a personal frustration and became something I hope is useful for the whole community.
          </p>
        </div>
      </section>

      {/* ── FOUNDER STORY ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-16 lg:grid-cols-2">

            {/* Image */}
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-100">
                <Image
                  src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80"
                  alt="View from inside a small aircraft cockpit over a patchwork of fields"
                  width={700}
                  height={520}
                  className="h-[480px] w-full object-cover"
                />
              </div>
              <p className="mt-3 text-center text-xs text-slate-400">The view that made all the research worthwhile.</p>
            </div>

            {/* Story */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">The search that shouldn't be this hard.</h2>

              <div className="mt-6 space-y-5 text-lg leading-relaxed text-slate-600">
                <p>
                  I'm a pilot. Not a professional one — the kind who rents on weekends, obsesses over weather apps at 10pm, and has been dreaming about having more consistent access to an airplane for years.
                </p>
                <p>
                  Like a lot of GA pilots, I got to a point where renting stopped making sense. The economics of owning alone didn't either. A partnership seemed like the obvious answer — split the costs, share the schedule, keep flying.
                </p>
                <p>
                  So I went looking. And what I found was a mess.
                </p>
                <p>
                  Reddit posts with no airport listed. Barnstormers listings with specs scattered across paragraph-long descriptions. Partnership threads buried three pages deep in aviation forums, half of them years old. Trade-A-Plane with pricing listed as "call for details." Websites that haven't been redesigned since 2008.
                </p>
                <p>
                  The information existed somewhere. Getting to it was exhausting.
                </p>
                <p>
                  I spent weeks piecing together what a fair partnership structure even looked like — what buy-ins were normal, what monthly costs were reasonable, what airports had active clubs. None of that should require weeks. It should require a search bar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE FRUSTRATIONS ── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">What was broken.</h2>
            <p className="mt-3 text-lg text-slate-500">
              These weren't minor inconveniences. They were the reason good partnerships went unfound and good planes went unsold.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {frustrations.map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center justify-center rounded-full bg-sky-50 p-3">
            <Heart className="h-7 w-7 text-sky-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            I'm really building this for the community.
          </h2>

          <div className="mt-8 space-y-5 text-lg leading-relaxed text-slate-600 text-left">
            <p>
              AeroMatch isn't a startup play. It's a tool I wished existed when I was searching, so I built it — and I'm sharing it because every pilot going through that search deserves better than what's out there today.
            </p>
            <p>
              The goal is simple: if you're a pilot looking for a partner or a plane, this should be the first place you check. Not Reddit. Not three different sites with three different listing formats. Here.
            </p>
            <p>
              Partnership listings are free to post. Searching is free. I want to keep as much of this free as long as possible, because the community is better when information flows easily.
            </p>
            <p>
              Eventually, I'd love for this to grow into a full hub for the GA community — hangars, CFIs, maintenance shops, flight schools. But that all starts with solving the core problem first: helping pilots find their next aircraft.
            </p>
            <p className="font-medium text-slate-800">
              If this helps even one pilot find their airplane — or find the right partner to share one — it was worth building.
            </p>
          </div>
        </div>
      </section>

      {/* ── WHAT WE'RE BUILDING ── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">What we're building toward.</h2>
            <p className="mt-3 text-slate-500">The roadmap, in plain English.</p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {[
              { emoji: '✅', label: 'Partnership listings', desc: 'Searchable by airport, cost, aircraft type, and requirements.' },
              { emoji: '🔨', label: 'Aircraft for sale', desc: 'Aggregated listings with structured specs and FAA registry data.' },
              { emoji: '📬', label: 'Saved searches + alerts', desc: 'Get notified when a listing matching your criteria is posted.' },
              { emoji: '🛩️', label: 'Hangar listings', desc: 'Find available hangar space near your home airport.' },
              { emoji: '👩‍✈️', label: 'CFI directory', desc: 'Find flight instructors by airport, rating, and availability.' },
              { emoji: '🌐', label: 'Community hub', desc: 'The full-stack resource for the GA community.' },
            ].map(({ emoji, label, desc }) => (
              <div key={label} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-slate-900 py-20">
        <div
          className="absolute inset-0 opacity-15"
          style={{ backgroundImage: 'radial-gradient(ellipse at 70% 50%, #0ea5e9 0%, transparent 60%)' }}
        />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Let's build this together.</h2>
          <p className="mt-4 text-lg text-slate-300">
            Post your partnership. Share the site with someone who's searching. Tell me what's missing. The community makes this what it should be.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/partnerships"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-sky-500"
            >
              <Users className="h-5 w-5" />
              Browse Partnerships
            </Link>
            <Link
              href="/partnerships/new"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-base font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              Post a Listing <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
