import Link from 'next/link'
import { X } from 'lucide-react'
import { STATE_NAMES } from '@/lib/seo'
import { groupModelVariants } from '@/lib/modelGroups'
import AlertMeChip from '@/components/AlertMeChip'

type Params = Record<string, string | undefined>
const BASE = '/partnerships/seeking'

const SHARE_LABELS: Record<string, string> = { '1/2': '1/2 Share', '1/3': '1/3 Share', '1/4': '1/4 Share' }

function buildHref(params: Params, mutate: (p: URLSearchParams) => void): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v)
  mutate(sp)
  const qs = sp.toString()
  return qs ? `${BASE}?${qs}` : BASE
}

interface Chip { key: string; label: string; href: string }

/** Removable chips for the active /partnerships/seeking filters (server-rendered,
 *  no client JS). Mirrors PartnershipActiveFilterChips. */
export default function SeekerActiveFilterChips({
  params,
  models,
  alertContext,
  alertSourcePath,
}: {
  params: Params
  /** Model-token option list (already make-scoped by the caller) — when present,
   *  fully-selected variant groups collapse to a single "{base} (all)" chip
   *  (mirrors PartnershipActiveFilterChips); omit and chips stay per-model. */
  models?: string[]
  /** Same context/source-path the page's footer `AlertSignup` already receives —
   *  threaded through so the one-tap 🔔 chip below subscribes to the exact same
   *  search (mirrors PartnershipActiveFilterChips). */
  alertContext?: string
  alertSourcePath?: string
}) {
  const chips: Chip[] = []
  const num = (raw: string | undefined): number | null => {
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  // Home airports — the multi-select `airports` param renders one removable chip
  // per code (removing one rewrites `airports` without it). Takes precedence over
  // the legacy single `airport`(+radius) chip, kept only for back-compat with old
  // links / saved searches that still carry `airport`.
  const airportCodes = (params.airports ?? '')
    .split(',')
    .map((a) => a.trim().toUpperCase())
    .filter(Boolean)
  if (airportCodes.length > 0) {
    const soleRadius = airportCodes.length === 1 ? num(params.radius) : null
    for (const code of airportCodes) {
      chips.push({
        key: `airport:${code}`,
        label: soleRadius ? `Within ${soleRadius} mi of ${code}` : code,
        href: buildHref(params, (p) => {
          const rest = airportCodes.filter((c) => c !== code)
          if (rest.length) p.set('airports', rest.join(','))
          else { p.delete('airports'); p.delete('radius') }
        }),
      })
    }
  } else {
    const airport = params.airport?.trim()
    if (airport) {
      const radius = num(params.radius)
      chips.push({
        key: 'airport',
        label: radius ? `Within ${radius} mi of ${airport.toUpperCase()}` : airport.toUpperCase(),
        href: buildHref(params, (p) => { p.delete('airport'); p.delete('radius') }),
      })
    }
  }

  const state = params.state?.trim()
  if (state) chips.push({ key: 'state', label: STATE_NAMES[state.toUpperCase()] ?? state, href: buildHref(params, (p) => p.delete('state')) })

  // Make / Rating are multi-select (comma-joined) → one removable chip per value,
  // each link dropping only that value and leaving the rest of the list applied.
  const splitMulti = (raw: string | undefined): string[] =>
    (raw ?? '').split(',').map((v) => v.trim()).filter(Boolean)

  const dropFromList = (key: string, value: string) => (p: URLSearchParams) => {
    const next = splitMulti(p.get(key) ?? undefined).filter((v) => v !== value)
    if (next.length) p.set(key, next.join(','))
    else p.delete(key)
  }

  for (const make of splitMulti(params.make)) {
    chips.push({ key: `make:${make}`, label: `Wants ${make}`, href: buildHref(params, dropFromList('make', make)) })
  }

  // Model — multi-select: one removable chip per selected token. When a
  // multi-variant group's members are ALL selected, collapse them into a single
  // "{base} (all)" chip (mirrors PartnershipActiveFilterChips); partially selected
  // groups, singletons, and tokens absent from `models` stay per-token.
  const selectedModelsList = splitMulti(params.model)
  const selectedModelSet = new Set(selectedModelsList)
  const collapsedGroups: { key: string; members: string[] }[] = []
  const memberToGroupKey = new Map<string, string>()
  if (models) {
    for (const g of groupModelVariants(models)) {
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
      label: `Wants ${g.key} (all)`,
      href: buildHref(params, (p) => {
        const next = selectedModelsList.filter((m) => !g.members.includes(m))
        if (next.length) p.set('model', next.join(','))
        else p.delete('model')
      }),
    })
  }
  for (const model of selectedModelsList) {
    if (memberToGroupKey.has(model)) continue // covered by a collapsed parent chip
    chips.push({ key: `model:${model}`, label: `Wants ${model}`, href: buildHref(params, dropFromList('model', model)) })
  }

  for (const rating of splitMulti(params.rating)) {
    chips.push({ key: `rating:${rating}`, label: `${rating}-rated`, href: buildHref(params, dropFromList('rating', rating)) })
  }

  const minHours = num(params.min_hours)
  if (minHours) chips.push({ key: 'min_hours', label: `${minHours}+ hours`, href: buildHref(params, (p) => p.delete('min_hours')) })

  const shareType = params.share_type?.trim()
  if (shareType) chips.push({ key: 'share_type', label: SHARE_LABELS[shareType] ?? shareType, href: buildHref(params, (p) => p.delete('share_type')) })

  if (chips.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Filters</span>
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
        <Link href={BASE} className="ml-1 text-xs font-medium text-slate-400 underline-offset-2 transition-colors hover:text-slate-600 hover:underline">
          Clear all
        </Link>
      )}
      {alertSourcePath && (
        <AlertMeChip context={alertContext} sourcePath={alertSourcePath} source="filter_toolbar_seeking" />
      )}
    </div>
  )
}
