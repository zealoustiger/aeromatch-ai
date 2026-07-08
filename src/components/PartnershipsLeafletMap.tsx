'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import Link from 'next/link'
import { Search } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import type { MapPin } from './PartnershipsMapView'
import { focusListingFromMap, filterListByBounds } from '@/lib/mapListSync'

// Captures the live map instance + reports user pan/zoom up to the parent so it
// can offer a "Search this area" filter. Must live *inside* <MapContainer> to
// use the react-leaflet hooks.
function MapController({
  onReady,
  onMove,
}: {
  onReady: (map: L.Map) => void
  onMove: () => void
}) {
  const map = useMap()
  useEffect(() => {
    onReady(map)
  }, [map, onReady])
  useMapEvents({
    moveend: () => onMove(),
    zoomend: () => onMove(),
  })
  return null
}

// Leaflet's default marker icon references bundler-relative image paths that
// don't resolve under Next's asset pipeline — point them at the same CDN
// version already pinned in package.json instead.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function PartnershipsLeafletMap({
  pins,
  focusId,
  focusNonce,
}: {
  pins: MapPin[]
  /** Listing id to pan/zoom to + open the popup for (list → map sync). */
  focusId?: string | null
  /** Bumped by the parent on every focus request so the effect re-fires even
   *  when the same pin is clicked twice in a row. */
  focusNonce?: number
}) {
  const center: [number, number] = [
    pins.reduce((sum, p) => sum + p.lat, 0) / pins.length,
    pins.reduce((sum, p) => sum + p.lng, 0) / pins.length,
  ]

  // "Search this area" state: `moved` gates the button (only offer it once the
  // visitor has actually panned/zoomed); clicking it filters the list below to
  // the pins inside the current viewport. Clears when this map unmounts (e.g.
  // the visitor collapses "Hide map") so the list never stays silently filtered.
  const [map, setMap] = useState<L.Map | null>(null)
  const [moved, setMoved] = useState(false)

  useEffect(() => () => filterListByBounds(null), [])

  function searchThisArea() {
    if (!map) return
    const bounds = map.getBounds()
    const ids = pins.filter((p) => bounds.contains([p.lat, p.lng])).map((p) => p.id)
    filterListByBounds(ids)
    setMoved(false)
  }

  // List → map sync: a "Show on map" click on a card looks up this marker and
  // asks the cluster group to reveal it (spiderfying/zooming out of a cluster
  // if needed) then opens its popup — the reverse of focusListingFromMap above.
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  // react-leaflet-cluster's types reference `L.MarkerClusterGroup`, a type
  // leaflet.markercluster doesn't actually ship (no @types package for it) —
  // fall back to the one method this component calls on it.
  const clusterRef = useRef<{ zoomToShowLayer: (layer: L.Marker, cb?: () => void) => void } | null>(null)

  useEffect(() => {
    if (!focusId) return
    let cancelled = false
    let attempts = 0

    function tryFocus() {
      if (cancelled) return
      const marker = markersRef.current.get(focusId as string)
      // Right after the map first mounts, the Marker refs (this component) and
      // the cluster group's async chunk processing (`chunkedLoading` stages
      // newly-added markers into its cluster tree over animation frames rather
      // than synchronously) may both still be catching up — the marker may not
      // be registered yet, or registered but not yet clustered (`__parent`
      // unset, which `zoomToShowLayer` needs to compute where to zoom). Poll
      // briefly instead of racing either on the very first open.
      const clustered = marker && Boolean((marker as unknown as { __parent?: unknown }).__parent)
      if ((!marker || (clusterRef.current && !clustered)) && attempts < 40) {
        attempts += 1
        setTimeout(tryFocus, 50)
        return
      }
      if (!marker) return
      if (clusterRef.current) {
        clusterRef.current.zoomToShowLayer(marker, () => marker.openPopup())
      } else {
        marker.openPopup()
      }
    }

    tryFocus()
    return () => {
      cancelled = true
    }
  }, [focusId, focusNonce])

  return (
    <div className="relative">
      {moved && (
        <button
          type="button"
          onClick={searchThisArea}
          className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-md hover:bg-slate-50"
        >
          <Search className="h-4 w-4 text-sky-500" />
          Search this area
        </button>
      )}
      <MapContainer
        center={center}
        zoom={4}
        scrollWheelZoom={false}
        style={{ height: 384, width: '100%' }}
      >
        <MapController onReady={setMap} onMove={() => setMoved(true)} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup ref={clusterRef} chunkedLoading showCoverageOnHover={false}>
          {pins.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={markerIcon}
              ref={(m) => {
                if (m) markersRef.current.set(p.id, m)
                else markersRef.current.delete(p.id)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold text-slate-900">
                    {p.make} {p.model}
                  </div>
                  <div className="text-slate-600">
                    {p.airport_name || p.home_airport}
                    {p.city ? ` · ${p.city}, ${p.state}` : ''}
                  </div>
                  {p.buy_in_price != null && (
                    <div className="mt-1 text-slate-700">
                      Buy-in: ${p.buy_in_price.toLocaleString()}
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-3">
                    <Link
                      href={`/partnerships/${p.id}`}
                      className="font-medium text-sky-600 hover:underline"
                    >
                      View listing →
                    </Link>
                    <button
                      type="button"
                      onClick={() => focusListingFromMap(p.id)}
                      className="font-medium text-slate-500 hover:text-slate-700 hover:underline"
                    >
                      ↓ Show in list
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
