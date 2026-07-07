'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Map as MapIcon } from 'lucide-react'

export interface MapPin {
  id: string
  make: string
  model: string
  home_airport: string
  airport_name: string | null
  city: string | null
  state: string | null
  buy_in_price: number | null
  lat: number
  lng: number
}

// Leaflet touches `window` at import time, so it must never be pulled into the
// server bundle or the default page load — load it only once the visitor
// actually opens the map.
const PartnershipsLeafletMap = dynamic(() => import('./PartnershipsLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
      Loading map…
    </div>
  ),
})

export default function PartnershipsMapView({ pins }: { pins: MapPin[] }) {
  const [open, setOpen] = useState(false)

  if (pins.length === 0) return null

  return (
    <div className="mb-4">
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
          <PartnershipsLeafletMap pins={pins} />
        </div>
      )}
    </div>
  )
}
