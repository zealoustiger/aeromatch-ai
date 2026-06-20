'use client'

import Link from 'next/link'
import { GitCompare, X } from 'lucide-react'
import { useCompareOptional, MAX_COMPARE } from './CompareProvider'

/**
 * Fixed bottom bar that appears once the user has selected listings to compare
 * on /partnerships or /aircraft. Shows the chosen listings (chips with remove),
 * a clear-all control, and a "Compare (N)" button linking to
 * /compare?type=<type>&ids=...
 *
 * Hidden until at least one listing is selected (and until client-ready, to
 * avoid an SSR/hydration flash). Needs ≥2 to actually compare; with exactly 1 it
 * still shows so the user sees their selection + a hint to pick one more. The
 * tray is implicitly scoped to a single listing type (the provider enforces it).
 */
export default function CompareTray() {
  const compare = useCompareOptional()
  if (!compare || !compare.ready || compare.count === 0) return null

  const { items, count, type, remove, clear } = compare
  const canCompare = count >= 2
  const href = `/compare?type=${type ?? 'partnership'}&ids=${items
    .map((it) => encodeURIComponent(it.id))
    .join(',')}`

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.10)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        {/* Selected chips */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          <span className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-700 sm:flex">
            <GitCompare className="h-4 w-4 text-sky-500" />
            Compare
          </span>
          <ul className="flex items-center gap-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex max-w-[180px] shrink-0 items-center gap-1.5 rounded-full bg-sky-50 py-1 pl-3 pr-1.5 text-xs font-medium text-sky-800 ring-1 ring-sky-200"
              >
                <span className="truncate">{it.label}</span>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label={`Remove ${it.label} from comparison`}
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-sky-600 hover:bg-sky-200 hover:text-sky-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
          <span className="shrink-0 text-xs text-slate-400">
            {count}/{MAX_COMPARE}
          </span>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={clear}
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            Clear
          </button>
          {canCompare ? (
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              <GitCompare className="h-4 w-4" />
              Compare ({count})
            </Link>
          ) : (
            <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
              Pick one more to compare
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
