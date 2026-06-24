import Link from 'next/link'
import { X } from 'lucide-react'
import { STATE_NAMES } from '@/lib/seo'

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
export default function SeekerActiveFilterChips({ params }: { params: Params }) {
  const chips: Chip[] = []
  const num = (raw: string | undefined): number | null => {
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const airport = params.airport?.trim()
  if (airport) {
    const radius = num(params.radius)
    chips.push({
      key: 'airport',
      label: radius ? `Within ${radius} mi of ${airport.toUpperCase()}` : airport.toUpperCase(),
      href: buildHref(params, (p) => { p.delete('airport'); p.delete('radius') }),
    })
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
    </div>
  )
}
