'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Search, X, MapPin, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import SignUpGate from './SignUpGate'

const RADIUS_OPTIONS = [25, 50, 100, 150, 200]

export default function HeroSearch() {
  const [mode, setMode] = useState<'airports' | 'radius'>('airports')

  // Multi-airport mode
  const [airports, setAirports] = useState<string[]>([])
  const [airportInput, setAirportInput] = useState('')

  // Radius mode
  const [radiusAirport, setRadiusAirport] = useState('')
  const [radiusMiles, setRadiusMiles] = useState(50)

  // Sign-up gate
  const [showGate, setShowGate] = useState(false)
  const [pendingParams, setPendingParams] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Airport tag helpers ──
  function addAirport(raw: string) {
    const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length >= 3 && code.length <= 4 && !airports.includes(code)) {
      setAirports((prev) => [...prev, code])
    }
    setAirportInput('')
  }

  function removeAirport(code: string) {
    setAirports((prev) => prev.filter((a) => a !== code))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      if (airportInput.trim()) addAirport(airportInput)
    }
    if (e.key === 'Backspace' && airportInput === '' && airports.length > 0) {
      setAirports((prev) => prev.slice(0, -1))
    }
  }

  // ── Search ──
  function handleSearch() {
    let params = ''
    if (mode === 'airports') {
      const all = [...airports]
      if (airportInput.trim()) all.push(airportInput.trim().toUpperCase())
      if (all.length === 0) return
      params = `airports=${all.join(',')}`
    } else {
      const code = radiusAirport.trim().toUpperCase()
      if (!code) return
      params = `airport=${code}&radius=${radiusMiles}`
    }
    setPendingParams(params)
    setShowGate(true)
  }

  const canSearch =
    mode === 'airports'
      ? airports.length > 0 || airportInput.trim().length >= 3
      : radiusAirport.trim().length >= 3

  return (
    <>
      <div className="w-full max-w-2xl">
        {/* Mode toggle */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setMode('airports')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors',
              mode === 'airports'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <MapPin className="h-3.5 w-3.5" />
            Specific airports
          </button>
          <span className="text-slate-600">·</span>
          <button
            onClick={() => setMode('radius')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors',
              mode === 'radius'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Search className="h-3.5 w-3.5" />
            Airport + radius
          </button>
        </div>

        {/* Search box */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {mode === 'airports' ? (
            /* ── Multi-airport tags input ── */
            <div
              className="flex min-h-[52px] flex-1 cursor-text flex-wrap items-center gap-1.5 rounded-xl bg-white px-3 py-2 shadow-lg ring-2 ring-transparent focus-within:ring-sky-400"
              onClick={() => inputRef.current?.focus()}
            >
              {airports.map((code) => (
                <span
                  key={code}
                  className="flex items-center gap-1 rounded-md bg-sky-100 pl-2 pr-1 py-0.5 text-sm font-mono font-semibold text-sky-800"
                >
                  {code}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeAirport(code) }}
                    className="rounded p-0.5 hover:bg-sky-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                value={airportInput}
                onChange={(e) => setAirportInput(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                onBlur={() => { if (airportInput.trim()) addAirport(airportInput) }}
                placeholder={airports.length === 0 ? 'Type airports, e.g. KAUS  KDAL  KFXE — press Enter after each' : 'Add another…'}
                className="min-w-[160px] flex-1 bg-transparent py-1 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none"
                maxLength={4}
              />
            </div>
          ) : (
            /* ── Single airport + radius ── */
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={radiusAirport}
                  onChange={(e) => setRadiusAirport(e.target.value.toUpperCase())}
                  placeholder="Home airport (e.g. KAUS)"
                  className="h-[52px] w-full rounded-xl bg-white pl-9 pr-3 font-mono text-sm text-slate-900 shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  maxLength={4}
                />
              </div>
              <select
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="h-[52px] w-32 rounded-xl bg-white px-3 text-sm font-semibold text-slate-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r} miles</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={!canSearch}
            className="flex h-[52px] items-center gap-2 rounded-xl bg-sky-600 px-6 text-base font-semibold text-white shadow-lg transition-all hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto"
          >
            <Search className="h-5 w-5" />
            Search
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {mode === 'airports'
            ? 'Press Enter or comma after each ICAO code to add multiple airports.'
            : 'Find all partnerships based within your chosen radius.'}
        </p>
      </div>

      {showGate && (
        <SignUpGate
          searchParams={pendingParams}
          onClose={() => setShowGate(false)}
        />
      )}
    </>
  )
}
