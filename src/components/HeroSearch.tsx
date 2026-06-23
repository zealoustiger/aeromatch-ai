'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, MapPin, Plane, Users, PlaneTakeoff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import SignUpGate from './SignUpGate'

const RADIUS_OPTIONS = [25, 50, 100, 150, 200]

type Airport = { icao: string; iata: string | null; name: string; city: string | null; state: string | null; type: string | null }

// Rank suggestions so real airports beat tiny private strips: exact ICAO/IATA
// prefix first, then by size (large → small), then commercial (has IATA).
const TYPE_RANK: Record<string, number> = { large_airport: 0, medium_airport: 1, small_airport: 2 }
const SKIP_TYPES = new Set(['closed', 'heliport', 'seaplane_base', 'balloonport'])

export default function HeroSearch() {
  const router = useRouter()
  // Which marketplace the hero searches. Defaults to planes-for-sale (the broader,
  // public, no-gate experience); "partnerships" keeps the airport/radius behavior.
  const [searchType, setSearchType] = useState<'partnerships' | 'forsale'>('forsale')
  const [forSaleQuery, setForSaleQuery] = useState('')

  // Auth state — read-only, mirrors SaveListingButton. Signed-in users skip the gate.
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Partnerships: one smart box. Type a city/airport → pick from autocomplete,
  // which adds it as a chip (multi-airport stays possible, no ICAO memorizing). ──
  const [picked, setPicked] = useState<Airport[]>([])
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Airport[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [radiusMiles, setRadiusMiles] = useState(100)
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // Debounced airport lookup against the public `airports` table.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    const supabase = createClient()
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from('airports')
        .select('icao,iata,name,city,state,type')
        .or(`icao.ilike.${q}*,iata.ilike.${q}*,city.ilike.${q}*,name.ilike.*${q}*`)
        .limit(25)
      const ranked = (data ?? [])
        .filter((a: Airport) => !SKIP_TYPES.has(a.type ?? '') && !picked.some((p) => p.icao === a.icao))
        .map((a: Airport) => {
          const Q = q.toUpperCase()
          const exact = a.icao?.toUpperCase().startsWith(Q) || a.iata?.toUpperCase().startsWith(Q)
          return { a, score: (exact ? 0 : 10) + (TYPE_RANK[a.type ?? ''] ?? 4) + (a.iata ? 0 : 1) }
        })
        .sort((x, y) => x.score - y.score)
        .slice(0, 6)
        .map((r) => r.a)
      setSuggestions(ranked)
      setActiveIdx(-1)
    }, 200)
    return () => clearTimeout(handle)
  }, [query, picked])

  // Close the suggestion list on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setSuggestions([])
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function pick(a: Airport) {
    setPicked((prev) => (prev.some((p) => p.icao === a.icao) ? prev : [...prev, a]))
    setQuery('')
    setSuggestions([])
    setActiveIdx(-1)
    inputRef.current?.focus()
  }

  function removePicked(icao: string) {
    setPicked((prev) => prev.filter((p) => p.icao !== icao))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) pick(suggestions[activeIdx])
      else if (suggestions[0]) pick(suggestions[0])
      else if (picked.length) handleSearch()
    } else if (e.key === 'Backspace' && query === '' && picked.length) {
      setPicked((prev) => prev.slice(0, -1))
    }
  }

  // ── Search ──
  function handleSearch() {
    const codes = picked.map((p) => p.icao)
    if (codes.length === 0) return
    // One airport → the "near here within N mi" experience; several → exact set.
    const params = codes.length === 1 ? `airport=${codes[0]}&radius=${radiusMiles}` : `airports=${codes.join(',')}`
    track('search_performed', {
      mode: codes.length === 1 ? 'radius' : 'airports',
      airports: codes.join(','),
      radius_miles: codes.length === 1 ? radiusMiles : undefined,
    })
    if (user) {
      router.push(`/partnerships?${params}`)
      return
    }
    setPendingParams(params)
    setShowGate(true)
  }

  // Sign-up gate
  const [showGate, setShowGate] = useState(false)
  const [pendingParams, setPendingParams] = useState('')

  // ── Planes-for-sale free-text search (public /aircraft, no gate) ──
  function searchForSale(term: string) {
    const q = term.trim()
    track('search_performed', { mode: 'forsale', q })
    router.push(q ? `/aircraft?q=${encodeURIComponent(q)}` : '/aircraft')
  }
  const FORSALE_EXAMPLES = ['Cessna 172', 'Cirrus SR22', 'Glass panel']

  return (
    <>
      <div className="w-full max-w-2xl">
        {/* Marketplace tabs — Partnerships ↔ Planes for sale */}
        <div className="mb-5 flex justify-center">
          <div className="inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/20 backdrop-blur-sm">
            {([['forsale', Plane, 'Planes for sale'], ['partnerships', Users, 'Partnerships']] as const).map(
              ([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSearchType(key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                    searchType === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-200 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {searchType === 'partnerships' && (
          <>
            {/* One smart box: location autocomplete + inline radius + search. */}
            <div ref={boxRef} className="relative flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <div
                  className="flex min-h-[52px] cursor-text flex-wrap items-center gap-1.5 rounded-xl bg-white px-3 py-2 shadow-lg ring-2 ring-transparent focus-within:ring-sky-400"
                  onClick={() => inputRef.current?.focus()}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  {picked.map((a) => (
                    <span
                      key={a.icao}
                      className="flex items-center gap-1 rounded-md bg-sky-100 py-0.5 pl-2 pr-1 text-sm font-semibold text-sky-800"
                    >
                      <span className="font-mono">{a.icao}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removePicked(a.icao) }}
                        className="rounded p-0.5 hover:bg-sky-200"
                        aria-label={`Remove ${a.icao}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={picked.length === 0 ? 'Home airport or city — e.g. Austin or KAUS' : 'Add another…'}
                    className="min-w-[140px] flex-1 bg-transparent py-1 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                  {/* Inline radius — only meaningful for a single airport. */}
                  {picked.length <= 1 && (
                    <select
                      value={radiusMiles}
                      onChange={(e) => setRadiusMiles(Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto shrink-0 rounded-md border-l border-slate-200 bg-transparent py-1 pl-2 pr-1 text-xs font-medium text-slate-600 focus:outline-none"
                      aria-label="Search radius"
                    >
                      {RADIUS_OPTIONS.map((r) => (
                        <option key={r} value={r}>within {r} mi</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Autocomplete dropdown */}
                {suggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl">
                    {suggestions.map((a, i) => (
                      <li key={a.icao}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); pick(a) }}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={cn(
                            'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors',
                            i === activeIdx ? 'bg-sky-50' : 'hover:bg-slate-50'
                          )}
                        >
                          <PlaneTakeoff className={cn('h-4 w-4 shrink-0', i === activeIdx ? 'text-sky-600' : 'text-slate-400')} />
                          <span className="flex-1 truncate text-sm text-slate-900">
                            {a.name}
                            {a.city && <span className="text-slate-500"> · {[a.city, a.state].filter(Boolean).join(', ')}</span>}
                          </span>
                          <span className="font-mono text-xs text-slate-500">{a.icao}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={handleSearch}
                disabled={picked.length === 0}
                className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 text-base font-semibold text-white shadow-lg transition-all hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <Search className="h-5 w-5" />
                Search
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-slate-300">
              Start typing an airport or city, then pick from the list.
            </p>
          </>
        )}

        {searchType === 'forsale' && (
          <>
            {/* Free-text planes-for-sale search → public /aircraft?q= (no gate). */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={forSaleQuery}
                  onChange={(e) => setForSaleQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') searchForSale(forSaleQuery) }}
                  placeholder="Search planes for sale — make, model, or keyword"
                  className="h-[52px] w-full rounded-xl bg-white pl-9 pr-3 text-sm text-slate-900 shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <button
                onClick={() => searchForSale(forSaleQuery)}
                className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 text-base font-semibold text-white shadow-lg transition-all hover:bg-sky-500 sm:w-auto"
              >
                <Search className="h-5 w-5" />
                Search
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-300">Try:</span>
              {FORSALE_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => searchForSale(ex)}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 ring-1 ring-white/20 transition-colors hover:bg-white/20"
                >
                  {ex}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {showGate && <SignUpGate searchParams={pendingParams} onClose={() => setShowGate(false)} />}
    </>
  )
}
