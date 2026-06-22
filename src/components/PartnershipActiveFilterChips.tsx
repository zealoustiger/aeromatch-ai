import Link from 'next/link'
import { X } from 'lucide-react'
import { STATE_NAMES } from '@/lib/seo'

type Params = Record<string, string | undefined>

const BASE = '/partnerships'

// Human labels for the share-type filter values (mirrors PartnershipFilters).
const SHARE_TYPE_LABELS: Record<string, string> = {
  '1/2': '1/2 Share',
  '1/3': '1/3 Share',
  '1/4': '1/4 Share',
  leaseback: 'Leaseback',
  dry_lease: 'Dry Lease',
}

// Build an href to /partnerships that mirrors the active filters and applies
// `mutate` (the chip's removal). Only seeds from the live params, so internal
// keys never leak in. Partnerships has no pagination param to reset.
function buildHref(params: Params, mutate: (p: URLSearchParams) => void): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue
    sp.set(key, value)
  }
  mutate(sp)
  const qs = sp.toString()
  return qs ? `${BASE}?${qs}` : BASE
}

interface Chip {
  key: string
  label: string
  href: string
}

/**
 * Removable chips for the currently-active `/partnerships` filters, shown above
 * the results. Pure server component (no client JS / hydration) — each chip is a
 * `<Link>` to /partnerships with that one filter stripped. Mirrors the
 * `/aircraft` `ActiveFilterChips`, keyed to the partnership filter params
 * (`airport`+`radius`, `state`, `make`, `share_type`, `max_monthly`, `max_buyin`).
 */
export default function PartnershipActiveFilterChips({ params }: { params: Params }) {
  const chips: Chip[] = []

  const num = (raw: string | undefined): number | null => {
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  const dollars = (n: number) => `$${n.toLocaleString('en-US')}`

  // Home airport — removing it also clears `radius` (radius is meaningless alone).
  const airport = params.airport?.trim()
  if (airport) {
    const radius = num(params.radius)
    chips.push({
      key: 'airport',
      label: radius
        ? `Within ${radius} mi of ${airport.toUpperCase()}`
        : airport.toUpperCase(),
      href: buildHref(params, (p) => {
        p.delete('airport')
        p.delete('radius')
      }),
    })
  }

  // State
  const state = params.state?.trim()
  if (state) {
    chips.push({
      key: 'state',
      label: STATE_NAMES[state.toUpperCase()] ?? state,
      href: buildHref(params, (p) => p.delete('state')),
    })
  }

  // Aircraft make
  const make = params.make?.trim()
  if (make) {
    chips.push({
      key: 'make',
      label: make,
      href: buildHref(params, (p) => p.delete('make')),
    })
  }

  // Share type
  const shareType = params.share_type?.trim()
  if (shareType) {
    chips.push({
      key: 'share_type',
      label: SHARE_TYPE_LABELS[shareType] ?? shareType,
      href: buildHref(params, (p) => p.delete('share_type')),
    })
  }

  // Max monthly cost
  const maxMonthly = num(params.max_monthly)
  if (maxMonthly) {
    chips.push({
      key: 'max_monthly',
      label: `Under ${dollars(maxMonthly)}/mo`,
      href: buildHref(params, (p) => p.delete('max_monthly')),
    })
  }

  // Max buy-in
  const maxBuyin = num(params.max_buyin)
  if (maxBuyin) {
    chips.push({
      key: 'max_buyin',
      label: `Under ${dollars(maxBuyin)} buy-in`,
      href: buildHref(params, (p) => p.delete('max_buyin')),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Filters
      </span>
      {chips.map((c) => (
        <Link
          key={c.key}
          href={c.href}
          aria-label={`Remove filter: ${c.label}`}
          className="group inline-flex max-w-full items-center gap-1 rounded-full border border-sky-200 bg-sky-50 py-1 pl-3 pr-2 text-sm font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
        >
          <span className="truncate">{c.label}</span>
          <X className="h-3.5 w-3.5 shrink-0 text-sky-400 group-hover:text-sky-600" />
        </Link>
      ))}
      {chips.length > 1 && (
        <Link
          href={BASE}
          className="ml-1 text-xs font-medium text-slate-400 underline-offset-2 transition-colors hover:text-slate-600 hover:underline"
        >
          Clear all
        </Link>
      )}
    </div>
  )
}
