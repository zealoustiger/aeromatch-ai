import Link from 'next/link'
import { X } from 'lucide-react'
import { STATE_NAMES } from '@/lib/seo'
import { groupModelVariants } from '@/lib/modelGroups'
import type { AircraftFacets } from '@/lib/aircraft-facets'

type Params = Record<string, string | undefined>

const BASE = '/aircraft'

// Build an href to /aircraft that mirrors the active filters, applies `mutate`
// (the chip's removal), and resets pagination — removing/altering a filter should
// always return to page 1. Internal/non-filter keys never leak in because we only
// seed from the live params and drop `page`.
function buildHref(params: Params, mutate: (p: URLSearchParams) => void): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (!value || key === 'page') continue
    sp.set(key, value)
  }
  mutate(sp)
  const qs = sp.toString()
  return qs ? `${BASE}?${qs}` : BASE
}

function parseList(raw: string | undefined): string[] {
  return (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

// Selected listing-quality grades, canonical A,B,C order. Prefers the multi-select
// `grade` param; falls back to a legacy single `min_grade` floor (A → [A]; B → [A,B])
// so old links / saved searches still surface the right chips.
function parseGrades(params: Params): string[] {
  const raw = parseList(params.grade)
    .map((g) => g.toUpperCase())
    .filter((g) => ['A', 'B', 'C'].includes(g))
  if (raw.length) return ['A', 'B', 'C'].filter((g) => raw.includes(g))
  if (params.min_grade === 'A') return ['A']
  if (params.min_grade === 'B') return ['A', 'B']
  return []
}

interface Chip {
  key: string
  label: string
  href: string
}

/**
 * Removable chips for the currently-active `/aircraft` filters, shown above the
 * results. Pure server component — each chip is a `<Link>` to /aircraft with that
 * one filter stripped, so there's no client JS / hydration. `sort` and `page` are
 * deliberately not chips (ordering / pagination, not result-set filters).
 */
export default function ActiveFilterChips({
  params,
  facets,
}: {
  params: Params
  /** Make/model facets — when present, fully-selected variant groups collapse to a
   *  single "{base} (all)" chip (mirrors the sidebar rollup); omit and chips stay
   *  per-model. */
  facets?: AircraftFacets
}) {
  const chips: Chip[] = []

  const num = (raw: string | undefined): number | null => {
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  const dollars = (n: number) => `$${n.toLocaleString('en-US')}`
  const hrs = (n: number) => `${n.toLocaleString('en-US')} hrs`

  // Make — removing it also clears `model` (mirrors the filter sidebar).
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

  // Model chips. By default one chip per selected model. When facets are available,
  // a multi-variant group whose members are ALL selected collapses to a single
  // "{base} (all)" chip (removing it strips every member) — mirroring the sidebar
  // rollup so picking "SR20 (all)" doesn't litter the header with six variant chips.
  // Partially-selected groups, singletons, and models absent from facets stay per-model.
  const models = parseList(params.model)
  const selectedSet = new Set(models)

  // Map each selected model → the fully-selected group it belongs to (if any), so we
  // emit one parent chip per such group and skip its members below.
  const collapsedGroups: { key: string; members: string[] }[] = []
  const memberToGroupKey = new Map<string, string>()
  if (facets && make) {
    const options = facets.modelsByMake[make] ?? []
    for (const g of groupModelVariants(options)) {
      if (g.members.length < 2) continue // singletons render as plain chips
      if (g.members.every((mem) => selectedSet.has(mem))) {
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
        const next = models.filter((x) => !g.members.includes(x))
        if (next.length) p.set('model', next.join(','))
        else p.delete('model')
      }),
    })
  }

  for (const m of models) {
    if (memberToGroupKey.has(m)) continue // covered by a collapsed parent chip
    chips.push({
      key: `model:${m}`,
      label: m,
      href: buildHref(params, (p) => {
        const next = models.filter((x) => x !== m)
        if (next.length) p.set('model', next.join(','))
        else p.delete('model')
      }),
    })
  }

  // Smart-search family model (model_like, e.g. `sr22` → "SR22")
  const modelLike = params.model_like?.trim()
  if (modelLike) {
    chips.push({
      key: 'model_like',
      label: modelLike.toUpperCase(),
      href: buildHref(params, (p) => p.delete('model_like')),
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

  // Airport — show the ICAO code as a chip ("Near KSFO"). Removing it clears only
  // the airport param; the state filter (if also active) is left intact.
  const airport = params.airport?.trim().toUpperCase()
  if (airport) {
    chips.push({
      key: 'airport',
      label: `Near ${airport}`,
      href: buildHref(params, (p) => p.delete('airport')),
    })
  }

  // Price range
  const minPrice = num(params.min_price)
  const maxPrice = num(params.max_price)
  if (minPrice || maxPrice) {
    const label =
      minPrice && maxPrice
        ? `${dollars(minPrice)}–${dollars(maxPrice)}`
        : maxPrice
          ? `Under ${dollars(maxPrice)}`
          : `Over ${dollars(minPrice as number)}`
    chips.push({
      key: 'price',
      label,
      href: buildHref(params, (p) => {
        p.delete('min_price')
        p.delete('max_price')
      }),
    })
  }

  // Year range
  const minYear = num(params.min_year)
  const maxYear = num(params.max_year)
  if (minYear || maxYear) {
    const label =
      minYear && maxYear
        ? `${minYear}–${maxYear}`
        : minYear
          ? `${minYear} or newer`
          : `Up to ${maxYear}`
    chips.push({
      key: 'year',
      label,
      href: buildHref(params, (p) => {
        p.delete('min_year')
        p.delete('max_year')
      }),
    })
  }

  // Total time (airframe hours) range
  const minTt = num(params.min_tt)
  const maxTt = num(params.max_tt)
  if (minTt || maxTt) {
    const label =
      minTt && maxTt
        ? `${minTt.toLocaleString('en-US')}–${hrs(maxTt)}`
        : maxTt
          ? `Under ${hrs(maxTt)}`
          : `Over ${hrs(minTt as number)}`
    chips.push({
      key: 'tt',
      label,
      href: buildHref(params, (p) => {
        p.delete('min_tt')
        p.delete('max_tt')
      }),
    })
  }

  // Listing quality — one chip per selected grade. Only a real subset (1–2 grades)
  // narrows anything; all three == no filter, so we show no grade chips then.
  const grades = parseGrades(params)
  if (grades.length >= 1 && grades.length <= 2) {
    for (const g of grades) {
      chips.push({
        key: `grade:${g}`,
        label: `Grade ${g}`,
        href: buildHref(params, (p) => {
          const next = grades.filter((x) => x !== g)
          p.delete('min_grade') // drop the legacy floor so it can't re-expand the set
          if (next.length) p.set('grade', next.join(','))
          else p.delete('grade')
        }),
      })
    }
  }

  // Keyword
  const q = params.q?.trim()
  if (q) {
    chips.push({
      key: 'q',
      label: `“${q}”`,
      href: buildHref(params, (p) => p.delete('q')),
    })
  }

  // Price drops toggle
  if (params.drops) {
    chips.push({
      key: 'drops',
      label: 'Price drops',
      href: buildHref(params, (p) => p.delete('drops')),
    })
  }

  // "Show without photos" toggle — off-by-default expand of the catalog.
  if (params.include_no_photo) {
    chips.push({
      key: 'include_no_photo',
      label: 'Inc. no-photo',
      href: buildHref(params, (p) => p.delete('include_no_photo')),
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
