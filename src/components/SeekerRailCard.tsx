import Link from 'next/link'
import { MapPin, Search } from 'lucide-react'
import { PartnershipSeeker } from '@/lib/types'
import { anonymizeName, formatPrice } from '@/lib/utils'
import AviatorAvatar from '@/components/AviatorAvatar'

/**
 * Compact rail card for a pilot-seeking listing — the seeker twin of
 * `PartnershipRailCard`/`AircraftRailCard`, used by `SimilarSeekers`. Seekers
 * have no photos, so the avatar (seeded by id, same as `SeekerCard`) stands in
 * for the photo slot. Links to the on-platform seeker detail page.
 */
export default function SeekerRailCard({ seeker }: { seeker: PartnershipSeeker }) {
  const aircraftWant = [seeker.preferred_makes?.join(', '), seeker.preferred_models]
    .filter(Boolean)
    .join(' — ') || 'Open to any aircraft'

  return (
    <Link
      href={`/partnerships/seeking/${seeker.id}`}
      className="ch-card group block w-60 shrink-0 overflow-hidden bg-white p-4 sm:w-64"
    >
      <div className="flex items-center gap-2.5">
        <AviatorAvatar seed={seeker.id} size={42} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-sky-700">
            {anonymizeName(seeker.contact_name) || 'A pilot'}
          </p>
          <p className="text-xs text-slate-400">Seeking a partnership share</p>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 truncate text-sm text-slate-700">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{aircraftWant}</span>
      </p>

      <p className="mt-1.5 flex items-center gap-1.5 truncate text-sm text-slate-500">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">
          {seeker.city ? `${seeker.city}${seeker.state ? `, ${seeker.state}` : ''}` : seeker.home_airport}
        </span>
      </p>

      {(seeker.max_buy_in || seeker.max_monthly) && (
        <p className="mt-2 text-sm font-semibold text-slate-900">
          Up to{' '}
          {seeker.max_buy_in ? formatPrice(seeker.max_buy_in) : `${formatPrice(seeker.max_monthly!)}/mo`}
        </p>
      )}
    </Link>
  )
}
