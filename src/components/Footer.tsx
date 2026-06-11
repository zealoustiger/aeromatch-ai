import Link from 'next/link'
import { Plane } from 'lucide-react'
import { STATE_NAMES, SEO_MAKES } from '@/lib/seo'

const POPULAR_STATES = ['TX', 'FL', 'CA', 'AZ', 'WA', 'CO', 'GA', 'NC', 'OH', 'NY']

const exploreLinks = [
  { href: '/partnerships', label: 'Browse partnerships' },
  { href: '/partnerships/seeking', label: 'Pilots seeking shares' },
  { href: '/aircraft', label: 'Aircraft for sale' },
  { href: '/partnerships/new', label: 'Post a partnership' },
  { href: '/partnerships/seeking/new', label: 'Post a seeking listing' },
]

const companyLinks = [
  { href: '/about', label: 'About AeroMatch' },
]

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <Plane className="h-5 w-5 text-sky-600" strokeWidth={2.5} />
              <span className="text-lg">AeroMatch</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              The modern marketplace for aircraft partnerships, co-ownership, and sales. Built by a pilot, for pilots.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Explore</h3>
            <ul className="space-y-2">
              {exploreLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-slate-500 hover:text-sky-600">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular states */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Partnerships by state</h3>
            <ul className="space-y-2">
              {POPULAR_STATES.map((code) => (
                <li key={code}>
                  <Link
                    href={`/partnerships/state/${code.toLowerCase()}`}
                    className="text-sm text-slate-500 hover:text-sky-600"
                  >
                    {STATE_NAMES[code]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Makes + company */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Partnerships by make</h3>
            <ul className="space-y-2">
              {SEO_MAKES.slice(0, 6).map(({ slug, name }) => (
                <li key={slug}>
                  <Link
                    href={`/partnerships/make/${slug}`}
                    className="text-sm text-slate-500 hover:text-sky-600"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mb-3 mt-6 text-sm font-semibold text-slate-900">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-slate-500 hover:text-sky-600">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} AeroMatch. The modern marketplace for pilots.</p>
          <p className="text-xs text-slate-300">Free to search. Free to post.</p>
        </div>
      </div>
    </footer>
  )
}
