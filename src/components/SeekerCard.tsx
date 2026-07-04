import Link from 'next/link'
import { MapPin, Clock, Search, LineChart, Sparkles, CalendarDays } from 'lucide-react'
import { PartnershipSeeker } from '@/lib/types'
import { anonymizeName, formatPrice, formatPriceK, travelLabel } from '@/lib/utils'
import type { PartnershipCompVerdict } from '@/lib/partnershipComps'
import AviatorAvatar from '@/components/AviatorAvatar'

const CATEGORY_LABELS: Record<string, string> = {
  sel: 'Single-Engine',
  mel: 'Multi-Engine',
  turboprop: 'Turboprop',
  jet: 'Jet',
  any: 'Any Type',
}

const DAY_MS = 24 * 60 * 60 * 1000

// Freshness helpers — mirror PartnershipCard, keyed off `created_at` (seekers
// have no `first_seen_at`; they're user-posted, so creation time is the signal).
function isNew(createdAt: string | null): boolean {
  if (!createdAt) return false
  const then = new Date(createdAt).getTime()
  if (Number.isNaN(then)) return false
  return Date.now() - then < 7 * DAY_MS
}

// Redfin-style days-on-market label. Returns null when we have no usable date.
function listedAgo(createdAt: string | null): string | null {
  if (!createdAt) return null
  const then = new Date(createdAt).getTime()
  if (Number.isNaN(then)) return null
  const days = Math.floor((Date.now() - then) / DAY_MS)
  if (days <= 0) return 'Listed today'
  if (days === 1) return 'Listed 1 day ago'
  if (days < 7) return `Listed ${days} days ago`
  if (days < 14) return 'Listed 1 week ago'
  if (days < 30) return `Listed ${Math.floor(days / 7)} weeks ago`
  if (days < 60) return 'Listed 1 month ago'
  if (days < 365) return `Listed ${Math.floor(days / 30)} months ago`
  const years = Math.floor(days / 365)
  return years === 1 ? 'Listed 1 year ago' : `Listed ${years} years ago`
}

export default function SeekerCard({
  seeker,
  budgetVerdict,
}: {
  seeker: PartnershipSeeker
  /** When set, shows a "~X% below/above market" chip comparing the seeker's stated
   *  max buy-in to same-make partnership comps (same honesty gates as the detail
   *  page's `SeekerBudgetCheck`; "near" is dropped upstream so it never renders here). */
  budgetVerdict?: PartnershipCompVerdict
}) {
  const budgetParts: string[] = []
  if (seeker.max_buy_in) budgetParts.push(`${formatPrice(seeker.max_buy_in)} buy-in`)
  if (seeker.max_monthly) budgetParts.push(`${formatPrice(seeker.max_monthly)}/mo`)

  const aircraftSummary = [
    seeker.preferred_makes?.join(', ') || null,
    seeker.preferred_models || null,
  ].filter(Boolean).join(' · ') || (seeker.aircraft_category ? CATEGORY_LABELS[seeker.aircraft_category] : 'Any aircraft')

  const fresh = isNew(seeker.created_at)
  const listed = listedAgo(seeker.created_at)

  return (
    <Link
      href={`/partnerships/seeking/${seeker.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Pilot header — aviator avatar (seeded by id) + anonymized name */}
          <div className="mb-3 flex items-center gap-2.5">
            <AviatorAvatar seed={seeker.id} size={42} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {anonymizeName(seeker.contact_name) || 'A pilot'}
              </p>
              <p className="text-xs text-slate-400">Looking to join a partnership</p>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {fresh && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <Sparkles className="h-3 w-3" />
                New
              </span>
            )}
            {seeker.total_hours && (
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                {seeker.total_hours} hrs
              </span>
            )}
            {seeker.ratings_held && seeker.ratings_held.slice(0, 3).map((r) => (
              <span key={r} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                {r}
              </span>
            ))}
            {budgetVerdict?.kind === 'below' && (
              <span
                className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
                title={`vs. expected buy-in for this share size (${formatPrice(budgetVerdict.median)})`}
              >
                <LineChart className="h-3 w-3" />
                Budget may be tight · {formatPriceK(budgetVerdict.median)} typical · {budgetVerdict.count} comps
              </span>
            )}
            {budgetVerdict?.kind === 'above' && (
              <span
                className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                title={`vs. expected buy-in for this share size (${formatPrice(budgetVerdict.median)})`}
              >
                <LineChart className="h-3 w-3" />
                Budget comfortably above typical · {formatPriceK(budgetVerdict.median)} · {budgetVerdict.count} comps
              </span>
            )}
          </div>

          <h3 className="truncate text-base font-semibold text-slate-900">{seeker.title}</h3>

          {seeker.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{seeker.description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <strong className="font-semibold text-slate-700">{seeker.home_airport}</strong>
              {seeker.city && ` · ${seeker.city}, ${seeker.state}`}
              {seeker.willing_to_travel_nm && ` (${travelLabel(seeker.willing_to_travel_nm)})`}
            </span>
            <span className="flex items-center gap-1">
              <Search className="h-3.5 w-3.5" />
              {aircraftSummary}
            </span>
            {seeker.hours_per_month && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                ~{seeker.hours_per_month} hrs/mo
              </span>
            )}
          </div>
        </div>

        {/* Budget summary */}
        {budgetParts.length > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-slate-400">Budget up to</p>
            {seeker.max_buy_in && (
              <p className="text-lg font-bold text-slate-900">{formatPrice(seeker.max_buy_in)}</p>
            )}
            {seeker.max_monthly && (
              <p className="text-sm text-slate-500">{formatPrice(seeker.max_monthly)}<span className="text-xs">/mo</span></p>
            )}
          </div>
        )}
      </div>

      {listed && (
        <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3 text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />
          {listed}
        </div>
      )}
    </Link>
  )
}
