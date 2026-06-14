import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * "Verified by ClubHanger" trust badge. Only ever rendered from admin-set data
 * (profiles.verified / verified_ratings) — never self-attested.
 */
export default function VerifiedBadge({
  label = 'Verified by ClubHanger',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200',
        className
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Verified
    </span>
  )
}
