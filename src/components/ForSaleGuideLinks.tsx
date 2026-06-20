import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

/**
 * "Buying a plane?" related-guides cross-link block for the high-traffic for-sale
 * surfaces (`/aircraft` and the make+model pages). Purely additive internal
 * linking toward the buyer-guide cluster — surfaces the pre-purchase inspection
 * buyer guide, the cost guide, and the /guides hub. No new pages, no data fetch.
 *
 * Styling mirrors the existing for-sale rail cards
 * (`rounded-xl border border-slate-200 bg-white p-6 shadow-sm`) and the established
 * sky-blue accent — no new palette, no emerald.
 */
export default function ForSaleGuideLinks({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`.trim()}
    >
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
        <BookOpen className="h-4 w-4 text-sky-500" />
        Buying a plane?
      </h2>
      <p className="mb-3 text-sm text-slate-500">
        Plain-English guides to help you buy and own with confidence.
      </p>
      <ul className="space-y-2 text-sm leading-relaxed text-slate-600">
        <li>
          <Link
            href="/guides/aircraft-pre-purchase-inspection"
            className="font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            Aircraft Pre-Purchase Inspection — A Buyer&apos;s Checklist
          </Link>{' '}
          — what to check before you make an offer.
        </li>
        <li>
          <Link
            href="/guides/cost-of-aircraft-co-ownership"
            className="font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            How Much Does It Cost to Own an Aircraft?
          </Link>{' '}
          — buy-in, fixed, and hourly costs, so you can budget the whole purchase.
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
