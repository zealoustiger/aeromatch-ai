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

type AirportWithCoords = Airport & { lat: number; lng: number }

const EARTH_RADIUS_MI = 3958.8
const toRad = (deg: number) => (deg * Math.PI) / 180

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(a))
}

/** Bounding-box + client-side haversine nearest lookup (no PostGIS/earthdistance
 * extension enabled on this DB). Widens the box once if nothing is found nearby. */
async function findNearestAirport(lat: number, lng: number): Promise<AirportWithCoords | null> {
  const supabase = createClient()
  for (const latDelta of [3, 10]) {
    const lonDelta = Math.min(30, latDelta / Math.max(Math.cos(toRad(lat)), 0.15))
    const { data } = await supabase
      .from('airports')
      .select('icao,iata,name,city,state,type,lat,lng')
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lonDelta)
      .lte('lng', lng + lonDelta)
      .limit(500)
    const candidates = ((data ?? []) as AirportWithCoords[]).filter((a) => !SKIP_TYPES.has(a.type ?? ''))
    if (candidates.length === 0) continue
    let best: AirportWithCoords | null = null
    let bestDist = Infinity
    for (const a of candidates) {
      const dist = haversineMiles(lat, lng, a.lat, a.lng)
      if (dist < bestDist) {
        bestDist = dist
        best = a
      }
    }
    if (best) return best
  }
  return null
}

const TYPE_RANK: Record<string, number> = { large_airport: 0, medium_airport: 1, small_airport: 2 }
const SKIP_TYPES = new Set(['closed', 'heliport', 'seaplane_base', 'balloonport'])

/**
 * Airport autocomplete for posting forms. An uncontrolled <input name="..."> so it
 * works seamlessly with useFormDraft (DOM-based save/restore) and fillFormField
 * (AI prefill via DOM event dispatch). Shows a suggestion dropdown as the user types
 * a city, IATA, or partial ICAO; picking a suggestion sets the input value to the
 * ICAO code and clears the dropdown. Direct ICAO entry (4 uppercase alphanum chars)
 * suppresses the fuzzy dropdown to avoid noise after AI prefill, but still runs a
 * debounced exact-match lookup so a typo'd/nonexistent code is flagged inline
 * instead of only surfacing after a full-form submit round-trip.
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
  const [isInvalid, setIsInvalid] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function query(raw: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    const q = raw.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    // A complete ICAO-format code (4 alphanum chars like KAUS, KPAO): skip the fuzzy
    // dropdown (avoids noise after AI prefill or direct entry), but confirm it's real.
    if (/^[A-Z0-9]{4}$/i.test(q)) {
      setSuggestions([])
      const supabase = createClient()
      timerRef.current = setTimeout(async () => {
        const { data, error } = await supabase
          .from('airports')
          .select('icao')
          .eq('icao', q.toUpperCase())
          .maybeSingle()
        if (error) return
        setIsInvalid(!data)
      }, 400)
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
    setIsInvalid(false)
    const el = inputRef.current
    if (!el) return
    el.value = icao
    // Dispatch native input event so useFormDraft picks up the change for autosave.
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  function useMyLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocError("Location isn't supported by this browser — enter it manually.")
      return
    }
    setLocating(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const nearest = await findNearestAirport(pos.coords.latitude, pos.coords.longitude)
          if (nearest) {
            pick(nearest.icao)
          } else {
            setLocError("Couldn't find an airport near you — enter it manually.")
          }
        } catch {
          setLocError("Couldn't find an airport near you — enter it manually.")
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocError('Location permission denied — enter it manually.')
        setLocating(false)
      },
      { timeout: 8000, maximumAge: 300_000 }
    )
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
        pattern="[A-Za-z0-9]{4}"
        title="Select an airport from the list, or enter its 4-letter ICAO code."
        aria-invalid={isInvalid}
        className={cn(
          'w-full rounded-lg border py-2.5 pl-3 pr-10 text-base sm:text-sm placeholder-slate-400 transition focus:outline-none focus:ring-2',
          isInvalid
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
            : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100',
          className
        )}
        onChange={e => { setIsInvalid(false); setLocError(null); query(e.target.value) }}
        onKeyDown={handleKeyDown}
        onBlur={() => { setSuggestions([]); setActiveIdx(-1) }}
        onInvalid={e => {
          e.preventDefault()
          setIsInvalid(true)
          e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })
          e.currentTarget.focus()
        }}
      />
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        aria-label="Use my current location"
        title="Use my current location"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-base leading-none text-sky-600 transition hover:bg-sky-50 disabled:cursor-wait disabled:opacity-60"
      >
        {locating ? '⏳' : '📍'}
      </button>
      {isInvalid && (
        <p className="mt-1 text-xs text-rose-500">
          Select an airport from the list, or enter its 4-letter code (e.g. KAUS).
        </p>
      )}
      {!isInvalid && locError && (
        <p className="mt-1 text-xs text-amber-600">{locError}</p>
      )}
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
