import Link from 'next/link'
import { X } from 'lucide-react'
import { STATE_NAMES } from '@/lib/seo'
import { groupModelVariants } from '@/lib/modelGroups'
import type { PartnershipFacets } from '@/lib/partnershipsQuery'

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
export default function PartnershipActiveFilterChips({
  params,
  facets,
}: {
  params: Params
  /** Make/model facets — when present, fully-selected variant groups collapse to a
   *  single "{base} (all)" chip (mirrors the sidebar rollup); omit and chips stay
   *  per-model. */
  facets?: PartnershipFacets
}) {
  const chips: Chip[] = []

  const num = (raw: string | undefined): number | null => {
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  const dollars = (n: number) => `$${n.toLocaleString('en-US')}`

  // Home airports — the multi-select `airports` param renders one removable chip
  // per code (removing one rewrites `airports` without it). Takes precedence over
  // the legacy single `airport`+`radius` chip, which is kept only for back-compat
  // with old links / saved searches that still carry `airport`.
  const airportCodes = (params.airports ?? '')
    .split(',')
    .map((a) => a.trim().toUpperCase())
    .filter(Boolean)
  if (airportCodes.length > 0) {
    for (const code of airportCodes) {
      chips.push({
        key: `airport:${code}`,
        label: code,
        href: buildHref(params, (p) => {
          const rest = airportCodes.filter((c) => c !== code)
          if (rest.length) p.set('airports', rest.join(','))
          else p.delete('airports')
        }),
      })
    }
  } else {
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

  // Aircraft make — removing it also drops any model (mirrors /aircraft: a
  // model selection only makes sense scoped to its make).
  const make = params.make?.trim()
  if (make) {
    chips.push({
      key: 'make',
      label: make,
      href: buildHref(params, (p) => {
        p.delete('make')
        p.delete('model')
      }),
    })
  }

  // Aircraft model — multi-select: one removable chip per selected model. When a
  // multi-variant group's members are ALL selected, collapse them into a single
  // "{base} (all)" chip (mirrors /aircraft's ActiveFilterChips rollup); partially
  // selected groups, singletons, and models absent from facets stay per-model.
  const selectedModels = (params.model ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  const selectedModelSet = new Set(selectedModels)

  const collapsedGroups: { key: string; members: string[] }[] = []
  const memberToGroupKey = new Map<string, string>()
  if (facets && make) {
    const options = facets.modelsByMake[make] ?? []
    for (const g of groupModelVariants(options)) {
      if (g.members.length < 2) continue // singletons render as plain chips
      if (g.members.every((mem) => selectedModelSet.has(mem))) {
        collapsedGroups.push(g)
        for (const mem of g.members) memberToGroupKey.set(mem, g.key)
      }
    }
  }

  for (const g of collapsedGroups) {
    chips.push({
      key: `modelgroup:${g.key}`,
      label: `${g.key} (all)`,
      href: buildHref(params, (p) => {
        const next = selectedModels.filter((x) => !g.members.includes(x))
        if (next.length) p.set('model', next.join(','))
        else p.delete('model')
      }),
    })
  }

  for (const model of selectedModels) {
    if (memberToGroupKey.has(model)) continue // covered by a collapsed parent chip
    chips.push({
      key: `model:${model}`,
      label: model,
      href: buildHref(params, (p) => {
        const rest = selectedModels.filter((m) => m !== model)
        if (rest.length) p.set('model', rest.join(','))
        else p.delete('model')
      }),
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
