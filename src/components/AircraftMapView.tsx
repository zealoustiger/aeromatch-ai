'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Map as MapIcon } from 'lucide-react'
import { LIST_FOCUS_PIN_EVENT, type ListFocusPinDetail } from '@/lib/mapListSync'

export interface AircraftMapPin {
  id: string
  make: string | null
  model: string | null
  location: string | null
  state: string | null
  asking_price: number | null
  lat: number
  lng: number
}

// Leaflet touches `window` at import time, so it must never be pulled into the
// server bundle or the default page load — load it only once the visitor
// actually opens the map.
const AircraftLeafletMap = dynamic(() => import('./AircraftLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
      Loading map…
    </div>
  ),
})

export default function AircraftMapView({ pins }: { pins: AircraftMapPin[] }) {
  const [open, setOpen] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [focusNonce, setFocusNonce] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // List → map sync: a card's "Show on map" click opens the map (if collapsed),
  // scrolls it into view, and hands the target pin id down to the leaflet map.
  // Ignores ids with no pin here (e.g. no resolvable location coords) so an
  // unrelated event never pops the map open for nothing. Mirrors
  // PartnershipsMapView's identical logic.
  useEffect(() => {
    function onFocus(e: Event) {
      const detail = (e as CustomEvent<ListFocusPinDetail>).detail
      if (!detail || !pins.some((p) => p.id === detail.id)) return
      setOpen(true)
      setFocusId(detail.id)
      setFocusNonce((n) => n + 1)
      wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.addEventListener(LIST_FOCUS_PIN_EVENT, onFocus)
    return () => window.removeEventListener(LIST_FOCUS_PIN_EVENT, onFocus)
  }, [pins])

  if (pins.length === 0) return null

  return (
    <div ref={wrapperRef} className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="ch-panel flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <MapIcon className="h-4 w-4 text-sky-500" />
        {open ? 'Hide map' : `View on map (${pins.length})`}
      </button>
      {open && (
        <div className="mt-2 overflow-hidden rounded-2xl">
          <AircraftLeafletMap pins={pins} focusId={focusId} focusNonce={focusNonce} />
        </div>
      )}
    </div>
  )
}
