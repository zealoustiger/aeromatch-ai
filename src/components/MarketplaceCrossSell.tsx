import Link from 'next/link'
import { Plane, Users, ArrowRight } from 'lucide-react'

/**
 * A single, make-aware cross-sell card between the two marketplace types
 * (co-ownership partnerships ↔ planes for sale). Shown at the bottom of each
 * results page so a visitor who actually wants the *other* ownership model finds
 * it — and so crawlers get one more internal link between the two biggest hubs.
 *
 * Slice 1 of "Blend result types + cross-sell": a static, contextual card (no
 * live counts / blended results yet). Real links only — when a `make` filter is
 * active it's carried through so the suggestion stays on-topic
 * (e.g. /partnerships?make=Cirrus → /aircraft?make=Cirrus).
 */
export default function MarketplaceCrossSell({
  from,
  make,
  className = '',
}: {
  /** Which marketplace the visitor is on now; the card promotes the OTHER one. */
  from: 'partnerships' | 'aircraft'
  /** Active make filter, if any — carried into the cross-link + the copy. */
  make?: string
  className?: string
}) {
  const m = make?.trim()
  const makeLabel = m ? `${m} ` : ''
  const makeQuery = m ? `?make=${encodeURIComponent(m)}` : ''

  const content =
    from === 'partnerships'
      ? {
          href: `/aircraft${makeQuery}`,
          Icon: Plane,
          heading: 'Prefer to own outright?',
          body: `Browse ${makeLabel}aircraft for sale aggregated from across the web — the same planes, owned solo instead of shared.`,
          cta: `Browse ${makeLabel}planes for sale`,
        }
      : {
          href: `/partnerships${makeQuery}`,
          Icon: Users,
          heading: 'Want to split the cost?',
          body: `See ${makeLabel}co-ownership partnerships — transparent buy-in, monthly, and hourly costs on every listing.`,
          cta: `Browse ${makeLabel}partnerships`,
        }

  const { href, Icon, heading, body, cta } = content

  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-5 transition-colors hover:border-sky-300 hover:bg-sky-100 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="hidden shrink-0 rounded-xl bg-white p-2 text-sky-600 shadow-sm sm:block">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
          <p className="mt-1 text-sm text-slate-600">{body}</p>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sky-600">
        <span className="hidden sm:inline">{cta}</span>
        <ArrowRight className="h-5 w-5" />
      </span>
    </Link>
  )
}
