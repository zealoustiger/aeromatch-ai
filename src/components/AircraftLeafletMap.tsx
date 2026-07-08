'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import type { AircraftMapPin } from './AircraftMapView'

// Leaflet's default marker icon references bundler-relative image paths that
// don't resolve under Next's asset pipeline — point them at the same CDN
// version already pinned in package.json instead (matches PartnershipsLeafletMap).
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function AircraftLeafletMap({ pins }: { pins: AircraftMapPin[] }) {
  const center: [number, number] = [
    pins.reduce((sum, p) => sum + p.lat, 0) / pins.length,
    pins.reduce((sum, p) => sum + p.lng, 0) / pins.length,
  ]

  return (
    <MapContainer
      center={center}
      zoom={4}
      scrollWheelZoom={false}
      style={{ height: 384, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/*
        Each pin is a city-level approximation (see resolveLocationCoords) — many
        aircraft in the same city share one coordinate, so clustering (not just
        polish, unlike partnerships' exact-ICAO pins) is load-bearing here from
        the start to avoid stacked/invisible markers.
      */}
      <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
        {pins.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-slate-900">
                  {p.make} {p.model}
                </div>
                {/* `location` is already "City, ST" for the vast majority of rows
                    (the same match this pin's coordinate came from) — mirrors
                    AircraftSaleCard, which also shows `location` alone. */}
                <div className="text-slate-600">{p.location}</div>
                {p.asking_price != null && (
                  <div className="mt-1 text-slate-700">
                    ${p.asking_price.toLocaleString()}
                  </div>
                )}
                <div className="mt-1">
                  <Link
                    href={`/aircraft/listing/${p.id}`}
                    className="font-medium text-sky-600 hover:underline"
                  >
                    View listing →
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
