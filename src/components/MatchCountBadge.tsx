import Link from 'next/link'
import { Users } from 'lucide-react'

/**
 * Compact "N matches" pill for dense list rows (e.g. `/listings`) — a smaller
 * sibling of `MatchCountNudge` (which is sized for a detail-page hero slot, not a
 * list row). Same self-suppress-at-0 convention.
 */
export default function MatchCountBadge({ count, href }: { count: number; href: string }) {
  if (count <= 0) return null

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 transition-colors hover:bg-sky-100"
    >
      <Users className="h-3 w-3" aria-hidden /> {count} {count === 1 ? 'match' : 'matches'}
    </Link>
  )
}
