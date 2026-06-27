'use client'

import { useRef, useState } from 'react'
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
 * Airport autocomplete for posting forms. An uncontrolled <input name="..."> so it
 * works seamlessly with useFormDraft (DOM-based save/restore) and fillFormField
 * (AI prefill via DOM event dispatch). Shows a suggestion dropdown as the user types
 * a city, IATA, or partial ICAO; picking a suggestion sets the input value to the
 * ICAO code and clears the dropdown. Direct ICAO entry (4+ uppercase alphanum chars)
 * suppresses the query to avoid noise after AI prefill.
 */
export default function AirportFormInput({
  name,
  required,
  defaultValue = '',
  placeholder = 'City, IATA, or ICAO (e.g. Austin, AUS, KAUS)',
  className,
}: {
  name: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [suggestions, setSuggestions] = useState<Airport[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function query(raw: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    const q = raw.trim()
    // Suppress query when empty or when value is already a complete ICAO-format code
    // (4 alphanum chars like KAUS, KPAO). Avoids noise after AI prefill or direct ICAO entry.
    if (q.length < 2 || /^[A-Z0-9]{4}$/i.test(q)) {
      setSuggestions([])
      return
    }
    const supabase = createClient()
    timerRef.current = setTimeout(async () => {
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
        .sort((x: { score: number }, y: { score: number }) => x.score - y.score)
        .slice(0, 6)
        .map((r: { a: Airport }) => r.a)
      setSuggestions(ranked)
      setActiveIdx(-1)
    }, 200)
  }

  function pick(icao: string) {
    setSuggestions([])
    setActiveIdx(-1)
    const el = inputRef.current
    if (!el) return
    el.value = icao
    // Dispatch native input event so useFormDraft picks up the change for autosave.
    el.dispatchEvent(new Event('input', { bubbles: true }))
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
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      pick((suggestions[activeIdx >= 0 ? activeIdx : 0]).icao)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100',
          className
        )}
        onChange={e => query(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { setSuggestions([]); setActiveIdx(-1) }}
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
                onClick={() => pick(a.icao)}
                className={cn(
                  'flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm transition-colors',
                  i === activeIdx ? 'bg-sky-50 text-sky-700' : 'hover:bg-slate-50'
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
