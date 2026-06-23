import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'

/**
 * "New to co-ownership?" related-resources cross-link block for the partnership hub
 * surfaces (the make hubs `/partnerships/make/[make]` and state hubs
 * `/partnerships/state/[state]`). The partnership-side counterpart to
 * `ForSaleGuideLinks` on the for-sale surfaces — those hubs previously only
 * cross-linked to other hubs and `/partnerships`, never into the co-ownership
 * guides cluster or the cost calculator. Purely additive internal linking that
 * routes crawl equity to the priority seed pages /guides/aircraft-co-ownership
 * (#12) and /tools/cost-calculator (#11). No new pages, no data fetch; every
 * target is an existing always-valid static page (no 404 risk).
 *
 * Styling mirrors the existing partnership cross-link cards
 * (`rounded-xl border border-slate-200 bg-white p-6 shadow-sm`) and the
 * established sky-blue accent — no new palette.
 */
export default function PartnershipResourceLinks({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`.trim()}
    >
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Users className="h-4 w-4 text-sky-500" />
        New to co-ownership?
      </h2>
      <p className="mb-3 text-sm text-slate-500">
        Plain-English guides and tools to help you share a plane with confidence.
      </p>
      <ul className="space-y-2 text-sm leading-relaxed text-slate-600">
        <li>
          <Link
            href="/guides/aircraft-co-ownership"
            className="font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            How Aircraft Co-Ownership &amp; Partnerships Work
          </Link>{' '}
          — the starting point: share types, costs, and how partners split them.
        </li>
        <li>
          <Link
            href="/guides/how-to-find-aircraft-partners"
            className="font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            How to Find Aircraft Co-Owners &amp; Partners
          </Link>{' '}
          — where to look, how to vet a candidate, and the red flags to avoid.
        </li>
        <li>
          <Link
            href="/tools/cost-calculator"
            className="font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            Partnership Cost Calculator
          </Link>{' '}
          — see the true monthly and per-hour cost of a share before you commit.
        </li>
      </ul>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <Link
          href="/guides"
          className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
        >
          Browse all ClubHanger guides <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
