'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Airport = {
  icao: string
  iata: string | null
  name: string
  city: string | null
  state: string | null
  type: string | null
}

const TYPE_RANK: Record<string, number> = { large_airport: 0, medium_airport: 1, small_airport: 2 }
const SKIP_TYPES = new Set(['closed', 'heliport', 'seaplane_base', 'balloonport'])

/**
 * Airport picker with city/name/ICAO autocomplete. Queries the public `airports`
 * table (debounced 200ms), ranks by size + commercial status.
 *
 * Two modes:
 *  - single (clearAfterSelect=false, default): keeps the picked ICAO in the input;
 *    blur commits whatever is typed as a raw code (allows direct ICAO entry too).
 *  - chip-add (clearAfterSelect=true): clears the input after each pick so the
 *    caller can add the ICAO as a chip without disrupting the next entry.
 *
 * Clicking a suggestion uses onMouseDown+e.preventDefault() to keep focus on the
 * input (avoids triggering blur before the click fires — the standard pattern).
 */
export default function AirportAutocompleteInput({
  placeholder = 'Airport, city, or ICAO code',
  initialValue = '',
  onSelect,
  clearAfterSelect = false,
  className,
}: {
  placeholder?: string
  /** Seed the text field (e.g. from URL params). Use a `key` prop to remount when the URL value changes. */
  initialValue?: string
  /** Called with the chosen ICAO string (or '' to clear). */
  onSelect: (icao: string) => void
  /** Chip-add mode: clear the input after each pick. */
  clearAfterSelect?: boolean
  className?: string
}) {
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Airport[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setSuggestions([]); return }
    const supabase = createClient()
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from('airports')
        .select('icao,iata,name,city,state,type')
        .or(`icao.ilike.${q}*,iata.ilike.${q}*,city.ilike.${q}*,name.ilike.*${q}*`)
        .limit(25)
      const Q = q.toUpperCase()
      const ranked = (data ?? [])
        .filter((a: Airport) => !SKIP_TYPES.has(a.type ?? ''))
        .map((a: Airport) => {
          const exact = a.icao?.toUpperCase().startsWith(Q) || a.iata?.toUpperCase().startsWith(Q)
          return { a, score: (exact ? 0 : 10) + (TYPE_RANK[a.type ?? ''] ?? 4) + (a.iata ? 0 : 1) }
        })
        .sort((x, y) => x.score - y.score)
        .slice(0, 6)
        .map(r => r.a)
      setSuggestions(ranked)
      setActiveIdx(-1)
    }, 200)
    return () => clearTimeout(handle)
  }, [query])

  function pick(a: Airport) {
    setSuggestions([])
    setActiveIdx(-1)
    setQuery(clearAfterSelect ? '' : a.icao)
    onSelect(a.icao)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Escape') {
      setSuggestions([])
      setActiveIdx(-1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        pick(suggestions[activeIdx])
      } else if (suggestions.length > 0) {
        pick(suggestions[0])
      } else {
        const icao = query.toUpperCase().trim()
        if (icao.length >= 2) {
          setSuggestions([])
          if (clearAfterSelect) setQuery('')
          onSelect(icao)
        }
      }
    }
  }

  function handleBlur() {
    setSuggestions([])
    setActiveIdx(-1)
    // Single-value mode only: commit typed text on blur (empty → clears filter).
    if (!clearAfterSelect) {
      onSelect(query.toUpperCase().trim())
    }
  }

  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        autoComplete="off"
        spellCheck={false}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
      {suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((a, i) => (
            <li key={a.icao} role="option" aria-selected={i === activeIdx}>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(a)}
                className={cn(
                  'flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm transition-colors',
                  i === activeIdx ? 'bg-sky-50 text-sky-700' : 'hover:bg-slate-50',
                )}
              >
                <span className="shrink-0 font-mono font-semibold text-slate-800">{a.icao}</span>
                <span className="min-w-0 truncate text-xs text-slate-500">
                  {[a.city, a.state].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
