import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'

/**
 * Owner-only "N matches" nudge — slice 1 of the compatibility matching engine.
 * Shown only to a listing's owner (the parent server component gates on
 * poster_id), it surfaces an honest count of currently active, compatible
 * listings on the other side of the marketplace (partnership ↔ seeker), scored
 * by `isCompatibleMatch` (src/lib/matching.ts) from columns both sides already
 * store. Self-suppresses at 0 — a promised zero reads as a dead end, not a
 * signal worth showing.
 */
export default function MatchCountNudge({
  count,
  label,
  href,
}: {
  count: number
  label: string
  href: string
}) {
  if (count <= 0) return null

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-sky-800">
        <Users className="h-4 w-4" aria-hidden /> {count} {count === 1 ? 'match' : 'matches'}
      </h2>
      <p className="mt-1 text-sm text-sky-700">{label}</p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-900"
      >
        Browse them <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
